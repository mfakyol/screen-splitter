# Screen Splitter

URL-based screen splitting / digital signage for store TVs and kiosks.
It shows several web pages in a layout of your choice, full screen (kiosk mode) on the monitor of your choice.
It starts automatically with Windows.

**Stack:** Electron + React + Vite + TypeScript (electron-vite)

## Features

- 12 layout presets: single, 2-up, 3-up, large + small combinations, 2x2 / 3x2 / 3x3 grids
- Per zone: URL, auto-refresh interval, zoom, mute
- Target display selection (multiple monitors), gap between zones, background color
- Every zone runs in its own `WebContentsView`, so sites that block iframes (X-Frame-Options) still load
- Failed pages retry after 10 s; a crashed renderer reloads automatically
- Kiosk mode: frameless, always on top, hidden from the taskbar, mouse cursor hidden
- Launch at Windows login and open straight into the player, no settings window
- Tray icon and global shortcuts
- Windows are redistributed when monitors are plugged in or removed
- Languages: English, Turkish, German (picked from the system locale on first run, changeable on the Appearance page)
- Theme: System / Light / Dark plus six accent colors, applied and saved instantly
- Settings UI with left navigation: Screens (monitor, preview, zones, layouts and screen settings grouped on one page), Startup, Appearance
- **Multiple screens:** each monitor gets its own layout and zones, with one kiosk window per monitor. If two screens target the same monitor the second is skipped with a warning
- While the player runs, the settings window stays above the kiosk windows and moves to a free monitor if there is one
- A legacy single-screen `config.json` is migrated to the new `screens` format on first launch

## Backup and the config format

The **Export settings / Import settings** buttons in the bottom-left corner save and restore all settings as a single JSON file; handy for copying one setup to many devices. Importing writes to disk immediately and restarts the player if it is running.

The `schema` field at the top of the file is the **config format version**, independent of the app version:

| schema | Format |
|---|---|
| 1 | v0.1 flat format (`layoutId`, `zones`, `displayId` at the root); assumed when the field is missing |
| 2 | `screens[]` array, theme and language fields |

Older files are migrated on load. A file with a **newer** schema than the app supports is rejected: importing shows an "update the app" notice, and on startup the file is left untouched and defaults are used. When making a breaking change to the format, bump `CONFIG_SCHEMA_VERSION` and add a migration step to `normalizeConfig`.

## Supported platforms

This release is packaged and tested for **Windows 10 and later** only. macOS support is planned for a later version; Linux will be added on request.

## Adding a language

All strings live in [src/shared/i18n.ts](src/shared/i18n.ts). To add a language:
1. Add the code to the `Lang` type (e.g. `'fr'`) and its label to `LANGUAGES`.
2. Copy the `en` dictionary, translate it, and add it to `DICTS`.
Missing keys fall back to English automatically.

## Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+S` | Open the settings window |
| `Ctrl+Shift+X` | Stop the player |
| `Ctrl+Shift+R` | Reload zones |
| `Ctrl+Shift+Q` | Quit the app |

## Development

```bash
npm install
npm run dev        # development with hot reload
npm run typecheck
npm run build      # compiles into out/
npm run dist       # Windows NSIS installer (dist/)
```

## Tests

Vitest + Testing Library. Tests sit next to the source as `*.test.ts(x)`.

```bash
npm test               # single run
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```

| File | Covers |
|---|---|
| `src/shared/layouts.test.ts` | layout geometry: total area, overlap, bounds, fallback |
| `src/shared/i18n.test.ts` | every key present in every language, consistent placeholders, locale selection |
| `src/main/config.test.ts` | normalization, round-trip save, BOM, broken JSON, language detection (Electron mocked) |
| `src/main/player.test.ts` | URL normalization, pixel bounds and gap math, display selection |
| `src/renderer/src/App.test.tsx` | UI flows: language switching, layout and zone editing, save, start/stop, display selection (jsdom, mocked `window.api`) |

## Project structure

```
src/
  main/      Electron main process
    index.ts   window management, tray, shortcuts, IPC, autostart
    player.ts  kiosk window + zones (WebContentsView)
    config.ts  config.json read/write
  preload/   API exposed to the renderer through contextBridge (window.api)
  renderer/  React settings UI
  shared/    shared types and layout definitions
resources/   icon
```

Settings are stored in `%APPDATA%\Screen Splitter\config.json`; the tray menu can reveal the file.

## Roadmap (ideas)

- Custom layout editor (drag and drop, free proportions)
- URL rotation (playlists) per zone and time-based scheduling
- Remote management: pull config from a central server, manage many devices
- Local media zones (video/images)
- Watchdog: reload frozen pages, scheduled daily restart
- Screenshot / health reporting
