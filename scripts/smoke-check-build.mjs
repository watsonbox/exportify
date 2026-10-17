// Serves a production build the way GitHub Pages does and checks the index page and every asset it references load
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { parseArgs } from 'node:util'

const serve = (dir, base) =>
  http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost')
    const relative = pathname.startsWith(base) ? decodeURIComponent(pathname.slice(base.length)) : null
    const file = relative === null ? null : path.join(dir, relative, relative === '' || relative.endsWith('/') ? 'index.html' : '')

    if (file === null || !file.startsWith(path.resolve(dir)) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) {
      res.writeHead(404).end()
    } else {
      res.writeHead(200).end(fs.readFileSync(file))
    }
  })

const referencedUrls = html =>
  [...html.matchAll(/<(script|link)\b[^>]*?\s(?:src|href)=["']([^"']+)["']/gi)].map(([, tag, url]) => ({ tag: tag.toLowerCase(), url }))

export const smokeCheck = async ({ dir, base }) => {
  const server = serve(path.resolve(dir), base)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const checked = []
  const failures = []

  const get = async pathname => {
    checked.push(pathname)
    const response = await fetch(origin + pathname)
    if (!response.ok) failures.push(`${pathname}: ${response.status}`)
    return response
  }

  try {
    const index = await get(base)
    if (index.ok) {
      const references = referencedUrls(await index.text())
        .map(({ tag, url }) => ({ tag, url: new URL(url, origin + base) }))
        .filter(({ url }) => url.origin === origin)

      if (!references.some(({ tag }) => tag === 'script')) failures.push(`${base}: references no JavaScript`)
      for (const { url } of references) await get(url.pathname)
    }
  } finally {
    server.close()
  }

  return { checked, failures }
}

if (import.meta.filename === process.argv[1]) {
  const homepage = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8')).homepage
  const { values } = parseArgs({
    options: {
      dir: { type: 'string', default: 'dist' },
      base: { type: 'string', default: new URL(homepage).pathname }
    }
  })

  const { checked, failures } = await smokeCheck(values)
  for (const pathname of checked) console.log(`${failures.some(failure => failure.startsWith(`${pathname}:`)) ? '✗' : '✓'} ${pathname}`)

  if (failures.length > 0) {
    console.error(`\nSmoke check failed for ${values.dir} served at ${values.base}:\n${failures.join('\n')}`)
    process.exit(1)
  }
}
