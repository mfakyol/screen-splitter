import type React from 'react'
import type { DisplayInfo } from '../../../shared/types'
import type { PageProps } from '../pageProps'
import { Card, SettingRow } from '../components/Card'
import Switch from '../components/Switch'
import { IconMonitor, IconRefresh, IconCheck } from '../components/Icons'

interface Props extends PageProps {
  displays: DisplayInfo[]
  onRefreshDisplays: () => void
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

export default function DisplayPage({ config, t, update, displays, onRefreshDisplays }: Props): React.JSX.Element {
  return (
    <div className="page-stack">
      <Card
        title={t('display.target')}
        description={t('display.targetDesc')}
        actions={
          <button type="button" className="btn ghost sm" onClick={onRefreshDisplays}>
            <IconRefresh /> {t('display.refresh')}
          </button>
        }
      >
        <div className="display-grid" role="radiogroup" aria-label={t('display.target')}>
          <button
            type="button"
            role="radio"
            aria-checked={config.displayId === null}
            className={'display-card' + (config.displayId === null ? ' selected' : '')}
            onClick={() => update({ displayId: null })}
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
            const selected = config.displayId === d.id
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={'display-card' + (selected ? ' selected' : '')}
                onClick={() => update({ displayId: d.id })}
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
        <SettingRow label={t('display.gap')} description={t('display.gapDesc')} htmlFor="gap-input">
          <div className="range-row">
            <input
              type="range"
              min={0}
              max={60}
              value={config.gap}
              aria-hidden
              tabIndex={-1}
              onChange={(e) => update({ gap: Number(e.target.value) })}
            />
            <input
              id="gap-input"
              className="num"
              type="number"
              min={0}
              max={100}
              value={config.gap}
              onChange={(e) => update({ gap: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
            <span className="unit">px</span>
          </div>
        </SettingRow>

        <SettingRow label={t('display.background')} description={t('display.backgroundDesc')} htmlFor="bg-input">
          <div className="color-row">
            <input
              id="bg-input"
              type="color"
              value={config.background}
              onChange={(e) => update({ background: e.target.value })}
            />
            <code>{config.background}</code>
          </div>
        </SettingRow>

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
