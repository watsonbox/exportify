# Exportify

Client-only React SPA that exports Spotify playlists to CSV, deployed to GitHub Pages at https://exportify.app. No data leaves the browser: keep it that way, and keep the app read-only (never request Spotify write scopes).

## Commands

Tooling is pinned in `mise.toml` (Node 22, pnpm 10).

- `mise s`: install dependencies if needed and start the dev server on http://127.0.0.1:3000
- `mise test`: run the Vitest and script test suites once. It doesn't install dependencies, so run `mise install` first after a lockfile change
- Agents don't run dependency changes (`pnpm add`, `update`, `install`) themselves: work out the exact command and ask the maintainer to run it
- `pnpm lint`: lint (should report zero problems)
- `pnpm build`: typecheck and production build into `dist/`
- `pnpm preview`: serve the production build locally

The build is Vite (`vite.config.ts`, with `index.html` at the root) and the tests run on Vitest in jsdom.

## Spotify login and the test account

- Real Spotify login only works at http://127.0.0.1:3000, the redirect URI registered for the production client ID. Only one checkout can serve it at a time, so worktree agents can't log in. Everything they do must work against mocks.
- For anything that needs live data (capturing responses, manual or screenshot checks), use the dedicated "Exportify Dev" test account, never the maintainer's own. The maintainer logs in.
- The production app has Spotify extended quota, so endpoints and fields restricted for development-mode apps (`/audio-features`, batch `/artists` and `/albums`, `popularity`) still work.

## Tests and fixtures

- Tests are React Testing Library plus MSW (`src/mocks/handlers.ts`). Prefer behaviour-level tests over implementation details.
- Spotify fixtures come from real responses recorded from the test account, scrubbed of tokens and account identifiers. Never commit raw captures, HAR files (they carry bearer tokens) or anything from a personal account.
- There's no Playwright or screenshot suite on purpose. UI-affecting changes (dependency upgrades, styling) get a before/after agent-browser screenshot check against `mise s` with the test account instead.
