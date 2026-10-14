// Shared mock data for the screenshot and demo GIF scripts.
// Produces HTML that opens the built renderer (out/renderer) with a fake window.api.
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const RENDERER = path.join(ROOT, 'out', 'renderer')
const VERSION = require(path.join(ROOT, 'package.json')).version

const screens = [
  {
    id: 'left',
    name: 'Window TV',
    displayId: 1,
    layoutId: 'main-left',
    zones: [
      { url: 'https://menu.example.com/board', refreshSec: 300, zoom: 1, muted: true },
      { url: 'https://promo.example.com/spring', refreshSec: 60, zoom: 1.1, muted: true },
      { url: 'https://social.example.com/wall', refreshSec: 120, zoom: 1, muted: true }
    ],
    gap: 6,
    background: '#000000'
  },
  {
    id: 'right',
    name: 'Checkout',
    displayId: 2,
    layoutId: 'main-bottom-bar',
    zones: [
      { url: 'https://queue.example.com/now-serving', refreshSec: 30, zoom: 1.25, muted: true },
      { url: '', refreshSec: 0, zoom: 1, muted: true }
    ],
    gap: 0,
    background: '#000000'
  }
]

const displays = [
  { id: 1, label: 'Samsung 55"', bounds: { x: 0, y: 0, width: 3840, height: 2160 }, scaleFactor: 1, primary: true },
  { id: 2, label: 'LG 32"', bounds: { x: 3840, y: 0, width: 1920, height: 1080 }, scaleFactor: 1, primary: false }
]

/** Transpiles src/shared/layouts.ts to CommonJS (with Vite's esbuild) and returns LAYOUTS */
function loadLayouts() {
  const esbuild = require('esbuild')
  const src = fs.readFileSync(path.join(ROOT, 'src', 'shared', 'layouts.ts'), 'utf8')
  const { code } = esbuild.transformSync(src, { loader: 'ts', format: 'cjs', target: 'es2020' })
  const m = { exports: {} }
  new Function('module', 'exports', 'require', code)(m, m.exports, require)
  return m.exports.LAYOUTS
}

/** Injects a mocked window.api into the built index.html */
function mockHtml({ theme = 'light', language = 'en', accent = 'blue' } = {}) {
  const index = fs.readFileSync(path.join(RENDERER, 'index.html'), 'utf8')
  const config = { schema: 2, language, theme, accent, screens, autoplay: true, autostart: true, hideCursor: true }
  const mock = `
<script>
  const config = ${JSON.stringify(config)};
  const status = { running: true, windows: 2, active: ['left', 'right'], skipped: [] };
  window.api = {
    getConfig: async () => config,
    saveConfig: async (c) => c,
    exportConfig: async () => ({ ok: true }),
    importConfig: async () => ({ ok: false, canceled: true }),
    getLayouts: async () => ${JSON.stringify(loadLayouts())},
    getDisplays: async () => ${JSON.stringify(displays)},
    startPlayer: async () => status,
    stopPlayer: async () => ({ running: false, windows: 0, active: [], skipped: [] }),
    reloadPlayer: async () => {},
    getStatus: async () => status,
    getAppInfo: async () => ({ version: '${VERSION}', configPath: '', packaged: true }),
    onStatus: () => () => {}
  };
</script>`
  // CSP blocks inline scripts; drop it for the mock api
  return index.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '').replace('<head>', '<head>' + mock)
}

/** Writes the mock HTML into the renderer folder (for relative asset paths) and returns its path */
function writeMockPage(name, opts) {
  const file = path.join(RENDERER, name)
  fs.writeFileSync(file, mockHtml(opts), 'utf8')
  return file
}

module.exports = { ROOT, RENDERER, writeMockPage }
