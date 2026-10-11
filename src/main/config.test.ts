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

import { DEFAULT_CONFIG, normalizeConfig, loadConfig, saveConfig, getConfigPath } from './config'

beforeEach(() => {
  userData = mkdtempSync(join(tmpdir(), 'screen-splitter-test-'))
  locale = 'en-US'
})

afterEach(() => {
  rmSync(userData, { recursive: true, force: true })
})

describe('normalizeConfig', () => {
  it('builds the default config from an empty object', () => {
    const cfg = normalizeConfig({})
    expect(cfg.layoutId).toBe('single')
    expect(cfg.zones).toHaveLength(1)
    expect(cfg.zones[0]).toEqual({ url: '', refreshSec: 0, zoom: 1, muted: false })
    expect(cfg.autoplay).toBe(false)
    expect(cfg.autostart).toBe(false)
    expect(cfg.gap).toBe(0)
    expect(cfg.hideCursor).toBe(true)
  })

  it('fills the zone count to match the layout', () => {
    const cfg = normalizeConfig({ layoutId: 'grid-2x2', zones: [{ url: 'a.com', refreshSec: 5, zoom: 1, muted: false }] })
    expect(cfg.zones).toHaveLength(4)
    expect(cfg.zones[0].url).toBe('a.com')
    expect(cfg.zones[0].refreshSec).toBe(5)
    expect(cfg.zones[3].url).toBe('')
  })

  it('drops extra zones', () => {
    const zones = Array.from({ length: 6 }, (_, i) => ({ url: `z${i}`, refreshSec: 0, zoom: 1, muted: false }))
    const cfg = normalizeConfig({ layoutId: 'split-h', zones })
    expect(cfg.zones).toHaveLength(2)
    expect(cfg.zones.map((z) => z.url)).toEqual(['z0', 'z1'])
  })

  it('fills missing zone fields with defaults', () => {
    // older config versions may lack refreshSec/zoom/muted
    const cfg = normalizeConfig({ layoutId: 'single', zones: [{ url: 'x.com' } as never] })
    expect(cfg.zones[0]).toEqual({ url: 'x.com', refreshSec: 0, zoom: 1, muted: false })
  })

  it('uses single for an invalid layoutId', () => {
    const cfg = normalizeConfig({ layoutId: 'missing' })
    expect(cfg.layoutId).toBe('single')
    expect(cfg.zones).toHaveLength(1)
  })

  it('clamps gap to the 0..100 range', () => {
    expect(normalizeConfig({ gap: -5 }).gap).toBe(0)
    expect(normalizeConfig({ gap: 500 }).gap).toBe(100)
    expect(normalizeConfig({ gap: 12 }).gap).toBe(12)
    expect(normalizeConfig({ gap: 'abc' as never }).gap).toBe(0)
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
    locale = 'en-US'
    expect(normalizeConfig({ language: 'tr' }).language).toBe('tr')
    expect(normalizeConfig({ language: 'xx' as never }).language).toBe('en')
  })

  it('theme and accent defaults are system/blue', () => {
    const cfg = normalizeConfig({})
    expect(cfg.theme).toBe('system')
    expect(cfg.accent).toBe('blue')
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
    const cfg = normalizeConfig({ layoutId: 'grid-3x3' })
    cfg.zones[0].url = 'degisti'
    expect(JSON.stringify(DEFAULT_CONFIG)).toBe(before)
  })
})

describe('loadConfig / saveConfig', () => {
  it('config path is config.json under userData', () => {
    expect(getConfigPath()).toBe(join(userData, 'config.json'))
  })

  it('returns defaults when the file does not exist', () => {
    expect(existsSync(getConfigPath())).toBe(false)
    expect(loadConfig().layoutId).toBe('single')
  })

  it('saves and reads back (round-trip)', () => {
    const saved = saveConfig({
      ...normalizeConfig({}),
      layoutId: 'split-v',
      zones: [
        { url: 'https://a.com', refreshSec: 30, zoom: 1.5, muted: true },
        { url: 'b.com', refreshSec: 0, zoom: 1, muted: false }
      ],
      gap: 8,
      background: '#123456',
      language: 'de'
    })
    expect(existsSync(getConfigPath())).toBe(true)
    const loaded = loadConfig()
    expect(loaded).toEqual(saved)
    expect(loaded.zones[0].zoom).toBe(1.5)
    expect(loaded.language).toBe('de')
  })

  it('normalizes while saving', () => {
    const saved = saveConfig({ ...normalizeConfig({}), layoutId: 'cols-3', zones: [], gap: 999 })
    expect(saved.zones).toHaveLength(3)
    expect(saved.gap).toBe(100)
  })

  it('reads a file that starts with a UTF-8 BOM', () => {
    const json = JSON.stringify({ layoutId: 'grid-2x2', language: 'tr' })
    writeFileSync(getConfigPath(), '﻿' + json, 'utf8')
    const cfg = loadConfig()
    expect(cfg.layoutId).toBe('grid-2x2')
    expect(cfg.language).toBe('tr')
  })

  it('falls back to defaults on broken JSON and logs an error', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    writeFileSync(getConfigPath(), '{ bozuk json', 'utf8')
    const cfg = loadConfig()
    expect(cfg.layoutId).toBe('single')
    expect(errSpy).toHaveBeenCalled()
  })

  it('writes the file as readable (indented) JSON', () => {
    saveConfig(normalizeConfig({}))
    const text = readFileSync(getConfigPath(), 'utf8')
    expect(text).toContain('\n  "layoutId"')
    expect(() => JSON.parse(text)).not.toThrow()
  })
})
