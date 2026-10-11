// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import App from './App'
import { LAYOUTS } from '../../shared/layouts'
import type { AppConfig, DisplayInfo, PlayerStatus, ScreenConfig } from '../../shared/types'

const screen1: ScreenConfig = {
  id: 's1',
  name: '',
  displayId: null,
  layoutId: 'split-h',
  zones: [
    { url: 'https://a.com', refreshSec: 0, zoom: 1, muted: false },
    { url: '', refreshSec: 0, zoom: 1, muted: false }
  ],
  gap: 0,
  background: '#000000'
}

const baseConfig: AppConfig = {
  schema: 2,
  language: 'tr',
  theme: 'dark',
  accent: 'blue',
  screens: [screen1],
  autoplay: false,
  autostart: false,
  hideCursor: true
}

const displays: DisplayInfo[] = [
  { id: 1, label: 'Display 1', bounds: { x: 0, y: 0, width: 1920, height: 1080 }, scaleFactor: 1, primary: true },
  { id: 2, label: 'TV', bounds: { x: 1920, y: 0, width: 3840, height: 2160 }, scaleFactor: 1, primary: false }
]

const IDLE: PlayerStatus = { running: false, windows: 0, active: [], skipped: [] }
const RUNNING: PlayerStatus = { running: true, windows: 1, active: ['s1'], skipped: [] }

type Api = Window['api']

function mockApi(overrides: Partial<AppConfig> = {}, status: PlayerStatus = IDLE, packaged = true): Api {
  const cfg = { ...baseConfig, ...overrides }
  const api: Api = {
    getConfig: vi.fn().mockResolvedValue(cfg),
    saveConfig: vi.fn().mockImplementation(async (c: AppConfig) => c),
    exportConfig: vi.fn().mockResolvedValue({ ok: true, path: 'C:\\x\\screen-splitter-settings.json' }),
    importConfig: vi.fn().mockResolvedValue({ ok: false, canceled: true }),
    getLayouts: vi.fn().mockResolvedValue(LAYOUTS),
    getDisplays: vi.fn().mockResolvedValue(displays),
    startPlayer: vi.fn().mockResolvedValue(RUNNING),
    stopPlayer: vi.fn().mockResolvedValue(IDLE),
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
const tab = (name: RegExp): HTMLElement => screen.getByRole('tab', { name })

beforeEach(() => {
  document.title = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('style')
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
  it('shows loading, then opens the Screens page in the selected language', async () => {
    mockApi()
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Ekranlar' })).toBeInTheDocument()
    expect(screen.getByText('Ekran Bölücü')).toBeInTheDocument()
    expect(screen.getByText('Durduruldu')).toBeInTheDocument()
    expect(document.title).toBe('Ekran Bölücü - Ayarlar')
    expect(document.documentElement.lang).toBe('tr')
  })

  it('the left menu has three pages and switches between them', async () => {
    await renderApp()
    const nav = screen.getByRole('navigation')
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(['Ekranlar', 'Başlatma', 'Görünüm'])
    await goTo(/^Başlatma$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Başlatma' })).toBeInTheDocument()
    await goTo(/^Görünüm$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Görünüm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Görünüm$/ })).toHaveAttribute('aria-current', 'page')
  })

  it('screen tabs show only on the Screens page', async () => {
    await renderApp()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    await goTo(/^Başlatma$/)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    await goTo(/^Ekranlar$/)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  it('an English config renders English text', async () => {
    await renderApp({ language: 'en' })
    expect(screen.getByRole('heading', { level: 1, name: 'Screens' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start All' })).toBeInTheDocument()
  })

  it('changing the language translates the UI immediately and saves the config', async () => {
    const api = await renderApp()
    await goTo(/^Görünüm$/)
    await user().selectOptions(screen.getByLabelText('Dil'), 'de')
    expect(await screen.findByRole('heading', { level: 1, name: 'Darstellung' })).toBeInTheDocument()
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ language: 'de' }))
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
    cleanup()
    globalThis.__prefersDark = false
    await renderApp({ theme: 'system' })
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('theme and accent selection apply and save immediately', async () => {
    const api = await renderApp({ theme: 'dark' })
    await goTo(/^Görünüm$/)
    await user().click(screen.getByRole('radio', { name: 'Açık' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }))
    await user().click(screen.getByRole('radio', { name: 'Mor' }))
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#8b5cf6')
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ accent: 'violet' }))
  })
})

describe('App - Screens page: groups', () => {
  it('Monitor, Preview, Zones, Layouts and Screen settings groups are on the same page', async () => {
    await renderApp()
    for (const title of ['Monitör', 'Önizleme', 'Bölgeler', 'Düzenler', 'Ekran ayarları']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  it('lists monitor cards with the primary tag and the automatic option', async () => {
    await renderApp()
    const group = screen.getByRole('radiogroup', { name: 'Hedef ekran' })
    expect(within(group).getAllByRole('radio')).toHaveLength(3)
    expect(within(group).getByRole('radio', { name: /Otomatik/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(group).getByRole('radio', { name: /Display 1.*1920×1080.*Birincil/ })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /TV.*3840×2160/ })).toBeInTheDocument()
  })

  it('monitor selection is written to the active screen and shows in the tab', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('radio', { name: /^TV/ }))
    expect(tab(/Ekran 1/)).toHaveTextContent('TV')
    await user().click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() =>
      expect(api.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ screens: [expect.objectContaining({ id: 's1', displayId: 2 })] })
      )
    )
  })

  it('the refresh displays button requests the list again', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Ekranları yenile' }))
    expect(api.getDisplays).toHaveBeenCalledTimes(2)
  })

  it('lists every layout and marks the selected one', async () => {
    await renderApp()
    const group = screen.getByRole('radiogroup', { name: 'Düzenler' })
    expect(within(group).getAllByRole('radio')).toHaveLength(LAYOUTS.length)
    expect(within(group).getByRole('radio', { name: '2 Yan Yana' })).toHaveAttribute('aria-checked', 'true')
  })

  it('lists zone cards by layout with correct status chips', async () => {
    await renderApp()
    expect(screen.getByRole('article', { name: 'Bölge 1' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Bölge 2' })).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Bölge 1' })).getByText('Hazır')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Bölge 2' })).getByText('Boş')).toBeInTheDocument()
  })

  it('changing the layout updates the zone count and keeps existing URLs', async () => {
    await renderApp()
    await user().click(screen.getByRole('radio', { name: '2x2 Izgara' }))
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByLabelText('Bölge 1 URL')).toHaveValue('https://a.com')
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()
  })

  it('entering a URL marks the zone Ready and updates the tab counter', async () => {
    await renderApp()
    await user().type(screen.getByLabelText('Bölge 2 URL'), 'b.com')
    expect(within(screen.getByRole('article', { name: 'Bölge 2' })).getByText('Hazır')).toBeInTheDocument()
    expect(tab(/Ekran 1/)).toHaveTextContent('2/2')
  })

  it('shows zoom as a percentage; the mute switch works', async () => {
    await renderApp({
      screens: [{ ...screen1, layoutId: 'single', zones: [{ url: 'x', refreshSec: 0, zoom: 1.5, muted: false }] }]
    })
    expect(screen.getByLabelText('Yakınlaştırma (%)')).toHaveValue(150)
    const mute = screen.getByRole('switch', { name: 'Sesi kapat' })
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

  it('screen name, gap and background are edited on the same page', async () => {
    await renderApp()
    const name = screen.getByLabelText('Ekran adı')
    expect(name).toHaveAttribute('placeholder', 'Ekran 1')
    await user().type(name, 'Left TV')
    expect(tab(/Left TV/)).toBeInTheDocument()

    const gap = screen.getByLabelText('Bölge arası boşluk')
    await user().clear(gap)
    await user().type(gap, '12')
    expect(gap).toHaveValue(12)
    expect(screen.getByText('#000000')).toBeInTheDocument()
  })
})

describe('App - multiple screens', () => {
  it('a single-screen config shows one default-named tab, an add button and no delete', async () => {
    await renderApp()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]).toHaveTextContent('Ekran 1')
    expect(tabs[0]).toHaveTextContent('1/2')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Ekran ekle' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bu ekranı sil' })).not.toBeInTheDocument()
  })

  it('add screen: picks a free monitor, activates the new tab, marks unsaved', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Ekran ekle' }))
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveTextContent('Ekran 2')
    expect(tabs[1]).toHaveTextContent('TV')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('radio', { name: /^TV/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()

    await user().click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() =>
      expect(api.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          screens: [expect.objectContaining({ id: 's1' }), expect.objectContaining({ displayId: 2 })]
        })
      )
    )
  })

  it('switching tabs shows the zones and monitor of each screen', async () => {
    const s2: ScreenConfig = {
      ...screen1,
      id: 's2',
      name: 'Checkout',
      displayId: 2,
      layoutId: 'single',
      zones: [{ url: 'https://checkout.local', refreshSec: 0, zoom: 1, muted: false }]
    }
    await renderApp({ screens: [screen1, s2] })
    expect(screen.getByLabelText('Bölge 1 URL')).toHaveValue('https://a.com')

    await user().click(tab(/Checkout/))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByLabelText('Bölge 1 URL')).toHaveValue('https://checkout.local')
    expect(screen.getByRole('radio', { name: /^TV/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(screen.getByRole('radiogroup', { name: 'Düzenler' })).getByRole('radio', { name: 'Tek Ekran' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
  })

  it('a second screen on the same monitor gets a warning', async () => {
    const s2: ScreenConfig = { ...screen1, id: 's2', displayId: null }
    await renderApp({ screens: [screen1, s2] })
    const second = screen.getAllByRole('tab')[1]
    expect(second).toHaveClass('conflict')
    await user().click(second)
    expect(screen.getByText('Aynı monitör başka bir ekrana atanmış')).toBeInTheDocument()
  })

  it('deleting a saved screen asks for confirmation; Cancel keeps it', async () => {
    const s2: ScreenConfig = { ...screen1, id: 's2', name: 'Checkout', displayId: 2 }
    await renderApp({ screens: [screen1, s2] })
    await user().click(tab(/Checkout/))
    // The delete button lives only in the tab bar
    const buttons = screen.getAllByRole('button', { name: 'Bu ekranı sil' })
    expect(buttons).toHaveLength(1)
    await user().click(buttons[0])

    const dialog = screen.getByRole('dialog', { name: 'Ekran silinsin mi?' })
    expect(dialog).toHaveTextContent('"Checkout" kaydedilmiş bir ekran')
    expect(screen.getAllByRole('tab')).toHaveLength(2)

    await user().click(within(dialog).getByRole('button', { name: 'Vazgeç' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.queryByText('Kaydedilmemiş değişiklikler')).not.toBeInTheDocument()
  })

  it('confirming Delete removes the saved screen', async () => {
    const s2: ScreenConfig = { ...screen1, id: 's2', name: 'Checkout', displayId: 2 }
    await renderApp({ screens: [screen1, s2] })
    await user().click(tab(/Checkout/))
    await user().click(screen.getByRole('button', { name: 'Bu ekranı sil' }))
    await user().click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Sil' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(1)
    expect(tabs[0]).toHaveTextContent('Ekran 1')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('button', { name: 'Bu ekranı sil' })).not.toBeInTheDocument()
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()
  })

  it('the Escape key closes the confirmation', async () => {
    const s2: ScreenConfig = { ...screen1, id: 's2', name: 'Checkout', displayId: 2 }
    await renderApp({ screens: [screen1, s2] })
    await user().click(screen.getAllByRole('button', { name: 'Bu ekranı sil' })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user().keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('a not-yet-saved (newly added) screen is deleted without confirmation', async () => {
    await renderApp()
    await user().click(screen.getByRole('button', { name: 'Ekran ekle' }))
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    await user().click(screen.getAllByRole('button', { name: 'Bu ekranı sil' })[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(1)
  })

  it('after Save a new screen counts as saved and asks for confirmation', async () => {
    await renderApp()
    await user().click(screen.getByRole('button', { name: 'Ekran ekle' }))
    await user().click(screen.getByRole('button', { name: 'Kaydet' }))
    await screen.findByRole('status')
    await user().click(screen.getAllByRole('button', { name: 'Bu ekranı sil' })[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('"Ekran 2" kaydedilmiş bir ekran')
  })

  it('shows the window count when the player runs with several windows', async () => {
    await renderApp({}, { running: true, windows: 2, active: ['s1', 's2'], skipped: [] })
    expect(screen.getByText('Oynatılıyor')).toBeInTheDocument()
    expect(screen.getByText('2 pencere')).toBeInTheDocument()
  })

  it('shows a warning toast when a screen is skipped on start', async () => {
    const api = await renderApp()
    ;(api.startPlayer as ReturnType<typeof vi.fn>).mockResolvedValue({ running: true, windows: 1, active: ['s1'], skipped: ['s2'] })
    await user().click(screen.getByRole('button', { name: 'Tümünü Başlat' }))
    expect(await screen.findByRole('status')).toHaveTextContent('1 ekran atlandı')
  })

  it('Start All is called without a screen filter', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Tümünü Başlat' }))
    await waitFor(() => expect(api.startPlayer).toHaveBeenCalledWith(expect.anything(), undefined))
  })

  it('Start only this screen passes only the active screen id and shows a dot on the tab', async () => {
    const s2: ScreenConfig = {
      ...screen1,
      id: 's2',
      name: 'Checkout',
      displayId: 2,
      layoutId: 'single',
      zones: [{ url: 'https://checkout.local', refreshSec: 0, zoom: 1, muted: true }]
    }
    const api = await renderApp({ screens: [screen1, s2] })
    ;(api.startPlayer as ReturnType<typeof vi.fn>).mockResolvedValue({
      running: true,
      windows: 1,
      active: ['s2'],
      skipped: []
    })
    await user().click(tab(/Checkout/))
    await user().click(screen.getByRole('button', { name: 'Sadece bu ekranı başlat' }))
    await waitFor(() => expect(api.startPlayer).toHaveBeenCalledWith(expect.anything(), ['s2']))
    expect(await screen.findByText('Oynatılıyor')).toBeInTheDocument()
    expect(tab(/Checkout/)).toHaveClass('playing')
    expect(tab(/Ekran 1/)).not.toHaveClass('playing')
    expect(within(tab(/Checkout/)).getByLabelText('Oynatılıyor')).toBeInTheDocument()
  })

  it('Start only this screen: does not start when the screen has no URL', async () => {
    const empty: ScreenConfig = {
      ...screen1,
      id: 's2',
      name: 'Empty',
      displayId: 2,
      layoutId: 'single',
      zones: [{ url: '', refreshSec: 0, zoom: 1, muted: true }]
    }
    const api = await renderApp({ screens: [screen1, empty] })
    await user().click(tab(/Empty/))
    await user().click(screen.getByRole('button', { name: 'Sadece bu ekranı başlat' }))
    expect(await screen.findByRole('status')).toHaveTextContent('En az bir bölgeye URL girin')
    expect(api.startPlayer).not.toHaveBeenCalled()
  })
})

describe('App - saving and player', () => {
  it('Save is disabled without changes; enabled after a change and saves', async () => {
    const api = await renderApp()
    const save = screen.getByRole('button', { name: 'Kaydet' })
    expect(save).toBeDisabled()

    await goTo(/^Başlatma$/)
    await user().click(screen.getByRole('switch', { name: 'Fare imlecini gizle' }))
    expect(save).toBeEnabled()

    await user().click(save)
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ hideCursor: false })))
    expect(await screen.findByRole('status')).toHaveTextContent('Ayarlar kaydedildi')
    expect(save).toBeDisabled()
  })

  it('does not start without any URL, warns and returns to the Screens page', async () => {
    const api = await renderApp({
      screens: [{ ...screen1, layoutId: 'single', zones: [{ url: '', refreshSec: 0, zoom: 1, muted: false }] }]
    })
    await goTo(/^Başlatma$/)
    await user().click(screen.getByRole('button', { name: 'Tümünü Başlat' }))
    expect(await screen.findByRole('status')).toHaveTextContent('En az bir bölgeye URL girin')
    expect(api.startPlayer).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1, name: 'Ekranlar' })).toBeInTheDocument()
  })

  it('starts the player when there is a URL and updates the status', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Tümünü Başlat' }))
    await waitFor(() => expect(api.startPlayer).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Oynatılıyor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Durdur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tümünü Yeniden Başlat' })).toBeInTheDocument()
  })

  it('Stop and Reload work while the player runs', async () => {
    const api = await renderApp({}, RUNNING)
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

describe('App - startup page', () => {
  it('switches match the config and can be toggled; cursor hiding lives here', async () => {
    await renderApp({ autostart: true })
    await goTo(/^Başlatma$/)
    const autostart = screen.getByRole('switch', { name: 'Windows açılışında başlat' })
    const autoplay = screen.getByRole('switch', { name: 'Doğrudan oynatıcıyı aç' })
    expect(autostart).toBeChecked()
    expect(autoplay).not.toBeChecked()
    await user().click(autoplay)
    expect(autoplay).toBeChecked()
    expect(screen.getByRole('heading', { level: 2, name: 'Oynatıcı' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Fare imlecini gizle' })).toBeChecked()
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

  it('shows the version', async () => {
    await renderApp()
    expect(screen.getByText('v0.1.0')).toBeInTheDocument()
  })
})

describe('App - export/import settings', () => {
  it('export is called with the on-screen config (including unsaved changes) and shows a toast', async () => {
    const api = await renderApp()
    await user().type(screen.getByLabelText('Bölge 2 URL'), 'b.com')
    await user().click(screen.getByRole('button', { name: 'Ayarları dışa aktar' }))
    await waitFor(() =>
      expect(api.exportConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          screens: [expect.objectContaining({ zones: [expect.anything(), expect.objectContaining({ url: 'b.com' })] })]
        })
      )
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Ayarlar dışa aktarıldı')
    // exporting does not count as saving
    expect(screen.getByText('Kaydedilmemiş değişiklikler')).toBeInTheDocument()
  })

  it('a canceled export stays silent, an error is shown', async () => {
    const api = await renderApp()
    ;(api.exportConfig as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, canceled: true })
    await user().click(screen.getByRole('button', { name: 'Ayarları dışa aktar' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    ;(api.exportConfig as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, error: 'EACCES' })
    await user().click(screen.getByRole('button', { name: 'Ayarları dışa aktar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Dışa aktarılamadı: EACCES')
  })

  it('a successful import replaces the config and counts as saved', async () => {
    const api = await renderApp()
    const imported: AppConfig = {
      ...baseConfig,
      language: 'en',
      screens: [{ ...screen1, id: 'imp1', name: 'Imported', layoutId: 'single', zones: [screen1.zones[0]] }]
    }
    ;(api.importConfig as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, config: imported })
    // make a change first: importing must reset dirty
    await user().type(screen.getByLabelText('Bölge 2 URL'), 'x')
    await user().click(screen.getByRole('button', { name: 'Ayarları içe aktar' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Screens' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Imported/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Settings imported')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('rejects a newer-format file and shows version info', async () => {
    const api = await renderApp()
    ;(api.importConfig as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      unsupported: { file: 3, supported: 2 }
    })
    await user().click(screen.getByRole('button', { name: 'Ayarları içe aktar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Dosya biçimi v3; uygulamanın bu sürümü en fazla v2')
    expect(screen.getByRole('tab', { name: /Ekran 1/ })).toBeInTheDocument()
  })

  it('a canceled import changes nothing, a broken file shows an error', async () => {
    const api = await renderApp()
    await user().click(screen.getByRole('button', { name: 'Ayarları içe aktar' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    ;(api.importConfig as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, error: 'SyntaxError' })
    await user().click(screen.getByRole('button', { name: 'Ayarları içe aktar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('İçe aktarılamadı: SyntaxError')
  })
})
