abstract class TracksData {
  abstract dataLabels(): string[]
  abstract data(): Promise<Map<string, string[]>>
}

export default TracksData
