// WCAG 2 contrast.
//
// WCAG 2.x relative luminance is defined for sRGB only
// (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance), so wide-gamut
// inputs are per-channel-clipped to sRGB before luminance is computed.
// The `clipped` flag on the result lets callers flag this in the UI.

import type { Color } from './types'
import { convert, srgbToLinear } from './convert'
import { clipTo } from './gamut'

export type WcagLevel = 'AA' | 'AAA' | 'fail'

export interface ContrastResult {
  /** Ratio in [1, 21] or null if alpha < 1 and no backdrop was supplied. */
  ratio: number | null
  /** True iff the _input_ color was clipped to sRGB before computing. */
  clipped: boolean
  /** Best WCAG level passed for normal-size text (>= 4.5 = AA, >= 7 = AAA). */
  normalText: WcagLevel
  /** Best WCAG level passed for large text (>= 3 = AA, >= 4.5 = AAA). */
  largeText: WcagLevel
  /** UI components (icons, focus indicators), pass at >= 3. */
  uiComponents: WcagLevel
  /** Set when ratio is null. */
  reason?: 'alpha-without-backdrop'
}

const FAIL: ContrastResult = {
  ratio: null,
  clipped: false,
  normalText: 'fail',
  largeText: 'fail',
  uiComponents: 'fail',
  reason: 'alpha-without-backdrop',
}

/** Source-over compositing: `top` over `bottom`. Returns an opaque sRGB color. */
export function alphaComposite(top: Color, bottom: Color): Color {
  const t = convert(top, 'srgb')
  const b = convert(bottom, 'srgb')
  const ta = t.alpha
  const ba = b.alpha
  const outA = ta + ba * (1 - ta)
  if (outA <= 0) return { ...b, components: [0, 0, 0], alpha: 0 }
  const blend = (i: 0 | 1 | 2) =>
    (t.components[i] * ta + b.components[i] * ba * (1 - ta)) / outA
  return { ...t, components: [blend(0), blend(1), blend(2)], alpha: outA }
}

/** Compute WCAG 2 relative luminance from an sRGB-clipped color. */
export function relativeLuminance(color: Color): number {
  const clipped = clipTo(color, 'srgb')
  const [r, g, b] = srgbToLinear(clipped.components)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function level(
  ratio: number,
  aaThreshold: number,
  aaaThreshold: number,
): WcagLevel {
  if (ratio >= aaaThreshold) return 'AAA'
  if (ratio >= aaThreshold) return 'AA'
  return 'fail'
}

interface ContrastInput {
  /** Picked color. */
  color: Color
  /** Counterpart for contrast comparison. */
  against: Color
  /** Required when either color has alpha < 1. */
  backdrop?: Color
}

/**
 * Compute the WCAG 2 contrast ratio between two colors.
 *
 * If either input has alpha < 1 and no `backdrop` is provided, returns `ratio:
 * null` because WCAG 2 is undefined for translucent colors.
 */
export function contrast({
  color,
  against,
  backdrop,
}: ContrastInput): ContrastResult {
  const needsBackdrop = color.alpha < 1 || against.alpha < 1
  if (needsBackdrop && !backdrop) {
    return FAIL
  }

  const a = needsBackdrop && backdrop ? alphaComposite(color, backdrop) : color
  const b =
    needsBackdrop && backdrop ? alphaComposite(against, backdrop) : against

  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  const ratio = (lighter + 0.05) / (darker + 0.05)
  const clipped = !inUnit(convert(color, 'srgb').components)

  return {
    ratio,
    clipped,
    normalText: level(ratio, 4.5, 7),
    largeText: level(ratio, 3, 4.5),
    uiComponents: level(ratio, 3, 3),
  }
}

function inUnit(c: readonly number[]): boolean {
  return c.every((v) => v >= 0 - 1e-6 && v <= 1 + 1e-6)
}
