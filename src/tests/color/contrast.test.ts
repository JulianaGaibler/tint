import { describe, it, expect } from 'vitest'
import {
  contrast,
  relativeLuminance,
  alphaComposite,
} from '@lib/color/contrast'
import { parseColor } from '@lib/color/parse'

describe('relativeLuminance', () => {
  it('black is 0', () => {
    expect(relativeLuminance(parseColor('#000000'))).toBeCloseTo(0)
  })
  it('white is 1', () => {
    expect(relativeLuminance(parseColor('#ffffff'))).toBeCloseTo(1)
  })
  it('mid-grey is ≈0.2159', () => {
    expect(relativeLuminance(parseColor('#808080'))).toBeCloseTo(0.2159, 3)
  })
})

describe('contrast — WCAG 2 reference pairs', () => {
  it('black on white = 21:1', () => {
    const r = contrast({
      color: parseColor('#000000'),
      against: parseColor('#ffffff'),
    })
    expect(r.ratio).toBeCloseTo(21, 1)
    expect(r.normalText).toBe('AAA')
    expect(r.largeText).toBe('AAA')
  })

  it('white on white = 1:1, fail', () => {
    const r = contrast({
      color: parseColor('#ffffff'),
      against: parseColor('#ffffff'),
    })
    expect(r.ratio).toBeCloseTo(1)
    expect(r.normalText).toBe('fail')
  })

  it('mid-grey (#767676) on white passes AA normal text', () => {
    const r = contrast({
      color: parseColor('#767676'),
      against: parseColor('#ffffff'),
    })
    expect(r.ratio).toBeGreaterThanOrEqual(4.5)
    expect(r.normalText).toBe('AA')
  })

  it('is symmetric in the two colors', () => {
    const a = contrast({
      color: parseColor('#222222'),
      against: parseColor('#eeeeee'),
    })
    const b = contrast({
      color: parseColor('#eeeeee'),
      against: parseColor('#222222'),
    })
    expect(a.ratio).toBeCloseTo(b.ratio!, 6)
  })
})

describe('contrast — alpha handling', () => {
  it('returns null ratio without backdrop when alpha < 1', () => {
    const r = contrast({
      color: { ...parseColor('#ff0000'), alpha: 0.5 },
      against: parseColor('#ffffff'),
    })
    expect(r.ratio).toBeNull()
    expect(r.reason).toBe('alpha-without-backdrop')
  })

  it('computes a real ratio when backdrop is supplied', () => {
    const r = contrast({
      color: { ...parseColor('#000000'), alpha: 0.5 },
      against: parseColor('#ffffff'),
      backdrop: parseColor('#ffffff'),
    })
    expect(r.ratio).not.toBeNull()
    // 50% black over white ≈ #808080 (sRGB blend) vs white
    expect(r.ratio!).toBeGreaterThan(1)
    expect(r.ratio!).toBeLessThan(21)
  })
})

describe('alphaComposite', () => {
  it('50% black over white = mid-grey-ish', () => {
    const out = alphaComposite(
      { ...parseColor('#000000'), alpha: 0.5 },
      parseColor('#ffffff'),
    )
    expect(out.alpha).toBeCloseTo(1)
    // Mid-grey in sRGB after compositing
    expect(out.components[0]).toBeCloseTo(0.5, 2)
  })

  it('opaque top covers bottom', () => {
    const out = alphaComposite(parseColor('#ff0000'), parseColor('#0000ff'))
    expect(out.components[0]).toBeCloseTo(1)
    expect(out.components[2]).toBeCloseTo(0)
  })
})
