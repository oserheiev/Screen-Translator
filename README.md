# Screen Translator

A desktop app that lets you capture any region of your screen and instantly translate the text using Google Gemini AI. Works on macOS and Windows.

## How it works

Press the global hotkey, draw a selection over any text on screen — in a game, image, video, PDF, or any window — and get the original text plus its translation in seconds.

<img width="980" height="712" alt="image" src="https://github.com/user-attachments/assets/513ca6bd-594d-4acb-a033-3a999aa76e6d" />

## Features

- **Hotkey capture** — trigger from anywhere with a customizable global shortcut (default `Ctrl+Alt+T`)
- **Multi-display support** — works across all connected monitors
- **OCR + translation in one step** — powered by Google Gemini (no separate OCR service needed)
- **any languages** — Any language supported by LLM is in your hands now
- **Auto-detect source language** — no need to specify what you're translating from
- **Translation history** — browse and restore past translations
- **Auto-updates** — checks for new releases and install in a single click

## Getting started

1. Get a [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)
2. Download the latest release for your platform from [Releases](https://github.com/oserheiev/Screen-Translator/releases)
3. Open the app, go to Settings, paste your API key
4. Press `Ctrl+Alt+T` or `Command+Alt+T` (or your configured hotkey), draw a selection, done

---

## For developers

### Stack

- **Electron** — main process, tray, global hotkey, IPC
- **React + TypeScript** — renderer UI
- **Webpack** — bundles the renderer
- **Google Gemini** (`@google/genai`) — OCR and translation via a single prompt
- **electron-store** — persistent settings
- **electron-builder** — packaging and publishing

### Project structure

```
electron/          Main process (compiled by tsc)
  main.ts          App lifecycle, windows, tray, hotkey, IPC handlers
  preload.ts       Exposes typed window.electron API via contextBridge
  constants.ts     IPC channel names and window config
  types.ts         Settings type

src/               Renderer process (compiled by webpack)
  App.tsx          Root React component
  contexts/
    AppContext.tsx  All app state, settings persistence, image processing
  services/
    gemini.service.ts  Gemini API calls with retry logic
  capture/
    capture.ts     Standalone capture overlay (non-React)
  hooks/
    useElectronIpc.ts  Typed IPC hook
  i18n/            UI localization strings
  config.ts        Gemini model, retry config, defaults
```

### Setup

```bash
npm install
```

You need a Gemini API key in the app's Settings UI at runtime — no `.env` file required.

### Development

```bash
npm run dev        # webpack watch + electron (concurrent)
```

Open DevTools by launching with `--debug` or setting `NODE_ENV=development`.

### Build & run

```bash
npm run build      # webpack renderer + tsc main process
npm start          # build then launch
```

### Package for distribution

```bash
npm run package:mac
npm run package:win
```

### Key flows

**Capture:** hotkey → main spawns one transparent `BrowserWindow` per display → `capture.ts` takes a `getUserMedia` screenshot → user draws a rect → cropped image sent via IPC → `AppContext.processImage()` calls Gemini → result shown in the main window.

**IPC:** all channel names live in `electron/constants.ts`. The preload script whitelists them through `contextBridge`. Renderer uses `window.electron` (typed in `src/types/index.d.ts`).

**Settings:** persisted by `electron-store` in the OS user data directory. Saving settings immediately re-registers the global hotkey.
