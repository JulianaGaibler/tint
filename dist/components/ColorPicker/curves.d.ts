export type CurveStyle = 'boundary' | 'iso' | 'contrast';
export interface ChartCurve {
    /** Stable key for `{#each}`. Also used as the legend entry id. */
    id: string;
    /** SVG `d` in the canvas's 100×100 viewBox coordinates. */
    d: string;
    /** Stroke style. Canvas maps this to a stroke recipe. */
    style: CurveStyle;
    /**
     * Optional legend label. Curves with no label still render but are not listed
     * in the legend.
     */
    label?: string;
}
/**
 * Samples per curve. Dense enough that, at a typical ~250px displayed canvas on
 * a 2× Retina screen (~500 device pixels wide), each segment spans ≲ 1 device
 * pixel, so the polyline reads as a smooth curve. The caching layer makes the
 * density essentially free per repaint.
 */
export declare const N_SAMPLES = 192;
/**
 * Hue × gamut: ~720 combinations at our 0.5° bucketing. 50 covers smooth
 * scrubbing without unbounded growth.
 */
export declare const BOUNDARY_CAP = 50;
/**
 * Hue × pct × gamut: ~144k combinations. 150 survives rapid scrub
 * back-and-forth on both axes without thrashing.
 */
export declare const ISO_CAP = 150;
/**
 * The sRGB or Display-P3 gamut boundary in the OKLCH plane at the given hue:
 * for each lightness, the maximum chroma that still fits in the target gamut.
 */
export declare function sampleGamutBoundary(hue: number, gamut?: 'srgb' | 'display-p3'): ChartCurve;
/**
 * The iso-chroma curve for a given relative chroma percentage: the path the
 * cursor will trace when L or H change while the relative-chroma lock is
 * engaged.
 */
export declare function sampleRelativeChromaCurve(hue: number, pct: number, gamut?: 'srgb' | 'display-p3'): ChartCurve;
export type ContrastCurveSpace = 'oklch' | 'hsl';
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
export declare function sampleContrastCurve(hue: number, againstHex: string, targetRatio: number, space?: ContrastCurveSpace, gamut?: 'srgb' | 'display-p3'): ChartCurve | null;
/** Test-only: drop all cached SVG paths. */
export declare function _resetCachesForTests(): void;
/** Test-only: read cache sizes. */
export declare function _cacheSizesForTests(): {
    boundary: number;
    iso: number;
    contrast: number;
};
