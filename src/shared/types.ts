import type { Lang } from './i18n'

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

export interface AppConfig {
  /** UI language */
  language: Lang
  layoutId: string
  zones: Zone[]
  /** Electron display id; null = primary display */
  displayId: number | null
  /** Start the player directly when the app opens */
  autoplay: boolean
  /** Launch the app at Windows login */
  autostart: boolean
  /** gap between zones (px) */
  gap: number
  background: string
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
  displayId: number | null
}
