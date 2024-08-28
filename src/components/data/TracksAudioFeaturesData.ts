import i18n from "../../i18n/config"
import TracksData from "./TracksData"
import { apiCall } from "helpers"

class TracksAudioFeaturesData extends TracksData {
  AUDIO_FEATURES_LIMIT = 100

  tracks: any[]

  constructor(accessToken: string, tracks: any[]) {
    super(accessToken)
    this.tracks = tracks
  }

  dataLabels() {
    return [
      i18n.t("track.audio_features.danceability"),
      i18n.t("track.audio_features.energy"),
      i18n.t("track.audio_features.key"),
      i18n.t("track.audio_features.loudness"),
      i18n.t("track.audio_features.mode"),
      i18n.t("track.audio_features.speechiness"),
      i18n.t("track.audio_features.acousticness"),
      i18n.t("track.audio_features.instrumentalness"),
      i18n.t("track.audio_features.liveness"),
      i18n.t("track.audio_features.valence"),
      i18n.t("track.audio_features.tempo"),
      i18n.t("track.audio_features.time_signature")
    ]
  }

  async data() {
    const trackIds = this.tracks.map((track: any) => track.id)

    let requests = []

    for (var offset = 0; offset < trackIds.length; offset = offset + this.AUDIO_FEATURES_LIMIT) {
      requests.push(`https://api.spotify.com/v1/audio-features?ids=${trackIds.slice(offset, offset + this.AUDIO_FEATURES_LIMIT)}`)
    }

    const audioFeaturesPromises = requests.map(request => { return apiCall(request, this.accessToken) })
    const audioFeatures = (await Promise.all(audioFeaturesPromises)).flatMap((response) => response.data.audio_features)

    const audioFeaturesData = new Map<string, string[]>(audioFeatures.filter((af: any) => af).map((audioFeatures: any) => {
      return [
        audioFeatures.uri,
        [
          audioFeatures.danceability,
          audioFeatures.energy,
          audioFeatures.key,
          audioFeatures.loudness,
          audioFeatures.mode,
          audioFeatures.speechiness,
          audioFeatures.acousticness,
          audioFeatures.instrumentalness,
          audioFeatures.liveness,
          audioFeatures.valence,
          audioFeatures.tempo,
          audioFeatures.time_signature
        ]
      ]
    }))

    // Add empty fields where we didn't get data - can be the case for example with episodes
    const audioFeaturesTrackUris = Array.from(audioFeaturesData.keys())
    this.tracks.filter(t => !audioFeaturesTrackUris.includes(t.uri)).forEach((track) => {
      audioFeaturesData.set(track.uri, ["", "", "", "", "", "", "", "", "", "", "", ""])
    })

    return audioFeaturesData
  }
}

export default TracksAudioFeaturesData
