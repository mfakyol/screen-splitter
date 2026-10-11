import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppConfig, DisplayInfo, Layout, PlayerStatus, Zone } from '../../shared/types'
import { LANGUAGES, layoutName, t as translate, type Lang, type TKey } from '../../shared/i18n'
import LayoutPreview from './LayoutPreview'

const EMPTY_ZONE: Zone = { url: '', refreshSec: 0, zoom: 1, muted: false }

type Toast = { kind: 'ok' | 'err'; text: string } | null

export default function App(): React.JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [status, setStatus] = useState<PlayerStatus>({ running: false, displayId: null })
  const [activeZone, setActiveZone] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [info, setInfo] = useState<{ version: string; configPath: string; packaged: boolean } | null>(null)

  const lang: Lang = config?.language ?? 'en'
  const t = useCallback(
    (key: TKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  )

  useEffect(() => {
    Promise.all([
      window.api.getConfig(),
      window.api.getLayouts(),
      window.api.getDisplays(),
      window.api.getStatus(),
      window.api.getAppInfo()
    ]).then(([cfg, lays, disps, st, inf]) => {
      setConfig(cfg)
      setLayouts(lays)
      setDisplays(disps)
      setStatus(st)
      setInfo(inf)
    })
    return window.api.onStatus(setStatus)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'app.settingsTitle')
  }, [lang])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  const layout = useMemo(
    () => layouts.find((l) => l.id === config?.layoutId) ?? layouts[0],
    [layouts, config?.layoutId]
  )

  const update = useCallback((patch: Partial<AppConfig>) => {
    setConfig((c) => (c ? { ...c, ...patch } : c))
    setDirty(true)
  }, [])

  const selectLayout = (l: Layout): void => {
    if (!config) return
    const zones: Zone[] = l.zones.map((_z, i) => config.zones[i] ?? { ...EMPTY_ZONE })
    update({ layoutId: l.id, zones })
    setActiveZone((a) => Math.min(a, l.zones.length - 1))
  }

  const updateZone = (i: number, patch: Partial<Zone>): void => {
    if (!config) return
    const zones = config.zones.map((z, idx) => (idx === i ? { ...z, ...patch } : z))
    update({ zones })
  }

  /** Language changes apply and save immediately (so the tray menu updates too) */
  const changeLanguage = async (language: Lang): Promise<void> => {
    if (!config) return
    const next = { ...config, language }
    setConfig(next)
    try {
      await window.api.saveConfig(next)
    } catch {
      setDirty(true)
    }
  }

  const save = async (): Promise<void> => {
    if (!config) return
    try {
      const saved = await window.api.saveConfig(config)
      setConfig(saved)
      setDirty(false)
      setToast({ kind: 'ok', text: t('toast.saved') })
    } catch (e) {
      setToast({ kind: 'err', text: t('toast.saveFailed', { err: String(e) }) })
    }
  }

  const start = async (): Promise<void> => {
    if (!config) return
    if (!config.zones.some((z) => z.url.trim())) {
      setToast({ kind: 'err', text: t('toast.needUrl') })
      return
    }
    const st = await window.api.startPlayer(config)
    setDirty(false)
    setStatus(st)
    setToast({ kind: 'ok', text: t('toast.started') })
  }

  const stop = async (): Promise<void> => {
    const st = await window.api.stopPlayer()
    setStatus(st)
  }

  const refreshDisplays = async (): Promise<void> => setDisplays(await window.api.getDisplays())

  if (!config || !layout) return <div className="loading">{translate('en', 'app.loading')}</div>

  const zone = config.zones[activeZone] ?? EMPTY_ZONE

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" />
          <div>
            <h1>{t('app.title')}</h1>
            <small>{t('app.subtitle')}</small>
          </div>
        </div>
        <div className="actions">
          <select
            className="lang-select"
            value={config.language}
            onChange={(e) => changeLanguage(e.target.value as Lang)}
            title={t('section.language')}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <span className={'status ' + (status.running ? 'on' : 'off')}>
            {status.running ? t('status.running') : t('status.stopped')}
          </span>
          <button className="btn ghost" onClick={save} disabled={!dirty}>
            {t('btn.save')}
          </button>
          {status.running ? (
            <>
              <button className="btn ghost" onClick={() => window.api.reloadPlayer()}>
                {t('btn.reload')}
              </button>
              <button className="btn danger" onClick={stop}>
                {t('btn.stop')}
              </button>
              <button className="btn primary" onClick={start}>
                {t('btn.restart')}
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={start}>
              {t('btn.start')}
            </button>
          )}
        </div>
      </header>

      <main className="grid">
        {/* Left: layout picker */}
        <section className="panel">
          <h2>{t('section.layout')}</h2>
          <div className="layout-list">
            {layouts.map((l) => (
              <button
                key={l.id}
                className={'layout-card' + (l.id === config.layoutId ? ' selected' : '')}
                onClick={() => selectLayout(l)}
                title={layoutName(lang, l.id)}
              >
                <LayoutPreview layout={l} showNumbers={false} />
                <span>{layoutName(lang, l.id)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Middle: preview + zone settings */}
        <section className="panel">
          <h2>
            {t('section.zones')} <small>({layout.zones.length})</small>
          </h2>
          <div className="preview">
            <LayoutPreview
              layout={layout}
              width={320}
              height={180}
              gap={Math.max(2, config.gap / 4)}
              activeIndex={activeZone}
              onZoneClick={setActiveZone}
            />
          </div>
          <p className="hint">{t('zones.hint')}</p>

          <div className="zone-tabs">
            {config.zones.map((z, i) => (
              <button
                key={i}
                className={'zone-tab' + (i === activeZone ? ' active' : '') + (z.url ? ' has-url' : '')}
                onClick={() => setActiveZone(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="zone-form">
            <label>
              <span>{t('zone.url', { n: activeZone + 1 })}</span>
              <input
                type="text"
                placeholder={t('zone.urlPlaceholder')}
                value={zone.url}
                onChange={(e) => updateZone(activeZone, { url: e.target.value })}
              />
            </label>
            <div className="row">
              <label>
                <span>{t('zone.refresh')}</span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={zone.refreshSec}
                  onChange={(e) =>
                    updateZone(activeZone, { refreshSec: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </label>
              <label>
                <span>{t('zone.zoom')}</span>
                <input
                  type="number"
                  min={25}
                  max={400}
                  step={5}
                  value={Math.round(zone.zoom * 100)}
                  onChange={(e) =>
                    updateZone(activeZone, {
                      zoom: Math.min(4, Math.max(0.25, (Number(e.target.value) || 100) / 100))
                    })
                  }
                />
              </label>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={zone.muted}
                onChange={(e) => updateZone(activeZone, { muted: e.target.checked })}
              />
              <span>{t('zone.muted')}</span>
            </label>
          </div>

          <div className="zone-summary">
            {config.zones.map((z, i) => (
              <div
                key={i}
                className={'zone-line' + (i === activeZone ? ' active' : '')}
                onClick={() => setActiveZone(i)}
              >
                <b>{i + 1}</b>
                <span className={z.url ? '' : 'muted'}>{z.url || t('zone.noUrl')}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: general settings */}
        <section className="panel">
          <h2>{t('section.display')}</h2>

          <label>
            <span>
              {t('display.target')}{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  refreshDisplays()
                }}
              >
                {t('display.refresh')}
              </a>
            </span>
            <select
              value={config.displayId ?? ''}
              onChange={(e) => update({ displayId: e.target.value === '' ? null : Number(e.target.value) })}
            >
              <option value="">{t('display.primary')}</option>
              {displays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.bounds.width}×{d.bounds.height}
                  {d.primary ? ' ' + t('display.primaryTag') : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="row">
            <label>
              <span>{t('display.gap')}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={config.gap}
                onChange={(e) => update({ gap: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              />
            </label>
            <label>
              <span>{t('display.background')}</span>
              <input type="color" value={config.background} onChange={(e) => update({ background: e.target.value })} />
            </label>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={config.hideCursor}
              onChange={(e) => update({ hideCursor: e.target.checked })}
            />
            <span>{t('display.hideCursor')}</span>
          </label>

          <h2 className="mt">{t('section.autostart')}</h2>
          <label className="check">
            <input
              type="checkbox"
              checked={config.autostart}
              onChange={(e) => update({ autostart: e.target.checked })}
            />
            <span>{t('autostart.windows')}</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={config.autoplay}
              onChange={(e) => update({ autoplay: e.target.checked })}
            />
            <span>{t('autostart.autoplay')}</span>
          </label>
          {!info?.packaged && config.autostart && <p className="warn">{t('autostart.devWarn')}</p>}

          <h2 className="mt">{t('section.shortcuts')}</h2>
          <ul className="keys">
            <li>
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> {t('keys.settings')}
            </li>
            <li>
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> {t('keys.stop')}
            </li>
            <li>
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> {t('keys.reload')}
            </li>
            <li>
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Q</kbd> {t('keys.quit')}
            </li>
          </ul>

          {info && (
            <p className="footer">
              v{info.version} ·{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  window.api.revealConfig()
                }}
              >
                config.json
              </a>
            </p>
          )}
        </section>
      </main>

      {toast && <div className={'toast ' + toast.kind}>{toast.text}</div>}
    </div>
  )
}
