// Turns a raw Spotify capture into the checked-in fixtures; see src/test/fixtures/spotify/README.md
import fs from 'node:fs'
import path from 'node:path'
import { scrub, type PrivateValueHash } from '../src/test/fixtures/spotify/scrub.ts'

const rawPath = process.argv[2]
if (!rawPath) {
  console.error('Usage: mise run fixtures:scrub <path to responses-raw.json>')
  process.exit(1)
}

const fixtureDir = path.join(import.meta.dirname, '../src/test/fixtures/spotify')
const liveDir = path.join(fixtureDir, 'live')
const hashesPath = path.join(fixtureDir, 'private-value-hashes.json')

const writeJson = (file: string, value: unknown) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n')

const { fixtures, index, privateValueHashes } = scrub(JSON.parse(fs.readFileSync(rawPath, 'utf8')))

fs.rmSync(liveDir, { recursive: true, force: true })
fs.mkdirSync(liveDir)
for (const [name, fixture] of Object.entries(fixtures)) writeJson(path.join(liveDir, name), fixture)
writeJson(path.join(liveDir, 'index.json'), index)

// Keep hashes from earlier captures so their values stay checked after a re-capture
const previousHashes: PrivateValueHash[] = fs.existsSync(hashesPath) ? JSON.parse(fs.readFileSync(hashesPath, 'utf8')) : []
const mergedHashes = [...previousHashes, ...privateValueHashes]
  .filter((hash, i, all) => all.findIndex(other => other.sha256 === hash.sha256) === i)
  .sort((a, b) => a.label.localeCompare(b.label) || a.sha256.localeCompare(b.sha256))
writeJson(hashesPath, mergedHashes)

const totalBytes = fs.readdirSync(liveDir).reduce((sum, name) => sum + fs.statSync(path.join(liveDir, name)).size, 0)
console.log(`Wrote ${Object.keys(fixtures).length} fixtures (${Math.round(totalBytes / 1024)} KB) to ${path.relative(process.cwd(), liveDir)}`)
console.log(`Tracking ${mergedHashes.length} private value hashes in ${path.relative(process.cwd(), hashesPath)}`)
