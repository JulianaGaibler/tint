// String-in / object-out helpers that wrap `parseColor` + `convert` +
// `contrast`. They exist so callers that don't need the `Color` type
// can skip parsing it themselves.
import { parseColor } from './parse';
import { convert } from './convert';
import { contrast as wcagContrast } from './contrast';
function asColor(input) {
    return typeof input === 'string' ? parseColor(input) : input;
}
/**
 * SRGB with `r`/`g`/`b` in 0-255 (matches the CSS `rgb()` form). Throws
 * `ColorParseError` on unparseable strings.
 */
export function toRgb(input) {
    const c = convert(asColor(input), 'srgb');
    return {
        r: c.components[0] * 255,
        g: c.components[1] * 255,
        b: c.components[2] * 255,
        alpha: c.alpha,
    };
}
/** HSL with h ∈ [0, 360), s/l ∈ [0, 100]. */
export function toHsl(input) {
    const c = convert(asColor(input), 'hsl');
    return {
        h: c.components[0],
        s: c.components[1],
        l: c.components[2],
        alpha: c.alpha,
    };
}
/**
 * OKLCH with l ∈ [0, 1], c ≥ 0 (sRGB peaks at ~0.32-0.36 depending on hue, P3
 * reaches ~0.45), h ∈ [0, 360).
 */
export function toOklch(input) {
    const c = convert(asColor(input), 'oklch');
    return {
        l: c.components[0],
        c: c.components[1],
        h: c.components[2],
        alpha: c.alpha,
    };
}
/** OKLab with l ∈ [0, 1], a/b ∈ approximately [-0.4, 0.4]. */
export function toOklab(input) {
    const c = convert(asColor(input), 'oklab');
    return {
        l: c.components[0],
        a: c.components[1],
        b: c.components[2],
        alpha: c.alpha,
    };
}
/**
 * Display-P3 with r/g/b in 0-1 (matching the CSS `color(display-p3 …)`
 * notation, NOT the 0-255 convention).
 */
export function toP3(input) {
    const c = convert(asColor(input), 'display-p3');
    return {
        r: c.components[0],
        g: c.components[1],
        b: c.components[2],
        alpha: c.alpha,
    };
}
/**
 * WCAG 2 contrast ratio between two colors. Argument order doesn't affect the
 * ratio. The math is symmetric.
 *
 * Wide-gamut inputs are per-channel-clipped to sRGB first (WCAG 2 is defined
 * for sRGB only). `clipped` reports when that happened.
 */
export function colorContrast(color, against, opts = {}) {
    return wcagContrast({
        color: asColor(color),
        against: asColor(against),
        backdrop: opts.backdrop ? asColor(opts.backdrop) : undefined,
    });
}
