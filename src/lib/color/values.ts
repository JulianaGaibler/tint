// Structured value objects for each color space the library can emit.
// Channel ranges follow the corresponding CSS function (rgb() in 0-255,
// hsl() in degrees + percentages, OKLCH chroma in 0 to ~0.4, etc.)
// rather than a single normalized scheme. `alpha` is always 0-1.

export interface RgbValue {
  r: number
  g: number
  b: number
  alpha: number
}

export interface HslValue {
  h: number
  s: number
  l: number
  alpha: number
}

export interface OklchValue {
  l: number
  c: number
  h: number
  alpha: number
}

export interface OklabValue {
  l: number
  a: number
  b: number
  alpha: number
}

/** Display-P3 RGB. r/g/b are 0-1 (NOT 0-255) to match `color(display-p3 …)`. */
export interface P3Value {
  r: number
  g: number
  b: number
  alpha: number
}
