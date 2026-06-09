import { describe, it, expect } from 'vitest'
import { parseColor } from '@lib/color/parse'
import { ColorParseError } from '@lib/color/types'

describe('parseColor — hex', () => {
  it('parses #rrggbb', () => {
    const c = parseColor('#ff0000')
    expect(c.space).toBe('srgb')
    expect(c.components[0]).toBeCloseTo(1)
    expect(c.components[1]).toBeCloseTo(0)
    expect(c.components[2]).toBeCloseTo(0)
    expect(c.alpha).toBe(1)
  })

  it('parses #rgb shorthand', () => {
    const c = parseColor('#f00')
    expect(c.components[0]).toBeCloseTo(1)
    expect(c.components[1]).toBeCloseTo(0)
    expect(c.components[2]).toBeCloseTo(0)
  })

  it('parses #rrggbbaa', () => {
    const c = parseColor('#ff000080')
    expect(c.components[0]).toBeCloseTo(1)
    expect(c.alpha).toBeCloseTo(0x80 / 255, 4)
  })

  it('parses #rgba shorthand', () => {
    const c = parseColor('#f008')
    expect(c.alpha).toBeCloseTo(0x88 / 255, 4)
  })

  it('throws on bad length', () => {
    expect(() => parseColor('#ff00')).not.toThrow() // 4 is valid (#rgba)
    expect(() => parseColor('#fffff')).toThrow(ColorParseError)
    expect(() => parseColor('#xyz')).toThrow(ColorParseError)
  })
})

describe('parseColor — named colors', () => {
  it('parses red', () => {
    const c = parseColor('red')
    expect(c.components[0]).toBeCloseTo(1)
    expect(c.components[1]).toBeCloseTo(0)
    expect(c.components[2]).toBeCloseTo(0)
  })

  it('parses transparent as alpha=0', () => {
    const c = parseColor('transparent')
    expect(c.alpha).toBe(0)
  })

  it('is case-insensitive', () => {
    const a = parseColor('CornflowerBlue')
    const b = parseColor('cornflowerblue')
    expect(a.components).toEqual(b.components)
  })
})

describe('parseColor — rgb()/rgba()', () => {
  it('parses legacy comma form', () => {
    const c = parseColor('rgb(255, 0, 0)')
    expect(c.components[0]).toBeCloseTo(1)
    expect(c.components[1]).toBeCloseTo(0)
    expect(c.alpha).toBe(1)
  })

  it('parses modern space form', () => {
    const c = parseColor('rgb(255 128 64)')
    expect(c.components[1]).toBeCloseTo(128 / 255)
  })

  it('parses modern with /alpha', () => {
    const c = parseColor('rgb(255 0 0 / 0.5)')
    expect(c.alpha).toBeCloseTo(0.5)
  })

  it('parses rgba(...) legacy', () => {
    const c = parseColor('rgba(255, 0, 0, 0.25)')
    expect(c.alpha).toBeCloseTo(0.25)
  })

  it('parses percentage channels', () => {
    const c = parseColor('rgb(100% 0% 0%)')
    expect(c.components[0]).toBeCloseTo(1)
  })
})

describe('parseColor — hsl()/hsla()', () => {
  it('parses legacy comma form', () => {
    const c = parseColor('hsl(120, 100%, 50%)')
    expect(c.space).toBe('hsl')
    expect(c.components[0]).toBeCloseTo(120)
    expect(c.components[1]).toBeCloseTo(100)
    expect(c.components[2]).toBeCloseTo(50)
  })

  it('parses modern space form', () => {
    const c = parseColor('hsl(120 100% 50%)')
    expect(c.components[0]).toBeCloseTo(120)
  })

  it('accepts hue with units', () => {
    const c = parseColor('hsl(0.5turn 100% 50%)')
    expect(c.components[0]).toBeCloseTo(180)
  })
})

describe('parseColor — oklch() / oklab()', () => {
  it('parses oklch with number L', () => {
    const c = parseColor('oklch(0.7 0.15 30)')
    expect(c.space).toBe('oklch')
    expect(c.components[0]).toBeCloseTo(0.7)
    expect(c.components[1]).toBeCloseTo(0.15)
    expect(c.components[2]).toBeCloseTo(30)
  })

  it('parses oklch with percent L scaled to 0-1', () => {
    const c = parseColor('oklch(70% 0.15 30)')
    expect(c.components[0]).toBeCloseTo(0.7)
  })

  it('parses oklab', () => {
    const c = parseColor('oklab(0.5 0.1 -0.1)')
    expect(c.space).toBe('oklab')
    expect(c.components[2]).toBeCloseTo(-0.1)
  })

  it('records missing components as NaN with missing flag', () => {
    const c = parseColor('oklch(none 0.15 30)')
    expect(Number.isNaN(c.components[0])).toBe(true)
    expect(c.missing.c0).toBe(true)
  })
})

describe('parseColor — color(srgb …), color(display-p3 …)', () => {
  it('parses color(srgb …)', () => {
    const c = parseColor('color(srgb 1 0 0)')
    expect(c.space).toBe('srgb')
    expect(c.components[0]).toBeCloseTo(1)
  })

  it('parses color(display-p3 …)', () => {
    const c = parseColor('color(display-p3 1 0.5 0)')
    expect(c.space).toBe('display-p3')
    expect(c.components[1]).toBeCloseTo(0.5)
  })

  it('rejects unknown color() space', () => {
    expect(() => parseColor('color(quokka 1 0 0)')).toThrow(ColorParseError)
  })
})

describe('parseColor — bad input', () => {
  it.each(['', '   ', 'oops', 'rgb()', 'rgb(', 'oklch(0.7 0.15)'])(
    'throws on %s',
    (input) => {
      expect(() => parseColor(input)).toThrow(ColorParseError)
    },
  )
})
