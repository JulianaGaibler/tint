import { describe, it, expect } from 'vitest'
import { toCss, toHex } from '@lib/color/serialize'
import { makeColor } from '@lib/color/types'

describe('toCss', () => {
  it('legacy sRGB red as rgb(...)', () => {
    const c = makeColor('srgb', [1, 0, 0], 1, { legacy: true })
    expect(toCss(c)).toBe('rgb(255, 0, 0)')
  })

  it('legacy sRGB with alpha as rgba(...)', () => {
    const c = makeColor('srgb', [1, 0, 0], 0.5, { legacy: true })
    expect(toCss(c)).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('modern sRGB without alpha', () => {
    const c = makeColor('srgb', [1, 0, 0], 1)
    expect(toCss(c)).toBe('rgb(255 0 0)')
  })

  it('hsl emits legacy comma form', () => {
    const c = makeColor('hsl', [120, 100, 50], 1, { legacy: true })
    expect(toCss(c)).toBe('hsl(120, 100%, 50%)')
  })

  it('oklch with no alpha', () => {
    const c = makeColor('oklch', [0.7, 0.15, 30])
    expect(toCss(c)).toBe('oklch(0.7 0.15 30)')
  })

  it('oklch with alpha', () => {
    const c = makeColor('oklch', [0.7, 0.15, 30], 0.5)
    expect(toCss(c)).toBe('oklch(0.7 0.15 30 / 0.5)')
  })

  it('display-p3 uses color() syntax', () => {
    const c = makeColor('display-p3', [1, 0.5, 0])
    expect(toCss(c)).toBe('color(display-p3 1 0.5 0)')
  })

  it('renders none for missing components', () => {
    const c = makeColor('oklch', [NaN, 0.15, 30], 1, {
      missing: { c0: true },
    })
    expect(toCss(c)).toContain('none')
  })
})

describe('toHex', () => {
  it('renders sRGB red as #FF0000', () => {
    const c = makeColor('srgb', [1, 0, 0])
    expect(toHex(c)).toBe('#FF0000')
  })

  it('renders sRGB grey at exact 128/255', () => {
    const c = makeColor('srgb', [128 / 255, 128 / 255, 128 / 255])
    expect(toHex(c)).toBe('#808080')
  })

  it('renders alpha as 8-digit hex', () => {
    const c = makeColor('srgb', [1, 0, 0], 0.5)
    expect(toHex(c)).toMatch(/^#FF0000[0-9A-F]{2}$/)
  })

  it('clips out-of-sRGB OKLCH to in-gamut hex', () => {
    // very saturated OKLCH outside sRGB gamut
    const c = makeColor('oklch', [0.7, 0.4, 30])
    const hex = toHex(c)
    expect(hex).toMatch(/^#[0-9A-F]{6}$/)
  })
})
