// Generates README screenshots: the settings window in light and dark themes.
// Usage: npm run build && npx electron scripts/screenshot.cjs
// Output: docs/screenshots/light.png, docs/screenshots/dark.png
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const RENDERER = path.join(ROOT, 'out', 'renderer')
const OUT_DIR = path.join(ROOT, 'docs', 'screenshots')
const WIDTH = 1180
const HEIGHT = 760

// Mock data: two screens, filled zones, player running
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

/** Transpiles src/shared/layouts.ts to CommonJS at runtime (with Vite's esbuild) and returns LAYOUTS */
function loadLayouts() {
  const esbuild = require('esbuild')
  const src = fs.readFileSync(path.join(ROOT, 'src', 'shared', 'layouts.ts'), 'utf8')
  const { code } = esbuild.transformSync(src, { loader: 'ts', format: 'cjs', target: 'es2020' })
  const m = { exports: {} }
  new Function('module', 'exports', 'require', code)(m, m.exports, require)
  return m.exports.LAYOUTS
}

const LAYOUTS = loadLayouts()

function mockHtml(theme, language) {
  const index = fs.readFileSync(path.join(RENDERER, 'index.html'), 'utf8')
  const config = {
    schema: 2,
    language,
    theme,
    accent: 'blue',
    screens,
    autoplay: true,
    autostart: true,
    hideCursor: true
  }
  const mock = `
<script>
  const config = ${JSON.stringify(config)};
  const status = { running: true, windows: 2, active: ['left', 'right'], skipped: [] };
  window.api = {
    getConfig: async () => config,
    saveConfig: async (c) => c,
    exportConfig: async () => ({ ok: true }),
    importConfig: async () => ({ ok: false, canceled: true }),
    getLayouts: async () => ${JSON.stringify(LAYOUTS)},
    getDisplays: async () => ${JSON.stringify(displays)},
    startPlayer: async () => status,
    stopPlayer: async () => ({ running: false, windows: 0, active: [], skipped: [] }),
    reloadPlayer: async () => {},
    getStatus: async () => status,
    getAppInfo: async () => ({ version: '${require(path.join(ROOT, 'package.json')).version}', configPath: '', packaged: true }),
    onStatus: () => () => {}
  };
</script>`
  // CSP blocks inline scripts; drop it for the mock api
  return index.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '').replace('<head>', '<head>' + mock)
}

async function shoot(win, file) {
  const img = await win.webContents.capturePage()
  fs.writeFileSync(file, img.toPNG())
  console.log('wrote:', path.relative(ROOT, file), `${Math.round(fs.statSync(file).size / 1024)} KB`)
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  // Safety: exit after 60 s if something hangs
  const guard = setTimeout(() => {
    console.error('timed out')
    app.exit(2)
  }, 60_000)

  const THEMES = ['light', 'dark']
  const htmlFor = (theme) => path.join(RENDERER, `_shot-${theme}.html`)
  // Write the files up front (sync tools like OneDrive can briefly lock a new file)
  for (const theme of THEMES) fs.writeFileSync(htmlFor(theme), mockHtml(theme, 'en'), 'utf8')
  await new Promise((r) => setTimeout(r, 300))

  // capturePage needs a visible window; a single window briefly appears on screen.
  // (Opening a separate window per theme failed with ERR_FAILED on the second load.)
  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: 0,
    y: 0,
    show: true,
    frame: false,
    useContentSize: true,
    webPreferences: { sandbox: true, contextIsolation: true, backgroundThrottling: false }
  })

  try {
    for (const theme of THEMES) {
      console.log('loading:', theme)
      await win.loadFile(htmlFor(theme))
      console.log('loaded:', theme)
      await new Promise((r) => setTimeout(r, 900))
      await shoot(win, path.join(OUT_DIR, `${theme}.png`))
    }
    win.destroy()
  } catch (err) {
    console.error('error:', err)
    app.exit(1)
  } finally {
    for (const theme of THEMES) {
      try {
        fs.unlinkSync(htmlFor(theme))
      } catch {
        /* missing */
      }
    }
  }
  clearTimeout(guard)
  app.quit()
})
