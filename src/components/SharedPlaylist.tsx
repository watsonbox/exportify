import React, { useEffect, useState } from "react"
import { Alert, Button } from "react-bootstrap"
import { useTranslation } from "react-i18next"
import { saveAs } from "file-saver"
import { decodePlaylistSnapshot, PlaylistSnapshot, sharedTrackUrl } from "../playlistShare"

export default function SharedPlaylist({ hash }: { hash: string }) {
  const { t } = useTranslation()
  const [result, setResult] = useState<{ snapshot?: PlaylistSnapshot, failed?: boolean }>({})

  useEffect(() => {
    let active = true
    decodePlaylistSnapshot(hash).then(
      snapshot => { if (active) setResult({ snapshot }) },
      () => { if (active) setResult({ failed: true }) },
    )
    return () => { active = false }
  }, [hash])

  if (result.failed) return <Alert variant="danger">{t("share.invalid")} <a href={import.meta.env.BASE_URL}>{t("share.home")}</a></Alert>
  if (!result.snapshot) return <p role="status">{t("share.loading")}</p>

  const snapshot = result.snapshot
  const exportCsv = () => {
    const rows = [[t("track.track_uri"), t("track.track_name"), t("track.artist_names"), t("track.album_name")], ...snapshot.tracks]
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n") + "\n"
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), "shared_playlist.csv", { autoBom: false })
  }

  return <section aria-labelledby="shared-playlist-name">
    <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
      <div className="shared-playlist-heading">
        <h2 id="shared-playlist-name">{snapshot.name}</h2>
        <p className="text-body-secondary mb-0">{t("share.snapshot", { count: snapshot.tracks.length })}</p>
      </div>
      <Button type="button" variant="primary" className="playlist-share-primary" onClick={exportCsv}>{t("share.download")}</Button>
    </div>
    <p className="small text-body-secondary">{t("share.snapshot_description")}</p>
    {snapshot.tracks.length === 0 ? <p>{t("share.empty")}</p> : <div className="table-responsive">
      <table className="table table-hover table-sm shared-playlist-table">
        <thead><tr><th scope="col">#</th><th scope="col">{t("track.track_name")}</th><th scope="col">{t("track.artist_names")}</th><th scope="col">{t("track.album_name")}</th></tr></thead>
        <tbody>{snapshot.tracks.map(([uri, name, artists, album], index) => {
          const url = sharedTrackUrl(uri)
          return <tr key={index}><td>{index + 1}</td><td>{url ? <a href={url} target="_blank" rel="noreferrer">{name}</a> : name}</td><td>{artists}</td><td>{album}</td></tr>
        })}</tbody>
      </table>
    </div>}
  </section>
}
