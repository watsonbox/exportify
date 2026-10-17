import fs from 'fs'
import path from 'path'
import { findLeaks, PrivateValueHash } from './scrub'
import privateValueHashes from './private-value-hashes.json'

const FIXTURE_DIR = __dirname
const SPOTIFY_TOKEN = /\b[AB]Q[A-Za-z0-9_-]{60,}/

const filesUnder = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? filesUnder(fullPath) : [fullPath]
  })

const checkedFiles = filesUnder(FIXTURE_DIR)
  .filter(file => path.basename(file) !== 'private-value-hashes.json')
  .map(file => [path.relative(FIXTURE_DIR, file), fs.readFileSync(file, 'utf8')])

describe('Spotify fixtures', () => {
  it('know which private values to look for', () => {
    const labels = (privateValueHashes as PrivateValueHash[]).map(hash => hash.label)

    expect(labels).toEqual(expect.arrayContaining(['user id', 'display name', 'account id', 'owned playlist id', 'owned playlist snapshot id']))
  })

  it('include live and documented responses', () => {
    const files = checkedFiles.map(([file]) => file)

    expect(files).toContainEqual(expect.stringMatching(/^live\/me\.json$/))
    expect(files).toContainEqual(expect.stringMatching(/^documented\/token\.json$/))
  })

  it.each(checkedFiles)('%s contains no private values', (_file, text) => {
    expect(findLeaks(text, privateValueHashes as PrivateValueHash[])).toEqual([])
  })

  it.each(checkedFiles)('%s contains no Spotify access or refresh tokens', (_file, text) => {
    expect(text).not.toMatch(SPOTIFY_TOKEN)
    expect(text).not.toMatch(/Bearer [A-Za-z0-9]/)
  })
})
