import React from "react"
import "i18n/config"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { setupServer } from "msw/node"
import FileSaver from "file-saver"

import SavedAlbumRow from "./SavedAlbumRow"

import "../icons"
import { handlerCalled, handlers } from "../mocks/handlers"

const server = setupServer(...handlers)

// Mock out Bugsnag calls
jest.mock('@bugsnag/js')

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

const baseAlbumHeaders = '"Album URI","Album Name","Album Type","Album Artist URI(s)","Album Artist Name(s)","Album Release Date","Release Date Precision","Track Count","Saved At"'

// Use a snapshot test to ensure exact component rendering
test("saved album row loading", async () => {
  const { asFragment } = render(<SavedAlbumRow accessToken="TEST_ACCESS_TOKEN" />)

  expect(await screen.findByText(/Saved albums/)).toBeInTheDocument()

  expect(asFragment()).toMatchSnapshot();
})

test("redirecting when access token is invalid", async () => {
  // @ts-ignore
  window.location = { pathname: "/exportify", href: "http://www.example.com/exportify" }

  render(<SavedAlbumRow accessToken="INVALID_ACCESS_TOKEN" />)

  await waitFor(() => {
    expect(window.location.href).toBe("/exportify")
  })
})

test("standard case exports successfully", async () => {
  const saveAsMock = jest.spyOn(FileSaver, "saveAs")
  saveAsMock.mockImplementation(jest.fn())

  render(<SavedAlbumRow accessToken="TEST_ACCESS_TOKEN" />);

  expect(await screen.findByText(/Saved albums/)).toBeInTheDocument()

  const buttonElement = screen.getByRole("button", { name: /export/i })

  expect(buttonElement).toBeInTheDocument()

  await userEvent.click(buttonElement)

  await waitFor(() => {
    expect(buttonElement).toHaveAttribute("disabled")
  })

  await waitFor(() => {
    expect(handlerCalled.mock.calls).toContainEqual(
      ['https://api.spotify.com/v1/me/albums?limit=50&offset=0']
    )
  })

  await waitFor(() => {
    expect(saveAsMock).toHaveBeenCalledTimes(1)
  })

  expect(saveAsMock).toHaveBeenCalledWith(
    {
      content: [
        `${baseAlbumHeaders}\n` +
        `"spotify:album:4iwv7b8gDPKztLkKCbWyhi","Best of Six By Seven","album","spotify:artist:4TXdHyuAOl3rAOFmZ6MeKz","Six by Seven","2017-02-17","day","14","2020-07-19T09:24:39Z"\n` +
        `"spotify:album:4MxbRuLNbxf0RERbT8OHsU","Cinder","album","spotify:artist:6H9oDpJUDuw3nkogwhd21s","Lux Terminus","2025-04-18","day","10","2025-04-23T14:51:45Z"\n` +
        `"spotify:album:7aIEHWiuOkDywdjyQyt8CL","program music II","album","spotify:artist:5sGsy5o8hBSMmDUFTC5Q2P","KASHIWA Daisuke","2016-04-30","day","8","2025-11-25T18:26:03Z"\n` +
        `"spotify:album:3xOcExpIWzroZldcdc212q","The Overview","album","spotify:artist:4X42BfuhWCAZ2swiVze9O0","Steven Wilson","2025-03-14","day","12","2025-03-20T21:24:38Z"\n` +
        `"spotify:album:6azzagF3oeYffG22gIiLWz","Nocturne","album","spotify:artist:2SDGIFzEh9xmE5zDKcMRkj","The Human Abstract","2006-08-22","day","12","2025-11-25T00:41:40Z"\n` +
        `"spotify:album:4abjNrXQcMRQlm0O4iyUSZ","Digital Veil","album","spotify:artist:2SDGIFzEh9xmE5zDKcMRkj","The Human Abstract","2011-03-08","day","8","2025-11-24T23:54:26Z"\n`
      ],
      options: { type: 'text/csv;charset=utf-8' }
    },
    'saved_albums.csv',
    { "autoBom": false }
  )
})
