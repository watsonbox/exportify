import React, { useState } from "react"
import { Alert, Button, Form, InputGroup } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useTranslation } from "react-i18next"
import { TracksPlaylist } from "./data/PlaylistsData"
import { createPlaylistShareLink, ShareLinkTooLargeError } from "../playlistShare"

export default function PlaylistShare({ playlist, onApiError }: { playlist: TracksPlaylist, onApiError: (error: unknown) => void }) {
  const { t } = useTranslation()
  const [creating, setCreating] = useState(false)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const create = async () => {
    setCreating(true)
    setError("")
    try {
      setLink(await createPlaylistShareLink(playlist))
    } catch (error) {
      if (error instanceof ShareLinkTooLargeError) {
        setError("share.too_large")
      } else {
        setError("share.failed")
        onApiError(error)
      }
    } finally {
      setCreating(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setCopyFailed(false)
    } catch {
      setCopyFailed(true)
    }
  }

  const inputId = `share-link-${playlist.id}`
  return <div id={`share-${playlist.id}`} className="playlist-share text-start py-2">
      <p className="small mb-2">{t("share.description")}</p>
      {!link && <Button type="button" variant="primary" className="btn-xs playlist-share-primary" disabled={creating} onClick={create}>
        {creating && <FontAwesomeIcon icon={['fas', 'sync']} spin className="me-1" />}
        {t(creating ? "share.creating" : "share.create")}
      </Button>}
      {error && <Alert variant="danger" className="small mt-2 mb-0">{t(error)}</Alert>}
      {link && <>
        <Form.Label htmlFor={inputId} className="small">{t("share.link")}</Form.Label>
        <InputGroup size="sm">
          <Form.Control id={inputId} value={link} readOnly onFocus={event => event.target.select()} />
          <Button type="button" variant="outline-secondary" className="playlist-share-action" onClick={copy}>{t("share.copy")}</Button>
        </InputGroup>
        <p className="small mt-2 mb-0" role="status">{t(copyFailed ? "share.copy_failed" : copied ? "share.copied" : "share.long_link")}</p>
      </>}
    </div>
}
