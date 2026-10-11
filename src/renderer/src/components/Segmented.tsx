import type React from 'react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface Props<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

export default function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>): React.JSX.Element {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={'segment' + (o.value === value ? ' active' : '')}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  )
}
