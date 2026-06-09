import { describe, it, expect, beforeEach } from 'vitest'
import {
  sampleGamutBoundary,
  sampleRelativeChromaCurve,
  sampleContrastCurve,
  BOUNDARY_CAP,
  ISO_CAP,
  N_SAMPLES,
  _resetCachesForTests,
  _cacheSizesForTests,
} from '@lib/components/ColorPicker/curves'

beforeEach(() => {
  _resetCachesForTests()
})

describe('sampleGamutBoundary', () => {
  it('returns a ChartCurve with a path starting with M', () => {
    const curve = sampleGamutBoundary(30)
    expect(curve.style).toBe('boundary')
    expect(curve.d.startsWith('M')).toBe(true)
    expect(curve.label).toBe('sRGB gamut')
  })

  it('emits N_SAMPLES + 1 points (one M, N L commands)', () => {
    const curve = sampleGamutBoundary(30)
    const mCount = (curve.d.match(/M/g) ?? []).length
    const lCount = (curve.d.match(/L/g) ?? []).length
    expect(mCount).toBe(1)
    expect(lCount).toBe(N_SAMPLES)
  })

  it('uses the requested gamut in the label', () => {
    expect(sampleGamutBoundary(30, 'display-p3').label).toBe('Display-P3 gamut')
  })

  it('produces stable output for the same input (cache hit)', () => {
    const a = sampleGamutBoundary(30)
    const b = sampleGamutBoundary(30)
    expect(a.d).toBe(b.d)
  })

  it('buckets sub-degree hue differences (cache hit)', () => {
    const a = sampleGamutBoundary(30)
    const b = sampleGamutBoundary(30.1) // within the 0.5° bucket
    expect(a.d).toBe(b.d)
  })

  it('produces different output for visibly different hues', () => {
    const a = sampleGamutBoundary(30)
    const b = sampleGamutBoundary(180)
    expect(a.d).not.toBe(b.d)
  })

  it('evicts oldest entry once cache hits BOUNDARY_CAP', () => {
    // Fill cache with distinct hues.
    for (let i = 0; i < BOUNDARY_CAP; i++) {
      sampleGamutBoundary(i)
    }
    expect(_cacheSizesForTests().boundary).toBe(BOUNDARY_CAP)
    // One more should evict the oldest.
    sampleGamutBoundary(BOUNDARY_CAP + 1)
    expect(_cacheSizesForTests().boundary).toBe(BOUNDARY_CAP)
  })
})

describe('sampleRelativeChromaCurve', () => {
  it('returns a labeled iso-curve', () => {
    const curve = sampleRelativeChromaCurve(30, 73)
    expect(curve.style).toBe('iso')
    expect(curve.label).toBe('Relative chroma 73%')
  })

  it('caps pct to [0, 100]', () => {
    expect(sampleRelativeChromaCurve(30, -5).label).toBe('Relative chroma 0%')
    expect(sampleRelativeChromaCurve(30, 250).label).toBe(
      'Relative chroma 100%',
    )
  })

  it('matches the gamut boundary when pct = 100', () => {
    const boundary = sampleGamutBoundary(30)
    const iso100 = sampleRelativeChromaCurve(30, 100)
    expect(iso100.d).toBe(boundary.d)
  })

  it('caches by (hue, pct, gamut)', () => {
    sampleRelativeChromaCurve(30, 50)
    sampleRelativeChromaCurve(30, 50) // hit
    expect(_cacheSizesForTests().iso).toBe(1)
    sampleRelativeChromaCurve(30, 60)
    expect(_cacheSizesForTests().iso).toBe(2)
  })

  it('evicts at ISO_CAP', () => {
    for (let i = 0; i < ISO_CAP; i++) {
      sampleRelativeChromaCurve(30, i / 2)
    }
    expect(_cacheSizesForTests().iso).toBeLessThanOrEqual(ISO_CAP)
    sampleRelativeChromaCurve(30, 99.5)
    expect(_cacheSizesForTests().iso).toBeLessThanOrEqual(ISO_CAP)
  })
})

describe('sampleContrastCurve', () => {
  it('returns a labeled curve for blue vs white (monotonic case)', () => {
    const curve = sampleContrastCurve(240, '#ffffff', 4.5, 'oklch')
    expect(curve).not.toBeNull()
    expect(curve!.style).toBe('contrast')
    expect(curve!.label).toBe('Contrast 4.50:1')
    // Should have at least one segment (`M ... L ...`).
    expect(curve!.d).toMatch(/^M[\d.]+,[\d.]+ L[\d.]+,[\d.]+/)
  })

  it('returns a curve for magenta vs white (non-monotonic case)', () => {
    // Magenta hues have non-monotonic luminance vs chroma. Marching
    // squares must still produce something rather than zigzag or stop.
    const curve = sampleContrastCurve(310, '#ffffff', 7, 'oklch')
    expect(curve).not.toBeNull()
    expect(curve!.d.length).toBeGreaterThan(0)
    // Must contain at least one segment.
    expect(curve!.d).toContain('M')
    expect(curve!.d).toContain('L')
  })

  it('returns a curve in HSL space for the same target', () => {
    const curve = sampleContrastCurve(240, '#ffffff', 4.5, 'hsl')
    expect(curve).not.toBeNull()
    expect(curve!.d.length).toBeGreaterThan(0)
  })

  it('all segment coordinates land inside the 0..100 viewBox', () => {
    const curve = sampleContrastCurve(60, '#ffffff', 4.5, 'oklch')
    expect(curve).not.toBeNull()
    // Pull every numeric coord out of the d string and assert range.
    const nums = curve!.d.match(/[-+]?\d*\.?\d+/g) ?? []
    expect(nums.length).toBeGreaterThan(0)
    for (const n of nums) {
      const v = Number(n)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(100)
    }
  })

  it('returns null for unparseable against color', () => {
    expect(sampleContrastCurve(30, 'not-a-color', 4.5)).toBeNull()
  })

  it('caches by (hue, against, ratio, space, gamut)', () => {
    sampleContrastCurve(30, '#ffffff', 4.5, 'oklch')
    expect(_cacheSizesForTests().contrast).toBe(1)
    sampleContrastCurve(30, '#ffffff', 4.5, 'oklch')
    expect(_cacheSizesForTests().contrast).toBe(1)
    sampleContrastCurve(30, '#ffffff', 4.5, 'hsl')
    expect(_cacheSizesForTests().contrast).toBe(2)
    sampleContrastCurve(30, '#ffffff', 7, 'oklch')
    expect(_cacheSizesForTests().contrast).toBe(3)
  })

  it('produces different output for different target ratios', () => {
    const aa = sampleContrastCurve(240, '#ffffff', 4.5, 'oklch')
    const aaa = sampleContrastCurve(240, '#ffffff', 7, 'oklch')
    expect(aa!.d).not.toBe(aaa!.d)
  })
})
