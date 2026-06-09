// Sample SVG curves to overlay on the OKLCH 2D plane in Canvas.svelte.
//
// Each curve is a polyline traced by walking L from 0 to 1 and computing a
// chroma value at each step. We emit SVG `d` strings in the canvas's
// 100×100 viewBox so the same string lays cleanly on top of the painted
// pixels regardless of the rendered canvas size.
//
// Inspired by OkColor's `getSrgbStrokeLimit` / `getRelativeChromaStrokeLimit`
// (Doko-Zero, MIT). Math + caching are our own.

import { maxChromaIn } from '@lib/color/gamut'
import { CHROMA_MAX } from '@lib/color/constants'
import {
  contrast as wcagContrast,
  parseColor,
  ColorParseError,
  makeColor,
  type Color,
} from '@lib/color'

export type CurveStyle = 'boundary' | 'iso' | 'contrast'

export interface ChartCurve {
  /** Stable key for `{#each}`. Also used as the legend entry id. */
  id: string
  /** SVG `d` in the canvas's 100×100 viewBox coordinates. */
  d: string
  /** Stroke style. Canvas maps this to a stroke recipe. */
  style: CurveStyle
  /**
   * Optional legend label. Curves with no label still render but are not listed
   * in the legend.
   */
  label?: string
}

/**
 * Samples per curve. Dense enough that, at a typical ~250px displayed canvas on
 * a 2× Retina screen (~500 device pixels wide), each segment spans ≲ 1 device
 * pixel, so the polyline reads as a smooth curve. The caching layer makes the
 * density essentially free per repaint.
 */
export const N_SAMPLES = 192

function sampleD(
  _h: number,
  _gamut: 'srgb' | 'display-p3',
  factor: (l: number) => number,
): string {
  let d = ''
  for (let i = 0; i <= N_SAMPLES; i++) {
    const l = i / N_SAMPLES
    const c = factor(l)
    const x = Math.min(1, c / CHROMA_MAX) * 100
    const y = (1 - l) * 100
    d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)} `
  }
  // Trim trailing space for cleaner snapshots and cache equality.
  return d.trimEnd()
}

/**
 * Minimal LRU helper. `cache.keys().next().value` is the oldest entry because
 * Map preserves insertion order. Re-insert on hit to refresh recency.
 */
function lruGet<V>(
  cache: Map<string, V>,
  key: string,
  build: () => V,
  cap: number,
): V {
  const hit = cache.get(key)
  if (hit !== undefined) {
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const v = build()
  if (cache.size >= cap) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, v)
  return v
}

const BOUNDARY_CACHE = new Map<string, string>()
const ISO_CACHE = new Map<string, string>()
/**
 * Hue × gamut: ~720 combinations at our 0.5° bucketing. 50 covers smooth
 * scrubbing without unbounded growth.
 */
export const BOUNDARY_CAP = 50
/**
 * Hue × pct × gamut: ~144k combinations. 150 survives rapid scrub
 * back-and-forth on both axes without thrashing.
 */
export const ISO_CAP = 150

/**
 * The sRGB or Display-P3 gamut boundary in the OKLCH plane at the given hue:
 * for each lightness, the maximum chroma that still fits in the target gamut.
 */
export function sampleGamutBoundary(
  hue: number,
  gamut: 'srgb' | 'display-p3' = 'srgb',
): ChartCurve {
  const h = Math.round(hue * 2) / 2 // 0.5° bucket
  const key = `${h}|${gamut}`
  const d = lruGet(
    BOUNDARY_CACHE,
    key,
    () => sampleD(h, gamut, (l) => maxChromaIn(l, h, gamut)),
    BOUNDARY_CAP,
  )
  return {
    id: `boundary-${gamut}`,
    d,
    style: 'boundary',
    label: gamut === 'srgb' ? 'sRGB gamut' : 'Display-P3 gamut',
  }
}

/**
 * The iso-chroma curve for a given relative chroma percentage: the path the
 * cursor will trace when L or H change while the relative-chroma lock is
 * engaged.
 */
export function sampleRelativeChromaCurve(
  hue: number,
  pct: number,
  gamut: 'srgb' | 'display-p3' = 'srgb',
): ChartCurve {
  const h = Math.round(hue * 2) / 2
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  const key = `${h}|${p}|${gamut}`
  const d = lruGet(
    ISO_CACHE,
    key,
    () => sampleD(h, gamut, (l) => (p / 100) * maxChromaIn(l, h, gamut)),
    ISO_CAP,
  )
  return {
    id: 'iso-chroma',
    d,
    style: 'iso',
    label: `Relative chroma ${p}%`,
  }
}

// ---------- Contrast iso-curve (marching squares) ----------

export type ContrastCurveSpace = 'oklch' | 'hsl'

const CONTRAST_CACHE = new Map<string, string>()
const CONTRAST_CAP = 80

/**
 * Resolution of the marching-squares grid. 32×32 = 1089 ratio evaluations per
 * curve, all cached. Higher numbers give smoother curves. 32 is a good visual
 * fit for the popover's ~250-px canvas.
 */
const CONTRAST_GRID = 32

interface Pt {
  x: number
  y: number
}

/**
 * Sample a curve where WCAG 2 contrast against `againstHex` equals
 * `targetRatio`. The curve is drawn in the canvas's coordinate space, so it
 * overlays correctly regardless of the editor model: `oklch` maps to (chroma,
 * lightness), `hsl` to (saturation, lightness).
 *
 * Uses marching squares rather than a per-row binary search, since WCAG
 * luminance isn't monotonic in chroma at fixed (L, hue) for many hues (notably
 * the magenta/purple range, where increasing C can both raise and lower sRGB
 * luminance through the OKLab → linear-sRGB chain). The result is a complete
 * iso-contour, including closed loops and multi-arm shapes, not a single-valued
 * curve.
 *
 * Returns `null` if `againstHex` doesn't parse.
 */
export function sampleContrastCurve(
  hue: number,
  againstHex: string,
  targetRatio: number,
  space: ContrastCurveSpace = 'oklch',
  gamut: 'srgb' | 'display-p3' = 'srgb',
): ChartCurve | null {
  const h = Math.round(hue * 2) / 2
  const r = Math.round(targetRatio * 100) / 100
  const key = `${h}|${againstHex}|${r}|${space}|${gamut}`
  const cached = CONTRAST_CACHE.get(key)
  if (cached !== undefined) {
    CONTRAST_CACHE.delete(key)
    CONTRAST_CACHE.set(key, cached)
    return {
      id: 'contrast',
      d: cached,
      style: 'contrast',
      label: `Contrast ${r.toFixed(2)}:1`,
    }
  }

  let against: Color
  try {
    against = parseColor(againstHex)
  } catch (e) {
    if (e instanceof ColorParseError) return null
    throw e
  }

  // Per-space accessors. `axisRange` gives the in-gamut [lo, hi] for
  // the second axis at a given lightness. `canvasX` maps an axis value
  // to a viewBox X position.
  let makeAt: (axis: number, lightnessFrac: number) => Color
  let axisRange: (lightnessFrac: number) => { lo: number; hi: number }
  let canvasX: (axis: number) => number

  if (space === 'oklch') {
    makeAt = (c, lf) => makeColor('oklch', [lf, c, h])
    axisRange = (lf) => ({ lo: 0, hi: maxChromaIn(lf, h, gamut) })
    canvasX = (c) => Math.min(1, c / CHROMA_MAX) * 100
  } else {
    makeAt = (s, lf) => makeColor('hsl', [h, s, lf * 100])
    axisRange = () => ({ lo: 0, hi: 100 })
    canvasX = (s) => s
  }

  const ratioAt = (axis: number, lightnessFrac: number): number => {
    const result = wcagContrast({
      color: makeAt(axis, lightnessFrac),
      against,
    })
    return result.ratio ?? 1
  }

  // Precompute the per-row axis range AND the (GRID+1)×(GRID+1) corner
  // grid of ratios. li=0 is the bottom of the canvas (low lightness,
  // high y in viewBox), li=GRID is the top (high lightness, low y).
  const ranges: { lo: number; hi: number }[] = new Array(CONTRAST_GRID + 1)
  const corners: number[][] = new Array(CONTRAST_GRID + 1)
  for (let li = 0; li <= CONTRAST_GRID; li++) {
    const lf = li / CONTRAST_GRID
    const range = axisRange(lf)
    ranges[li] = range
    const row = new Array(CONTRAST_GRID + 1) as number[]
    for (let ai = 0; ai <= CONTRAST_GRID; ai++) {
      const axisVal = range.lo + (ai / CONTRAST_GRID) * (range.hi - range.lo)
      row[ai] = ratioAt(axisVal, lf)
    }
    corners[li] = row
  }

  // Map an interpolated grid coord (li, ai both possibly non-integer) to
  // viewBox coords. For OKLCH the axis range varies per row, so left/right
  // edge crossings (ai fixed, li fractional) need their range linearly
  // interpolated between adjacent rows.
  function toView(liFrac: number, aiFrac: number): Pt {
    const lf = liFrac / CONTRAST_GRID
    const liFloor = Math.floor(liFrac)
    const liCeil = Math.min(CONTRAST_GRID, liFloor + 1)
    const t = liFrac - liFloor
    const rLo = ranges[liFloor].lo * (1 - t) + ranges[liCeil].lo * t
    const rHi = ranges[liFloor].hi * (1 - t) + ranges[liCeil].hi * t
    const axisVal = rLo + (aiFrac / CONTRAST_GRID) * (rHi - rLo)
    return { x: canvasX(axisVal), y: (1 - lf) * 100 }
  }

  const segments: [Pt, Pt][] = []

  for (let li = 0; li < CONTRAST_GRID; li++) {
    const rangeLo = ranges[li]
    const rangeHi = ranges[li + 1]
    // Skip cells where both rows have zero-width axis range (e.g., L=0 or
    // L=1 in OKLCH where maxChromaIn returns 0).
    if (rangeLo.hi <= rangeLo.lo + 1e-9 && rangeHi.hi <= rangeHi.lo + 1e-9) {
      continue
    }
    for (let ai = 0; ai < CONTRAST_GRID; ai++) {
      // Corner ratios, indexed as in the spec: tl/tr (top, high li),
      // bl/br (bottom, low li).
      const bl = corners[li][ai]
      const br = corners[li][ai + 1]
      const tl = corners[li + 1][ai]
      const tr = corners[li + 1][ai + 1]

      const blA = bl > targetRatio
      const brA = br > targetRatio
      const tlA = tl > targetRatio
      const trA = tr > targetRatio

      const code = (tlA ? 8 : 0) | (trA ? 4 : 0) | (brA ? 2 : 0) | (blA ? 1 : 0)
      if (code === 0 || code === 15) continue

      // Crossing parameter per edge, t in [0, 1] along the edge.
      const tB = blA !== brA ? (targetRatio - bl) / (br - bl) : -1
      const tT = tlA !== trA ? (targetRatio - tl) / (tr - tl) : -1
      const tL = blA !== tlA ? (targetRatio - bl) / (tl - bl) : -1
      const tR = brA !== trA ? (targetRatio - br) / (tr - br) : -1

      const ptB = tB >= 0 ? toView(li, ai + tB) : null
      const ptT = tT >= 0 ? toView(li + 1, ai + tT) : null
      const ptL = tL >= 0 ? toView(li + tL, ai) : null
      const ptR = tR >= 0 ? toView(li + tR, ai + 1) : null

      switch (code) {
        // Single-corner above (or single below, mirror image).
        case 1:
        case 14:
          if (ptB && ptL) segments.push([ptB, ptL])
          break
        case 2:
        case 13:
          if (ptB && ptR) segments.push([ptB, ptR])
          break
        case 4:
        case 11:
          if (ptT && ptR) segments.push([ptT, ptR])
          break
        case 8:
        case 7:
          if (ptT && ptL) segments.push([ptT, ptL])
          break
        // Two adjacent corners above.
        case 3:
        case 12:
          if (ptL && ptR) segments.push([ptL, ptR])
          break
        case 6:
        case 9:
          if (ptB && ptT) segments.push([ptB, ptT])
          break
        // Saddles. Disambiguate by the cell mean: if the mean is on the
        // "above" side, the two above-corners are connected through the
        // cell interior. Otherwise the two below-corners are.
        case 5: {
          // BL + TR above, BR + TL below.
          const mean = (bl + br + tl + tr) / 4
          if (mean > targetRatio) {
            if (ptB && ptR) segments.push([ptB, ptR])
            if (ptL && ptT) segments.push([ptL, ptT])
          } else {
            if (ptB && ptL) segments.push([ptB, ptL])
            if (ptT && ptR) segments.push([ptT, ptR])
          }
          break
        }
        case 10: {
          // BR + TL above, BL + TR below.
          const mean = (bl + br + tl + tr) / 4
          if (mean > targetRatio) {
            if (ptB && ptL) segments.push([ptB, ptL])
            if (ptT && ptR) segments.push([ptT, ptR])
          } else {
            if (ptB && ptR) segments.push([ptB, ptR])
            if (ptL && ptT) segments.push([ptL, ptT])
          }
          break
        }
      }
    }
  }

  // Build the SVG path. Each segment is independent (`M…L…`), which is
  // visually correct: adjacent segments share endpoints, so the path
  // reads as a continuous curve. We don't merge them into longer M/L
  // runs because the order isn't naturally walk-able in our grid
  // iteration.
  let d = ''
  for (const [a, b] of segments) {
    d +=
      'M' +
      a.x.toFixed(2) +
      ',' +
      a.y.toFixed(2) +
      ' L' +
      b.x.toFixed(2) +
      ',' +
      b.y.toFixed(2) +
      ' '
  }
  d = d.trimEnd()

  if (CONTRAST_CACHE.size >= CONTRAST_CAP) {
    const oldest = CONTRAST_CACHE.keys().next().value
    if (oldest !== undefined) CONTRAST_CACHE.delete(oldest)
  }
  CONTRAST_CACHE.set(key, d)

  return {
    id: 'contrast',
    d,
    style: 'contrast',
    label: `Contrast ${r.toFixed(2)}:1`,
  }
}

/** Test-only: drop all cached SVG paths. */
export function _resetCachesForTests(): void {
  BOUNDARY_CACHE.clear()
  ISO_CACHE.clear()
  CONTRAST_CACHE.clear()
}

/** Test-only: read cache sizes. */
export function _cacheSizesForTests(): {
  boundary: number
  iso: number
  contrast: number
} {
  return {
    boundary: BOUNDARY_CACHE.size,
    iso: ISO_CACHE.size,
    contrast: CONTRAST_CACHE.size,
  }
}
