import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppConfig, Zone } from '../shared/types'
import { getLayout } from '../shared/layouts'
import { isLang, langFromLocale } from '../shared/i18n'

export const DEFAULT_ZONE: Zone = { url: '', refreshSec: 0, zoom: 1, muted: false }

export const DEFAULT_CONFIG: AppConfig = {
  language: 'en',
  layoutId: 'single',
  zones: [{ ...DEFAULT_ZONE }],
  displayId: null,
  autoplay: false,
  autostart: false,
  gap: 0,
  background: '#000000',
  hideCursor: true
}

const configPath = (): string => join(app.getPath('userData'), 'config.json')

/** Matches the zone count to the layout and fills missing fields. */
export function normalizeConfig(raw: Partial<AppConfig>): AppConfig {
  const cfg: AppConfig = { ...DEFAULT_CONFIG, ...raw }
  // Pick the system language when the setting is missing or invalid (first run).
  // Use the value from the user's file, not the 'en' in DEFAULT_CONFIG.
  cfg.language = isLang(raw.language) ? raw.language : langFromLocale(app.getLocale())
  const layout = getLayout(cfg.layoutId)
  cfg.layoutId = layout.id
  const zones: Zone[] = []
  for (let i = 0; i < layout.zones.length; i++) {
    zones.push({ ...DEFAULT_ZONE, ...(cfg.zones?.[i] ?? {}) })
  }
  cfg.zones = zones
  cfg.gap = Math.max(0, Math.min(100, Number(cfg.gap) || 0))
  return cfg
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
    console.error('could not read config, using defaults', err)
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
