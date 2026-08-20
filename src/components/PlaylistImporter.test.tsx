import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import PlaylistImporter from "./PlaylistImporter"
import PlaylistImportService from "./data/PlaylistImportService"
import "../i18n/config"
import "../icons"

jest.mock("./data/PlaylistImportService")

describe("PlaylistImporter", () => {
  const mockProps = {
    accessToken: "test_token",
    onImportStarted: jest.fn(),
    onImportProgress: jest.fn(),
    onImportDone: jest.fn(),
    onImportError: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the import button", () => {
    render(<PlaylistImporter {...mockProps} />)
    expect(screen.getByRole("button", { name: /Import Playlist/i })).toBeInTheDocument()
  })

  it("parses single file on change and opens modal", async () => {
    render(<PlaylistImporter {...mockProps} />)

    const file = new File(
      ['"Track URI"\n"spotify:track:abc12345"\n"spotify:track:xyz67890"'],
      "My_Favorites.csv",
      { type: "text/csv" }
    )

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/2 tracks found ready to import/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue("My Favorites")).toBeInTheDocument()
    })
  })

  it("parses multiple files on change and opens modal with all items", async () => {
    render(<PlaylistImporter {...mockProps} />)

    const file1 = new File(['"Track URI"\n"spotify:track:1"'], "Play_1.csv", { type: "text/csv" })
    const file2 = new File(['"Track URI"\n"spotify:track:2"\n"spotify:track:3"'], "Play_2.csv", { type: "text/csv" })

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    await waitFor(() => {
      expect(screen.getByDisplayValue("Play 1")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Play 2")).toBeInTheDocument()
      expect(screen.getByText(/2 playlists ready to import \(3 tracks total\)/i)).toBeInTheDocument()
    })
  })

  it("triggers PlaylistImportService.importMultiplePlaylists on confirm", async () => {
    ;(PlaylistImportService.importMultiplePlaylists as jest.Mock).mockResolvedValue({
      successfulPlaylistsCount: 2,
      totalTracksCount: 3,
      failedPlaylists: []
    })

    render(<PlaylistImporter {...mockProps} />)

    const file1 = new File(['"Track URI"\n"spotify:track:1"'], "Play_1.csv", { type: "text/csv" })
    const file2 = new File(['"Track URI"\n"spotify:track:2"\n"spotify:track:3"'], "Play_2.csv", { type: "text/csv" })

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import to Spotify/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Import to Spotify/i }))

    await waitFor(() => {
      expect(PlaylistImportService.importMultiplePlaylists).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: "test_token",
          items: [
            { name: "Play 1", trackUris: ["spotify:track:1"] },
            { name: "Play 2", trackUris: ["spotify:track:2", "spotify:track:3"] }
          ],
          isPublic: false
        })
      )
      expect(mockProps.onImportDone).toHaveBeenCalledWith(2, 3, undefined)
    })
  })

  it("handles import errors gracefully", async () => {
    const error = new Error("Failed to create playlist")
    ;(PlaylistImportService.importMultiplePlaylists as jest.Mock).mockRejectedValue(error)

    render(<PlaylistImporter {...mockProps} />)

    const file = new File(['"Track URI"\n"spotify:track:abc12345"'], "Error_Test.csv", { type: "text/csv" })

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import to Spotify/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Import to Spotify/i }))

    await waitFor(() => {
      expect(mockProps.onImportError).toHaveBeenCalledWith(error)
    })
  })

  it("disables button when disabled prop is true", () => {
    render(<PlaylistImporter {...mockProps} disabled={true} />)
    expect(screen.getByRole("button", { name: /Import Playlist/i })).toBeDisabled()
  })
})
