import { describe, it, expect } from 'vitest'
import {
  canonicalize,
  normalizePalette,
  findPaletteMatch,
  type PaletteColor,
} from '@lib/components/ColorPicker/palette'
import { splitCanonicalAlpha } from '@lib/components/ColorPicker/shell-serialize'

const PALETTE: PaletteColor[] = [
  { name: 'color/red/30', value: '#ff8998' },
  { name: 'color/blue/50', value: 'rgb(0 96 223)' },
]

describe('canonicalize', () => {
  it('drops a fully opaque alpha', () => {
    expect(canonicalize('#ff8998ff')).toBe('#ff8998')
  })

  it('keeps the alpha byte by default', () => {
    expect(canonicalize('#ff899833')).toBe('#ff899833')
  })

  it('forces alpha to 1 with ignoreAlpha', () => {
    expect(canonicalize('#ff899833', { ignoreAlpha: true })).toBe('#ff8998')
  })

  it('normalizes across CSS syntaxes', () => {
    expect(canonicalize('rgb(255 137 152 / 0.2)', { ignoreAlpha: true })).toBe(
      '#ff8998',
    )
  })

  it('returns null for unparseable input', () => {
    expect(canonicalize('not-a-color')).toBeNull()
  })
})

describe('findPaletteMatch', () => {
  it('resolves a translucent token under ignoreAlpha', () => {
    const opts = { ignoreAlpha: true }
    const normalized = normalizePalette(PALETTE, opts)
    const match = findPaletteMatch(PALETTE, normalized, '#ff899833', opts)
    expect(match?.item.name).toBe('color/red/30')
  })

  it('misses a translucent token without ignoreAlpha', () => {
    const normalized = normalizePalette(PALETTE)
    expect(findPaletteMatch(PALETTE, normalized, '#ff899833')).toBeNull()
  })

  it('still resolves an opaque token under ignoreAlpha', () => {
    const opts = { ignoreAlpha: true }
    const normalized = normalizePalette(PALETTE, opts)
    const match = findPaletteMatch(PALETTE, normalized, '#0060df', opts)
    expect(match?.item.name).toBe('color/blue/50')
  })

  it('gives the earlier token to opacities that collapse onto one key', () => {
    const overlapping: PaletteColor[] = [
      { name: 'color/red/30', value: '#ff8998' },
      { name: 'color/red/30-ghost', value: '#ff899880' },
    ]
    const opts = { ignoreAlpha: true }
    const normalized = normalizePalette(overlapping, opts)
    const match = findPaletteMatch(overlapping, normalized, '#ff899820', opts)
    expect(match?.item.name).toBe('color/red/30')
  })
})

describe('splitCanonicalAlpha', () => {
  it('splits an 8 digit hex', () => {
    const { base, alpha } = splitCanonicalAlpha('#ff899833')
    expect(base).toBe('#FF8998')
    expect(alpha).toBeCloseTo(0.2, 2)
  })

  it('expands a 4 digit hex', () => {
    const { base, alpha } = splitCanonicalAlpha('#f008')
    expect(base).toBe('#FF0000')
    expect(alpha).toBeCloseTo(0.533, 2)
  })

  it('expands a 3 digit hex at full opacity', () => {
    expect(splitCanonicalAlpha('#f00')).toEqual({ base: '#FF0000', alpha: 1 })
  })

  it('reports full opacity for a 6 digit hex', () => {
    expect(splitCanonicalAlpha('#ff8998')).toEqual({
      base: '#FF8998',
      alpha: 1,
    })
  })

  it('passes keywords through with full opacity', () => {
    expect(splitCanonicalAlpha('transparent')).toEqual({
      base: 'TRANSPARENT',
      alpha: 1,
    })
  })
})
