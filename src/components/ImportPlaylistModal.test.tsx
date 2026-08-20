import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import ImportPlaylistModal, { PlaylistImportItem } from "./ImportPlaylistModal"
import "../i18n/config"
import "../icons"

describe("ImportPlaylistModal", () => {
  const singleItem: PlaylistImportItem[] = [
    { id: "1", fileName: "Road_Trip.csv", playlistName: "Road Trip", trackUris: ["spotify:track:1", "spotify:track:2"] }
  ]

  const multiItems: PlaylistImportItem[] = [
    { id: "1", fileName: "Road_Trip.csv", playlistName: "Road Trip", trackUris: ["spotify:track:1", "spotify:track:2"] },
    { id: "2", fileName: "Summer_Vibes.csv", playlistName: "Summer Vibes", trackUris: ["spotify:track:3"] },
    { id: "3", fileName: "Empty.csv", playlistName: "Empty", trackUris: [] }
  ]

  it("renders single-file modal layout when 1 item is passed", () => {
    render(<ImportPlaylistModal show={true} items={singleItem} onClose={jest.fn()} onConfirm={jest.fn()} />)

    const nameInput = screen.getByLabelText(/Playlist Name/i) as HTMLInputElement
    expect(nameInput.value).toBe("Road Trip")
    expect(screen.getByText(/2 tracks found ready to import/i)).toBeInTheDocument()
  })

  it("renders multi-file itemized list when multiple items are passed", () => {
    render(<ImportPlaylistModal show={true} items={multiItems} onClose={jest.fn()} onConfirm={jest.fn()} />)

    expect(screen.getByDisplayValue("Road Trip")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Summer Vibes")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Empty")).toBeInTheDocument()
    expect(screen.getByText(/2 playlists ready to import \(3 tracks total\)/i)).toBeInTheDocument()
  })

  it("allows editing playlist names and removing items in multi-file mode", () => {
    const onConfirmMock = jest.fn()
    render(<ImportPlaylistModal show={true} items={multiItems} onClose={jest.fn()} onConfirm={onConfirmMock} />)

    const roadTripInput = screen.getByDisplayValue("Road Trip")
    fireEvent.change(roadTripInput, { target: { value: "Updated Road Trip" } })

    const removeButtons = screen.getAllByRole("button", { name: /Remove/i })
    fireEvent.click(removeButtons[0]) // remove first item

    const submitBtn = screen.getByRole("button", { name: /Import to Spotify/i })
    fireEvent.click(submitBtn)

    expect(onConfirmMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({ playlistName: "Summer Vibes", trackUris: ["spotify:track:3"] })
      ],
      false
    )
  })

  it("toggles public status when checkbox is clicked", () => {
    const onConfirmMock = jest.fn()
    render(<ImportPlaylistModal show={true} items={singleItem} onClose={jest.fn()} onConfirm={onConfirmMock} />)

    const publicCheckbox = screen.getByLabelText(/Make playlist public/i)
    fireEvent.click(publicCheckbox)

    const submitBtn = screen.getByRole("button", { name: /Import to Spotify/i })
    fireEvent.click(submitBtn)

    expect(onConfirmMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({ playlistName: "Road Trip", trackUris: ["spotify:track:1", "spotify:track:2"] })
      ],
      true
    )
  })

  it("handles cancel button click", () => {
    const onCloseMock = jest.fn()
    render(<ImportPlaylistModal show={true} items={singleItem} onClose={onCloseMock} onConfirm={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it("disables submit button when no valid playlists with tracks and names exist", () => {
    const emptyItems: PlaylistImportItem[] = [
      { id: "1", fileName: "Empty.csv", playlistName: "Empty", trackUris: [] }
    ]
    render(<ImportPlaylistModal show={true} items={emptyItems} onClose={jest.fn()} onConfirm={jest.fn()} />)

    const submitBtn = screen.getByRole("button", { name: /Import to Spotify/i })
    expect(submitBtn).toBeDisabled()
  })
})
