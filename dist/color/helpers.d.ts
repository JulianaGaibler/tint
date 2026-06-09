import type { Color } from './types';
import { type ContrastResult } from './contrast';
import type { RgbValue, HslValue, OklchValue, OklabValue, P3Value } from './values';
/**
 * SRGB with `r`/`g`/`b` in 0-255 (matches the CSS `rgb()` form). Throws
 * `ColorParseError` on unparseable strings.
 */
export declare function toRgb(input: string | Color): RgbValue;
/** HSL with h ∈ [0, 360), s/l ∈ [0, 100]. */
export declare function toHsl(input: string | Color): HslValue;
/**
 * OKLCH with l ∈ [0, 1], c ≥ 0 (sRGB peaks at ~0.32-0.36 depending on hue, P3
 * reaches ~0.45), h ∈ [0, 360).
 */
export declare function toOklch(input: string | Color): OklchValue;
/** OKLab with l ∈ [0, 1], a/b ∈ approximately [-0.4, 0.4]. */
export declare function toOklab(input: string | Color): OklabValue;
/**
 * Display-P3 with r/g/b in 0-1 (matching the CSS `color(display-p3 …)`
 * notation, NOT the 0-255 convention).
 */
export declare function toP3(input: string | Color): P3Value;
export interface ColorContrastOptions {
    /**
     * Required when either input has alpha < 1: WCAG 2 is defined only for opaque
     * colors, so both inputs are α-composited over this backdrop first. Without
     * it, the result's `ratio` is `null`.
     */
    backdrop?: string | Color;
}
/**
 * WCAG 2 contrast ratio between two colors. Argument order doesn't affect the
 * ratio. The math is symmetric.
 *
 * Wide-gamut inputs are per-channel-clipped to sRGB first (WCAG 2 is defined
 * for sRGB only). `clipped` reports when that happened.
 */
export declare function colorContrast(color: string | Color, against: string | Color, opts?: ColorContrastOptions): ContrastResult;
