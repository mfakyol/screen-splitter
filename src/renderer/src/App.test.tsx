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

function mockApi(overrides: Partial<AppConfig> = {}, status: PlayerStatus = { running: false, displayId: null }): Api {
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
    getAppInfo: vi.fn().mockResolvedValue({ version: '0.1.0', configPath: 'C:\\x\\config.json', packaged: true }),
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

beforeEach(() => {
  document.title = ''
})

// vitest globals are off, so RTL does not clean up automatically
afterEach(() => cleanup())

describe('App - loading and language', () => {
  it('shows loading, then renders the UI in the selected language', async () => {
    mockApi()
    render(<App />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Ekran Bölücü' })).toBeInTheDocument()
    expect(screen.getByText('Durduruldu')).toBeInTheDocument()
    expect(document.title).toBe('Ekran Bölücü - Ayarlar')
    expect(document.documentElement.lang).toBe('tr')
  })

  it('an English config renders English text', async () => {
    await renderApp({ language: 'en' })
    expect(screen.getByRole('heading', { level: 1, name: 'Screen Splitter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Start Player' })).toBeInTheDocument()
  })

  it('changing the language translates the UI immediately and saves the config', async () => {
    const api = await renderApp()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByTitle('Dil'), 'de')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bildschirmteiler' })).toBeInTheDocument()
    expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ language: 'de' }))
  })
})

describe('App - layout and zones', () => {
  it('lists every layout and marks the selected one', async () => {
    await renderApp()
    const cards = document.querySelectorAll('.layout-card')
    expect(cards).toHaveLength(LAYOUTS.length)
    expect(document.querySelector('.layout-card.selected')).toHaveTextContent('2 Yan Yana')
  })

  it('shows the zone count for the layout', async () => {
    await renderApp()
    expect(document.querySelectorAll('.zone-tab')).toHaveLength(2)
    expect(screen.getByText('https://a.com')).toBeInTheDocument()
    expect(screen.getByText('URL yok')).toBeInTheDocument()
  })

  it('changing the layout updates the zone count and keeps existing URLs', async () => {
    await renderApp()
    const user = userEvent.setup()
    await user.click(screen.getByTitle('2x2 Izgara'))
    expect(document.querySelectorAll('.zone-tab')).toHaveLength(4)
    expect(screen.getByText('https://a.com')).toBeInTheDocument()
    expect(screen.getAllByText('URL yok')).toHaveLength(3)
  })

  it('a URL can be entered after clicking a zone tab', async () => {
    await renderApp()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '2' }))
    const input = screen.getByPlaceholderText('https://ornek.com/menu')
    expect(input).toHaveValue('')
    await user.type(input, 'b.com')
    expect(input).toHaveValue('b.com')
    expect(screen.getByText('b.com')).toBeInTheDocument()
  })

  it('shows zoom as a percentage and clamps it', async () => {
    await renderApp({ zones: [{ url: 'x', refreshSec: 0, zoom: 1.5, muted: false }], layoutId: 'single' })
    const zoom = screen.getByLabelText('Yakınlaştırma (%)')
    expect(zoom).toHaveValue(150)
  })
})

describe('App - saving and player', () => {
  it('the Save button is disabled without changes, enabled after a change and saves', async () => {
    const api = await renderApp()
    const user = userEvent.setup()
    const save = screen.getByRole('button', { name: 'Kaydet' })
    expect(save).toBeDisabled()

    await user.click(screen.getByLabelText('Oynatıcıda fare imlecini gizle'))
    expect(save).toBeEnabled()

    await user.click(save)
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ hideCursor: false })))
    expect(await screen.findByText('Ayarlar kaydedildi')).toBeInTheDocument()
    expect(save).toBeDisabled()
  })

  it('does not start the player without a URL and warns', async () => {
    const api = await renderApp({
      zones: [{ url: '', refreshSec: 0, zoom: 1, muted: false }],
      layoutId: 'single'
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '▶ Oynatıcıyı Başlat' }))
    expect(await screen.findByText('En az bir bölgeye URL girin')).toBeInTheDocument()
    expect(api.startPlayer).not.toHaveBeenCalled()
  })

  it('starts the player when there is a URL and updates the status', async () => {
    const api = await renderApp()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '▶ Oynatıcıyı Başlat' }))
    await waitFor(() => expect(api.startPlayer).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Oynatılıyor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Durdur' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yeniden Başlat' })).toBeInTheDocument()
  })

  it('Stop and Reload work while the player runs', async () => {
    const api = await renderApp({}, { running: true, displayId: null })
    const user = userEvent.setup()
    expect(screen.getByText('Oynatılıyor')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yenile' }))
    expect(api.reloadPlayer).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Durdur' }))
    await waitFor(() => expect(api.stopPlayer).toHaveBeenCalled())
    expect(await screen.findByText('Durduruldu')).toBeInTheDocument()
  })

  it('subscribes to status changes from the main process', async () => {
    const api = await renderApp()
    expect(api.onStatus).toHaveBeenCalledTimes(1)
  })
})

describe('App - display and startup settings', () => {
  it('lists displays and marks the primary one', async () => {
    await renderApp()
    const select = screen.getByLabelText(/Hedef ekran/) as HTMLSelectElement
    const options = within(select).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([
      'Birincil ekran',
      'Display 1 — 1920×1080 (birincil)',
      'TV — 3840×2160'
    ])
  })

  it('display selection is written to the config', async () => {
    const api = await renderApp()
    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText(/Hedef ekran/), '2')
    await user.click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(api.saveConfig).toHaveBeenCalledWith(expect.objectContaining({ displayId: 2 })))
  })

  it('warns in development mode with autostart on, not in the packaged build', async () => {
    const api = mockApi({ autostart: true })
    ;(api.getAppInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '0.1.0',
      configPath: 'x',
      packaged: false
    })
    render(<App />)
    expect(await screen.findByText(/Geliştirme modundasınız/)).toBeInTheDocument()
  })

  it('no warning in the packaged build', async () => {
    await renderApp({ autostart: true })
    expect(screen.queryByText(/Geliştirme modundasınız/)).not.toBeInTheDocument()
  })

  it('shows the version', async () => {
    await renderApp()
    expect(screen.getByText(/v0\.1\.0/)).toBeInTheDocument()
  })
})
