import { useEffect, useState } from 'react'
import { getAccent, resolveTheme, type AccentId, type ResolvedTheme, type ThemeMode } from '../../shared/theme'

const query = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/** Tracks the system dark-mode preference. */
export function usePrefersDark(): boolean {
  const [dark, setDark] = useState<boolean>(() => query()?.matches ?? false)
  useEffect(() => {
    const mq = query()
    if (!mq) return
    const handler = (e: MediaQueryListEvent): void => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

/** Applies the theme and accent color to <html>; returns the resolved theme. */
export function useTheme(mode: ThemeMode, accentId: AccentId): ResolvedTheme {
  const prefersDark = usePrefersDark()
  const resolved = resolveTheme(mode, prefersDark)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = resolved
    root.style.colorScheme = resolved
  }, [resolved])

  useEffect(() => {
    const accent = getAccent(accentId)
    const root = document.documentElement
    root.style.setProperty('--accent', accent.color)
    root.style.setProperty('--accent-hover', accent.hover)
    root.style.setProperty('--accent-soft', accent.soft)
    root.dataset.accent = accent.id
  }, [accentId])

  return resolved
}
