import type { AppConfig } from '../shared/types'
import { CONFIG_SCHEMA_VERSION, UnsupportedConfigError, normalizeConfig } from './config'

export type ParseResult =
  | { ok: true; config: AppConfig }
  | { ok: false; reason: 'empty' | 'syntax' | 'shape' | 'unsupported'; error: string; unsupported?: { file: number; supported: number } }

/** Serializes the config to readable JSON for export (schema first). */
export function serializeConfig(cfg: AppConfig): string {
  return JSON.stringify(normalizeConfig(cfg), null, 2) + '\n'
}

/**
 * Validates imported file text and turns it into a normalized config.
 * No disk or dialog access; a pure function for unit tests.
 */
export function parseConfigFile(text: string): ParseResult {
  let body = text
  if (body.charCodeAt(0) === 0xfeff) body = body.slice(1)
  if (!body.trim()) return { ok: false, reason: 'empty', error: 'empty file' }

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch (err) {
    return { ok: false, reason: 'syntax', error: String(err) }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'shape', error: 'config must be a JSON object' }
  }

  try {
    return { ok: true, config: normalizeConfig(parsed as Record<string, unknown>) }
  } catch (err) {
    if (err instanceof UnsupportedConfigError) {
      return {
        ok: false,
        reason: 'unsupported',
        error: err.message,
        unsupported: { file: err.fileSchema, supported: CONFIG_SCHEMA_VERSION }
      }
    }
    return { ok: false, reason: 'shape', error: String(err) }
  }
}
