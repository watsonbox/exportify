import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { smokeCheck } from './smoke-check-build.mjs'

const writeBuild = files => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-check-'))
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content)
  }
  return dir
}

const indexHtml = prefix => `<!doctype html><html><head>
<link rel="icon" href="${prefix}favicon.png"/>
<script defer="defer" src="${prefix}static/js/main.js"></script>
<link href="${prefix}static/css/main.css" rel="stylesheet">
<link rel="preconnect" href="https://api.spotify.com">
</head><body><a href="https://github.com/watsonbox/exportify">Fork me</a></body></html>`

const assets = { 'favicon.png': 'png', 'static/js/main.js': 'js', 'static/css/main.css': 'css' }

test('passes when the page and every asset it references load', async () => {
  const dir = writeBuild({ 'index.html': indexHtml('/'), ...assets })

  const { checked, failures } = await smokeCheck({ dir, base: '/' })

  assert.deepEqual(failures, [])
  assert.deepEqual(checked, ['/', '/favicon.png', '/static/js/main.js', '/static/css/main.css'])
})

test('fails when a referenced asset is missing', async () => {
  const dir = writeBuild({ 'index.html': indexHtml('/'), 'favicon.png': 'png', 'static/js/main.js': 'js' })

  const { failures } = await smokeCheck({ dir, base: '/' })

  assert.deepEqual(failures, ['/static/css/main.css: 404'])
})

test('fails when the index page is missing', async () => {
  const dir = writeBuild(assets)

  const { failures } = await smokeCheck({ dir, base: '/' })

  assert.deepEqual(failures, ['/: 404'])
})

test('fails when the page references no JavaScript', async () => {
  const dir = writeBuild({ 'index.html': '<!doctype html><html><head></head><body></body></html>' })

  const { failures } = await smokeCheck({ dir, base: '/' })

  assert.deepEqual(failures, ['/: references no JavaScript'])
})

test('serves the build under a sub-path base', async () => {
  const dir = writeBuild({ 'index.html': indexHtml('/exportify/'), ...assets })

  const { checked, failures } = await smokeCheck({ dir, base: '/exportify/' })

  assert.deepEqual(failures, [])
  assert.equal(checked[0], '/exportify/')
})

test('fails when assets are built for a different base path', async () => {
  const dir = writeBuild({ 'index.html': indexHtml('/'), ...assets })

  const { failures } = await smokeCheck({ dir, base: '/exportify/' })

  assert.deepEqual(failures, ['/favicon.png: 404', '/static/js/main.js: 404', '/static/css/main.css: 404'])
})

test('resolves relative asset URLs against the base', async () => {
  const dir = writeBuild({ 'index.html': indexHtml('./'), ...assets })

  const { checked, failures } = await smokeCheck({ dir, base: '/exportify/' })

  assert.deepEqual(failures, [])
  assert.ok(checked.includes('/exportify/static/js/main.js'))
})
