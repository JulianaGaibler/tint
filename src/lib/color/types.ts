// Color types shared across the color/ module.
//
// Conversion math, naming, and the white-point table are adapted from
// Servo's `components/style/color/` (MPL 2.0). See LICENSE-MPL-2.0 comments
// in convert.ts.

export type ColorSpace =
  | 'srgb'
  | 'srgb-linear'
  | 'hsl'
  | 'display-p3'
  | 'display-p3-linear'
  | 'oklab'
  | 'oklch'
  | 'xyz-d65'

export type Components = readonly [number, number, number]

export interface Color {
  readonly space: ColorSpace
  readonly components: Components
  readonly alpha: number
  readonly missing: {
    c0?: boolean
    c1?: boolean
    c2?: boolean
    alpha?: boolean
  }
  readonly legacy?: boolean
}

export class ColorParseError extends Error {
  constructor(
    public input: string,
    message: string,
  ) {
    super(`[tint/color] could not parse "${input}": ${message}`)
    this.name = 'ColorParseError'
  }
}

export function makeColor(
  space: ColorSpace,
  components: Components,
  alpha = 1,
  opts: { missing?: Color['missing']; legacy?: boolean } = {},
): Color {
  return {
    space,
    components,
    alpha,
    missing: opts.missing ?? {},
    legacy: opts.legacy,
  }
}
