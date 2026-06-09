// Gamut checks, per-channel clip, and OKLCH max-chroma search.
//
// Out-of-gamut colors are handled by the picker via an explicit warning
// + clip action rather than implicit binary-search gamut mapping, so the
// user controls when chroma is altered. `maxChromaIn` exists separately
// because the relative-chroma-lock needs the gamut boundary at a given
// (L, H) to translate between absolute and relative chroma.

import type { Color, ColorSpace, Components } from './types'
import { convert } from './convert'
import { makeColor } from './types'

const GAMUT_EPSILON = 1e-6

function withinUnit(c: Components, eps: number): boolean {
  return c.every((v) => v >= -eps && v <= 1 + eps)
}

/** True if `color` fits in sRGB's [0, 1]^3 cube (in its sRGB representation). */
export function inSrgb(color: Color, eps = GAMUT_EPSILON): boolean {
  const srgb = color.space === 'srgb' ? color : convert(color, 'srgb')
  return withinUnit(srgb.components, eps)
}

/** True if `color` fits in Display-P3's [0, 1]^3 cube. */
export function inP3(color: Color, eps = GAMUT_EPSILON): boolean {
  const p3 = color.space === 'display-p3' ? color : convert(color, 'display-p3')
  return withinUnit(p3.components, eps)
}

/** Clip components to [0, 1] in `target` space. Returns the clipped Color. */
export function clipTo(color: Color, target: ColorSpace = 'srgb'): Color {
  const converted = convert(color, target)
  const clipped = converted.components.map((v) =>
    Math.max(0, Math.min(1, v)),
  ) as unknown as Components
  return {
    ...converted,
    components: clipped,
  }
}

const CHROMA_SEARCH_CEILING = 0.5
const CHROMA_SEARCH_EPS = 1e-4

/**
 * Maximum OKLCH chroma that stays in `target`'s gamut at the given L/H.
 *
 * The OKLCH gamut's chroma boundary depends on both L and H, so closed form
 * isn't available and we binary-search. Used by relative-chroma-lock to
 * translate between absolute chroma and a 0-100% relative chroma.
 */
export function maxChromaIn(
  l: number,
  h: number,
  target: 'srgb' | 'display-p3' = 'srgb',
): number {
  if (l <= 0 || l >= 1) return 0
  let lo = 0
  let hi = CHROMA_SEARCH_CEILING
  const check = target === 'display-p3' ? inP3 : inSrgb
  // Ceiling already in gamut (rare): skip the search.
  if (check(makeColor('oklch', [l, hi, h]), 1e-4)) return hi
  while (hi - lo > CHROMA_SEARCH_EPS) {
    const mid = (lo + hi) / 2
    if (check(makeColor('oklch', [l, mid, h]), 1e-4)) lo = mid
    else hi = mid
  }
  return lo
}

export const maxChromaInSrgb = (l: number, h: number) =>
  maxChromaIn(l, h, 'srgb')
export const maxChromaInP3 = (l: number, h: number) =>
  maxChromaIn(l, h, 'display-p3')
