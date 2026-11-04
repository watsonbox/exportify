import JSZip from "jszip"
import TracksBaseData from "components/data/TracksBaseData"
import { TracksPlaylist } from "components/data/PlaylistsData"

// Keep links and decoded snapshots bounded, including when reading untrusted links.
export const MAX_SHARE_LINK_LENGTH = 512_000
const MAX_SNAPSHOT_LENGTH = 2_000_000
const SHARE_PREFIX = "#playlist="
const SNAPSHOT_FILE = "playlist.json"

// Only listening metadata is shared; account IDs, tokens and added-by data stay out.
export type SharedTrack = [uri: string, name: string, artists: string, album: string]
export interface PlaylistSnapshot {
  version: 1
  name: string
  tracks: SharedTrack[]
}

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

export async function encodePlaylistSnapshot(snapshot: PlaylistSnapshot): Promise<string> {
  const json = JSON.stringify(snapshot)
  if (json.length > MAX_SNAPSHOT_LENGTH || snapshot.tracks.length > 10_000) throw new ShareLinkTooLargeError()

  const zip = new JSZip().file(SNAPSHOT_FILE, json)
  const encoded = (await zip.generateAsync({ type: "base64", compression: "DEFLATE", compressionOptions: { level: 9 } }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  // Never carry OAuth callback parameters, custom client IDs or other fragments into a share.
  const link = `${window.location.origin}${window.location.pathname}${SHARE_PREFIX}${encoded}`
  if (link.length > MAX_SHARE_LINK_LENGTH) throw new ShareLinkTooLargeError()
  return link
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
  if (typeof data !== "object" || data === null || !("version" in data) || data.version !== 1 ||
      !("name" in data) || typeof data.name !== "string" || !("tracks" in data) || !Array.isArray(data.tracks) ||
      data.tracks.length > 10_000 || !data.tracks.every((track: unknown) =>
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
