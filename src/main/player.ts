import { BrowserWindow, WebContentsView, screen, type Display } from 'electron'
import type { AppConfig, Rect } from '../shared/types'
import { getLayout } from '../shared/layouts'
import { t, type Lang } from '../shared/i18n'

const RETRY_MS = 10_000

function placeholderHtml(index: number, bg: string, lang: Lang): string {
  const html =
    '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:' +
    bg +
    ';color:#777;font-family:Segoe UI,sans-serif;font-size:4vw;">' +
    t(lang, 'player.zone', { n: index + 1 }) +
    '<span style="font-size:1.5vw">' +
    t(lang, 'player.noUrl') +
    '</span></body></html>'
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html)
}

/** Makes a user-entered URL loadable; adds https when the scheme is missing. */
export function normalizeUrl(url: string): string {
  const u = url.trim()
  if (!u) return ''
  if (/^[a-z]+:\/\//i.test(u) || u.startsWith('data:') || u.startsWith('file:')) return u
  return 'https://' + u
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** Converts layout fractions to pixel bounds; the gap is shared evenly between zones. */
export function computeZoneBounds(zones: Rect[], W: number, H: number, gap: number): Bounds[] {
  return zones.map((r) => ({
    x: Math.round(r.x * W + gap / 2),
    y: Math.round(r.y * H + gap / 2),
    width: Math.max(1, Math.round(r.w * W - gap)),
    height: Math.max(1, Math.round(r.h * H - gap))
  }))
}

export function pickDisplay(displayId: number | null): Display {
  const all = screen.getAllDisplays()
  return all.find((d) => d.id === displayId) ?? screen.getPrimaryDisplay()
}

export class Player {
  private win: BrowserWindow | null = null
  private views: WebContentsView[] = []
  private timers: NodeJS.Timeout[] = []
  private config: AppConfig | null = null

  get running(): boolean {
    return !!this.win && !this.win.isDestroyed()
  }

  get displayId(): number | null {
    return this.config?.displayId ?? null
  }

  start(config: AppConfig): void {
    this.stop()
    this.config = config
    const display = pickDisplay(config.displayId)
    const { x, y, width, height } = display.bounds

    const win = new BrowserWindow({
      x,
      y,
      width,
      height,
      show: false,
      frame: false,
      kiosk: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      autoHideMenuBar: true,
      backgroundColor: config.background,
      webPreferences: { sandbox: true, contextIsolation: true }
    })
    win.setMenuBarVisibility(false)
    win.setBounds(display.bounds)
    win.on('closed', () => {
      this.clearTimers()
      this.views = []
      this.win = null
    })
    win.on('resize', () => this.applyBounds())
    this.win = win

    const layout = getLayout(config.layoutId)
    layout.zones.forEach((_rect, i) => {
      const zone = config.zones[i]
      const view = new WebContentsView({
        webPreferences: {
          sandbox: true,
          contextIsolation: true,
          backgroundThrottling: false,
          partition: 'persist:zone-' + i
        }
      })
      view.setBackgroundColor(config.background)
      win.contentView.addChildView(view)
      this.views.push(view)

      const wc = view.webContents
      wc.setAudioMuted(zone.muted)
      wc.on('did-finish-load', () => wc.setZoomFactor(zone.zoom || 1))
      wc.on('did-fail-load', (_e, code, desc, url, isMain) => {
        if (!isMain || code === -3) return
        console.warn('[zone ' + i + '] failed to load (' + code + ' ' + desc + ') ' + url)
        this.timers.push(setTimeout(() => this.loadZone(i), RETRY_MS))
      })
      wc.on('render-process-gone', (_e, details) => {
        console.warn('[zone ' + i + '] render process gone: ' + details.reason)
        this.timers.push(setTimeout(() => this.loadZone(i), 1000))
      })
      // Block new windows; open the link in the same zone
      wc.setWindowOpenHandler(({ url }) => {
        wc.loadURL(url).catch(() => {})
        return { action: 'deny' }
      })

      if (config.hideCursor) {
        wc.on('dom-ready', () => {
          wc.insertCSS('html, body, * { cursor: none !important; }').catch(() => {})
        })
      }

      this.loadZone(i)
      if (zone.refreshSec > 0) {
        this.timers.push(setInterval(() => this.loadZone(i), zone.refreshSec * 1000))
      }
    })

    this.applyBounds()
    win.show()
    win.setFullScreen(true)
    win.focus()
  }

  private loadZone(i: number): void {
    const view = this.views[i]
    const zone = this.config?.zones[i]
    if (!view || !zone || view.webContents.isDestroyed()) return
    const url = normalizeUrl(zone.url)
    view.webContents
      .loadURL(url || placeholderHtml(i, this.config!.background, this.config!.language))
      .catch(() => {})
  }

  reload(): void {
    this.views.forEach((_v, i) => this.loadZone(i))
  }

  /** Move the window to the target display when the display setup changes */
  refreshDisplay(): void {
    if (!this.running || !this.config) return
    const display = pickDisplay(this.config.displayId)
    this.win!.setBounds(display.bounds)
    this.applyBounds()
  }

  private applyBounds(): void {
    if (!this.running || !this.config) return
    const [W, H] = this.win!.getContentSize()
    const layout = getLayout(this.config.layoutId)
    computeZoneBounds(layout.zones, W, H, this.config.gap).forEach((b, i) => {
      this.views[i]?.setBounds(b)
    })
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearInterval(t))
    this.timers = []
  }

  stop(): void {
    this.clearTimers()
    if (this.win && !this.win.isDestroyed()) {
      for (const v of this.views) {
        try {
          this.win.contentView.removeChildView(v)
          v.webContents.close()
        } catch {
          /* ignore */
        }
      }
      this.win.destroy()
    }
    this.views = []
    this.win = null
  }
}
