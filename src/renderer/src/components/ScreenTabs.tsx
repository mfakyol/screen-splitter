import type React from 'react'
import type { DisplayInfo, ScreenConfig } from '../../../shared/types'
import type { TFn } from '../pageProps'
import { IconMonitor, IconPlay, IconPlus, IconTrash } from './Icons'

interface Props {
  screens: ScreenConfig[]
  displays: DisplayInfo[]
  activeId: string
  /** Screens that currently have an open window */
  playingIds: string[]
  onSelect: (id: string) => void
  onAdd: () => void
  /** Deletes the active screen; hidden when there is only one screen */
  onDelete: () => void
  /** Starts only the active screen */
  onStartOne: () => void
  t: TFn
}

export const screenLabel = (t: TFn, screens: ScreenConfig[], scr: ScreenConfig): string =>
  scr.name.trim() || t('screens.default', { n: screens.indexOf(scr) + 1 })

/** Finds which monitor each screen lands on; marks conflicts. */
export function resolveTargets(
  screens: ScreenConfig[],
  displays: DisplayInfo[]
): { label: Map<string, string>; conflict: Set<string> } {
  const primary = displays.find((d) => d.primary) ?? displays[0]
  const label = new Map<string, string>()
  const conflict = new Set<string>()
  const used = new Set<number>()
  for (const s of screens) {
    const d = displays.find((x) => x.id === s.displayId) ?? primary
    if (!d) continue
    label.set(s.id, d.label)
    if (used.has(d.id)) conflict.add(s.id)
    used.add(d.id)
  }
  return { label, conflict }
}

export default function ScreenTabs({
  screens,
  displays,
  activeId,
  playingIds,
  onSelect,
  onAdd,
  onDelete,
  onStartOne,
  t
}: Props): React.JSX.Element {
  const { label, conflict } = resolveTargets(screens, displays)
  return (
    <div className="screen-tabs" role="tablist" aria-label={t('section.zones')}>
      {screens.map((s) => {
        const active = s.id === activeId
        const playing = playingIds.includes(s.id)
        const filled = s.zones.filter((z) => z.url.trim()).length
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={
              'screen-tab' + (active ? ' active' : '') + (conflict.has(s.id) ? ' conflict' : '') + (playing ? ' playing' : '')
            }
            onClick={() => onSelect(s.id)}
            title={conflict.has(s.id) ? t('screens.conflict') : playing ? t('screens.playing') : undefined}
          >
            <IconMonitor />
            <span className="screen-tab-text">
              <span className="screen-tab-name">
                {screenLabel(t, screens, s)}
                {playing && <span className="playing-dot" aria-label={t('screens.playing')} />}
              </span>
              <span className="screen-tab-meta">
                {label.get(s.id) ?? '—'} · {filled}/{s.zones.length}
              </span>
            </span>
          </button>
        )
      })}
      <button type="button" className="screen-tab add" onClick={onAdd}>
        <IconPlus />
        <span>{t('screens.add')}</span>
      </button>
      <div className="screen-tab-actions">
        <button type="button" className="screen-tab action" onClick={onStartOne} title={t('screens.startOne')}>
          <IconPlay />
          <span>{t('screens.startOne')}</span>
        </button>
        {screens.length > 1 && (
          <button type="button" className="screen-tab action remove" onClick={onDelete} title={t('screen.delete')}>
            <IconTrash />
            <span>{t('screen.delete')}</span>
          </button>
        )}
      </div>
    </div>
  )
}
