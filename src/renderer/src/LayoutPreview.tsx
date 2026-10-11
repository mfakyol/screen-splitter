import type React from 'react'
import type { Layout } from '../../shared/types'

interface Props {
  layout: Layout
  width?: number
  height?: number
  gap?: number
  activeIndex?: number | null
  showNumbers?: boolean
  onZoneClick?: (index: number) => void
}

export default function LayoutPreview({
  layout,
  width = 160,
  height = 90,
  gap = 3,
  activeIndex = null,
  showNumbers = true,
  onZoneClick
}: Props): React.JSX.Element {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ aspectRatio: `${width} / ${height}`, display: 'block' }}
    >
      <rect x={0} y={0} width={width} height={height} rx={4} className="lp-bg" />
      {layout.zones.map((z, i) => {
        const x = z.x * width + gap / 2
        const y = z.y * height + gap / 2
        const w = z.w * width - gap
        const h = z.h * height - gap
        return (
          <g
            key={i}
            className={'lp-zone' + (activeIndex === i ? ' active' : '') + (onZoneClick ? ' clickable' : '')}
            onClick={onZoneClick ? () => onZoneClick(i) : undefined}
          >
            <rect x={x} y={y} width={w} height={h} rx={2} />
            {showNumbers && (
              <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central">
                {i + 1}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
