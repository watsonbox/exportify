// Parses RFC 4180 CSV, where every field may be quoted and "" escapes a quote inside one
export function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      rows.push([...row, field])
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) rows.push([...row, field])

  return rows
}

// The data rows of a CSV as objects keyed by its header row
export function csvRecords(csv: string): Record<string, string>[] {
  const [headers, ...rows] = parseCsv(csv)
  return rows.map(row => Object.fromEntries(headers.map((header, i) => [header, row[i]])))
}

export function csvHeaders(csv: string): string[] {
  return parseCsv(csv)[0]
}
