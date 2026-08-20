import React, { useRef, useState } from "react"
import { withTranslation, WithTranslation } from "react-i18next"
import { Button } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import ImportPlaylistModal, { PlaylistImportItem } from "./ImportPlaylistModal"
import { parseTracksCsv, filenameToPlaylistName } from "../utils/csvParser"
import PlaylistImportService from "./data/PlaylistImportService"

export interface PlaylistImporterProps extends WithTranslation {
  accessToken: string
  disabled?: boolean
  onImportStarted: (playlistName: string, totalTracks: number, totalPlaylists: number) => void
  onImportProgress: (
    playlistIndex: number,
    totalPlaylists: number,
    playlistName: string,
    importedCount: number,
    totalTracks: number
  ) => void
  onImportDone: (importedPlaylistsCount: number, totalTracksCount: number, singlePlaylistName?: string) => void
  onImportError: (error: any) => void
}

export const PlaylistImporter: React.FC<PlaylistImporterProps> = ({
  t,
  accessToken,
  disabled = false,
  onImportStarted,
  onImportProgress,
  onImportDone,
  onImportError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modalShow, setModalShow] = useState(false)
  const [parsedItems, setParsedItems] = useState<PlaylistImportItem[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || "")
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const parsedResults: PlaylistImportItem[] = await Promise.all(
        files.map(async (file, idx) => {
          const content = await readFileAsText(file)
          const { trackUris } = parseTracksCsv(content)
          return {
            id: `${file.name}-${idx}-${Date.now()}`,
            fileName: file.name,
            playlistName: filenameToPlaylistName(file.name),
            trackUris
          }
        })
      )

      setParsedItems(parsedResults)
      setModalShow(true)
    } catch (error) {
      onImportError(error)
    }
  }

  const handleModalClose = () => {
    setModalShow(false)
  }

  const handleConfirmImport = async (validItems: PlaylistImportItem[], isPublic: boolean) => {
    setModalShow(false)
    setIsImporting(true)

    const totalTracks = validItems.reduce((acc, item) => acc + item.trackUris.length, 0)
    const firstName = validItems[0]?.playlistName || ""
    onImportStarted(firstName, totalTracks, validItems.length)

    try {
      const result = await PlaylistImportService.importMultiplePlaylists({
        accessToken,
        items: validItems.map((item) => ({
          name: item.playlistName,
          trackUris: item.trackUris
        })),
        isPublic,
        onProgress: (pIdx, pTotal, pName, importedCount, trackTotal) => {
          onImportProgress(pIdx, pTotal, pName, importedCount, trackTotal)
        }
      })

      if (validItems.length === 1) {
        onImportDone(result.successfulPlaylistsCount, result.totalTracksCount, firstName)
      } else {
        onImportDone(result.successfulPlaylistsCount, result.totalTracksCount, undefined)
      }
    } catch (error) {
      onImportError(error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,text/csv"
        multiple
        style={{ display: "none" }}
        data-testid="playlist-import-input"
      />
      {/* @ts-ignore */}
      <Button
        type="button"
        variant="outline-secondary"
        size={"xs" as any}
        onClick={handleButtonClick}
        className="text-nowrap me-2"
        disabled={disabled || isImporting}
      >
        <FontAwesomeIcon icon={["fas", "file-import"]} /> {t("import_playlist")}
      </Button>

      <ImportPlaylistModal
        show={modalShow}
        items={parsedItems}
        onClose={handleModalClose}
        onConfirm={handleConfirmImport}
      />
    </>
  )
}

export default withTranslation()(PlaylistImporter)
