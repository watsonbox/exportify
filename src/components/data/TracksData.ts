abstract class TracksData {
  accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  abstract dataLabels(): string[]
  abstract data(): Promise<Map<string, string[]>>
}

export default TracksData
