import type { Color, ColorSpace, Components } from './types';
export declare function normalizeHue(hue: number): number;
export declare function hslToSrgb([h, s, l]: Components): Components;
export declare function srgbToHsl([r, g, b]: Components): Components;
export declare function orthogonalToPolar([l, a, b]: Components, eps?: number): Components;
export declare function polarToOrthogonal([l, c, h]: Components): Components;
export declare function srgbToLinear(c: Components): Components;
export declare function linearToSrgb(c: Components): Components;
export declare const p3ToLinear: typeof srgbToLinear;
export declare const linearToP3: typeof linearToSrgb;
/** Convert a Color to a new color space, preserving alpha. */
export declare function convert(c: Color, target: ColorSpace): Color;
