export interface ParsedCsvResult {
  trackUris: string[]
  errors: string[]
}

const SPOTIFY_TRACK_URI_REGEX = /^spotify:track:[a-zA-Z0-9]+$/

/**
 * Splits a CSV string into rows and columns adhering to RFC 4180.
 */
function parseCsvRows(csvContent: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ""
  let insideQuotes = false

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i]
    const nextChar = csvContent[i + 1]

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"'
        i++ // Skip escaped quote
      } else if (char === '"') {
        insideQuotes = false
      } else {
        currentField += char
      }
    } else {
      if (char === '"') {
        insideQuotes = true
      } else if (char === ',') {
        currentRow.push(currentField)
        currentField = ""
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++
        }
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ""
      } else if (char === '\n') {
        currentRow.push(currentField)
        rows.push(currentRow)
        currentRow = []
        currentField = ""
      } else {
        currentField += char
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField)
    rows.push(currentRow)
  }

  return rows
}

/**
 * Converts a filename into a default playlist title.
 */
export function filenameToPlaylistName(filename: string): string {
  return filename
    .replace(/\.csv$/i, "")
    .replace(/%20/g, " ")
    .replace(/[_-]+/g, " ")
    .trim()
}

/**
 * Parses track URIs from CSV file content.
 */
export function parseTracksCsv(csvContent: string): ParsedCsvResult {
  const rows = parseCsvRows(csvContent).filter(row => row.some(cell => cell.trim().length > 0))
  if (rows.length === 0) {
    return { trackUris: [], errors: [] }
  }

  const header = rows[0].map(col => col.trim().toLowerCase())
  const trackUriColIndex = header.findIndex(col =>
    col === "track uri" ||
    col === "track_uri" ||
    col === "uri" ||
    col.includes("track uri")
  )

  const trackUris: string[] = []

  if (trackUriColIndex !== -1) {
    for (let r = 1; r < rows.length; r++) {
      const cell = rows[r][trackUriColIndex]?.trim() || ""
      if (SPOTIFY_TRACK_URI_REGEX.test(cell)) {
        trackUris.push(cell)
      }
    }
  } else {
    // Fallback: search all cells for track URI patterns
    for (let r = 0; r < rows.length; r++) {
      for (const cell of rows[r]) {
        const trimmed = cell.trim()
        if (SPOTIFY_TRACK_URI_REGEX.test(trimmed)) {
          trackUris.push(trimmed)
          break
        }
      }
    }
  }

  return { trackUris, errors: [] }
}
