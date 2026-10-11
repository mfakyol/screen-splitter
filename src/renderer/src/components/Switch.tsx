import React, { useId } from 'react'

interface Props {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Compact mode: inline use without a description */
  compact?: boolean
}

/** Accessible toggle switch. The label is linked via aria-labelledby. */
export default function Switch({ label, description, checked, onChange, compact }: Props): React.JSX.Element {
  const id = useId()
  return (
    <label className={'switch-row' + (compact ? ' compact' : '')}>
      <span className="switch-text">
        <span className="switch-label" id={id}>
          {label}
        </span>
        {description && <span className="switch-desc">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch-input"
        aria-labelledby={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden>
        <span className="switch-thumb" />
      </span>
    </label>
  )
}
