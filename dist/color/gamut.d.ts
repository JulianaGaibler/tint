import type { Color, ColorSpace } from './types';
/** True if `color` fits in sRGB's [0, 1]^3 cube (in its sRGB representation). */
export declare function inSrgb(color: Color, eps?: number): boolean;
/** True if `color` fits in Display-P3's [0, 1]^3 cube. */
export declare function inP3(color: Color, eps?: number): boolean;
/** Clip components to [0, 1] in `target` space. Returns the clipped Color. */
export declare function clipTo(color: Color, target?: ColorSpace): Color;
/**
 * Maximum OKLCH chroma that stays in `target`'s gamut at the given L/H.
 *
 * The OKLCH gamut's chroma boundary depends on both L and H, so closed form
 * isn't available and we binary-search. Used by relative-chroma-lock to
 * translate between absolute chroma and a 0-100% relative chroma.
 */
export declare function maxChromaIn(l: number, h: number, target?: 'srgb' | 'display-p3'): number;
export declare const maxChromaInSrgb: (l: number, h: number) => number;
export declare const maxChromaInP3: (l: number, h: number) => number;
