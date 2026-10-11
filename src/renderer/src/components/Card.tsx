import type React from 'react'

interface CardProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}

export function Card({ title, description, actions, children, className, id }: CardProps): React.JSX.Element {
  return (
    <section className={'card' + (className ? ' ' + className : '')} id={id}>
      {(title || actions) && (
        <header className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

interface RowProps {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
}

/** Left: label + description, right: control. For settings rows. */
export function SettingRow({ label, description, htmlFor, children }: RowProps): React.JSX.Element {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <label className="setting-label" htmlFor={htmlFor}>
          {label}
        </label>
        {description && <span className="setting-desc">{description}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}
