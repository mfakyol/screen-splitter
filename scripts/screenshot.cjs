// Generates README screenshots: the settings window in light and dark themes.
// Usage: npm run build && npm run screenshot
// Output: docs/screenshots/light.png, docs/screenshots/dark.png
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const { ROOT, writeMockPage } = require('./mock-ui.cjs')

const OUT_DIR = path.join(ROOT, 'docs', 'screenshots')
const WIDTH = 1180
const HEIGHT = 760
const THEMES = ['light', 'dark']

app.whenReady().then(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const guard = setTimeout(() => {
    console.error('timed out')
    app.exit(2)
  }, 60_000)

  // Write the pages up front (sync tools like OneDrive can briefly lock a new file)
  const pages = THEMES.map((theme) => writeMockPage(`_shot-${theme}.html`, { theme }))
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
    for (let i = 0; i < THEMES.length; i++) {
      await win.loadFile(pages[i])
      await new Promise((r) => setTimeout(r, 900))
      const file = path.join(OUT_DIR, `${THEMES[i]}.png`)
      fs.writeFileSync(file, (await win.webContents.capturePage()).toPNG())
      console.log('wrote:', path.relative(ROOT, file), `${Math.round(fs.statSync(file).size / 1024)} KB`)
    }
    win.destroy()
  } catch (err) {
    console.error('error:', err)
    app.exit(1)
  } finally {
    for (const p of pages) fs.rmSync(p, { force: true })
  }
  clearTimeout(guard)
  app.quit()
})
