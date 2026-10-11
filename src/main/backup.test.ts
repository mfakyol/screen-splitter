import { describe, it, expect, vi } from 'vitest'
import { tmpdir } from 'os'

vi.mock('electron', () => ({
  app: {
    getPath: () => tmpdir(),
    getLocale: () => 'en-US'
  }
}))

import { parseConfigFile, serializeConfig } from './backup'
import { normalizeConfig, normalizeScreen } from './config'

const fail = (r: ReturnType<typeof parseConfigFile>) => (r.ok ? null : r)

describe('parseConfigFile - broken files', () => {
  it.each([
    ['empty file', ''],
    ['whitespace only', '   \n\t '],
    ['BOM only', '﻿']
  ])('%s -> empty', (_name, text) => {
    const r = fail(parseConfigFile(text))
    expect(r?.reason).toBe('empty')
  })

  it.each([
    ['unclosed bracket', '{ "schema": 2, "screens": ['],
    ['trailing comma', '{ "schema": 2, }'],
    ['single quotes', "{ 'schema': 2 }"],
    ['line comment', '{ // comment\n "schema": 2 }'],
    ['truncated file', '{"schema":2,"language":"tr","screens":[{"id":"a","lay'],
    ['plain text', 'this is not a config'],
    ['HTML page', '<!doctype html><html><body>404</body></html>']
  ])('%s -> syntax', (_name, text) => {
    const r = fail(parseConfigFile(text))
    expect(r?.reason).toBe('syntax')
    expect(r?.error).toMatch(/SyntaxError|JSON/)
  })

  it.each([
    ['array', '[1, 2, 3]'],
    ['empty array', '[]'],
    ['null', 'null'],
    ['number', '42'],
    ['string', '"schema"'],
    ['boolean', 'true']
  ])('%s -> shape', (_name, text) => {
    const r = fail(parseConfigFile(text))
    expect(r?.reason).toBe('shape')
  })

  it('newer schema -> unsupported, with version info', () => {
    const r = fail(parseConfigFile(JSON.stringify({ schema: 5, screens: [] })))
    expect(r?.reason).toBe('unsupported')
    expect(r?.unsupported).toEqual({ file: 5, supported: 2 })
    expect(r?.error).toContain('v5')
  })

  it('an empty object is valid and filled with defaults', () => {
    const r = parseConfigFile('{}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.config.schema).toBe(2)
      expect(r.config.screens).toHaveLength(1)
    }
  })

  it('an object with unrelated fields is valid: unknown fields stay but the config works', () => {
    const r = parseConfigFile(JSON.stringify({ foo: 'bar', screens: [{ layoutId: 'cols-3' }] }))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.config.screens[0].zones).toHaveLength(3)
  })

  it('fixes broken field values (invalid layout, gap, color, language)', () => {
    const r = parseConfigFile(
      JSON.stringify({
        schema: 2,
        language: 'xx',
        theme: 'neon',
        screens: [{ id: 's', layoutId: 'missing', gap: -10, background: 'red', zones: [{ url: 7 }] }]
      })
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      const s = r.config.screens[0]
      expect(s.layoutId).toBe('single')
      expect(s.gap).toBe(0)
      expect(s.background).toBe('#000000')
      expect(r.config.language).toBe('en')
      expect(r.config.theme).toBe('system')
    }
  })
})

describe('parseConfigFile - valid files', () => {
  it('reads valid JSON that starts with a BOM', () => {
    const r = parseConfigFile('﻿' + JSON.stringify({ schema: 2, language: 'tr' }))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.config.language).toBe('tr')
  })

  it('imports and migrates the legacy v0.1 flat format', () => {
    const legacy = {
      layoutId: 'grid-2x2',
      zones: [{ url: 'https://a.com', refreshSec: 30, zoom: 1, muted: false }],
      displayId: 3,
      gap: 4,
      background: '#112233'
    }
    const r = parseConfigFile(JSON.stringify(legacy))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.config.schema).toBe(2)
      expect(r.config.screens).toHaveLength(1)
      expect(r.config.screens[0]).toMatchObject({ layoutId: 'grid-2x2', displayId: 3, gap: 4, background: '#112233' })
      expect(r.config.screens[0].zones).toHaveLength(4)
      expect(r.config.screens[0].zones[0].refreshSec).toBe(30)
    }
  })

  it('Windows line endings (CRLF) and indentation cause no problems', () => {
    const text = '{\r\n  "schema": 2,\r\n  "language": "de"\r\n}\r\n'
    const r = parseConfigFile(text)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.config.language).toBe('de')
  })
})

describe('serializeConfig <-> parseConfigFile round-trip', () => {
  const sample = normalizeConfig({
    language: 'tr',
    theme: 'dark',
    accent: 'rose',
    autoplay: true,
    autostart: true,
    hideCursor: false,
    screens: [
      normalizeScreen({
        id: 'left',
        name: 'Left TV',
        displayId: 11,
        layoutId: 'main-left',
        zones: [
          { url: 'https://menu.local', refreshSec: 60, zoom: 1.25, muted: true },
          { url: 'https://promo.local', refreshSec: 0, zoom: 1, muted: false },
          { url: '', refreshSec: 0, zoom: 1, muted: true }
        ],
        gap: 6,
        background: '#101010'
      }),
      normalizeScreen({ id: 'right', name: 'Checkout', displayId: 12, layoutId: 'single', zones: [{ url: 'checkout.local', refreshSec: 0, zoom: 1, muted: true }] })
    ]
  })

  it('exported text starts with schema and is readably indented', () => {
    const text = serializeConfig(sample)
    expect(text.startsWith('{\n  "schema": 2,')).toBe(true)
    expect(text.endsWith('\n')).toBe(true)
  })

  it('export -> import yields the same config', () => {
    const r = parseConfigFile(serializeConfig(sample))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.config).toEqual(sample)
  })

  it('a hand-corrupted export returns a meaningful error', () => {
    const text = serializeConfig(sample)
    const broken = text.slice(0, Math.floor(text.length / 2))
    const r = fail(parseConfigFile(broken))
    expect(r?.reason).toBe('syntax')
  })
})
