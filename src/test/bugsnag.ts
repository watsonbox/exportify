import Bugsnag, { Event } from "@bugsnag/js"

export type BugsnagReport = { error: Error, groupingHash?: string, metadata: Record<string, unknown> }

// Stubs Bugsnag.notify and returns what each report would send after its onError callback
export function captureBugsnagReports() {
  const reports: BugsnagReport[] = []

  vi.spyOn(Bugsnag, "notify").mockImplementation((error, onError) => {
    const report: BugsnagReport = { error: error as Error, metadata: {} }
    const event = {
      set groupingHash(hash: string) { report.groupingHash = hash },
      addMetadata: (section: string, values: unknown) => { report.metadata[section] = values },
    }
    if (typeof onError === "function") { onError(event as unknown as Event, () => {}) }
    reports.push(report)
  })

  return reports
}
