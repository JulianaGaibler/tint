// Output-format types for the ColorPicker.
//
// The `format` prop drives the type of `value` through `ValueFor<F>`:
// `format='hex'` → `value: string`, `format='oklch'` → `value: OklchValue`,
// and so on. The value-object types are re-exported from `@lib/color` so
// the ColorPicker's public API doesn't force consumers to import from two
// entry points.

import type { Color } from '@lib/color'
export type {
  RgbValue,
  HslValue,
  OklchValue,
  OklabValue,
  P3Value,
} from '@lib/color'
import type {
  RgbValue,
  HslValue,
  OklchValue,
  OklabValue,
  P3Value,
} from '@lib/color'

export type ColorFormat =
  | 'hex' // string '#rrggbb' or '#rrggbbaa'
  | 'css' // any CSS color function the picker emitted
  | 'rgb' // { r: 0-255, g: 0-255, b: 0-255, alpha: 0-1 }
  | 'hsl' // { h: 0-360, s: 0-100, l: 0-100, alpha: 0-1 }
  | 'oklch' // { l: 0-1, c: 0-~0.4, h: 0-360, alpha: 0-1 }
  | 'oklab' // { l: 0-1, a: -0.4-0.4, b: -0.4-0.4, alpha: 0-1 }
  | 'p3' // { r: 0-1, g: 0-1, b: 0-1, alpha: 0-1 } (Display-P3)
  | 'color' // full Color object

export type ValueFor<F extends ColorFormat> = F extends 'hex'
  ? string
  : F extends 'css'
    ? string
    : F extends 'rgb'
      ? RgbValue
      : F extends 'hsl'
        ? HslValue
        : F extends 'oklch'
          ? OklchValue
          : F extends 'oklab'
            ? OklabValue
            : F extends 'p3'
              ? P3Value
              : F extends 'color'
                ? Color
                : never

export type ContrastCategory = 'body' | 'large' | 'ui'

export interface ContrastOptions {
  /** The counterpart CSS color string to check against. */
  against: string
  /** Whether the picked color is foreground or background. Default 'foreground'. */
  role?: 'foreground' | 'background'
  /** Opaque CSS color to α-blend against when picked has alpha < 1. */
  backdrop?: string
  /**
   * Initial WCAG 2 category used by the contrast row's tune menu. body: body
   * text (AA ≥ 4.5, AAA ≥ 7) large: large text (AA ≥ 3, AAA ≥ 4.5) ui: UI
   * components / non-text (≥ 3) Default 'body'.
   */
  category?: ContrastCategory
}

export type WideGamutMode = 'auto' | 'srgb' | 'p3'
