// Spotify Web API responses as the app receives them, modelled on the recorded fixtures in src/test/fixtures/spotify

export interface Paging<T> {
  href: string
  items: T[]
  limit: number
  next: string | null
  offset: number
  previous: string | null
  total: number
}

export interface ExternalUrls { spotify?: string }

export interface Image { height: number | null; url: string; width: number | null }

export interface UserReference {
  external_urls: ExternalUrls
  href: string
  id: string
  type: string
  uri: string
}

export interface PublicUser extends UserReference { display_name: string | null }

export interface CurrentUser extends PublicUser {
  followers: { href: string | null; total: number }
  images: Image[]
}

// Episodes in playlists come back track-shaped, with the show as their album and artist and the show's name as the artist type
export interface SimplifiedArtist {
  external_urls: ExternalUrls
  href: string | null
  id: string | null
  name: string | null
  type: string
  uri: string | null
}

export interface Artist extends SimplifiedArtist {
  id: string
  name: string
  uri: string
  followers: { href: string | null; total: number }
  genres: string[]
  images: Image[]
  popularity: number
}

// Local tracks have no album id, uri, release date or images
export interface SimplifiedAlbum {
  album_type: string | null
  artists: SimplifiedArtist[]
  available_markets: string[]
  external_urls: ExternalUrls
  href: string | null
  id: string | null
  images: Image[]
  name: string
  release_date: string | null
  release_date_precision: string | null
  total_tracks?: number
  type: string
  uri: string | null
}

export interface Album extends SimplifiedAlbum {
  id: string
  uri: string
  copyrights: { text: string; type: string }[]
  external_ids: { upc?: string; ean?: string; isrc?: string }
  genres: string[]
  label: string
  popularity: number
}

export interface Track {
  album: SimplifiedAlbum
  artists: SimplifiedArtist[]
  available_markets?: string[]
  disc_number: number
  duration_ms: number
  explicit: boolean
  external_ids: { isrc?: string; ean?: string; upc?: string; spotify?: string }
  external_urls: ExternalUrls
  href: string | null
  id: string | null
  is_local: boolean
  is_playable?: boolean
  name: string
  popularity: number
  preview_url: string | null
  track_number: number
  type: string
  uri: string
}

// Tracks removed from Spotify come back as a null track
export interface PlaylistItem {
  added_at: string
  added_by: UserReference | null
  is_local: boolean
  item: Track | null
  track: Track | null
}

export interface SavedTrack {
  added_at: string
  track: Track
}

export interface SimplifiedPlaylist {
  collaborative: boolean
  description: string | null
  external_urls: ExternalUrls
  href: string
  id: string
  images: Image[] | null
  items: { href: string; total: number }
  name: string
  owner: PublicUser
  public: boolean
  snapshot_id: string
  tracks: { href: string; total: number }
  type: string
  uri: string
}

export interface AudioFeatures {
  acousticness: number
  analysis_url: string
  danceability: number
  duration_ms: number
  energy: number
  id: string
  instrumentalness: number
  key: number
  liveness: number
  loudness: number
  mode: number
  speechiness: number
  tempo: number
  time_signature: number
  track_href: string
  type: string
  uri: string
  valence: number
}

// Ids with no album or audio features, such as a show's or an episode's, come back as null
export interface ArtistsResponse { artists: Artist[] }
export interface AlbumsResponse { albums: (Album | null)[] }
export interface AudioFeaturesResponse { audio_features: (AudioFeatures | null)[] }

export interface ErrorResponse { error: { status: number; message: string } }
