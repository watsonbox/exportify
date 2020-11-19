import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import renderer from "react-test-renderer"
import { setupServer } from "msw/node"
import FileSaver from "file-saver"
import JSZip from "jszip"

import PlaylistTable from "./PlaylistTable"

import "../icons"
import { handlerCalled, handlers, nullTrackHandlers } from "../mocks/handlers"

const server = setupServer(...handlers)

server.listen({
  onUnhandledRequest: 'warn'
})

beforeAll(() => {
  global.Blob = function (content, options) { return  ({content, options}) }
})

const { location } = window

beforeAll(() => {
  delete window.location
})

afterAll(() => {
  window.location = location
})

afterEach(() => {
  jest.restoreAllMocks()
  server.resetHandlers()
})

// Use a snapshot test to ensure exact component rendering
test("playlist loading", async () => {
  const component = renderer.create(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" />)
  const instance = component.getInstance()

  await waitFor(() => {
    expect(instance.state.playlistCount).toEqual(1)
  })

  expect(component.toJSON()).toMatchSnapshot();
})

test("redirecting when access token is invalid", async () => {
  window.location = { href: "http://www.example.com/exportify#access_token=INVALID_ACCESS_TOKEN" }

  render(<PlaylistTable accessToken="INVALID_ACCESS_TOKEN" />)

  await waitFor(() => {
    expect(window.location.href).toBe("http://www.example.com/exportify")
  })
})

describe("single playlist exporting", () => {
  test("standard case exports successfully", async () => {
    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" />);

    await waitFor(() => {
      expect(screen.getByText(/Export All/)).toBeInTheDocument()
    })

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    fireEvent.click(linkElement)

    await waitFor(() => {
      expect(handlerCalled).toHaveBeenCalledTimes(4)
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        [ 'https://api.spotify.com/v1/me' ],
        [ 'https://api.spotify.com/v1/users/watsonbox/playlists' ],
        [ 'https://api.spotify.com/v1/users/watsonbox/tracks' ],
        [ 'https://api.spotify.com/v1/me/tracks?offset=0&limit=20' ]
      ])

      expect(saveAsMock).toHaveBeenCalledTimes(1)
      expect(saveAsMock).toHaveBeenCalledWith(
        {
          content: [
            '"Track URI","Track Name","Artist URI","Artist Name","Album URI","Album Name","Disc Number","Track Number","Track Duration (ms)","Added By","Added At"\n' +
            '"spotify:track:1GrLfs4TEvAZ86HVzXHchS","Crying","spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz","Six by Seven","spotify:album:4iwv7b8gDPKztLkKCbWyhi","Best of Six By Seven","1","3","198093","","2020-07-19T09:24:39Z"\n'
          ],
          options: { type: 'text/csv;charset=utf-8' }
        },
        'liked.csv',
        true
      )
    })
  })

  test("playlist with null track skips null track", async () => {
    server.use(...nullTrackHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" />);

    await waitFor(() => {
      expect(screen.getByText(/Export All/)).toBeInTheDocument()
    })

    const linkElement = screen.getAllByText("Export")[1]

    expect(linkElement).toBeInTheDocument()

    fireEvent.click(linkElement)

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
      expect(saveAsMock).toHaveBeenCalledWith(
        {
          content: [
            '"Track URI","Track Name","Artist URI","Artist Name","Album URI","Album Name","Disc Number","Track Number","Track Duration (ms)","Added By","Added At"\n'
          ],
          options: { type: 'text/csv;charset=utf-8' }
        },
        'ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv',
        true
      )
    })
  })
})

test("exporting of all playlists", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  const jsZipFileMock = jest.spyOn(JSZip.prototype, 'file')
  const jsZipGenerateAsync = jest.spyOn(JSZip.prototype, 'generateAsync')
  jsZipGenerateAsync.mockResolvedValue("zip_content")

  render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" />);

  await waitFor(() => {
    expect(screen.getByText(/Export All/)).toBeInTheDocument()
  })

  const linkElement = screen.getByText("Export All")

  expect(linkElement).toBeInTheDocument()

  fireEvent.click(linkElement)

  await waitFor(() => {
    expect(jsZipFileMock).toHaveBeenCalledTimes(2)
    expect(jsZipFileMock).toHaveBeenCalledWith(
      "liked.csv",
      '"Track URI","Track Name","Artist URI","Artist Name","Album URI","Album Name","Disc Number","Track Number","Track Duration (ms)","Added By","Added At"\n' +
      '"spotify:track:1GrLfs4TEvAZ86HVzXHchS","Crying","spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz","Six by Seven","spotify:album:4iwv7b8gDPKztLkKCbWyhi","Best of Six By Seven","1","3","198093","","2020-07-19T09:24:39Z"\n'
    )
    expect(jsZipFileMock).toHaveBeenCalledWith(
      "ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv",
      '"Track URI","Track Name","Artist URI","Artist Name","Album URI","Album Name","Disc Number","Track Number","Track Duration (ms)","Added By","Added At"\n' +
      '"spotify:track:7ATyvp3TmYBmGW7YuC8DJ3","One Twos / Run Run Run","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","1","1","241346","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n' +
      '"spotify:track:0FNanBLvmFEDyD75Whjj52","Us Against Whatever Ever","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","1","2","269346","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n'
    )
  })

  await waitFor(() => {
    expect(saveAsMock).toHaveBeenCalledTimes(1)
    expect(saveAsMock).toHaveBeenCalledWith("zip_content", "spotify_playlists.zip")
  })
})
