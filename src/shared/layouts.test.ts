import { describe, it, expect } from 'vitest'
import { LAYOUTS, getLayout } from './layouts'

describe('LAYOUTS', () => {
  it('ids are unique', () => {
    const ids = LAYOUTS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every layout has at least one zone', () => {
    for (const l of LAYOUTS) expect(l.zones.length).toBeGreaterThan(0)
  })

  it('all zones are within 0..1 and stay on screen', () => {
    for (const l of LAYOUTS) {
      for (const z of l.zones) {
        expect(z.x).toBeGreaterThanOrEqual(0)
        expect(z.y).toBeGreaterThanOrEqual(0)
        expect(z.w).toBeGreaterThan(0)
        expect(z.h).toBeGreaterThan(0)
        expect(z.x + z.w).toBeLessThanOrEqual(1 + 1e-9)
        expect(z.y + z.h).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })

  it('zones cover the screen fully (total area 1)', () => {
    for (const l of LAYOUTS) {
      const area = l.zones.reduce((s, z) => s + z.w * z.h, 0)
      expect(area, l.id).toBeCloseTo(1, 6)
    }
  })

  it('zones do not overlap', () => {
    const overlaps = (a: (typeof LAYOUTS)[0]['zones'][0], b: typeof a): boolean =>
      a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9
    for (const l of LAYOUTS) {
      for (let i = 0; i < l.zones.length; i++)
        for (let j = i + 1; j < l.zones.length; j++)
          expect(overlaps(l.zones[i], l.zones[j]), `${l.id} ${i}-${j}`).toBe(false)
    }
  })

  it('grid layouts have the expected zone count', () => {
    expect(getLayout('grid-2x2').zones).toHaveLength(4)
    expect(getLayout('grid-3x2').zones).toHaveLength(6)
    expect(getLayout('grid-3x3').zones).toHaveLength(9)
    expect(getLayout('cols-3').zones).toHaveLength(3)
  })
})

describe('getLayout', () => {
  it('finds a layout by id', () => {
    expect(getLayout('split-h').id).toBe('split-h')
  })

  it('falls back to the first layout (single) for an unknown id', () => {
    expect(getLayout('no-such-layout').id).toBe('single')
    expect(getLayout('').id).toBe('single')
  })
})
