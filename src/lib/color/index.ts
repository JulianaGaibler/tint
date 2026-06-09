// Core types
export type { Color, ColorSpace, Components } from './types'
export { ColorParseError, makeColor } from './types'

// Conversion primitives
export {
  convert,
  hslToSrgb,
  srgbToHsl,
  srgbToLinear,
  linearToSrgb,
  orthogonalToPolar,
  polarToOrthogonal,
  normalizeHue,
} from './convert'

// CSS parse + serialize
export { parseColor } from './parse'
export { toCss, toHex } from './serialize'

// Gamut checks + OKLCH max-chroma
export {
  inSrgb,
  inP3,
  clipTo,
  maxChromaIn,
  maxChromaInSrgb,
  maxChromaInP3,
} from './gamut'

// WCAG 2 contrast (takes Color objects). See `colorContrast` for the string API.
export { contrast, relativeLuminance, alphaComposite } from './contrast'
export type { ContrastResult, WcagLevel } from './contrast'

// Structured value types per color space
export type {
  RgbValue,
  HslValue,
  OklchValue,
  OklabValue,
  P3Value,
} from './values'

// String-in / object-out helpers that accept CSS strings or Color
export { toRgb, toHsl, toOklch, toOklab, toP3, colorContrast } from './helpers'
export type { ColorContrastOptions } from './helpers'
