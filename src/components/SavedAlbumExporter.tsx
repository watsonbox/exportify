import { saveAs } from "file-saver";
import SavedAlbumData from "./data/SavedAlbumData";

// Handles exporting all of a user's saved albums as a CSV file
class SavedAlbumExporter {
  FILE_NAME = "saved_albums.csv"

  accessToken: string
  savedAlbumCount: number

  constructor(accessToken: string, savedAlbumCount: number) {
    this.accessToken = accessToken
    this.savedAlbumCount = savedAlbumCount
  }

  async export() {
    return this.csvData().then((data) => {
      const blob = new Blob([data], { type: "text/csv;charset=utf-8" })
      saveAs(blob, this.FILE_NAME, { autoBom: false })
    })
  }

  async csvData() {
    const savedAlbumData = new SavedAlbumData(this.accessToken, this.savedAlbumCount)
    const items = await savedAlbumData.data()

    let csvContent = ""
    csvContent += savedAlbumData.dataLabels().map(this.sanitize).join() + "\n"
    items.forEach((albumData) => {
      csvContent += albumData.map(this.sanitize).join(",") + "\n"
    })

    return csvContent
  }

  sanitize(string: string): string {
    return '"' + String(string).replace(/"/g, '""') + '"'
  }
}

export default SavedAlbumExporter