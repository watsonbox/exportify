import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Modal, Button, Form, Alert, Badge, Table } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export interface PlaylistImportItem {
  id: string
  fileName: string
  playlistName: string
  trackUris: string[]
}

export interface ImportPlaylistModalProps {
  show: boolean
  items: PlaylistImportItem[]
  onClose: () => void
  onConfirm: (validItems: PlaylistImportItem[], isPublic: boolean) => void
}

const EMPTY_ITEMS: PlaylistImportItem[] = []

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  show,
  items = EMPTY_ITEMS,
  onClose,
  onConfirm
}) => {
  const { t } = useTranslation()
  const [localItems, setLocalItems] = useState<PlaylistImportItem[]>(items)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (show) {
      setLocalItems(items || EMPTY_ITEMS)
      setIsPublic(false)
    }
  }, [items, show])

  const handleNameChange = (id: string, newName: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, playlistName: newName } : item))
    )
  }

  const handleRemoveItem = (id: string) => {
    setLocalItems((prev) => prev.filter((item) => item.id !== id))
  }

  const validItems = (localItems || []).filter(
    (item) => item.playlistName.trim().length > 0 && item.trackUris.length > 0
  )
  const totalTracks = validItems.reduce((acc, item) => acc + item.trackUris.length, 0)
  const canSubmit = validItems.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onConfirm(
      validItems.map((item) => ({ ...item, playlistName: item.playlistName.trim() })),
      isPublic
    )
  }

  const isSingle = (items?.length === 1) && localItems.length === 1

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" size={isSingle ? undefined : "lg"}>
      <Modal.Header closeButton>
        <Modal.Title>{t("import_modal_title")}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {isSingle ? (
            <>
              <Form.Group className="mb-3" controlId="importPlaylistNameInput">
                <Form.Label>{t("import_modal_playlist_name")}</Form.Label>
                <Form.Control
                  type="text"
                  value={localItems[0]?.playlistName || ""}
                  onChange={(e) => handleNameChange(localItems[0].id, e.target.value)}
                  placeholder={t("import_modal_playlist_name")}
                  autoFocus
                />
              </Form.Group>

              {localItems[0]?.trackUris.length > 0 ? (
                <Alert variant="info" className="py-2 mb-3">
                  {t("import_modal_tracks_found", { count: localItems[0].trackUris.length })}
                </Alert>
              ) : (
                <Alert variant="warning" className="py-2 mb-3">
                  {t("import_modal_no_tracks")}
                </Alert>
              )}
            </>
          ) : (
            <>
              <div className="table-responsive mb-3" style={{ maxHeight: "350px", overflowY: "auto" }}>
                <Table hover size="sm" className="align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "55%" }}>{t("import_modal_playlist_name")}</th>
                      <th style={{ width: "35%" }}>{t("playlist.tracks")}</th>
                      <th style={{ width: "10%" }} className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {localItems.map((item) => {
                      const hasTracks = item.trackUris.length > 0
                      return (
                        <tr key={item.id}>
                          <td>
                            <Form.Control
                              type="text"
                              size="sm"
                              value={item.playlistName}
                              onChange={(e) => handleNameChange(item.id, e.target.value)}
                              placeholder={t("import_modal_playlist_name")}
                              aria-label={t("import_modal_playlist_name")}
                            />
                          </td>
                          <td>
                            {hasTracks ? (
                              <Badge bg="info" className="text-dark">
                                {item.trackUris.length} {t("playlist.tracks").toLowerCase()}
                              </Badge>
                            ) : (
                              <Badge bg="warning" className="text-dark">
                                {t("import_modal_no_tracks")}
                              </Badge>
                            )}
                          </td>
                          <td className="text-end">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              aria-label={t("import_modal_remove")}
                              className="py-0 px-2"
                            >
                              <FontAwesomeIcon icon={["fas", "times"]} />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>

              {canSubmit ? (
                <Alert variant="info" className="py-2 mb-3">
                  {t("import_modal_batch_summary", {
                    playlistCount: validItems.length,
                    trackCount: totalTracks
                  })}
                </Alert>
              ) : (
                <Alert variant="warning" className="py-2 mb-3">
                  {t("import_modal_no_tracks")}
                </Alert>
              )}
            </>
          )}

          <Form.Group className="mb-2" controlId="importPlaylistPublicCheckbox">
            <Form.Check
              type="checkbox"
              label={t("import_modal_public")}
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            {t("import_modal_cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSubmit}>
            {t("import_modal_confirm")}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ImportPlaylistModal
