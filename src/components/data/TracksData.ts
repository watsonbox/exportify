export type CsvValue = string | number | boolean

abstract class TracksData {
  abstract dataLabels(): string[]
  abstract data(): Promise<Map<string, CsvValue[]>>
}

export default TracksData
