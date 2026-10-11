import type React from 'react'

type P = React.SVGProps<SVGSVGElement>

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
}

export const IconLayout = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <path d="M12 3v18M3 12h9" />
  </svg>
)

export const IconMonitor = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const IconPower = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M12 3v9" />
    <path d="M6.3 7.3a8 8 0 1 0 11.4 0" />
  </svg>
)

export const IconPalette = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H13a1.5 1.5 0 0 1 0-3h2.5A5.5 5.5 0 0 0 21 8.5 7.5 7.5 0 0 0 12 3Z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconPlay = (p: P): React.JSX.Element => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" />
  </svg>
)

export const IconStop = (p: P): React.JSX.Element => (
  <svg {...base} {...p} fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

export const IconRefresh = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66" />
    <path d="M20 4v5h-5" />
  </svg>
)

export const IconSave = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M5 4h11l3 3v13H5z" />
    <path d="M8 4v5h7V4M8 20v-6h8v6" />
  </svg>
)

export const IconGlobe = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
)

export const IconSun = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconMoon = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
  </svg>
)

export const IconCheck = (p: P): React.JSX.Element => (
  <svg {...base} {...p} strokeWidth={2.5}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

export const IconExternal = (p: P): React.JSX.Element => (
  <svg {...base} {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)

export const Logo = (p: P): React.JSX.Element => (
  <svg width={28} height={28} viewBox="0 0 32 32" aria-hidden {...p}>
    <rect x="2" y="2" width="13" height="13" rx="3" fill="#3b82f6" />
    <rect x="17" y="2" width="13" height="13" rx="3" fill="#10b981" />
    <rect x="2" y="17" width="13" height="13" rx="3" fill="#f59e0b" />
    <rect x="17" y="17" width="13" height="13" rx="3" fill="#ef4444" />
  </svg>
)
