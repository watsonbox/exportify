import { createHash } from 'crypto'

export interface RawResponse { url: string; status: number; headers: Record<string, string>; body: any }
export interface Fixture extends RawResponse { method: 'GET' }
export interface IndexEntry { file: string; method: 'GET'; url: string; status: number; note?: string }
export interface PrivateValueHash { label: string; length: number; sha256: string }
interface PrivateValue { label: string; value: string; fake: string }

const FAKE_USER_ID = 'exportifytestuser'
const FAKE_DISPLAY_NAME = 'Test User'
const FAKE_ACCOUNT_ID = 'FakeAcct00'
const MARKETS_KEPT = 2
const PAGE_ITEMS_KEPT = 25
const BATCH_ENDPOINT = /^\/v1\/(albums|artists|audio-features)$/

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex')

const fakeId = (prefix: string, n: number, length: number) => prefix + String(n).padStart(length - prefix.length, '0')

export function fixtureName(url: string): string {
  const { pathname, searchParams } = new URL(url)
  const query = Array.from(searchParams.entries()).flat()
  return [...pathname.replace(/^\/v1\//, '').split('/'), ...query].filter(Boolean).join('-') + '.json'
}

function privateValues(raw: RawResponse[]): PrivateValue[] {
  const me = raw.find(response => new URL(response.url).pathname === '/v1/me')?.body
  if (!me) throw new Error('The capture has no /me response, so the account to scrub is unknown')

  const ownedPlaylists = raw
    .filter(response => /\/playlists$/.test(new URL(response.url).pathname))
    .flatMap(response => response.body.items)
    .filter(playlist => playlist.owner.id === me.id)
    .filter((playlist, i, all) => all.findIndex(other => other.id === playlist.id) === i)

  return [
    { label: 'user id', value: me.id, fake: FAKE_USER_ID },
    { label: 'display name', value: me.display_name, fake: FAKE_DISPLAY_NAME },
    { label: 'account id', value: me.account_id, fake: FAKE_ACCOUNT_ID },
    ...ownedPlaylists.flatMap((playlist, i) => [
      { label: 'owned playlist id', value: playlist.id, fake: fakeId('fakeplaylist', i + 1, 22) },
      { label: 'owned playlist snapshot id', value: playlist.snapshot_id, fake: fakeId('fakesnapshot', i + 1, 32) },
    ]),
  ].filter(({ value }) => value)
}

function mapStrings(value: any, fn: (s: string) => string): any {
  if (typeof value === 'string') return fn(value)
  if (Array.isArray(value)) return value.map(item => mapStrings(item, fn))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, mapStrings(child, fn)]))
  }
  return value
}

function trimMarkets(value: any): any {
  if (Array.isArray(value)) return value.map(trimMarkets)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) =>
      [key, key === 'available_markets' && Array.isArray(child) ? child.slice(0, MARKETS_KEPT) : trimMarkets(child)]))
  }
  return value
}

export function scrub(raw: RawResponse[]) {
  const replacements = privateValues(raw).sort((a, b) => b.value.length - a.value.length)
  const replace = (s: string) => replacements.reduce((result, { value, fake }) => result.split(value).join(fake), s)

  const fixtures: Record<string, Fixture> = {}
  const index: IndexEntry[] = []
  const batchCounts: Record<string, number> = {}

  for (const response of raw) {
    const url = replace(response.url)
    let body = trimMarkets(mapStrings(response.body, replace))
    let name = fixtureName(url)
    let note: string | undefined

    const batchEndpoint = new URL(url).pathname.match(BATCH_ENDPOINT)?.[1]
    if (batchEndpoint) {
      const n = batchCounts[batchEndpoint] = (batchCounts[batchEndpoint] || 0) + 1
      const hasNulls = Object.values(body).some(entries => Array.isArray(entries) && entries.includes(null))
      if (n > 1 && !hasNulls) continue
      name = `${batchEndpoint}-${n}.json`
      if (hasNulls) note = 'contains null entries'
    } else if (Array.isArray(body.items) && typeof body.total === 'number' && body.items.length > PAGE_ITEMS_KEPT) {
      note = `items trimmed from ${body.items.length} to ${PAGE_ITEMS_KEPT}`
      body = { ...body, items: body.items.slice(0, PAGE_ITEMS_KEPT) }
    }

    if (fixtures[name]) throw new Error(`Two responses map to ${name}`)
    const { 'content-length': _contentLength, ...headers } = response.headers
    fixtures[name] = { method: 'GET', url, status: response.status, headers, body }
    index.push({ file: name, method: 'GET', url, status: response.status, ...(note && { note }) })
  }

  const privateValueHashes: PrivateValueHash[] = replacements.map(({ label, value }) =>
    ({ label, length: value.length, sha256: sha256(value) }))

  return { fixtures, index, privateValueHashes }
}

const isWordChar = (char: string | undefined) => !!char && /[A-Za-z0-9]/.test(char)

// Hashes every substring of a tracked length that starts on a word boundary, where IDs and names begin
export function findLeaks(text: string, hashes: PrivateValueHash[]): string[] {
  const labelsByHash = new Map(hashes.map(hash => [hash.sha256, hash.label]))
  const lengths = Array.from(new Set(hashes.map(hash => hash.length)))
  const found = new Set<string>()

  for (let start = 0; start < text.length; start++) {
    if (isWordChar(text[start - 1]) && isWordChar(text[start])) continue
    for (const length of lengths) {
      const label = labelsByHash.get(sha256(text.slice(start, start + length)))
      if (label) found.add(label)
    }
  }
  return Array.from(found)
}
