import { describe, it, expect } from 'vitest'
import { ACCENTS, THEME_MODES, getAccent, isAccentId, isThemeMode, resolveTheme } from './theme'

describe('theme modes', () => {
  it('supports system, light, dark', () => {
    expect(THEME_MODES).toEqual(['system', 'light', 'dark'])
    for (const m of THEME_MODES) expect(isThemeMode(m)).toBe(true)
    expect(isThemeMode('auto')).toBe(false)
    expect(isThemeMode(undefined)).toBe(false)
  })

  it('resolveTheme resolves system mode by the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('resolveTheme keeps light/dark regardless of the OS preference', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('accent colors', () => {
  it('ids are unique and contain valid hex colors', () => {
    const ids = ACCENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of ACCENTS) {
      expect(a.color).toMatch(/^#[0-9a-f]{6}$/i)
      expect(a.hover).toMatch(/^#[0-9a-f]{6}$/i)
      expect(a.soft).toMatch(/^rgba\(/)
    }
  })

  it('isAccentId accepts only defined colors', () => {
    expect(isAccentId('blue')).toBe(true)
    expect(isAccentId('violet')).toBe(true)
    expect(isAccentId('red')).toBe(false)
    expect(isAccentId(3)).toBe(false)
  })

  it('getAccent returns the first color for an unknown id', () => {
    expect(getAccent('teal').id).toBe('teal')
    expect(getAccent('missing' as never).id).toBe(ACCENTS[0].id)
  })
})
