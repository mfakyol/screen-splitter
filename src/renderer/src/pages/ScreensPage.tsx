import React, { useState } from 'react'
import type { DisplayInfo, Layout, ScreenConfig, Zone } from '../../../shared/types'
import { layoutName } from '../../../shared/i18n'
import type { PageProps } from '../pageProps'
import LayoutPreview from '../LayoutPreview'
import { Card } from '../components/Card'
import Switch from '../components/Switch'
import { IconGlobe, IconMonitor, IconRefresh, IconCheck } from '../components/Icons'
import { resolveTargets } from '../components/ScreenTabs'

const EMPTY_ZONE: Zone = { url: '', refreshSec: 0, zoom: 1, muted: true }

interface Props extends PageProps {
  screen: ScreenConfig
  updateScreen: (patch: Partial<ScreenConfig>) => void
  layouts: Layout[]
  layout: Layout
  displays: DisplayInfo[]
  onRefreshDisplays: () => void
}

/** Mini rectangle on the monitor card: keeps the aspect ratio */
function Shape({ w, h }: { w: number; h: number }): React.JSX.Element {
  const ratio = w / h
  const width = ratio >= 1 ? 48 : 48 * ratio
  const height = ratio >= 1 ? 48 / ratio : 48
  return (
    <span className="display-shape" aria-hidden>
      <span style={{ width, height }} />
    </span>
  )
}

export default function ScreensPage({
  config,
  t,
  screen,
  updateScreen,
  layouts,
  layout,
  displays,
  onRefreshDisplays
}: Props): React.JSX.Element {
  const [activeZone, setActiveZone] = useState<number | null>(null)
  const lang = config.language
  const { conflict } = resolveTargets(config.screens, displays)
  const index = config.screens.indexOf(screen)

  const selectLayout = (l: Layout): void => {
    const zones: Zone[] = l.zones.map((_z, i) => screen.zones[i] ?? { ...EMPTY_ZONE })
    updateScreen({ layoutId: l.id, zones })
    setActiveZone(null)
  }

  const updateZone = (i: number, patch: Partial<Zone>): void => {
    updateScreen({ zones: screen.zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z)) })
  }

  const focusZone = (i: number): void => {
    setActiveZone(i)
    const el = document.getElementById('zone-url-' + i) as HTMLInputElement | null
    if (!el) return
    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  const filled = screen.zones.filter((z) => z.url.trim()).length

  return (
    <div className="page-grid" key={screen.id}>
      <div className="col-main">
        {/* ---- Monitor ---- */}
        <Card
          title={t('section.monitor')}
          description={t('display.targetDesc')}
          actions={
            <button type="button" className="btn ghost sm" onClick={onRefreshDisplays}>
              <IconRefresh /> {t('display.refresh')}
            </button>
          }
        >
          {conflict.has(screen.id) && <p className="notice warn">{t('screens.conflict')}</p>}
          <div className="display-grid compact" role="radiogroup" aria-label={t('display.target')}>
            <button
              type="button"
              role="radio"
              aria-checked={screen.displayId === null}
              className={'display-card' + (screen.displayId === null ? ' selected' : '')}
              onClick={() => updateScreen({ displayId: null })}
            >
              <span className="display-shape auto" aria-hidden>
                <IconMonitor width={24} height={24} />
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

        {/* ---- Preview ---- */}
        <Card
          title={t('section.preview')}
          description={t('zones.hint')}
          actions={<span className="chip">{layoutName(lang, layout.id)}</span>}
        >
          <div className="preview-frame">
            <LayoutPreview
              layout={layout}
              width={320}
              height={180}
              gap={Math.max(2, screen.gap / 4)}
              activeIndex={activeZone}
              onZoneClick={focusZone}
            />
          </div>
        </Card>

        {/* ---- Zones ---- */}
        <Card
          title={t('section.zones')}
          actions={
            <span className="chip subtle">
              {filled}/{screen.zones.length}
            </span>
          }
        >
          <div className="zone-list">
            {screen.zones.map((zone, i) => {
              const ready = !!zone.url.trim()
              return (
                <article
                  key={i}
                  className={'zone-card' + (activeZone === i ? ' active' : '')}
                  onFocus={() => setActiveZone(i)}
                  aria-label={t('zone.title', { n: i + 1 })}
                >
                  <header className="zone-head">
                    <span className="zone-badge">{i + 1}</span>
                    <h3>{t('zone.title', { n: i + 1 })}</h3>
                    <span className={'chip ' + (ready ? 'ok' : 'subtle')}>
                      {ready ? t('zone.filled') : t('zone.empty')}
                    </span>
                  </header>

                  <label className="field url-field">
                    <span className="field-label">{t('zone.url', { n: i + 1 })}</span>
                    <span className="input-wrap">
                      <IconGlobe className="input-icon" />
                      <input
                        id={'zone-url-' + i}
                        type="text"
                        inputMode="url"
                        spellCheck={false}
                        placeholder={t('zone.urlPlaceholder')}
                        value={zone.url}
                        onChange={(e) => updateZone(i, { url: e.target.value })}
                      />
                    </span>
                  </label>

                  <div className="zone-options">
                    <label className="field small">
                      <span className="field-label">{t('zone.refreshShort')}</span>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={zone.refreshSec}
                        onChange={(e) => updateZone(i, { refreshSec: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </label>
                    <label className="field small">
                      <span className="field-label">{t('zone.zoom')}</span>
                      <input
                        type="number"
                        min={25}
                        max={400}
                        step={5}
                        value={Math.round(zone.zoom * 100)}
                        onChange={(e) =>
                          updateZone(i, { zoom: Math.min(4, Math.max(0.25, (Number(e.target.value) || 100) / 100)) })
                        }
                      />
                    </label>
                    <Switch
                      compact
                      label={t('zone.muted')}
                      checked={zone.muted}
                      onChange={(muted) => updateZone(i, { muted })}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="col-side">
        {/* ---- Layouts ---- */}
        <Card title={t('section.layouts')}>
          <div className="layout-grid" role="radiogroup" aria-label={t('section.layouts')}>
            {layouts.map((l) => {
              const selected = l.id === screen.layoutId
              return (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={'layout-tile' + (selected ? ' selected' : '')}
                  onClick={() => selectLayout(l)}
                  title={layoutName(lang, l.id)}
                >
                  <LayoutPreview layout={l} showNumbers={false} gap={4} />
                  <span>{layoutName(lang, l.id)}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* ---- Screen settings ---- */}
        <Card title={t('section.screenSettings')} className="stacked">
          <label className="field">
            <span className="field-label">{t('screen.name')}</span>
            <input
              type="text"
              placeholder={t('screens.default', { n: index + 1 })}
              value={screen.name}
              onChange={(e) => updateScreen({ name: e.target.value })}
            />
          </label>

          <div className="field">
            <label className="field-label" htmlFor="gap-input">
              {t('display.gap')}
            </label>
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
          </div>

          <div className="field">
            <label className="field-label" htmlFor="bg-input">
              {t('display.background')}
            </label>
            <div className="color-row">
              <input
                id="bg-input"
                type="color"
                value={screen.background}
                onChange={(e) => updateScreen({ background: e.target.value })}
              />
              <code>{screen.background}</code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
