export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']

export type AccentId = 'blue' | 'violet' | 'emerald' | 'orange' | 'rose' | 'teal'

export interface Accent {
  id: AccentId
  /** main color */
  color: string
  /** hover / emphasized state */
  hover: string
  /** soft background in the light theme (rgba) */
  soft: string
}

export const ACCENTS: Accent[] = [
  { id: 'blue', color: '#3b82f6', hover: '#2563eb', soft: 'rgba(59,130,246,0.14)' },
  { id: 'violet', color: '#8b5cf6', hover: '#7c3aed', soft: 'rgba(139,92,246,0.14)' },
  { id: 'emerald', color: '#10b981', hover: '#059669', soft: 'rgba(16,185,129,0.14)' },
  { id: 'orange', color: '#f97316', hover: '#ea580c', soft: 'rgba(249,115,22,0.14)' },
  { id: 'rose', color: '#f43f5e', hover: '#e11d48', soft: 'rgba(244,63,94,0.14)' },
  { id: 'teal', color: '#14b8a6', hover: '#0d9488', soft: 'rgba(20,184,166,0.14)' }
]

export const DEFAULT_THEME: ThemeMode = 'system'
export const DEFAULT_ACCENT: AccentId = 'blue'

export function isThemeMode(v: unknown): v is ThemeMode {
  return typeof v === 'string' && (THEME_MODES as string[]).includes(v)
}

export function isAccentId(v: unknown): v is AccentId {
  return typeof v === 'string' && ACCENTS.some((a) => a.id === v)
}

export function getAccent(id: AccentId): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

/** Resolves 'system' mode using the OS preference. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === 'system') return prefersDark ? 'dark' : 'light'
  return mode
}
