import type React from 'react'
import type { PageProps } from '../pageProps'
import { LANGUAGES, type Lang, type TKey } from '../../../shared/i18n'
import { ACCENTS, THEME_MODES, type ThemeMode } from '../../../shared/theme'
import { Card, SettingRow } from '../components/Card'
import Segmented from '../components/Segmented'
import { IconCheck, IconMonitor, IconMoon, IconSun } from '../components/Icons'

const THEME_ICON: Record<ThemeMode, React.ReactNode> = {
  system: <IconMonitor />,
  light: <IconSun />,
  dark: <IconMoon />
}

export default function AppearancePage({ config, t, applyNow }: PageProps): React.JSX.Element {
  return (
    <div className="page-stack narrow">
      <Card>
        <SettingRow label={t('appearance.theme')} description={t('appearance.themeDesc')}>
          <Segmented<ThemeMode>
            ariaLabel={t('appearance.theme')}
            value={config.theme}
            onChange={(theme) => applyNow({ theme })}
            options={THEME_MODES.map((m) => ({
              value: m,
              label: t(('theme.' + m) as TKey),
              icon: THEME_ICON[m]
            }))}
          />
        </SettingRow>

        <SettingRow label={t('appearance.accent')} description={t('appearance.accentDesc')}>
          <div className="swatches" role="radiogroup" aria-label={t('appearance.accent')}>
            {ACCENTS.map((a) => {
              const selected = a.id === config.accent
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(('accent.' + a.id) as TKey)}
                  title={t(('accent.' + a.id) as TKey)}
                  className={'swatch' + (selected ? ' selected' : '')}
                  style={{ background: a.color }}
                  onClick={() => applyNow({ accent: a.id })}
                >
                  {selected && <IconCheck width={14} height={14} />}
                </button>
              )
            })}
          </div>
        </SettingRow>

        <SettingRow label={t('appearance.language')} description={t('appearance.languageDesc')} htmlFor="lang-select">
          <select id="lang-select" value={config.language} onChange={(e) => applyNow({ language: e.target.value as Lang })}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </SettingRow>
      </Card>
    </div>
  )
}
