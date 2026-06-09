import { describe, it, expect } from 'vitest'
import {
  inSrgb,
  inP3,
  clipTo,
  maxChromaInSrgb,
  maxChromaInP3,
} from '@lib/color/gamut'
import { parseColor } from '@lib/color/parse'
import { makeColor } from '@lib/color/types'

describe('inSrgb', () => {
  it('a pure sRGB red is in sRGB', () => {
    expect(inSrgb(parseColor('#ff0000'))).toBe(true)
  })

  it('a saturated OKLCH outside sRGB is reported false', () => {
    const c = makeColor('oklch', [0.7, 0.4, 30])
    expect(inSrgb(c)).toBe(false)
  })

  it('a desaturated OKLCH inside sRGB is true', () => {
    const c = makeColor('oklch', [0.7, 0.05, 30])
    expect(inSrgb(c)).toBe(true)
  })
})

describe('inP3', () => {
  it('a pure P3 red is in P3', () => {
    const c = makeColor('display-p3', [1, 0, 0])
    expect(inP3(c)).toBe(true)
  })

  it('an out-of-P3 OKLCH is false', () => {
    const c = makeColor('oklch', [0.7, 0.5, 30])
    expect(inP3(c)).toBe(false)
  })
})

describe('clipTo', () => {
  it('clips out-of-sRGB color to within [0, 1]', () => {
    const c = makeColor('oklch', [0.7, 0.4, 30])
    const clipped = clipTo(c, 'srgb')
    expect(clipped.space).toBe('srgb')
    for (const v of clipped.components) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('leaves an in-sRGB color alone (within tolerance)', () => {
    const c = parseColor('#3366cc')
    const clipped = clipTo(c, 'srgb')
    expect(clipped.components[0]).toBeCloseTo(c.components[0], 3)
    expect(clipped.components[1]).toBeCloseTo(c.components[1], 3)
    expect(clipped.components[2]).toBeCloseTo(c.components[2], 3)
  })
})

describe('maxChromaInSrgb', () => {
  it('returns 0 at L=0 or L=1', () => {
    expect(maxChromaInSrgb(0, 30)).toBe(0)
    expect(maxChromaInSrgb(1, 30)).toBe(0)
  })

  it('peaks around mid-lightness for red-ish hues', () => {
    const mid = maxChromaInSrgb(0.6, 30)
    const dim = maxChromaInSrgb(0.05, 30)
    const bright = maxChromaInSrgb(0.97, 30)
    expect(mid).toBeGreaterThan(dim)
    expect(mid).toBeGreaterThan(bright)
  })

  it('the result is just-barely in gamut', () => {
    const l = 0.7
    const h = 200
    const c = maxChromaInSrgb(l, h)
    // Exactly at max: in gamut (with our 1e-4 tolerance)
    expect(inSrgb(makeColor('oklch', [l, c, h]), 1e-3)).toBe(true)
    // Slightly above: out of gamut
    expect(inSrgb(makeColor('oklch', [l, c + 0.01, h]))).toBe(false)
  })
})

describe('maxChromaInP3', () => {
  it('P3 max chroma >= sRGB max chroma at the same (L, H)', () => {
    for (const h of [0, 60, 120, 180, 240, 300]) {
      const srgbMax = maxChromaInSrgb(0.6, h)
      const p3Max = maxChromaInP3(0.6, h)
      expect(p3Max).toBeGreaterThanOrEqual(srgbMax - 1e-3)
    }
  })
})
