import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import FileSaver from "file-saver"
import { http, HttpResponse } from "msw"
import App from "../App"
import PlaylistTable from "./PlaylistTable"
import { decodePlaylistSnapshot, encodePlaylistSnapshot, PlaylistSnapshot } from "../playlistShare"
import { ghostpoetTracksUrl, handlerCalled } from "../mocks/handlers"
import { server } from "../mocks/server"
import i18n from "../i18n/config"
import { csvRecords } from "../test/csv"

vi.mock('@bugsnag/js')

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.setItem('access_token', 'TEST_ACCESS_TOKEN')
})

async function openShare(user: ReturnType<typeof userEvent.setup>) {
  render(<PlaylistTable onSetSubtitle={vi.fn()} />)
  const row = await screen.findByRole('row', { name: /Ghostpoet/ })
  await user.click(within(row).getByRole('button', { name: 'Share' }))
}

test('creates a share only after explicit confirmation, then copies the complete link', async () => {
  const user = userEvent.setup()
  await openShare(user)
  expect(screen.getByText(/including private playlists and Liked Songs/)).toBeInTheDocument()
  expect(handlerCalled.mock.calls.map(([url]) => url)).not.toContain(expect.stringContaining('/tracks?offset='))

  await user.click(screen.getByRole('button', { name: 'Create share link' }))
  const input = await screen.findByRole('textbox', { name: 'Playlist share link' })
  const link = (input as HTMLInputElement).value
  expect((await decodePlaylistSnapshot(new URL(link).hash)).tracks).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: 'Copy link' }))
  expect(await navigator.clipboard.readText()).toBe(link)
  expect(await screen.findByRole('status')).toHaveTextContent('Link copied.')
})

test('keeps the link available for manual copying if clipboard access is denied', async () => {
  const user = userEvent.setup()
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Permission denied'))
  await openShare(user)
  await user.click(screen.getByRole('button', { name: 'Create share link' }))
  await screen.findByRole('textbox', { name: 'Playlist share link' })
  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  expect(await screen.findByRole('status')).toHaveTextContent('Select the link and copy it manually.')
  expect(screen.getByRole('textbox', { name: 'Playlist share link' })).toHaveAttribute('readonly')
})

test('allows retry after Spotify refuses snapshot creation', async () => {
  const user = userEvent.setup()
  server.use(http.get(ghostpoetTracksUrl, () => HttpResponse.json({ error: { status: 403, message: 'Refused' } }, { status: 403 })))
  await openShare(user)
  await user.click(screen.getByRole('button', { name: 'Create share link' }))

  expect(await screen.findByText('Could not create the link. Please try again.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Create share link' })).toBeEnabled()
  expect(screen.queryByRole('textbox', { name: 'Playlist share link' })).not.toBeInTheDocument()
})

const snapshot: PlaylistSnapshot = {
  version: 1,
  name: 'Shared 🎶 playlist',
  tracks: [['spotify:track:1GrLfs4TEvAZ86HVzXHchS', 'Crying "again"\nNow', 'Six by Seven', 'Best of Six By Seven']],
}

test.each([false, true])('opens and downloads a snapshot without Spotify requests (logged in: %s)', async loggedIn => {
  const user = userEvent.setup()
  if (!loggedIn) localStorage.clear()
  const link = await encodePlaylistSnapshot(snapshot)
  window.history.replaceState(null, '', link)
  const save = vi.spyOn(FileSaver, 'saveAs').mockImplementation(() => {})
  render(<App />)

  expect(await screen.findByRole('heading', { name: snapshot.name })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Get Started/ })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Crying/ })).toHaveAttribute('href', 'https://open.spotify.com/track/1GrLfs4TEvAZ86HVzXHchS')
  await user.click(screen.getByRole('button', { name: 'Download CSV' }))
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  expect(csvRecords(await (save.mock.calls[0][0] as Blob).text())).toEqual([{
    'Track URI': snapshot.tracks[0][0], 'Track Name': snapshot.tracks[0][1], 'Artist Name(s)': snapshot.tracks[0][2], 'Album Name': snapshot.tracks[0][3],
  }])
  expect(handlerCalled).not.toHaveBeenCalled()
})

test('shows a useful error for a truncated link without trying Spotify login', async () => {
  window.history.replaceState(null, '', '#playlist=truncated')
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent('Ask the sender to copy the full link again.')
  expect(screen.getByRole('link', { name: 'Go to Exportify' })).toHaveAttribute('href', '/')
  expect(handlerCalled).not.toHaveBeenCalled()
})
