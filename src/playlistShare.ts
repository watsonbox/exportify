import JSZip from "jszip"
import TracksBaseData from "components/data/TracksBaseData"
import { TracksPlaylist } from "components/data/PlaylistsData"

// Keep links and decoded snapshots bounded, including when reading untrusted links.
export const MAX_SHARE_LINK_LENGTH = 512_000
const MAX_SNAPSHOT_LENGTH = 2_000_000
const MAX_SHARE_TRACKS = 10_000
const SHARE_PREFIX = "#playlist="
const SNAPSHOT_FILE = "playlist.json"

// Only listening metadata is shared; account IDs, tokens and added-by data stay out.
export type SharedTrack = [uri: string, name: string, artists: string, album: string]
export interface PlaylistSnapshot {
  version: 1
  name: string
  tracks: SharedTrack[]
}

// Version 2 is a wire format only; the viewer still receives PlaylistSnapshot.
// Columns keep similar values together for DEFLATE's sliding compression window.
type CompactSnapshot = [
  version: 2, name: string, dictionary: string[],
  uris: string[], names: string[], artists: number[], albums: number[],
]

export class ShareLinkTooLargeError extends Error {}

export const isPlaylistShare = (hash: string) => hash.startsWith(SHARE_PREFIX)

export async function createPlaylistShareLink(playlist: TracksPlaylist): Promise<string> {
  const items = await new TracksBaseData(playlist).trackItems()
  return encodePlaylistSnapshot({
    version: 1,
    name: playlist.name,
    tracks: items.map(({ track }) => [
      track.uri, track.name, track.artists.map(artist => artist.name ?? "").join(", "), track.album.name,
    ]),
  })
}

function packSnapshot(snapshot: PlaylistSnapshot): CompactSnapshot {
  const dictionary: string[] = []
  const indices = new Map<string, number>()
  const intern = (value: string) => {
    let index = indices.get(value)
    if (index === undefined) {
      index = dictionary.length
      indices.set(value, index)
      dictionary.push(value)
    }
    return index
  }

  const uris: string[] = [], names: string[] = [], artists: number[] = [], albums: number[] = []
  for (const [uri, name, artist, album] of snapshot.tracks) {
    const match = /^spotify:(track|episode):([a-zA-Z0-9]{22})$/.exec(uri)
    // The explicit raw marker also preserves local and arbitrary URIs without collisions.
    uris.push(match ? (match[1] === "track" ? "t" : "e") + match[2] : "u" + uri)
    names.push(name)
    artists.push(intern(artist))
    albums.push(intern(album))
  }
  return [2, snapshot.name, dictionary, uris, names, artists, albums]
}

async function compressSnapshot(json: string): Promise<string> {
  const zip = new JSZip().file(SNAPSHOT_FILE, json)
  return (await zip.generateAsync({ type: "base64", compression: "DEFLATE", compressionOptions: { level: 9 } }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function encodePlaylistSnapshot(snapshot: PlaylistSnapshot): Promise<string> {
  const json = JSON.stringify(snapshot)
  if (json.length > MAX_SNAPSHOT_LENGTH || snapshot.tracks.length > MAX_SHARE_TRACKS) throw new ShareLinkTooLargeError()

  const compactJson = JSON.stringify(packSnapshot(snapshot))
  // Tiny playlists or unique metadata can compress better in the original format.
  // Compare actual compressed sizes so this optimization never lengthens a link.
  const candidates = [json]
  if (compactJson.length <= MAX_SNAPSHOT_LENGTH) candidates.push(compactJson)
  const encoded = (await Promise.all(candidates.map(compressSnapshot)))
    .reduce((shortest, candidate) => candidate.length < shortest.length ? candidate : shortest)
  // Never carry OAuth callback parameters, custom client IDs or other fragments into a share.
  const link = `${window.location.origin}${window.location.pathname}${SHARE_PREFIX}${encoded}`
  if (link.length > MAX_SHARE_LINK_LENGTH) throw new ShareLinkTooLargeError()
  return link
}

const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(item => typeof item === "string")

const dictionaryIndex = (value: unknown, length: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length

function unpackSnapshot(data: unknown[]): PlaylistSnapshot {
  const [version, name, dictionary, uris, names, artists, albums] = data
  if (data.length !== 7 || version !== 2 || typeof name !== "string" ||
      !stringArray(dictionary) || dictionary.length > MAX_SHARE_TRACKS * 2 ||
      !stringArray(uris) || !stringArray(names) || !Array.isArray(artists) || !Array.isArray(albums) ||
      uris.length > MAX_SHARE_TRACKS || [names, artists, albums].some(column => column.length !== uris.length)) {
    throw new Error("Invalid playlist snapshot")
  }

  const snapshot: PlaylistSnapshot = { version: 1, name, tracks: [] }
  let expandedLength = JSON.stringify(snapshot).length
  if (expandedLength > MAX_SNAPSHOT_LENGTH) throw new Error("Playlist snapshot is too large")
  for (let i = 0; i < uris.length; i++) {
    const artist: unknown = artists[i], album: unknown = albums[i]
    const uri = uris[i]
    const match = /^([te])([a-zA-Z0-9]{22})$/.exec(uri)
    if ((!uri.startsWith("u") && !match) ||
        !dictionaryIndex(artist, dictionary.length) || !dictionaryIndex(album, dictionary.length)) {
      throw new Error("Invalid playlist snapshot")
    }
    const expandedUri = uri.startsWith("u") ? uri.slice(1) : `spotify:${match![1] === "t" ? "track" : "episode"}:${match![2]}`
    const track: SharedTrack = [expandedUri, names[i], dictionary[artist], dictionary[album]]
    // Dictionary references can expand into much more text than the compressed JSON.
    // Apply the same limit to the restored snapshot before the viewer receives it.
    expandedLength += JSON.stringify(track).length + (i > 0 ? 1 : 0)
    if (expandedLength > MAX_SNAPSHOT_LENGTH) throw new Error("Playlist snapshot is too large")
    snapshot.tracks.push(track)
  }
  return snapshot
}

function readSnapshot(file: JSZip.JSZipObject): Promise<string> {
  // Stream the expansion so even a small malicious zip cannot allocate an unbounded JSON string.
  return new Promise((resolve, reject) => {
    let length = 0
    const chunks: string[] = []
    // JSZip exposes this browser streaming API but omits it from JSZipObject's types.
    const stream = (file as JSZip.JSZipObject & {
      internalStream(type: "string"): JSZip.JSZipStreamHelper<string>
    }).internalStream("string")
    stream.on("data", chunk => {
      length += chunk.length
      if (length > MAX_SNAPSHOT_LENGTH) {
        stream.pause()
        reject(new Error("Playlist snapshot is too large"))
      } else {
        chunks.push(chunk)
      }
    }).on("error", reject).on("end", () => resolve(chunks.join(""))).resume()
  })
}

export async function decodePlaylistSnapshot(hash: string): Promise<PlaylistSnapshot> {
  const encoded = hash.slice(SHARE_PREFIX.length)
  if (!isPlaylistShare(hash) || hash.length > MAX_SHARE_LINK_LENGTH || !/^[\w-]+$/.test(encoded)) {
    throw new Error("Invalid playlist link")
  }
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - encoded.length % 4) % 4)
  const zip = await JSZip.loadAsync(base64, { base64: true })
  const file = zip.file(SNAPSHOT_FILE)
  if (!file || Object.keys(zip.files).length !== 1) throw new Error("Invalid playlist archive")

  const data: unknown = JSON.parse(await readSnapshot(file))
  if (Array.isArray(data)) return unpackSnapshot(data)

  // Existing version 1 links remain readable after switching to the compact format.
  if (typeof data !== "object" || data === null || !("version" in data) || data.version !== 1 ||
      !("name" in data) || typeof data.name !== "string" || !("tracks" in data) || !Array.isArray(data.tracks) ||
      data.tracks.length > MAX_SHARE_TRACKS || !data.tracks.every((track: unknown) =>
        Array.isArray(track) && track.length === 4 && track.every(value => typeof value === "string"))) {
    throw new Error("Invalid playlist snapshot")
  }
  // Return only the fields in the public format, even if a hand-crafted link contains extras.
  return { version: 1, name: data.name, tracks: data.tracks.map(([uri, name, artists, album]) => [uri, name, artists, album]) }
}

export function sharedTrackUrl(uri: string): string | undefined {
  const match = /^spotify:(track|episode):([a-zA-Z0-9]{22})$/.exec(uri)
  return match ? `https://open.spotify.com/${match[1]}/${match[2]}` : undefined
}
