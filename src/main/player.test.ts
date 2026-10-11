import { describe, it, expect, vi } from 'vitest'

// player.ts imports electron; only the pure functions are tested
vi.mock('electron', () => ({
  BrowserWindow: class {},
  WebContentsView: class {},
  screen: {
    getAllDisplays: () => [
      { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { id: 2, bounds: { x: 1920, y: 0, width: 3840, height: 2160 } }
    ],
    getPrimaryDisplay: () => ({ id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } })
  }
}))

import { normalizeUrl, computeZoneBounds, pickDisplay } from './player'
import { getLayout } from '../shared/layouts'

describe('normalizeUrl', () => {
  it('returns empty for empty and whitespace input', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('   ')).toBe('')
  })

  it('adds https to an address without a scheme', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('  example.com/menu?x=1 ')).toBe('https://example.com/menu?x=1')
    expect(normalizeUrl('localhost:3000')).toBe('https://localhost:3000')
  })

  it('keeps an existing scheme', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
    expect(normalizeUrl('HTTPS://Example.com')).toBe('HTTPS://Example.com')
    expect(normalizeUrl('ftp://files.local')).toBe('ftp://files.local')
  })

  it('leaves data: and file: URLs alone', () => {
    expect(normalizeUrl('data:text/html,<b>x</b>')).toBe('data:text/html,<b>x</b>')
    expect(normalizeUrl('file:///C:/tabela/index.html')).toBe('file:///C:/tabela/index.html')
  })
})

describe('computeZoneBounds', () => {
  it('a single zone covers the whole screen (gap 0)', () => {
    const b = computeZoneBounds(getLayout('single').zones, 1920, 1080, 0)
    expect(b).toEqual([{ x: 0, y: 0, width: 1920, height: 1080 }])
  })

  it('splits the screen evenly for 2 side by side', () => {
    const [a, b] = computeZoneBounds(getLayout('split-h').zones, 1920, 1080, 0)
    expect(a).toEqual({ x: 0, y: 0, width: 960, height: 1080 })
    expect(b).toEqual({ x: 960, y: 0, width: 960, height: 1080 })
  })

  it('shares the gap evenly between zones', () => {
    const [a, b] = computeZoneBounds(getLayout('split-h').zones, 1000, 500, 10)
    expect(a).toEqual({ x: 5, y: 5, width: 490, height: 490 })
    expect(b).toEqual({ x: 505, y: 5, width: 490, height: 490 })
    // the gap between two zones is exactly gap
    expect(b.x - (a.x + a.width)).toBe(10)
  })

  it('2x2 grid zones stay on screen and do not overlap', () => {
    const W = 1920
    const H = 1080
    const bounds = computeZoneBounds(getLayout('grid-2x2').zones, W, H, 6)
    expect(bounds).toHaveLength(4)
    for (const b of bounds) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width).toBeLessThanOrEqual(W)
      expect(b.y + b.height).toBeLessThanOrEqual(H)
    }
    for (let i = 0; i < bounds.length; i++)
      for (let j = i + 1; j < bounds.length; j++) {
        const a = bounds[i]
        const b = bounds[j]
        const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
        expect(overlap, `${i}-${j}`).toBe(false)
      }
  })

  it('returns whole pixels', () => {
    const bounds = computeZoneBounds(getLayout('cols-3').zones, 1366, 768, 3)
    for (const b of bounds) {
      expect(Number.isInteger(b.x)).toBe(true)
      expect(Number.isInteger(b.y)).toBe(true)
      expect(Number.isInteger(b.width)).toBe(true)
      expect(Number.isInteger(b.height)).toBe(true)
    }
  })

  it('gives at least 1px size for a very large gap (no negative size)', () => {
    const bounds = computeZoneBounds(getLayout('grid-3x3').zones, 300, 300, 100)
    for (const b of bounds) {
      expect(b.width).toBeGreaterThanOrEqual(1)
      expect(b.height).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('pickDisplay', () => {
  it('picks the display when the id matches', () => {
    expect(pickDisplay(2).id).toBe(2)
  })

  it('picks the primary display for a null or unknown id', () => {
    expect(pickDisplay(null).id).toBe(1)
    expect(pickDisplay(999).id).toBe(1)
  })
})
