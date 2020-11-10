import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import renderer from "react-test-renderer"
import { setupServer } from "msw/node"
import FileSaver from "file-saver"
import JSZip from "jszip"

import PlaylistTable from "./PlaylistTable"

import "../icons"
import { handlers } from '../mocks/handlers_success'

const server = setupServer(...handlers)

server.listen({
  onUnhandledRequest: 'warn'
})

beforeAll(() => {
  global.Blob = function (content, options) { return  ({content, options}) }
})

afterEach(() => {
  jest.restoreAllMocks()
})

// Use a snapshot test to ensure exact component rendering
test("playlist loading", async () => {
  const component = renderer.create(<PlaylistTable />)
  const instance = component.getInstance()

  await waitFor(() => {
    expect(instance.state.playlistCount).toEqual(1)
  })

  expect(component.toJSON()).toMatchSnapshot();
})

test("single playlist exporting", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  render(<PlaylistTable />);

  await waitFor(() => {
    expect(screen.getByText(/Export All/)).toBeInTheDocument()
  })

  const linkElement = screen.getAllByText("Export")[0]

  expect(linkElement).toBeInTheDocument()

  fireEvent.click(linkElement)

  await waitFor(() => {
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

test("exporting of all playlist", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  const jsZipFileMock = jest.spyOn(JSZip.prototype, 'file')
  const jsZipGenerateAsync = jest.spyOn(JSZip.prototype, 'generateAsync')
  jsZipGenerateAsync.mockResolvedValue("zip_content")

  render(<PlaylistTable />);

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
