// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'
import { LAYOUTS } from '../../shared/layouts'
import type { AppConfig, DisplayInfo, PlayerStatus } from '../../shared/types'

const baseConfig: AppConfig = {
  language: 'tr',
  theme: 'dark',
  accent: 'blue',
  layoutId: 'split-h',
  zones: [
    { url: 'https://a.com', refreshSec: 0, zoom: 1, muted: false },
    { url: '', refreshSec: 0, zoom: 1, muted: false }
  ],
  displayId: null,
  autoplay: false,
  autostart: false,
  gap: 0,
  background: '#000000',
  hideCursor: true
}

const displays: DisplayInfo[] = [
  { id: 1, label: 'Display 1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1, primary: true },
  { id: 2, label: 'TV', bounds: { x: 1920, y: 0, width: 3840, height: 2160 }, scaleFactor: 1, primary: false }
]

type Api = Window['api']

function mockApi(
  overrides: Partial<AppConfig> = {},
  status: PlayerStatus = { running: false, displayId: null },
  packaged = true
): Api {
  const cfg = { ...baseConfig, ...overrides }
  const api: Api = {
    getConfig: vi.fn().mockResolvedValue(cfg),
    saveConfig: vi.fn().mockImplementation(async (c: AppConfig) => c),
    revealConfig: vi.fn().mockResolvedValue(undefined),
    getLayouts: vi.fn().mockResolvedValue(LAYOUTS),
    getDisplays: vi.fn().mockResolvedValue(displays),
    startPlayer: vi.fn().mockResolvedValue({ running: true, displayId: null }),
    stopPlayer: vi.fn().mockResolvedValue({ running: false, displayId: null }),
    reloadPlayer: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockResolvedValue(status),
    getAppInfo: vi.fn().mockResolvedValue({ version: '0.1.0', configPath: 'C:\\x\\config.json', packaged }),
    onStatus: vi.fn().mockReturnValue(() => {})
  }
  window.api = api
  return api
}

async function renderApp(...args: Parameters<typeof mockApi>): Promise<Api> {
  const api = mockApi(...args)
  render(<App />)
  await screen.findByRole('heading', { level: 1 })
  return api
}

const user = () => userEvent.setup()
const goTo = async (name: RegExp): Promise<void> => {
  await user().click(screen.getByRole('button', { name }))
}

beforeEach(() => {
  document.title = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
  // jsdom has no matchMedia; fake it for the system theme
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('dark') && globalThis.__prefersDark === true,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  })
  globalThis.__prefersDark = false
})

afterEach(() => cleanup())

declare global {
  // eslint-disable-next-line no-var
  var __prefersDark: boolean | undefined
}

describe('App - loading, language and navigation', () => {
  it('shows loading, then opens the first page in the selected language', async () => {
    mockApi()
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Düzen & Bölgeler' })).toBeInTheDocument()
    expect(screen.getByText('Ekran Bölücü')).toBeInTheDocument()
    expect(screen.getByText('Durduruldu')).toBeInTheDocument()
    expect(document.title).toBe('Ekran Bölücü - Ayarlar')
    expect(document.documentElement.lang).toBe('tr')
  })

  it('the left menu switches between pages', async () => {
    await renderApp()
    await goTo(/^Ekran$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Ekran' })).toBeInTheDocument()
    await goTo(/^Başlatma$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Başlatma' })).toBeInTheDocument()
    await goTo(/^Görünüm$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Görünüm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Görünüm$/ })).toHaveAttribute('aria-current', 'page')
  })

  it('an English config renders English text', async () => {
    await renderApp({ language: 'en' })
    expect(screen.getByRole('heading', { level: 1, name: 'Layout & Zones' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start Player' })).toBeInTheDocument()
  })

  it('changing the language translates the UI immediately and saves the config', async () => {
    const api = await renderApp()
    await goTo(/^Görünüm$/)
    await user().selectOptions(screen.getByLabelText('Dil'), 'de')
    expect(await screen.findByRole('heading', { level: 1, name: 'Darstellung' })).toBeInTheDocument()
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ language: 'de' }))
    // A language change does not count as "unsaved"
    expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument()
  })
})

describe('App - theme', () => {
  it('applies the config theme to the html element', async () => {
    await renderApp({ theme: 'dark' })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#3b82f6')
  })

  it('the system theme follows the OS preference', async () => {
    globalThis.__prefersDark = true
    await renderApp({ theme: 'system' })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('the system theme becomes light for a light preference', async () => {
    globalThis.__prefersDark = false
    await renderApp({ theme: 'system' })
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('theme selection applies and saves immediately', async () => {
    const api = await renderApp({ theme: 'dark' })
    await goTo(/^Görünüm$/)
    await user().click(screen.getByRole('radio', { name: 'Açık' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }))
    expect(screen.getByRole('radio', { name: 'Açık' })).toHaveAttribute('aria-checked', 'true')
  })

  it('accent selection updates the CSS variable and saves', async () => {
    const api = await renderApp()
    await goTo(/^Görünüm$/)
    await user().click(screen.getByRole('radio', { name: 'Mor' }))
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#8b5cf6')
    expect(document.documentElement.dataset.accent).toBe('violet')
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ accent: 'violet' }))
  })
})

describe('App - layout and zones', () => {
  it('lists every layout and marks the selected one', async () => {
    await renderApp()
    const group = screen.getByRole('radiogroup', { name: 'Düzenler' })
    const tiles = within(group).getAllByRole('radio')
    expect(tiles).toHaveLength(LAYOUTS.length)
    expect(within(group).getByRole('radio', { name: '2 Yan Yana' })).toHaveAttribute('aria-checked', 'true')
  })

  it('lists zone cards by layout with correct status chips', async () => {
    await renderApp()
    expect(screen.getByRole('article', { name: 'Bölge 1' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Bölge 2' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: 'Bölge 3' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Bölge 1' })).getByText('Hazır')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Bölge 2' })).getByText('Boş')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('changing the layout updates the zone count and keeps existing URLs', async () => {
    await renderApp()
    await user().click(screen.getByRole('radio', { name: '2x2 Izgara' }))
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByLabelText('Bölge 1 URL')).toHaveValue('https://a.com')
    expect(screen.getByText('1/4')).toBeInTheDocument()
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()
  })

  it('entering a URL marks the zone Ready', async () => {
    await renderApp()
    const input = screen.getByLabelText('Bölge 2 URL')
    await user().type(input, 'b.com')
    expect(input).toHaveValue('b.com')
    expect(within(screen.getByRole('article', { name: 'Bölge 2' })).getByText('Hazır')).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
  })

  it('shows zoom as a percentage; the mute switch works', async () => {
    await renderApp({ layoutId: 'single', zones: [{ url: 'x', refreshSec: 0, zoom: 1.5, muted: false }] })
    expect(screen.getByLabelText('Yakınlaştırma (%)')).toHaveValue(150)
    const mute = screen.getByRole('switch', { name: 'Sesi kapat' })
    expect(mute).not.toBeChecked()
    await user().click(mute)
    expect(mute).toBeChecked()
  })

  it('clicking a zone in the preview focuses its URL field', async () => {
    await renderApp()
    const zones = document.querySelectorAll('.preview-frame .lp-zone.clickable')
    expect(zones).toHaveLength(2)
    await user().click(zones[1] as Element)
    expect(screen.getByLabelText('Bölge 2 URL')).toHaveFocus()
  })
})

describe('App - saving and player', () => {
  it('Save is disabled without changes; enabled after a change and saves', async () => {
    const api = await renderApp()
    const save = screen.getByRole('button', { name: 'Kaydet' })
    expect(save).toBeDisabled()

    await goTo(/^Ekran$/)
    await user().click(screen.getByRole('switch', { name: 'Fare imlecini gizle' }))
    expect(save).toBeEnabled()
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()

    await user().click(save)
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ hideCursor: false })))
    expect(await screen.findByRole('status')).toHaveTextContent('Ayarlar kaydedildi')
    expect(save).toBeDisabled()
    expect(screen.queryByText('Kaydedilmemiş değişiklikler')).not.toBeInTheDocument()
  })

  it('does not start without a URL, warns and returns to the layout page', async () => {
    const api = await renderApp({ layoutId: 'single', zones: [{ url: '', refreshSec: 0, zoom: 1, muted: false }] })
    await goTo(/^Başlatma$/)
    await user().click(screen.getByRole('button', { name: 'Oynatıcıyı Başlat' }))
    expect(await screen.findByRole('status')).toHaveTextContent('En az bir bölgeye URL girin')
    expect(api.startPlayer).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1, name: 'Düzen & Bölgeler' })).toBeInTheDocument()
  })

  it('starts the player when there is a URL and updates the status', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Oynatıcıyı Başlat' }))
    await waitFor(() => expect(api.startPlayer).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Oynatılıyor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Durdur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yeniden Başlat' })).toBeInTheDocument()
  })

  it('Stop and Reload work while the player runs', async () => {
    const api = await renderApp({}, { running: true, displayId: null })
    expect(screen.getByText('Oynatılıyor')).toBeInTheDocument()
    await user().click(screen.getByRole('button', { name: 'Yenile' }))
    expect(api.reloadPlayer).toHaveBeenCalled()
    await user().click(screen.getByRole('button', { name: 'Durdur' }))
    await waitFor(() => expect(api.stopPlayer).toHaveBeenCalled())
    expect(await screen.findByText('Durduruldu')).toBeInTheDocument()
  })

  it('subscribes to status changes from the main process', async () => {
    const api = await renderApp()
    expect(api.onStatus).toHaveBeenCalledTimes(1)
  })
})

describe('App - display page', () => {
  it('lists display cards with the primary tag and the automatic option', async () => {
    await renderApp()
    await goTo(/^Ekran$/)
    const group = screen.getByRole('radiogroup', { name: 'Hedef ekran' })
    const cards = within(group).getAllByRole('radio')
    expect(cards).toHaveLength(3)
    expect(within(group).getByRole('radio', { name: /Otomatik/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(group).getByRole('radio', { name: /Display 1.*1920×1080.*Birincil/ })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /TV.*3840×2160/ })).toBeInTheDocument()
  })

  it('display selection is written to the config', async () => {
    const api = await renderApp()
    await goTo(/^Ekran$/)
    await user().click(screen.getByRole('radio', { name: /^TV/ }))
    await user().click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ displayId: 2 })))
  })

  it('the refresh displays button requests the list again', async () => {
    const api = await renderApp()
    await goTo(/^Ekran$/)
    await user().click(screen.getByRole('button', { name: 'Ekranları yenile' }))
    expect(api.getDisplays).toHaveBeenCalledTimes(2)
  })

  it('gap and background are editable', async () => {
    await renderApp()
    await goTo(/^Ekran$/)
    const gap = screen.getByLabelText('Bölge arası boşluk')
    await user().clear(gap)
    await user().type(gap, '12')
    expect(gap).toHaveValue(12)
    expect(screen.getByText('#000000')).toBeInTheDocument()
  })
})

describe('App - startup page', () => {
  it('switches match the config and can be toggled', async () => {
    await renderApp({ autostart: true })
    await goTo(/^Başlatma$/)
    const autostart = screen.getByRole('switch', { name: 'Windows açılışında başlat' })
    const autoplay = screen.getByRole('switch', { name: 'Doğrudan oynatıcıyı aç' })
    expect(autostart).toBeChecked()
    expect(autoplay).not.toBeChecked()
    await user().click(autoplay)
    expect(autoplay).toBeChecked()
  })

  it('warns in development mode with autostart on, not in the packaged build', async () => {
    await renderApp({ autostart: true }, undefined, false)
    await goTo(/^Başlatma$/)
    expect(screen.getByText(/Geliştirme modundasınız/)).toBeInTheDocument()
    cleanup()

    await renderApp({ autostart: true }, undefined, true)
    await goTo(/^Başlatma$/)
    expect(screen.queryByText(/Geliştirme modundasınız/)).not.toBeInTheDocument()
  })

  it('lists the shortcuts', async () => {
    await renderApp()
    await goTo(/^Başlatma$/)
    expect(screen.getByText('Ayarları aç')).toBeInTheDocument()
    expect(screen.getByText('Uygulamadan çık')).toBeInTheDocument()
  })

  it('shows the version and opens the config file', async () => {
    const api = await renderApp()
    const link = screen.getByRole('button', { name: /v0\.1\.0/ })
    await user().click(link)
    expect(api.revealConfig).toHaveBeenCalled()
  })
})
