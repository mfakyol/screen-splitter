import type { Layout } from './types'

const grid = (cols: number, rows: number) => {
  const zones = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      zones.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows })
  return zones
}

export const LAYOUTS: Layout[] = [
  { id: 'single', zones: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { id: 'split-h', zones: grid(2, 1) },
  { id: 'split-v', zones: grid(1, 2) },
  {
    id: 'main-left',
    zones: [
      { x: 0, y: 0, w: 2 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 }
    ]
  },
  {
    id: 'main-right',
    zones: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0, w: 2 / 3, h: 1 }
    ]
  },
  {
    id: 'main-top',
    zones: [
      { x: 0, y: 0, w: 1, h: 2 / 3 },
      { x: 0, y: 2 / 3, w: 0.5, h: 1 / 3 },
      { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 }
    ]
  },
  {
    id: 'main-bottom-bar',
    zones: [
      { x: 0, y: 0, w: 1, h: 0.85 },
      { x: 0, y: 0.85, w: 1, h: 0.15 }
    ]
  },
  {
    id: 'sidebar-right',
    zones: [
      { x: 0, y: 0, w: 0.75, h: 1 },
      { x: 0.75, y: 0, w: 0.25, h: 1 }
    ]
  },
  { id: 'cols-3', zones: grid(3, 1) },
  { id: 'grid-2x2', zones: grid(2, 2) },
  { id: 'grid-3x2', zones: grid(3, 2) },
  { id: 'grid-3x3', zones: grid(3, 3) }
]

export const getLayout = (id: string): Layout => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]
