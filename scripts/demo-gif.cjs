// Generates a short demo GIF for the README: tab, layout, page and theme changes.
// Usage: npm run build && npm run demo
// Output: docs/demo.gif
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const { GIFEncoder, quantize, applyPalette } = require('gifenc')
const { ROOT, writeMockPage } = require('./mock-ui.cjs')

const OUT = path.join(ROOT, 'docs', 'demo.gif')
const WIDTH = 1180
const HEIGHT = 760
/** GIF width; scaled down to keep the file size reasonable */
const GIF_WIDTH = 880

/**
 * Scenario: each step picks a target (CSS selector + optional text);
 * a click ring is shown on the target first, then it is clicked and held.
 */
// top: scroll the page body to the top after the click (tab/page changes)
const STEPS = [
  { hold: 1600 }, // opening: Screens page
  { target: '[title="2x2 Grid"]', hold: 1400 },
  { target: '.preview-frame .lp-zone.clickable', index: 3, hold: 1300 },
  { target: '[role="tab"]', text: 'Checkout', top: true, hold: 1500 },
  { target: '[title="3 Columns"]', hold: 1300 },
  { target: '.nav-item', text: 'App', top: true, hold: 1600 },
  { target: '.nav-item', text: 'Appearance', top: true, hold: 1100 },
  { target: '.segment', text: 'Dark', hold: 1300 },
  { target: '[aria-label="Violet"]', hold: 1300 },
  { target: '.nav-item', text: 'Screens', top: true, hold: 2200 }
]

// Helpers that run inside the page: find the target, show a ring, click
const PAGE_HELPERS = `
window.__find = (sel, text, index) => {
  let els = [...document.querySelectorAll(sel)];
  if (text) els = els.filter((e) => e.textContent.trim().includes(text));
  return els[index || 0] || null;
};
window.__ring = (sel, text, index) => {
  const el = window.__find(sel, text, index);
  if (!el) return false;
  // Bring an off-screen target into view (instantly, no animation)
  const box = el.getBoundingClientRect();
  if (box.top < 0 || box.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'instant' });
  const r = el.getBoundingClientRect();
  const ring = document.createElement('div');
  ring.id = '__ring';
  const size = 34;
  Object.assign(ring.style, {
    position: 'fixed', zIndex: 99999, pointerEvents: 'none',
    left: (r.left + r.width / 2 - size / 2) + 'px', top: (r.top + r.height / 2 - size / 2) + 'px',
    width: size + 'px', height: size + 'px', borderRadius: '50%',
    background: 'rgba(59,130,246,0.25)', border: '3px solid rgba(59,130,246,0.9)'
  });
  document.body.appendChild(ring);
  return true;
};
window.__click = (sel, text, index) => {
  document.getElementById('__ring')?.remove();
  const el = window.__find(sel, text, index);
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  return true;
};
window.__top = () => {
  const body = document.querySelector('.page-body');
  if (body) body.scrollTo({ top: 0, behavior: 'instant' });
  return true;
};
true;
`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Captures one frame from the window: downscaled RGBA pixel array */
async function grab(win) {
  const img = (await win.webContents.capturePage()).resize({ width: GIF_WIDTH, quality: 'best' })
  const { width, height } = img.getSize()
  const bgra = img.toBitmap() // BGRA on Windows
  const rgba = new Uint8Array(bgra.length)
  for (let i = 0; i < bgra.length; i += 4) {
    rgba[i] = bgra[i + 2]
    rgba[i + 1] = bgra[i + 1]
    rgba[i + 2] = bgra[i]
    rgba[i + 3] = 255
  }
  return { rgba, width, height }
}

app.whenReady().then(async () => {
  const guard = setTimeout(() => {
    console.error('timed out')
    app.exit(2)
  }, 120_000)

  const page = writeMockPage('_demo.html', { theme: 'light' })
  await sleep(300)

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

  const frames = []
  // With DEMO_FRAMES=<dir> every frame is also written as PNG (for review)
  const dumpDir = process.env.DEMO_FRAMES
  if (dumpDir) fs.mkdirSync(dumpDir, { recursive: true })
  const add = async (delay) => {
    const f = await grab(win)
    frames.push({ ...f, delay })
    if (dumpDir) {
      const png = (await win.webContents.capturePage()).resize({ width: GIF_WIDTH }).toPNG()
      fs.writeFileSync(path.join(dumpDir, `frame-${String(frames.length).padStart(2, '0')}.png`), png)
    }
  }
  const js = (code) => win.webContents.executeJavaScript(code)
  const args = (s) => `${JSON.stringify(s.target)}, ${JSON.stringify(s.text ?? null)}, ${s.index ?? 0}`

  try {
    await win.loadFile(page)
    await sleep(900)
    await js(PAGE_HELPERS)

    for (const [i, step] of STEPS.entries()) {
      if (step.target) {
        if (!(await js(`window.__ring(${args(step)})`))) throw new Error(`step ${i}: target not found ${step.target} ${step.text ?? ''}`)
        await sleep(120)
        await add(450) // click ring
        await js(`window.__click(${args(step)})`)
        await sleep(80)
        if (step.top) await js('window.__top()')
        await sleep(450) // let transitions settle
      }
      await add(step.hold)
      console.log(`frame ${frames.length}: step ${i + 1}/${STEPS.length}`)
    }
    win.destroy()

    // Encode: each frame with its own 256-color palette
    const gif = GIFEncoder()
    for (const f of frames) {
      const palette = quantize(f.rgba, 256)
      const index = applyPalette(f.rgba, palette)
      gif.writeFrame(index, f.width, f.height, { palette, delay: f.delay })
    }
    gif.finish()
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, gif.bytes())
    const total = frames.reduce((s, f) => s + f.delay, 0)
    console.log(
      `wrote: ${path.relative(ROOT, OUT)} ${Math.round(fs.statSync(OUT).size / 1024)} KB, ` +
        `${frames.length} frames, ${(total / 1000).toFixed(1)} s, ${frames[0].width}x${frames[0].height}`
    )
  } catch (err) {
    console.error('error:', err)
    app.exit(1)
  } finally {
    fs.rmSync(page, { force: true })
  }
  clearTimeout(guard)
  app.quit()
})
