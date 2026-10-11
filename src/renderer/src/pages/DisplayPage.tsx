import type React from 'react'
import type { DisplayInfo, ScreenConfig } from '../../../shared/types'
import type { PageProps } from '../pageProps'
import { Card, SettingRow } from '../components/Card'
import Switch from '../components/Switch'
import { IconMonitor, IconRefresh, IconCheck, IconTrash } from '../components/Icons'
import { resolveTargets } from '../components/ScreenTabs'

interface Props extends PageProps {
  screen: ScreenConfig
  updateScreen: (patch: Partial<ScreenConfig>) => void
  displays: DisplayInfo[]
  onRefreshDisplays: () => void
  canDelete: boolean
  onDelete: () => void
}

/** Mini rectangle on the display card: keeps the aspect ratio */
function Shape({ w, h }: { w: number; h: number }): React.JSX.Element {
  const ratio = w / h
  const width = ratio >= 1 ? 56 : 56 * ratio
  const height = ratio >= 1 ? 56 / ratio : 56
  return (
    <span className="display-shape" aria-hidden>
      <span style={{ width, height }} />
    </span>
  )
}

export default function DisplayPage({
  config,
  t,
  update,
  screen,
  updateScreen,
  displays,
  onRefreshDisplays,
  canDelete,
  onDelete
}: Props): React.JSX.Element {
  const { conflict } = resolveTargets(config.screens, displays)
  const index = config.screens.indexOf(screen)

  return (
    <div className="page-stack" key={screen.id}>
      <Card
        title={t('display.target')}
        description={t('display.targetDesc')}
        actions={
          <button type="button" className="btn ghost sm" onClick={onRefreshDisplays}>
            <IconRefresh /> {t('display.refresh')}
          </button>
        }
      >
        {conflict.has(screen.id) && <p className="notice warn">{t('screens.conflict')}</p>}
        <div className="display-grid" role="radiogroup" aria-label={t('display.target')}>
          <button
            type="button"
            role="radio"
            aria-checked={screen.displayId === null}
            className={'display-card' + (screen.displayId === null ? ' selected' : '')}
            onClick={() => updateScreen({ displayId: null })}
          >
            <span className="display-shape auto" aria-hidden>
              <IconMonitor width={26} height={26} />
            </span>
            <span className="display-name">{t('display.auto')}</span>
            <span className="display-meta">{t('display.autoDesc')}</span>
            <span className="radio-check">
              <IconCheck width={14} height={14} />
            </span>
          </button>
          {displays.map((d) => {
            const selected = screen.displayId === d.id
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={'display-card' + (selected ? ' selected' : '')}
                onClick={() => updateScreen({ displayId: d.id })}
              >
                <Shape w={d.bounds.width} h={d.bounds.height} />
                <span className="display-name">{d.label}</span>
                <span className="display-meta">
                  {d.bounds.width}×{d.bounds.height}
                  {d.primary && <span className="chip tiny">{t('display.primaryTag')}</span>}
                </span>
                <span className="radio-check">
                  <IconCheck width={14} height={14} />
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <SettingRow label={t('screen.name')} description={t('screen.nameDesc')} htmlFor="screen-name">
          <input
            id="screen-name"
            type="text"
            className="text-md"
            placeholder={t('screens.default', { n: index + 1 })}
            value={screen.name}
            onChange={(e) => updateScreen({ name: e.target.value })}
          />
        </SettingRow>

        <SettingRow label={t('display.gap')} description={t('display.gapDesc')} htmlFor="gap-input">
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={60}
              value={screen.gap}
              aria-hidden
              tabIndex={-1}
              onChange={(e) => updateScreen({ gap: Number(e.target.value) })}
            />
            <input
              id="gap-input"
              className="num"
              type="number"
              min={0}
              max={100}
              value={screen.gap}
              onChange={(e) => updateScreen({ gap: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
            <span className="unit">px</span>
          </div>
        </SettingRow>

        <SettingRow label={t('display.background')} description={t('display.backgroundDesc')} htmlFor="bg-input">
          <div className="color-row">
            <input
              id="bg-input"
              type="color"
              value={screen.background}
              onChange={(e) => updateScreen({ background: e.target.value })}
            />
            <code>{screen.background}</code>
          </div>
        </SettingRow>

        {canDelete && (
          <div className="setting-row">
            <button type="button" className="btn danger sm" onClick={onDelete}>
              <IconTrash /> {t('screen.delete')}
            </button>
          </div>
        )}
      </Card>

      <Card>
        <div className="setting-row">
          <Switch
            label={t('display.hideCursor')}
            description={t('display.hideCursorDesc')}
            checked={config.hideCursor}
            onChange={(hideCursor) => update({ hideCursor })}
          />
        </div>
      </Card>
    </div>
  )
}
