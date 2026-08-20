import React from "react"
import "i18n/config"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import FileSaver from "file-saver"
import JSZip from "jszip"

import PlaylistTable from "./PlaylistTable"
import PlaylistImportService from "./data/PlaylistImportService"

import "../icons"
import { handlerCalled, handlers, nullAlbumHandlers, nullTrackHandlers, localTrackHandlers, duplicateTrackHandlers, missingPlaylistsHandlers } from "../mocks/handlers"

const server = setupServer(...handlers)

// Mock out Bugsnag calls
jest.mock('@bugsnag/js')
const onSetSubtitle = jest.fn()

server.listen({
  onUnhandledRequest: 'warn'
})

beforeAll(() => {
  // @ts-ignore
  global.Blob = function (content, options) { return ({ content, options }) }

  // https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
})

const { location } = window

beforeAll(() => {
  // @ts-ignore
  delete window.location
})

afterAll(() => {
  window.location = location
})

afterEach(() => {
  jest.restoreAllMocks()
  server.resetHandlers()
})

const baseTrackHeaders = '"Track URI","Track Name","Artist URI(s)","Artist Name(s)","Album URI","Album Name","Album Artist URI(s)","Album Artist Name(s)","Album Release Date","Album Image URL","Disc Number","Track Number","Track Duration (ms)","Track Preview URL","Explicit","Popularity","ISRC","Added By","Added At"'
const baseTrackDataCrying = '"spotify:track:1GrLfs4TEvAZ86HVzXHchS","Crying","spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz","Six by Seven","spotify:album:4iwv7b8gDPKztLkKCbWyhi","Best of Six By Seven","spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz","Six by Seven","2017-02-17","https://i.scdn.co/image/ab67616d0000b273f485821b346237acbbca07ea","1","3","198093","https://p.scdn.co/mp3-preview/daf08df57a49c215c8c53dc5fe88dec5461f15c9?cid=9950ac751e34487dbbe027c4fd7f8e99","false","2","UK4UP1300002","","2020-07-19T09:24:39Z"'

// Use a snapshot test to ensure exact component rendering
test("playlist loading", async () => {
  const { asFragment } = render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

  expect(await screen.findByText(/Export All/)).toBeInTheDocument()

  expect(asFragment()).toMatchSnapshot();
})

test("redirecting when access token is invalid", async () => {
  // @ts-ignore
  window.location = { pathname: "/exportify", href: "http://www.example.com/exportify" }

  render(<PlaylistTable accessToken="INVALID_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

  await waitFor(() => {
    expect(window.location.href).toBe("/exportify")
  })
})

describe("single playlist exporting", () => {
  test("standard case exports successfully", async () => {
    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(linkElement).toHaveAttribute("disabled")
    })

    await waitFor(() => {
      expect(linkElement).toBeEnabled
    })

    await waitFor(() => {
      expect(linkElement).toBeDisabled
    })

    await waitFor(() => {
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        ['https://api.spotify.com/v1/me'],
        ['https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20'],
        ['https://api.spotify.com/v1/me/tracks'],
        ['https://api.spotify.com/v1/me/tracks?offset=0&limit=50']
      ])
    })

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders}\n` +
          `${baseTrackDataCrying}\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'liked.csv',
      { "autoBom": false }
    )
  })

  test("including additional artist data", async () => {
    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" config={{ includeArtistsData: true }} onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(linkElement).toHaveAttribute("disabled")
    })

    await waitFor(() => {
      expect(linkElement).toBeEnabled
    })

    await waitFor(() => {
      expect(linkElement).toBeDisabled
    })

    await waitFor(() => {
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        ['https://api.spotify.com/v1/me'],
        ['https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20'],
        ['https://api.spotify.com/v1/me/tracks'],
        ['https://api.spotify.com/v1/me/tracks?offset=0&limit=50'],
        ['https://api.spotify.com/v1/artists?ids=4TXdHyuAOl3rAOFmZ6MeKz']
      ])
    })

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders},"Artist Genres"\n` +
          `${baseTrackDataCrying},"nottingham indie"\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'liked.csv',
      { "autoBom": false }
    )
  })

  test("including additional audio features data", async () => {
    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" config={{ includeAudioFeaturesData: true }} onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(linkElement).toHaveAttribute("disabled")
    })

    await waitFor(() => {
      expect(linkElement).toBeEnabled
    })

    await waitFor(() => {
      expect(linkElement).toBeDisabled
    })

    await waitFor(() => {
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        ['https://api.spotify.com/v1/me'],
        ['https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20'],
        ['https://api.spotify.com/v1/me/tracks'],
        ['https://api.spotify.com/v1/me/tracks?offset=0&limit=50'],
        ['https://api.spotify.com/v1/audio-features?ids=1GrLfs4TEvAZ86HVzXHchS']
      ])
    })

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders},"Danceability","Energy","Key","Loudness","Mode","Speechiness","Acousticness","Instrumentalness","Liveness","Valence","Tempo","Time Signature"\n` +
          `${baseTrackDataCrying},"0.416","0.971","0","-5.55","1","0.0575","0.00104","0.0391","0.44","0.19","131.988","4"\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'liked.csv',
      { "autoBom": false }
    )
  })

  test("including additional album data", async () => {
    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" config={{ includeAlbumData: true }} onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(linkElement).toHaveAttribute("disabled")
    })

    await waitFor(() => {
      expect(linkElement).toBeEnabled
    })

    await waitFor(() => {
      expect(linkElement).toBeDisabled
    })

    await waitFor(() => {
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        ['https://api.spotify.com/v1/me'],
        ['https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20'],
        ['https://api.spotify.com/v1/me/tracks'],
        ['https://api.spotify.com/v1/me/tracks?offset=0&limit=50'],
        ['https://api.spotify.com/v1/albums?ids=4iwv7b8gDPKztLkKCbWyhi']
      ])
    })

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders},"Album Genres","Label","Copyrights"\n` +
          `${baseTrackDataCrying},"something, something else","Beggars Banquet","C 2016 Beggars Banquet Records Ltd., P 2016 Beggars Banquet Records Ltd."\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'liked.csv',
      { "autoBom": false }
    )
  })

  test("tracks without album data omit it", async () => {
    server.use(...nullAlbumHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" config={{ includeAlbumData: true }} onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[0]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(linkElement).toHaveAttribute("disabled")
    })

    await waitFor(() => {
      expect(linkElement).toBeEnabled
    })

    await waitFor(() => {
      expect(linkElement).toBeDisabled
    })

    await waitFor(() => {
      expect(handlerCalled.mock.calls).toEqual([ // Ensure API call order and no duplicates
        ['https://api.spotify.com/v1/me'],
        ['https://api.spotify.com/v1/users/watsonbox/playlists?offset=0&limit=20'],
        ['https://api.spotify.com/v1/me/tracks'],
        ['https://api.spotify.com/v1/me/tracks?offset=0&limit=50'],
        ['https://api.spotify.com/v1/albums?ids=4iwv7b8gDPKztLkKCbWyhi']
      ])
    })

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders},"Album Genres","Label","Copyrights"\n` +
          `${baseTrackDataCrying},"","",""\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'liked.csv',
      { "autoBom": false }
    )
  })

  test("playlist with null track skips null track", async () => {
    server.use(...nullTrackHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[1]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders}\n`
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv',
      { "autoBom": false }
    )
  })

  test("playlist with local tracks includes them", async () => {
    server.use(...localTrackHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[1]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders}\n` +
          '"spotify:local:The+Waymores:Heart+of+Stone:Heart+of+Stone:128","Heart of Stone","","The Waymores","","Heart of Stone","","","","","0","0","128000","","false","0","","spotify:user:u8ins5esg43wtxk4h66o5d1nb","2021-02-24T06:12:40Z"\n' +
          '"spotify:local:Charlie+Marie:Heard+It+Through+The+Red+Wine:Heard+It+Through+The+Red+Wine:227","Heard It Through The Red Wine","","Charlie Marie","","Heard It Through The Red Wine","","","","","0","0","227000","","false","0","","spotify:user:u8ins5esg43wtxk4h66o5d1nb","2021-02-24T06:12:40Z"\n'
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv',
      { "autoBom": false }
    )
  })

  test("playlist with duplicate tracks includes them", async () => {
    server.use(...duplicateTrackHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getAllByText("Export")[1]

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(saveAsMock).toHaveBeenCalledTimes(1)
    })

    expect(saveAsMock).toHaveBeenCalledWith(
      {
        content: [
          `${baseTrackHeaders}\n` +
          '"spotify:track:7ATyvp3TmYBmGW7YuC8DJ3","One Twos / Run Run Run","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","1","241346","https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99","false","22","GBMEF1100339","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n' +
          '"spotify:track:7ATyvp3TmYBmGW7YuC8DJ3","One Twos / Run Run Run","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","1","241346","https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99","false","22","GBMEF1100339","spotify:user:watsonbox","2020-11-20T15:19:04Z"\n'
        ],
        options: { type: 'text/csv;charset=utf-8' }
      },
      'ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv',
      { "autoBom": false }
    )
  })
})

describe("searching playlists", () => {
  test("simple successful search", async () => {
    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    userEvent.type(screen.getByRole('searchbox'), 'Ghost{enter}')

    await waitFor(() => {
      // Liked tracks is gone but Ghostpoet still matches
      expect(screen.queryAllByRole('row')).toHaveLength(2)
      expect(screen.queryByText("Liked")).not.toBeInTheDocument()
      expect(screen.queryByText("Ghostpoet – Peanut Butter Blues and Melancholy Jam")).toBeInTheDocument()
    })

    userEvent.type(screen.getByRole('searchbox'), '{Escape}')

    await waitFor(() => {
      // Both liked tracks and Ghostpoet are present
      expect(screen.queryAllByRole('row')).toHaveLength(3)
      expect(screen.queryByText("Liked")).toBeInTheDocument()
      expect(screen.queryByText("Ghostpoet – Peanut Butter Blues and Melancholy Jam")).toBeInTheDocument()
    })
  })

  test("search with no results", async () => {
    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    userEvent.type(screen.getByRole('searchbox'), 'test{enter}')

    await waitFor(() => {
      // Both liked tracks and Ghostpoet are missing
      expect(screen.queryAllByRole('row')).toHaveLength(1)
      expect(screen.queryByText("Liked")).not.toBeInTheDocument()
      expect(screen.queryByText("Ghostpoet – Peanut Butter Blues and Melancholy Jam")).not.toBeInTheDocument()
    })
  })
})

describe("missing playlists", () => {
  test("playlist loading", async () => {
    server.use(...missingPlaylistsHandlers)

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

    expect(await screen.findByText(/This playlist is not supported/)).toBeInTheDocument() // FIXME
    expect(await screen.queryAllByRole('row')).toHaveLength(4)
  })

  test("exporting of all playlists", async () => {
    server.use(...missingPlaylistsHandlers)

    const saveAsMock = jest.spyOn(FileSaver, "saveAs")
    saveAsMock.mockImplementation(jest.fn())

    const jsZipFileMock = jest.spyOn(JSZip.prototype, 'file')
    const jsZipGenerateAsync = jest.spyOn(JSZip.prototype, 'generateAsync')
    jsZipGenerateAsync.mockResolvedValue("zip_content")

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

    expect(await screen.findByText(/Export All/)).toBeInTheDocument()

    const linkElement = screen.getByText("Export All")

    expect(linkElement).toBeInTheDocument()

    userEvent.click(linkElement)

    await waitFor(() => {
      expect(jsZipFileMock).toHaveBeenCalledTimes(2)
    })
  })

  // FIXME: Repeated searches producing extra request
  test("searching", async () => {
    server.use(...missingPlaylistsHandlers)

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />)

    expect(await screen.findByRole('searchbox')).toBeInTheDocument()

    userEvent.type(screen.getByRole('searchbox'), 'Ghost{enter}')

    await waitFor(() => {
      expect(screen.queryAllByRole('row')).toHaveLength(2)
    })
  })
})

test("exporting of all playlists", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  const jsZipFileMock = jest.spyOn(JSZip.prototype, 'file')
  const jsZipGenerateAsync = jest.spyOn(JSZip.prototype, 'generateAsync')
  jsZipGenerateAsync.mockResolvedValue("zip_content")

  render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

  expect(await screen.findByText(/Export All/)).toBeInTheDocument()

  const linkElement = screen.getByText("Export All")

  expect(linkElement).toBeInTheDocument()

  userEvent.click(linkElement)

  await waitFor(() => {
    expect(jsZipFileMock).toHaveBeenCalledTimes(2)
  })

  expect(jsZipFileMock).toHaveBeenCalledWith(
    "liked.csv",
    `${baseTrackHeaders}\n` +
    `${baseTrackDataCrying}\n`
  )

  expect(jsZipFileMock).toHaveBeenCalledWith(
    "ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv",
    `${baseTrackHeaders}\n` +
    '"spotify:track:7ATyvp3TmYBmGW7YuC8DJ3","One Twos / Run Run Run","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","1","241346","https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99","false","22","GBMEF1100339","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n' +
    '"spotify:track:0FNanBLvmFEDyD75Whjj52","Us Against Whatever Ever","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","2","269346","https://p.scdn.co/mp3-preview/e5e39be10697be8755532d02c52319ffa6d58688?cid=9950ac751e34487dbbe027c4fd7f8e99","false","36","GBMEF1000270","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n'
  )

  await waitFor(() => {
    expect(saveAsMock).toHaveBeenCalledTimes(1)
  })

  expect(saveAsMock).toHaveBeenCalledWith("zip_content", "spotify_playlists.zip")
})

test("exporting of search results", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  const jsZipFileMock = jest.spyOn(JSZip.prototype, 'file')
  const jsZipGenerateAsync = jest.spyOn(JSZip.prototype, 'generateAsync')
  jsZipGenerateAsync.mockResolvedValue("zip_content")

  render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={onSetSubtitle} />);

  expect(await screen.findByRole('searchbox')).toBeInTheDocument()

  userEvent.type(screen.getByRole('searchbox'), 'Ghost{enter}')

  expect(await screen.findByText(/Export Results/)).toBeInTheDocument()

  const linkElement = screen.getByText("Export Results")

  expect(linkElement).toBeInTheDocument()

  userEvent.click(linkElement)

  await waitFor(() => {
    expect(jsZipFileMock).toHaveBeenCalledTimes(1)
  })

  expect(jsZipFileMock).toHaveBeenCalledWith(
    "ghostpoet_–_peanut_butter_blues_and_melancholy_jam.csv",
    `${baseTrackHeaders}\n` +
    '"spotify:track:7ATyvp3TmYBmGW7YuC8DJ3","One Twos / Run Run Run","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","1","241346","https://p.scdn.co/mp3-preview/137d431ad0cf987b147dccea6304aca756e923c1?cid=9950ac751e34487dbbe027c4fd7f8e99","false","22","GBMEF1100339","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n' +
    '"spotify:track:0FNanBLvmFEDyD75Whjj52","Us Against Whatever Ever","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","spotify:album:6jiLkuSnhzDvzsHJlweoGh","Peanut Butter Blues and Melancholy Jam","spotify:artist:69lEbRQRe29JdyLrewNAvD","Ghostpoet","2011","https://i.scdn.co/image/ab67616d0000b273306e7640be17c5b3468e6e80","1","2","269346","https://p.scdn.co/mp3-preview/e5e39be10697be8755532d02c52319ffa6d58688?cid=9950ac751e34487dbbe027c4fd7f8e99","false","36","GBMEF1000270","spotify:user:watsonbox","2020-11-03T15:19:04Z"\n'
  )

  await waitFor(() => {
    expect(saveAsMock).toHaveBeenCalledTimes(1)
  })

  expect(saveAsMock).toHaveBeenCalledWith("zip_content", "spotify_playlists.zip")
})

describe("importing playlists", () => {
  let alertMock: jest.SpyInstance

  beforeEach(() => {
    alertMock = jest.spyOn(window, "alert").mockImplementation(() => {})
  })

  afterEach(() => {
    alertMock.mockRestore()
  })

  it("renders import playlist button and handles import flow", async () => {
    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={jest.fn()} />)
    expect(await screen.findByRole("button", { name: /Import Playlist/i })).toBeInTheDocument()
  })

  it("handles successful multi-playlist import flow with progress and cache reset", async () => {
    const importMultipleSpy = jest.spyOn(PlaylistImportService, "importMultiplePlaylists").mockImplementation(async (params) => {
      params.onProgress?.(0, 2, "List 1", 1, 1)
      params.onProgress?.(1, 2, "List 2", 2, 2)
      return {
        successfulPlaylistsCount: 2,
        totalTracksCount: 3,
        failedPlaylists: []
      }
    })

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={jest.fn()} />)

    expect(await screen.findByRole("button", { name: /Import Playlist/i })).toBeInTheDocument()

    const file1 = new File(['"Track URI"\n"spotify:track:1"'], "List_1.csv", { type: "text/csv" })
    const file2 = new File(['"Track URI"\n"spotify:track:2"\n"spotify:track:3"'], "List_2.csv", { type: "text/csv" })

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file1, file2] } })

    expect(await screen.findByRole("button", { name: /Import to Spotify/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Import to Spotify/i }))

    await waitFor(() => {
      expect(importMultipleSpy).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 2 playlists \(3 tracks total\)!/i)).toBeInTheDocument()
    })
  })

  it("handles successful import flow with progress and cache reset", async () => {
    const importSpy = jest.spyOn(PlaylistImportService, "importMultiplePlaylists").mockImplementation(async (params) => {
      const totalTracks = params.items.reduce((acc, item) => acc + item.trackUris.length, 0)
      params.onProgress?.(0, 1, params.items[0].name, totalTracks, totalTracks)
      return {
        successfulPlaylistsCount: 1,
        totalTracksCount: totalTracks,
        failedPlaylists: []
      }
    })

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={jest.fn()} />)

    expect(await screen.findByRole("button", { name: /Import Playlist/i })).toBeInTheDocument()

    const file = new File(
      ['"Track URI"\n"spotify:track:abc12345"\n"spotify:track:xyz67890"'],
      "My_New_Playlist.csv",
      { type: "text/csv" }
    )

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByRole("button", { name: /Import to Spotify/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Import to Spotify/i }))

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/Successfully imported 2 tracks into "My New Playlist"!/i)).toBeInTheDocument()
    })
  })

  it("handles 403 scope error with alert", async () => {
    jest.spyOn(PlaylistImportService, "importMultiplePlaylists").mockRejectedValue({
      response: { status: 403 }
    })

    render(<PlaylistTable accessToken="TEST_ACCESS_TOKEN" onSetSubtitle={jest.fn()} />)

    expect(await screen.findByRole("button", { name: /Import Playlist/i })).toBeInTheDocument()

    const file = new File(
      ['"Track URI"\n"spotify:track:abc12345"'],
      "Scope_Error.csv",
      { type: "text/csv" }
    )

    const fileInput = screen.getByTestId("playlist-import-input")
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(await screen.findByRole("button", { name: /Import to Spotify/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Import to Spotify/i }))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(
        "Spotify permissions needed to create playlists. Please re-login."
      )
    })
  })
})
