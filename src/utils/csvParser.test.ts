import { parseTracksCsv, filenameToPlaylistName } from "./csvParser"

describe("csvParser", () => {
  describe("filenameToPlaylistName", () => {
    it("strips .csv extension and replaces underscores/hyphens with spaces", () => {
      expect(filenameToPlaylistName("My_Favorite_Songs.csv")).toBe("My Favorite Songs")
      expect(filenameToPlaylistName("road-trip-2024.CSV")).toBe("road trip 2024")
      expect(filenameToPlaylistName("classic%20rock.csv")).toBe("classic rock")
    })

    it("handles files without extension", () => {
      expect(filenameToPlaylistName("cool_playlist")).toBe("cool playlist")
    })
  })

  describe("parseTracksCsv", () => {
    it("parses valid Exportify CSV with Track URI column", () => {
      const csv = `"Track URI","Track Name","Artist Name(s)"\n"spotify:track:4iV5W9uYEdYUVa79Axb7Rh","Song 1","Artist A"\n"spotify:track:1301WleyT98MSxVHPZCA6M","Song 2","Artist B"`
      const result = parseTracksCsv(csv)
      expect(result.trackUris).toEqual([
        "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
        "spotify:track:1301WleyT98MSxVHPZCA6M"
      ])
      expect(result.errors).toEqual([])
    })

    it("handles CRLF line breaks and quoted values containing commas", () => {
      const csv = `"Track URI","Track Name","Artist Name(s)"\r\n"spotify:track:123","Song, with comma","Artist 1, Artist 2"\r\n"spotify:track:456","Another ""Song""","Artist 3"`
      const result = parseTracksCsv(csv)
      expect(result.trackUris).toEqual([
        "spotify:track:123",
        "spotify:track:456"
      ])
      expect(result.errors).toEqual([])
    })

    it("falls back to regex matching if Track URI column is not explicitly named", () => {
      const csv = `"URI","Title"\n"spotify:track:789","Test Track"\n"spotify:track:999","Another Track"`
      const result = parseTracksCsv(csv)
      expect(result.trackUris).toEqual([
        "spotify:track:789",
        "spotify:track:999"
      ])
    })

    it("ignores empty lines and rows without valid track URIs", () => {
      const csv = `"Track URI","Track Name"\n\n"not-a-track","Invalid"\n"spotify:track:111","Valid Track"\n\n`
      const result = parseTracksCsv(csv)
      expect(result.trackUris).toEqual(["spotify:track:111"])
    })

    it("returns empty trackUris if CSV is empty or has no track URIs", () => {
      const result = parseTracksCsv("")
      expect(result.trackUris).toEqual([])
    })
  })
})
