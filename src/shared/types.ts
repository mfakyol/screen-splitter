import type { Lang } from './i18n'
import type { AccentId, ThemeMode } from './theme'

export interface Rect {
  /** fractions between 0..1 */
  x: number
  y: number
  w: number
  h: number
}

export interface Layout {
  id: string
  /** Display name lives in i18n: layout.<id> */
  zones: Rect[]
}

export interface Zone {
  url: string
  /** seconds; 0 = no refresh */
  refreshSec: number
  /** 1 = 100% */
  zoom: number
  muted: boolean
}

/** Player window definition for one physical monitor */
export interface ScreenConfig {
  id: string
  /** When empty the UI shows "Screen N" */
  name: string
  /** Electron display id; null = primary display */
  displayId: number | null
  layoutId: string
  zones: Zone[]
  /** gap between zones (px) */
  gap: number
  background: string
}

export interface AppConfig {
  /**
   * Config file format version (independent of the app version).
   * Bumped on a breaking format change; a file with a higher version
   * will not open in an older app.
   */
  schema: number
  /** UI language */
  language: Lang
  /** Settings window theme */
  theme: ThemeMode
  /** Accent color */
  accent: AccentId
  /** At least one screen */
  screens: ScreenConfig[]
  /** Start the player directly when the app opens */
  autoplay: boolean
  /** Launch the app at Windows login */
  autostart: boolean
  /** hide the mouse cursor in the player */
  hideCursor: boolean
}

export interface DisplayInfo {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  primary: boolean
}

export interface PlayerStatus {
  running: boolean
  /** number of open player windows */
  windows: number
  /** screen ids skipped because their monitor was already taken */
  skipped: string[]
}
