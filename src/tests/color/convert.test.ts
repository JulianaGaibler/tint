import { describe, it, expect } from 'vitest'
import { convert, hslToSrgb, srgbToHsl, normalizeHue } from '@lib/color/convert'
import { makeColor } from '@lib/color/types'
import type { Color, ColorSpace, Components } from '@lib/color'

const TOL_MATRIX = 1e-3
const TOL_CLOSED = 1e-9

function expectClose(
  actual: Components,
  expected: Components,
  tol = TOL_MATRIX,
) {
  for (let i = 0; i < 3; i++) {
    expect(actual[i]).toBeCloseTo(expected[i], -Math.log10(tol))
  }
}

describe('normalizeHue', () => {
  it('wraps negative angles', () => {
    expect(normalizeHue(-10)).toBeCloseTo(350, 6)
  })
  it('wraps past 360', () => {
    expect(normalizeHue(720)).toBeCloseTo(0, 6)
    expect(normalizeHue(450)).toBeCloseTo(90, 6)
  })
})

describe('HSL ↔ sRGB closed-form', () => {
  it('hsl(0 100% 50%) → red', () => {
    expectClose(hslToSrgb([0, 100, 50]), [1, 0, 0], TOL_CLOSED)
  })
  it('hsl(120 100% 50%) → green', () => {
    expectClose(hslToSrgb([120, 100, 50]), [0, 1, 0], TOL_CLOSED)
  })
  it('hsl(240 100% 50%) → blue', () => {
    expectClose(hslToSrgb([240, 100, 50]), [0, 0, 1], TOL_CLOSED)
  })
  it('round-trips primary red', () => {
    const back = srgbToHsl([1, 0, 0])
    expectClose(back, [0, 100, 50], TOL_CLOSED)
  })
  it('round-trips a mid-saturation cyan', () => {
    const hsl: Components = [200, 60, 50]
    const rgb = hslToSrgb(hsl)
    const back = srgbToHsl(rgb)
    expectClose(back, hsl, 1e-6)
  })
})

describe('cross-space conversions via convert()', () => {
  // CSS Color 4 sample: sRGB red ↔ oklch
  // Per the spec: rgb(255 0 0) ≈ oklch(0.6279554 0.2576633 29.2338851)
  it('sRGB red → oklch matches CSS Color 4 reference', () => {
    const red: Color = makeColor('srgb', [1, 0, 0])
    const oklch = convert(red, 'oklch')
    expect(oklch.components[0]).toBeCloseTo(0.628, 3)
    expect(oklch.components[1]).toBeCloseTo(0.2577, 3)
    expect(oklch.components[2]).toBeCloseTo(29.23, 1)
  })

  it('oklch → sRGB round-trip preserves color', () => {
    const start: Color = makeColor('oklch', [0.7, 0.18, 22])
    const srgb = convert(start, 'srgb')
    const back = convert(srgb, 'oklch')
    expect(back.components[0]).toBeCloseTo(0.7, 3)
    expect(back.components[1]).toBeCloseTo(0.18, 3)
    expect(back.components[2]).toBeCloseTo(22, 1)
  })

  it('sRGB white → XYZ-D65 white point', () => {
    const white: Color = makeColor('srgb', [1, 1, 1])
    const xyz = convert(white, 'xyz-d65')
    // D65 reference white: [0.9505, 1.0000, 1.0891]
    expect(xyz.components[0]).toBeCloseTo(0.9505, 3)
    expect(xyz.components[1]).toBeCloseTo(1.0, 3)
    expect(xyz.components[2]).toBeCloseTo(1.0891, 3)
  })

  it('Display-P3 → sRGB clips bright saturated P3 outside sRGB cube', () => {
    // P3 pure green is outside sRGB gamut → at least one channel will be > 1 or < 0
    const p3green: Color = makeColor('display-p3', [0, 1, 0])
    const srgb = convert(p3green, 'srgb')
    const outOfRange = srgb.components.some((v) => v > 1.001 || v < -0.001)
    expect(outOfRange).toBe(true)
  })

  it('Display-P3 → sRGB preserves an in-sRGB color', () => {
    // 50% grey in Display-P3 should map to ~50% grey in sRGB (with the
    // same gamma, just slightly different matrix).
    const grey: Color = makeColor('display-p3', [0.5, 0.5, 0.5])
    const srgb = convert(grey, 'srgb')
    expectClose(srgb.components, [0.5, 0.5, 0.5], 1e-2)
  })

  it('oklab ↔ oklch is the polar conversion', () => {
    const lab: Color = makeColor('oklab', [0.5, 0.1, -0.1])
    const lch = convert(lab, 'oklch')
    const back = convert(lch, 'oklab')
    expectClose(back.components, lab.components, 1e-6)
  })

  it('preserves alpha across conversions', () => {
    const c = makeColor('srgb', [0.5, 0.3, 0.1], 0.42)
    expect(convert(c, 'oklch').alpha).toBeCloseTo(0.42)
    expect(convert(c, 'display-p3').alpha).toBeCloseTo(0.42)
    expect(convert(c, 'oklab').alpha).toBeCloseTo(0.42)
  })

  it('round-trips every supported space pair for a mid-grey', () => {
    const spaces: ColorSpace[] = [
      'srgb',
      'srgb-linear',
      'hsl',
      'display-p3',
      'display-p3-linear',
      'oklab',
      'oklch',
      'xyz-d65',
    ]
    const start: Color = makeColor('srgb', [0.3, 0.5, 0.7])
    for (const space of spaces) {
      const round = convert(convert(start, space), 'srgb')
      expectClose(round.components, start.components, 2e-3)
    }
  })
})
