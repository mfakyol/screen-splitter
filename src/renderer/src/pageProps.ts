import type { AppConfig } from '../../shared/types'
import type { TKey } from '../../shared/i18n'

export type TFn = (key: TKey, params?: Record<string, string | number>) => string

export interface PageProps {
  config: AppConfig
  t: TFn
  /** Marks the change as pending (unsaved) */
  update: (patch: Partial<AppConfig>) => void
  /** Applies and saves the change immediately (e.g. theme, language) */
  applyNow: (patch: Partial<AppConfig>) => void
}
