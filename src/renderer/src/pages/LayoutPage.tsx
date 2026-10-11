import React, { useState } from 'react'
import type { Layout, Zone } from '../../../shared/types'
import { layoutName } from '../../../shared/i18n'
import type { PageProps } from '../pageProps'
import LayoutPreview from '../LayoutPreview'
import { Card } from '../components/Card'
import Switch from '../components/Switch'
import { IconGlobe } from '../components/Icons'

const EMPTY_ZONE: Zone = { url: '', refreshSec: 0, zoom: 1, muted: false }

interface Props extends PageProps {
  layouts: Layout[]
  layout: Layout
}

export default function LayoutPage({ config, t, update, layouts, layout }: Props): React.JSX.Element {
  const [activeZone, setActiveZone] = useState<number | null>(null)
  const lang = config.language

  const selectLayout = (l: Layout): void => {
    const zones: Zone[] = l.zones.map((_z, i) => config.zones[i] ?? { ...EMPTY_ZONE })
    update({ layoutId: l.id, zones })
    setActiveZone(null)
  }

  const updateZone = (i: number, patch: Partial<Zone>): void => {
    update({ zones: config.zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z)) })
  }

  const focusZone = (i: number): void => {
    setActiveZone(i)
    const el = document.getElementById('zone-url-' + i) as HTMLInputElement | null
    if (!el) return
    el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  const filled = config.zones.filter((z) => z.url.trim()).length

  return (
    <div className="page-grid layout-page">
      <div className="col-main">
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
              gap={Math.max(2, config.gap / 4)}
              activeIndex={activeZone}
              onZoneClick={focusZone}
            />
          </div>
        </Card>

        <Card
          title={t('section.zones')}
          actions={
            <span className="chip subtle">
              {filled}/{config.zones.length}
            </span>
          }
        >
          <div className="zone-list">
            {config.zones.map((zone, i) => {
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
        <Card title={t('section.layouts')}>
          <div className="layout-grid" role="radiogroup" aria-label={t('section.layouts')}>
            {layouts.map((l) => {
              const selected = l.id === config.layoutId
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
      </div>
    </div>
  )
}
