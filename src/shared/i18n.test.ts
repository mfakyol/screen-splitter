import { describe, it, expect } from 'vitest'
import { LANGUAGES, TKEYS, isLang, langFromLocale, layoutName, t, type TKey } from './i18n'
import { LAYOUTS } from './layouts'

describe('LANGUAGES / isLang', () => {
  it('supported languages are tr, en, de', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['tr', 'en', 'de'])
  })

  it('isLang accepts only supported codes', () => {
    expect(isLang('tr')).toBe(true)
    expect(isLang('en')).toBe(true)
    expect(isLang('de')).toBe(true)
    expect(isLang('fr')).toBe(false)
    expect(isLang('')).toBe(false)
    expect(isLang(undefined)).toBe(false)
    expect(isLang(42)).toBe(false)
  })
})

describe('langFromLocale', () => {
  it('drops the region code and picks the language', () => {
    expect(langFromLocale('tr-TR')).toBe('tr')
    expect(langFromLocale('tr')).toBe('tr')
    expect(langFromLocale('de_AT')).toBe('de')
    expect(langFromLocale('en-GB')).toBe('en')
  })

  it('is case-insensitive', () => {
    expect(langFromLocale('TR-tr')).toBe('tr')
  })

  it('falls back to English for an unsupported locale', () => {
    expect(langFromLocale('fr-FR')).toBe('en')
    expect(langFromLocale('')).toBe('en')
  })
})

describe('t', () => {
  it('returns the translation in the selected language', () => {
    expect(t('tr', 'btn.save')).toBe('Kaydet')
    expect(t('en', 'btn.save')).toBe('Save')
    expect(t('de', 'btn.save')).toBe('Speichern')
  })

  it('substitutes parameters', () => {
    expect(t('tr', 'zone.url', { n: 3 })).toBe('Bölge 3 URL')
    expect(t('en', 'player.zone', { n: 1 })).toBe('Zone 1')
    expect(t('en', 'toast.saveFailed', { err: 'disk' })).toBe('Save failed: disk')
  })

  it('returns the key for an unknown key', () => {
    expect(t('tr', 'no.such.key' as TKey)).toBe('no.such.key')
  })

  it('falls back to English for an unknown language', () => {
    // @ts-expect-error intentionally invalid language
    expect(t('xx', 'btn.save')).toBe('Save')
  })
})

describe('dictionary integrity', () => {
  it('the key list is not empty', () => {
    expect(TKEYS.length).toBeGreaterThan(50)
  })

  it.each(LANGUAGES.map((l) => l.code))('every key is translated in %s', (lang) => {
    for (const k of TKEYS) {
      const v = t(lang, k)
      expect(v, `${lang}:${k}`).not.toBe(k)
      expect(v.trim().length, `${lang}:${k}`).toBeGreaterThan(0)
    }
  })

  it('every layout has a name in every language', () => {
    for (const lang of LANGUAGES.map((l) => l.code)) {
      for (const l of LAYOUTS) {
        expect(layoutName(lang, l.id), `${lang}:${l.id}`).not.toBe('layout.' + l.id)
      }
    }
  })

  it('parameterized keys contain the same placeholders in every language', () => {
    const placeholders = (s: string): string[] => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const k of TKEYS) {
      const ref = placeholders(t('en', k))
      for (const lang of ['tr', 'de'] as const) {
        expect(placeholders(t(lang, k)), `${lang}:${k}`).toEqual(ref)
      }
    }
  })

  it('different languages really produce different text', () => {
    expect(t('tr', 'tray.quit')).not.toBe(t('en', 'tray.quit'))
    expect(t('de', 'tray.quit')).not.toBe(t('en', 'tray.quit'))
  })
})
