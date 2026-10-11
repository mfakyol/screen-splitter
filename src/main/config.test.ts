import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

let userData = ''
let locale = 'en-US'

vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => (name === 'userData' ? userData : tmpdir()),
    getLocale: () => locale
  }
}))

import {
  DEFAULT_CONFIG,
  CONFIG_SCHEMA_VERSION,
  UnsupportedConfigError,
  normalizeConfig,
  normalizeScreen,
  hasContent,
  loadConfig,
  saveConfig,
  getConfigPath
} from './config'

describe('config schema version', () => {
  it('current version is 2', () => {
    expect(CONFIG_SCHEMA_VERSION).toBe(2)
    expect(DEFAULT_CONFIG.schema).toBe(2)
  })

  it('a normalized config always carries the current version', () => {
    expect(normalizeConfig({}).schema).toBe(2)
    expect(normalizeConfig({ schema: 1 } as never).schema).toBe(2)
    expect(normalizeConfig({ schema: 2 }).schema).toBe(2)
  })

  it('a file without schema counts as v1 (legacy format) and migrates', () => {
    const cfg = normalizeConfig({ layoutId: 'split-h', zones: [zone('a')] })
    expect(cfg.schema).toBe(2)
    expect(cfg.screens[0].layoutId).toBe('split-h')
  })

  it('a file with a higher schema throws UnsupportedConfigError', () => {
    expect(() => normalizeConfig({ schema: 3 })).toThrow(UnsupportedConfigError)
    try {
      normalizeConfig({ schema: 99 })
    } catch (e) {
      const err = e as UnsupportedConfigError
      expect(err.fileSchema).toBe(99)
      expect(err.supported).toBe(2)
      expect(err.message).toContain('v99')
    }
  })

  it('treats invalid schema values like v1', () => {
    expect(normalizeConfig({ schema: 'abc' as never }).schema).toBe(2)
    expect(normalizeConfig({ schema: -4 }).schema).toBe(2)
    expect(normalizeConfig({ schema: 0 }).schema).toBe(2)
  })

  it('loadConfig does not overwrite a newer-schema file, continues with defaults and logs', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const original = JSON.stringify({ schema: 7, foo: 'bar' })
    writeFileSync(getConfigPath(), original, 'utf8')
    const cfg = loadConfig()
    expect(cfg.schema).toBe(2)
    expect(cfg.screens).toHaveLength(1)
    expect(readFileSync(getConfigPath(), 'utf8')).toBe(original)
    expect(errSpy.mock.calls[0][0]).toContain('v7')
  })

  it('saveConfig writes schema to the file', () => {
    saveConfig(normalizeConfig({}))
    const parsed = JSON.parse(readFileSync(getConfigPath(), 'utf8'))
    expect(parsed.schema).toBe(2)
    expect(Object.keys(parsed)[0]).toBe('schema')
  })
})
import type { ScreenConfig } from '../shared/types'

// Default zone: starts muted
const zone = (url = '', extra: Partial<ScreenConfig['zones'][0]> = {}) => ({
  url,
  refreshSec: 0,
  zoom: 1,
  muted: true,
  ...extra
})

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'screen-splitter-test-'))
  locale = 'en-US'
})

afterEach(() => {
  rmSync(userData, { recursive: true, force: true })
})

describe('normalizeScreen', () => {
  it('builds a default screen from an empty object and assigns an id', () => {
    const s = normalizeScreen({})
    expect(s.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(s.name).toBe('')
    expect(s.layoutId).toBe('single')
    expect(s.zones).toEqual([zone()])
    expect(s.displayId).toBeNull()
    expect(s.gap).toBe(0)
    expect(s.background).toBe('#000000')
  })

  it('keeps an existing id', () => {
    expect(normalizeScreen({ id: 'abc' }).id).toBe('abc')
  })

  it('fills the zone count to match the layout and drops extras', () => {
    const s = normalizeScreen({ layoutId: 'grid-2x2', zones: [zone('a.com', { refreshSec: 5 })] })
    expect(s.zones).toHaveLength(4)
    expect(s.zones[0]).toMatchObject({ url: 'a.com', refreshSec: 5 })
    expect(s.zones[3].url).toBe('')

    const many = normalizeScreen({ layoutId: 'split-h', zones: Array.from({ length: 6 }, (_, i) => zone('z' + i)) })
    expect(many.zones.map((z) => z.url)).toEqual(['z0', 'z1'])
  })

  it('fills missing zone fields with defaults (older version)', () => {
    const s = normalizeScreen({ zones: [{ url: 'x.com' } as never] })
    expect(s.zones[0]).toEqual(zone('x.com'))
  })

  it('uses single for an invalid layoutId', () => {
    expect(normalizeScreen({ layoutId: 'missing' }).layoutId).toBe('single')
  })

  it('clamps gap to 0..100 and resets an invalid color to the default', () => {
    expect(normalizeScreen({ gap: -5 }).gap).toBe(0)
    expect(normalizeScreen({ gap: 500 }).gap).toBe(100)
    expect(normalizeScreen({ gap: 'abc' as never }).gap).toBe(0)
    expect(normalizeScreen({ background: 'kirmizi' }).background).toBe('#000000')
    expect(normalizeScreen({ background: '#ABCDEF' }).background).toBe('#ABCDEF')
  })

  it('displayId becomes null when it is not a number', () => {
    expect(normalizeScreen({ displayId: '3' as never }).displayId).toBeNull()
    expect(normalizeScreen({ displayId: 3 }).displayId).toBe(3)
  })
})

describe('normalizeConfig', () => {
  it('builds a single-screen default config from an empty object', () => {
    const cfg = normalizeConfig({})
    expect(cfg.screens).toHaveLength(1)
    expect(cfg.screens[0].layoutId).toBe('single')
    expect(cfg.autoplay).toBe(false)
    expect(cfg.autostart).toBe(false)
    expect(cfg.hideCursor).toBe(true)
    expect(cfg.theme).toBe('system')
    expect(cfg.accent).toBe('blue')
  })

  it('moves a v0.1 single-screen config file into the screens[] array', () => {
    const cfg = normalizeConfig({
      layoutId: 'grid-2x2',
      zones: [zone('https://a.com', { zoom: 1.5 })],
      displayId: 7,
      gap: 8,
      background: '#123456',
      language: 'tr'
    })
    expect(cfg.screens).toHaveLength(1)
    const s = cfg.screens[0]
    expect(s.layoutId).toBe('grid-2x2')
    expect(s.zones).toHaveLength(4)
    expect(s.zones[0].zoom).toBe(1.5)
    expect(s.displayId).toBe(7)
    expect(s.gap).toBe(8)
    expect(s.background).toBe('#123456')
    expect(cfg.language).toBe('tr')
    // legacy fields do not stay at the root
    expect(cfg).not.toHaveProperty('layoutId')
    expect(cfg).not.toHaveProperty('zones')
    expect(cfg).not.toHaveProperty('displayId')
  })

  it('keeps multiple screens and normalizes each one', () => {
    const cfg = normalizeConfig({
      screens: [
        { id: 's1', layoutId: 'split-h', zones: [zone('a')] },
        { id: 's2', layoutId: 'cols-3', displayId: 2, gap: 999 }
      ]
    })
    expect(cfg.screens.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(cfg.screens[0].zones).toHaveLength(2)
    expect(cfg.screens[1].zones).toHaveLength(3)
    expect(cfg.screens[1].gap).toBe(100)
  })

  it('an empty screens array falls back to one default screen', () => {
    expect(normalizeConfig({ screens: [] }).screens).toHaveLength(1)
  })

  it('picks the system locale when no language is set', () => {
    locale = 'tr-TR'
    expect(normalizeConfig({}).language).toBe('tr')
    locale = 'de-DE'
    expect(normalizeConfig({}).language).toBe('de')
    locale = 'ja-JP'
    expect(normalizeConfig({}).language).toBe('en')
  })

  it('keeps a valid language and replaces an invalid one with the locale', () => {
    expect(normalizeConfig({ language: 'tr' }).language).toBe('tr')
    expect(normalizeConfig({ language: 'xx' as never }).language).toBe('en')
  })

  it('keeps a valid theme/accent and resets invalid ones to the defaults', () => {
    expect(normalizeConfig({ theme: 'dark', accent: 'rose' })).toMatchObject({ theme: 'dark', accent: 'rose' })
    expect(normalizeConfig({ theme: 'neon' as never, accent: 'red' as never })).toMatchObject({
      theme: 'system',
      accent: 'blue'
    })
  })

  it('DEFAULT_CONFIG is not mutated', () => {
    const before = JSON.stringify(DEFAULT_CONFIG)
    const cfg = normalizeConfig({})
    cfg.screens[0].zones[0].url = 'degisti'
    cfg.screens.push(cfg.screens[0])
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before)
  })
})

describe('hasContent', () => {
  it('is true when any screen has a URL', () => {
    expect(hasContent(normalizeConfig({}))).toBe(false)
    expect(hasContent(normalizeConfig({ screens: [{ zones: [zone('   ')] }] }))).toBe(false)
    expect(hasContent(normalizeConfig({ screens: [{}, { zones: [zone('a.com')] }] }))).toBe(true)
  })
})

describe('loadConfig / saveConfig', () => {
  it('config path is config.json under userData', () => {
    expect(getConfigPath()).toBe(join(userData, 'config.json'))
  })

  it('returns defaults when the file does not exist', () => {
    expect(existsSync(getConfigPath())).toBe(false)
    expect(loadConfig().screens).toHaveLength(1)
  })

  it('saves and reads back (round-trip)', () => {
    const saved = saveConfig({
      ...normalizeConfig({}),
      language: 'de',
      screens: [
        normalizeScreen({
          id: 's1',
          name: 'Left TV',
          layoutId: 'split-v',
          zones: [zone('https://a.com', { refreshSec: 30, zoom: 1.5, muted: true }), zone('b.com')],
          gap: 8,
          background: '#123456'
        }),
        normalizeScreen({ id: 's2', displayId: 2 })
      ]
    })
    expect(existsSync(getConfigPath())).toBe(true)
    const loaded = loadConfig()
    expect(loaded).toEqual(saved)
    expect(loaded.screens[0].name).toBe('Left TV')
    expect(loaded.screens[0].zones[0].zoom).toBe(1.5)
    expect(loaded.screens[1].displayId).toBe(2)
  })

  it('normalizes while saving', () => {
    const saved = saveConfig({
      ...normalizeConfig({}),
      screens: [{ id: 'x', name: '', displayId: null, layoutId: 'cols-3', zones: [], gap: 999, background: '#000000' }]
    })
    expect(saved.screens[0].zones).toHaveLength(3)
    expect(saved.screens[0].gap).toBe(100)
  })

  it('reads a legacy-format file and converts it to the new format', () => {
    writeFileSync(getConfigPath(), JSON.stringify({ layoutId: 'split-h', zones: [zone('a.com')], displayId: 5 }))
    const cfg = loadConfig()
    expect(cfg.screens).toHaveLength(1)
    expect(cfg.screens[0].layoutId).toBe('split-h')
    expect(cfg.screens[0].displayId).toBe(5)
  })

  it('reads a file that starts with a UTF-8 BOM', () => {
    writeFileSync(getConfigPath(), '﻿' + JSON.stringify({ language: 'tr' }), 'utf8')
    expect(loadConfig().language).toBe('tr')
  })

  it('falls back to defaults on broken JSON and logs an error', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    writeFileSync(getConfigPath(), '{ bozuk json', 'utf8')
    expect(loadConfig().screens).toHaveLength(1)
    expect(errSpy).toHaveBeenCalled()
  })

  it('writes the file as readable (indented) JSON', () => {
    saveConfig(normalizeConfig({}))
    const text = readFileSync(getConfigPath(), 'utf8')
    expect(text).toContain('\n  "screens"')
    expect(() => JSON.parse(text)).not.toThrow()
  })
})
