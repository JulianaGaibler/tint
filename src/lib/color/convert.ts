// Color-space conversion.
//
// Algorithms, matrices, and constants are adapted from Servo's
// `components/style/color/convert.rs`, which itself follows CSS Color 4
// (https://drafts.csswg.org/css-color-4/#color-conversion-code).
//
// Source: https://github.com/servo/servo/blob/main/components/style/color/convert.rs
// License: MPL 2.0 (https://mozilla.org/MPL/2.0/). This file (alongside
// the other color/*.ts modules ported from Servo) is governed by MPL 2.0.
// The rest of tint is under its own license. If you modify this file,
// retain this header.

import type { Color, ColorSpace, Components } from './types'
import { makeColor } from './types'

type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]

function multiply(c: Components, m: Mat3): Components {
  const [x, y, z] = c
  return [
    m[0] * x + m[3] * y + m[6] * z,
    m[1] * x + m[4] * y + m[7] * z,
    m[2] * x + m[5] * y + m[8] * z,
  ]
}

const sign = (v: number) => (v < 0 ? -1 : 1)

export function normalizeHue(hue: number): number {
  return hue - 360 * Math.floor(hue / 360)
}

// ---------- HSL ↔ sRGB (closed form) ----------

export function hslToSrgb([h, s, l]: Components): Components {
  const hue = normalizeHue(h)
  const sat = s / 100
  const lit = l / 100

  const t2 = lit <= 0.5 ? lit * (sat + 1) : lit + sat - lit * sat
  const t1 = lit * 2 - t2

  const hueToRgb = (a: number, b: number, hp: number) => {
    const hh = normalizeHue(hp)
    if (hh * 6 < 360) return a + ((b - a) * hh) / 60
    if (hh * 2 < 360) return b
    if (hh * 3 < 720) return a + ((b - a) * (240 - hh)) / 60
    return a
  }

  return [
    hueToRgb(t1, t2, hue + 120),
    hueToRgb(t1, t2, hue),
    hueToRgb(t1, t2, hue - 120),
  ]
}

export function srgbToHsl([r, g, b]: Components): Components {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let hue: number
  if (delta === 0) {
    hue = 0
  } else if (max === r) {
    hue = ((g - b) / delta) * 60 + (g < b ? 360 : 0)
  } else if (max === g) {
    hue = ((b - r) / delta + 2) * 60
  } else {
    hue = ((r - g) / delta + 4) * 60
  }

  const lit = (min + max) / 2
  let sat = 0
  if (delta !== 0 && lit !== 0 && lit !== 1) {
    sat = (max - lit) / Math.min(lit, 1 - lit)
  }

  return [hue, sat * 100, lit * 100]
}

// ---------- Lab ↔ LCH polar (used for OKLab ↔ OKLCH) ----------

const POLAR_EPSILON = 1.0 / 1e5 // for L range [0,1] OKLab

export function orthogonalToPolar(
  [l, a, b]: Components,
  eps = POLAR_EPSILON,
): Components {
  const chroma = Math.sqrt(a * a + b * b)
  let hue: number
  if (Math.abs(a) < eps && Math.abs(b) < eps) hue = NaN
  else if (Math.abs(chroma) < eps) hue = NaN
  else hue = normalizeHue((Math.atan2(b, a) * 180) / Math.PI)
  return [l, chroma, hue]
}

export function polarToOrthogonal([l, c, h]: Components): Components {
  if (Number.isNaN(h)) return [l, 0, 0]
  const rad = (h * Math.PI) / 180
  return [l, c * Math.cos(rad), c * Math.sin(rad)]
}

// ---------- sRGB gamma ↔ linear ----------

export function srgbToLinear(c: Components): Components {
  return c.map((v) => {
    const abs = Math.abs(v)
    if (abs < 0.04045) return v / 12.92
    return sign(v) * Math.pow((abs + 0.055) / 1.055, 2.4)
  }) as unknown as Components
}

export function linearToSrgb(c: Components): Components {
  return c.map((v) => {
    const abs = Math.abs(v)
    if (abs > 0.0031308)
      return sign(v) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055)
    return 12.92 * v
  }) as unknown as Components
}

// ---------- Display-P3 (same gamma as sRGB) ----------

export const p3ToLinear = srgbToLinear
export const linearToP3 = linearToSrgb

// ---------- RGB ↔ XYZ-D65 matrices ----------

// All matrices are stored COLUMN-major (matching Servo's transposed form),
// so multiply() expects column-major data. Each row of the comment below
// shows ONE column of the matrix in source order.

// sRGB → XYZ-D65 (linear-light sRGB in)
// Equivalent spec matrix rows:
//   x = 0.4123908... R + 0.3575843... G + 0.1804808... B
//   y = 0.2126390... R + 0.7151687... G + 0.0721923... B
//   z = 0.0193308... R + 0.1191948... G + 0.9505322... B
const SRGB_TO_XYZ: Mat3 = [
  0.4123907992659595, 0.21263900587151036, 0.01933081871559185,
  0.35758433938387796, 0.7151686787677559, 0.11919477979462599,
  0.1804807884018343, 0.07219231536073371, 0.9505321522496606,
]

const XYZ_TO_SRGB: Mat3 = [
  3.2409699419045213, -0.9692436362808798, 0.05563007969699361,
  -1.5373831775700935, 1.8759675015077206, -0.20397695888897657,
  -0.4986107602930033, 0.04155505740717561, 1.0569715142428786,
]

// Display-P3 → XYZ-D65 (linear-light P3 in)
const P3_TO_XYZ: Mat3 = [
  0.48657094864821626, 0.22897456406974884, 0.0, 0.26566769316909294,
  0.6917385218365062, 0.045113381858902575, 0.1982172852343625,
  0.079286914093745, 1.0439443689009757,
]

const XYZ_TO_P3: Mat3 = [
  2.4934969119414245, -0.829488969561575, 0.035845830243784335,
  -0.9313836179191236, 1.7626640603183468, -0.07617238926804171,
  -0.40271078445071684, 0.02362468584194359, 0.9568845240076873,
]

// XYZ-D65 ↔ OKLab via LMS (cube root)
const XYZ_TO_LMS: Mat3 = [
  0.8190224432164319, 0.0329836671980271, 0.048177199566046255,
  0.3619062562801221, 0.9292868468965546, 0.26423952494422764,
  -0.12887378261216414, 0.03614466816999844, 0.6335478258136937,
]

const LMS_TO_OKLAB: Mat3 = [
  0.2104542553, 1.9779984951, 0.0259040371, 0.793617785, -2.428592205,
  0.7827717662, -0.0040720468, 0.4505937099, -0.808675766,
]

const OKLAB_TO_LMS: Mat3 = [
  0.9999999984505198, 1.000000008881761, 1.000000054672411, 0.39633779217376786,
  -0.10556134232365635, -0.08948418209496575, 0.2158037580607588,
  -0.0638541747717059, -1.2914855378640917,
]

const LMS_TO_XYZ: Mat3 = [
  1.2268798733741557, -0.04057576262431372, -0.07637294974672142,
  -0.5578149965554813, 1.1122868293970594, -0.4214933239627914,
  0.28139105017721583, -0.07171106666151701, 1.5869240244272418,
]

// ---------- ColorSpace → XYZ-D65 (returns linear/XYZ tristim) ----------

function toXyzD65(c: Color): Components {
  switch (c.space) {
    case 'srgb':
      return multiply(srgbToLinear(c.components), SRGB_TO_XYZ)
    case 'srgb-linear':
      return multiply(c.components, SRGB_TO_XYZ)
    case 'hsl': {
      const rgb = hslToSrgb(c.components)
      return multiply(srgbToLinear(rgb), SRGB_TO_XYZ)
    }
    case 'display-p3':
      return multiply(p3ToLinear(c.components), P3_TO_XYZ)
    case 'display-p3-linear':
      return multiply(c.components, P3_TO_XYZ)
    case 'oklab': {
      const lms = multiply(c.components, OKLAB_TO_LMS)
      const cubed: Components = [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3]
      return multiply(cubed, LMS_TO_XYZ)
    }
    case 'oklch': {
      const lab = polarToOrthogonal(c.components)
      const lms = multiply(lab, OKLAB_TO_LMS)
      const cubed: Components = [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3]
      return multiply(cubed, LMS_TO_XYZ)
    }
    case 'xyz-d65':
      return c.components
  }
}

function fromXyzD65(space: ColorSpace, xyz: Components): Components {
  switch (space) {
    case 'srgb':
      return linearToSrgb(multiply(xyz, XYZ_TO_SRGB))
    case 'srgb-linear':
      return multiply(xyz, XYZ_TO_SRGB)
    case 'hsl': {
      const lin = multiply(xyz, XYZ_TO_SRGB)
      return srgbToHsl(linearToSrgb(lin))
    }
    case 'display-p3':
      return linearToP3(multiply(xyz, XYZ_TO_P3))
    case 'display-p3-linear':
      return multiply(xyz, XYZ_TO_P3)
    case 'oklab': {
      const lms = multiply(xyz, XYZ_TO_LMS)
      const cbrt: Components = [
        Math.cbrt(lms[0]),
        Math.cbrt(lms[1]),
        Math.cbrt(lms[2]),
      ]
      return multiply(cbrt, LMS_TO_OKLAB)
    }
    case 'oklch': {
      const lms = multiply(xyz, XYZ_TO_LMS)
      const cbrt: Components = [
        Math.cbrt(lms[0]),
        Math.cbrt(lms[1]),
        Math.cbrt(lms[2]),
      ]
      const lab = multiply(cbrt, LMS_TO_OKLAB)
      return orthogonalToPolar(lab, POLAR_EPSILON)
    }
    case 'xyz-d65':
      return xyz
  }
}

/** Convert a Color to a new color space, preserving alpha. */
export function convert(c: Color, target: ColorSpace): Color {
  if (c.space === target) return c

  // Closed-form fast paths. Going via XYZ for sRGB ↔ HSL introduces tiny
  // FP noise that can push a pure primary's hue from 0 to ~360 (because
  // `srgbToHsl` adds 360 when `g < b`, and the round-trip can produce
  // `b = 1e-7`). Use the closed-form converters where they exist.
  if (c.space === 'srgb' && target === 'hsl') {
    return makeColor('hsl', srgbToHsl(c.components), c.alpha)
  }
  if (c.space === 'hsl' && target === 'srgb') {
    return makeColor('srgb', hslToSrgb(c.components), c.alpha)
  }

  const xyz = toXyzD65(c)
  const out = fromXyzD65(target, xyz)
  return makeColor(target, out, c.alpha)
}
