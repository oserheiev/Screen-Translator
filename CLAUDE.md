# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Development (concurrent webpack watch + electron)
npm run dev

# Build (webpack renderer + tsc for electron main process)
npm run build

# Build only renderer (webpack)
npm run build:renderer

# Build only main process (tsc)
npm run build:main

# Watch renderer only
npm run watch

# Run after build
npm start

# Package for distribution
npm run package:mac
npm run package:win

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Always run `npm test` after any code change and ensure all tests pass before committing.**

To open DevTools, launch with `--debug` flag or set `NODE_ENV=development`.

## Architecture

This is an Electron + React + TypeScript desktop app for OCR and translation via Google Gemini AI.

### Process Separation

**Main process** (`electron/`): Compiled by `tsc -p electron/tsconfig.json` → `build/electron/`
- `main.ts` — app lifecycle, window management, tray, global hotkey, IPC handlers
- `preload.ts` — exposes a typed `window.electron` API to renderer via `contextBridge`
- `constants.ts` — all IPC channel names (`IPC_CHANNELS`) and window config
- `types.ts` — `Settings` type

**Renderer process** (`src/`): Compiled by webpack → `build/`
- `index.tsx` — React entry point for main window
- `capture/capture.ts` — standalone capture UI (not React), loaded in overlay windows
- `App.tsx` — main React component
- `contexts/AppContext.tsx` — all app state; wraps `GeminiService`, settings persistence, and image/text processing
- `services/gemini.service.ts` — Gemini API calls (OCR + translation), retry logic
- `hooks/useElectronIpc.ts` — typed wrapper over `window.electron`
- `config.ts` — Gemini constants (default model, retries, delay)

### Screen Capture Flow

1. Global hotkey or tray menu triggers `startScreenCapture()` in main process
2. Main creates one `BrowserWindow` per display (transparent, frameless, always-on-top)
3. Each capture window loads `capture.html` which runs `src/capture/capture.ts`
4. `ScreenCapture` class takes a screenshot via `getUserMedia` (desktop capture), shows it as background, lets user draw a selection rectangle
5. On mouse-up, the selected area is cropped from the screenshot canvas and sent back via `window.electron.capture.complete(imageData)`
6. Main process receives `capture-completed` IPC, closes all capture windows, sends `image-captured` to main window renderer
7. `AppContext.processImage()` calls `GeminiService.processImage()` which sends image + prompt to Gemini and parses JSON response `{originalText, translatedText}`

### IPC Pattern

All channel names are defined in `electron/constants.ts` as `IPC_CHANNELS`. The preload script (`electron/preload.ts`) exposes only whitelisted channels via `contextBridge`. Renderer code accesses everything through `window.electron` which is typed via `src/types/index.d.ts`.

Main → Renderer push events (via `ipcRenderer.on`): `image-captured`, `capture-error`
Renderer → Main invocations (`ipcRenderer.invoke`): everything else

### Settings Persistence

`electron-store` persists settings in the OS user data directory. Default model is `gemini-2.5-flash`. On settings save, hotkey is immediately re-registered via `globalShortcut`.

### What's New / Release Notes

Release notes are authored per-PR, not drafted at release time (see
`docs/adr/0001-release-notes-authored-per-pr.md`). A PR with a user-facing change adds a
`.release-notes/<slug>.yml` fragment — a YAML list of bullets, each with a mandatory
`English` key and optional translations for any other `AppLanguage`. A project skill
writes this automatically when finishing a branch (see `.claude/skills/release-notes/`);
PRs with no user-facing change should carry the `no-release-notes` label instead. A CI
check enforces one or the other on PRs touching `src/` or `electron/`.

At release time, `scripts/compile-release-notes.mjs` merges every fragment into a new
`{ version, bullets }` entry, prepends it to `src/whatsnew.json`, and deletes the
consumed fragments — no AI call, no network. `WhatsNewModal` shows unseen entries after
an update (tracked via the `lastSeenVersion` setting); `UpdateAvailableModal` shows a
localized preview before installing, fetched from the new tag's `whatsnew.json` on
GitHub. Never edit `src/whatsnew.json` by hand except to fix a broken entry.

### TypeScript Setup

Two separate `tsconfig.json` files:
- `electron/tsconfig.json` — targets CommonJS for main process
- `src/tsconfig.json` — targets renderer/browser environment

Root `tsconfig.json` is for editor tooling only; builds use the two sub-configs.