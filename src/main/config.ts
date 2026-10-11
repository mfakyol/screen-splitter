import { app } from 'electron'
import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppConfig, ScreenConfig, Zone } from '../shared/types'
import { getLayout } from '../shared/layouts'
import { isLang, langFromLocale } from '../shared/i18n'
import { DEFAULT_ACCENT, DEFAULT_THEME, isAccentId, isThemeMode } from '../shared/theme'

/** New zones start muted: unexpected audio is unwanted on store displays */
export const DEFAULT_ZONE: Zone = { url: '', refreshSec: 0, zoom: 1, muted: true }

export const DEFAULT_SCREEN: Omit<ScreenConfig, 'id'> = {
  name: '',
  displayId: null,
  layoutId: 'single',
  zones: [{ ...DEFAULT_ZONE }],
  gap: 0,
  background: '#000000'
}

/**
 * Config file format version. Independent of the app version.
 * 1: v0.1 flat format (layoutId/zones/displayId at the root)
 * 2: screens[] array, theme/language fields
 * Bump it on a breaking change and add a migration to normalizeConfig.
 */
export const CONFIG_SCHEMA_VERSION = 2

export class UnsupportedConfigError extends Error {
  constructor(
    public readonly fileSchema: number,
    public readonly supported: number = CONFIG_SCHEMA_VERSION
  ) {
    super(`config schema v${fileSchema} is not supported (max v${supported})`)
    this.name = 'UnsupportedConfigError'
  }
}

export const DEFAULT_CONFIG: AppConfig = {
  schema: CONFIG_SCHEMA_VERSION,
  language: 'en',
  theme: DEFAULT_THEME,
  accent: DEFAULT_ACCENT,
  screens: [],
  autoplay: false,
  autostart: false,
  hideCursor: true
}

const configPath = (): string => join(app.getPath('userData'), 'config.json')

export const newScreenId = (): string => randomUUID()

/** Matches a single screen definition to its layout and fills missing fields. */
export function normalizeScreen(raw: Partial<ScreenConfig>): ScreenConfig {
  const scr: ScreenConfig = { id: '', ...DEFAULT_SCREEN, ...raw }
  if (typeof scr.id !== 'string' || !scr.id) scr.id = newScreenId()
  if (typeof scr.name !== 'string') scr.name = ''
  const layout = getLayout(scr.layoutId)
  scr.layoutId = layout.id
  const zones: Zone[] = []
  for (let i = 0; i < layout.zones.length; i++) {
    zones.push({ ...DEFAULT_ZONE, ...(raw.zones?.[i] ?? {}) })
  }
  scr.zones = zones
  scr.gap = Math.max(0, Math.min(100, Number(scr.gap) || 0))
  if (typeof scr.displayId !== 'number') scr.displayId = null
  if (!/^#[0-9a-f]{6}$/i.test(String(scr.background))) scr.background = DEFAULT_SCREEN.background
  return scr
}

/** Legacy single-screen config fields */
interface LegacyFields {
  layoutId?: string
  zones?: Zone[]
  displayId?: number | null
  gap?: number
  background?: string
}

/** Config as read from disk, not yet validated */
export type RawConfig = Partial<Omit<AppConfig, 'screens'>> & { screens?: Partial<ScreenConfig>[] } & LegacyFields

/**
 * Makes the config valid: moves a legacy single-screen file into the screens[]
 * array, normalizes every screen and validates language/theme values.
 */
export function normalizeConfig(raw: RawConfig): AppConfig {
  // Format version: a missing field means v1 (legacy flat format)
  const fileSchema = typeof raw.schema === 'number' && raw.schema > 0 ? Math.floor(raw.schema) : 1
  if (fileSchema > CONFIG_SCHEMA_VERSION) throw new UnsupportedConfigError(fileSchema)

  const cfg: AppConfig = { ...DEFAULT_CONFIG, ...raw, screens: [], schema: CONFIG_SCHEMA_VERSION }
  cfg.language = isLang(raw.language) ? raw.language : langFromLocale(app.getLocale())
  if (!isThemeMode(cfg.theme)) cfg.theme = DEFAULT_THEME
  if (!isAccentId(cfg.accent)) cfg.accent = DEFAULT_ACCENT

  let screens: Partial<ScreenConfig>[]
  if (Array.isArray(raw.screens) && raw.screens.length > 0) {
    screens = raw.screens
  } else if (raw.layoutId || raw.zones || raw.displayId !== undefined) {
    // v0.1 format: the root fields form a single screen
    screens = [
      {
        layoutId: raw.layoutId,
        zones: raw.zones,
        displayId: raw.displayId ?? null,
        gap: raw.gap,
        background: raw.background
      }
    ]
  } else {
    screens = [{}]
  }
  cfg.screens = screens.map((s) => normalizeScreen(s))

  // Do not keep legacy fields at the root
  const out = cfg as AppConfig & LegacyFields
  delete out.layoutId
  delete out.zones
  delete out.displayId
  delete out.gap
  delete out.background
  return cfg
}

export function hasContent(cfg: AppConfig): boolean {
  return cfg.screens.some((s) => s.zones.some((z) => z.url.trim()))
}

export function loadConfig(): AppConfig {
  try {
    const p = configPath()
    if (!existsSync(p)) return normalizeConfig({})
    let text = readFileSync(p, 'utf8')
    // Editors such as Notepad may add a UTF-8 BOM
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
    return normalizeConfig(JSON.parse(text))
  } catch (err) {
    if (err instanceof UnsupportedConfigError) {
      // The file comes from a newer app; leave it untouched so it is not overwritten
      console.error(`config.json ${err.message}; please update the app. Continuing with default settings.`)
    } else {
      console.error('could not read config, using defaults', err)
    }
    return normalizeConfig({})
  }
}

export function saveConfig(cfg: AppConfig): AppConfig {
  const normalized = normalizeConfig(cfg)
  const p = configPath()
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, JSON.stringify(normalized, null, 2), 'utf8')
  return normalized
}

export const getConfigPath = configPath
