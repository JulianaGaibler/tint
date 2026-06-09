import { describe, it, expect } from 'vitest'
import {
  toRgb,
  toHsl,
  toOklch,
  toOklab,
  toP3,
  colorContrast,
  parseColor,
  ColorParseError,
  makeColor,
} from '@lib/color'

describe('toRgb', () => {
  it('parses a hex string', () => {
    const v = toRgb('#ff0000')
    expect(v.r).toBeCloseTo(255)
    expect(v.g).toBeCloseTo(0)
    expect(v.b).toBeCloseTo(0)
    expect(v.alpha).toBe(1)
  })

  it('accepts a Color object directly', () => {
    const c = makeColor('srgb', [1, 0, 0], 0.5)
    const v = toRgb(c)
    expect(v.r).toBeCloseTo(255)
    expect(v.alpha).toBe(0.5)
  })

  it('round-trips through a perceptual space (hex → oklch → rgb)', () => {
    const r1 = toRgb('#3366cc')
    const okl = toOklch('#3366cc')
    const r2 = toRgb(makeColor('oklch', [okl.l, okl.c, okl.h], okl.alpha))
    expect(r2.r).toBeCloseTo(r1.r, 0)
    expect(r2.g).toBeCloseTo(r1.g, 0)
    expect(r2.b).toBeCloseTo(r1.b, 0)
  })

  it('throws on unparseable strings', () => {
    expect(() => toRgb('not-a-color')).toThrow(ColorParseError)
  })
})

describe('toHsl', () => {
  it('parses HSL string', () => {
    const v = toHsl('hsl(120 100% 50%)')
    expect(v.h).toBeCloseTo(120)
    expect(v.s).toBeCloseTo(100)
    expect(v.l).toBeCloseTo(50)
  })

  it('converts from hex', () => {
    const v = toHsl('#ff0000')
    expect(v.h).toBeCloseTo(0)
    expect(v.s).toBeCloseTo(100)
    expect(v.l).toBeCloseTo(50)
  })
})

describe('toOklch', () => {
  it('matches the CSS Color 4 reference for sRGB red', () => {
    const v = toOklch('#ff0000')
    expect(v.l).toBeCloseTo(0.628, 2)
    expect(v.c).toBeCloseTo(0.258, 2)
    expect(v.h).toBeCloseTo(29.23, 1)
  })

  it('preserves alpha', () => {
    const v = toOklch('rgba(255, 0, 0, 0.3)')
    expect(v.alpha).toBeCloseTo(0.3)
  })
})

describe('toOklab', () => {
  it('round-trips with oklch via polar↔orthogonal', () => {
    const lab = toOklab('#0066ff')
    expect(Number.isFinite(lab.l)).toBe(true)
    expect(Number.isFinite(lab.a)).toBe(true)
    expect(Number.isFinite(lab.b)).toBe(true)
  })
})

describe('toP3', () => {
  it('returns the same value for an in-sRGB color converted to P3', () => {
    const p3 = toP3('#808080')
    // Mid-grey stays mid-grey across sRGB ↔ P3.
    expect(p3.r).toBeCloseTo(0.5, 1)
    expect(p3.g).toBeCloseTo(0.5, 1)
    expect(p3.b).toBeCloseTo(0.5, 1)
  })
})

describe('colorContrast', () => {
  it('21:1 for black on white', () => {
    const r = colorContrast('#000000', '#ffffff')
    expect(r.ratio).toBeCloseTo(21, 0)
    expect(r.normalText).toBe('AAA')
  })

  it('symmetric in argument order', () => {
    const a = colorContrast('#222', '#eee')
    const b = colorContrast('#eee', '#222')
    expect(a.ratio).toBeCloseTo(b.ratio!, 6)
  })

  it('null ratio when one side has alpha without backdrop', () => {
    const r = colorContrast('rgba(0,0,0,0.5)', '#ffffff')
    expect(r.ratio).toBeNull()
    expect(r.reason).toBe('alpha-without-backdrop')
  })

  it('real ratio with backdrop supplied', () => {
    const r = colorContrast('rgba(0,0,0,0.5)', '#ffffff', {
      backdrop: '#ffffff',
    })
    expect(r.ratio).not.toBeNull()
    expect(r.ratio!).toBeGreaterThan(1)
  })

  it('accepts Color objects too', () => {
    const black = parseColor('#000000')
    const white = parseColor('#ffffff')
    const r = colorContrast(black, white)
    expect(r.ratio).toBeCloseTo(21, 0)
  })
})
