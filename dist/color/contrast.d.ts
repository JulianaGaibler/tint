import type { Color } from './types';
export type WcagLevel = 'AA' | 'AAA' | 'fail';
export interface ContrastResult {
    /** Ratio in [1, 21] or null if alpha < 1 and no backdrop was supplied. */
    ratio: number | null;
    /** True iff the _input_ color was clipped to sRGB before computing. */
    clipped: boolean;
    /** Best WCAG level passed for normal-size text (>= 4.5 = AA, >= 7 = AAA). */
    normalText: WcagLevel;
    /** Best WCAG level passed for large text (>= 3 = AA, >= 4.5 = AAA). */
    largeText: WcagLevel;
    /** UI components (icons, focus indicators), pass at >= 3. */
    uiComponents: WcagLevel;
    /** Set when ratio is null. */
    reason?: 'alpha-without-backdrop';
}
/** Source-over compositing: `top` over `bottom`. Returns an opaque sRGB color. */
export declare function alphaComposite(top: Color, bottom: Color): Color;
/** Compute WCAG 2 relative luminance from an sRGB-clipped color. */
export declare function relativeLuminance(color: Color): number;
interface ContrastInput {
    /** Picked color. */
    color: Color;
    /** Counterpart for contrast comparison. */
    against: Color;
    /** Required when either color has alpha < 1. */
    backdrop?: Color;
}
/**
 * Compute the WCAG 2 contrast ratio between two colors.
 *
 * If either input has alpha < 1 and no `backdrop` is provided, returns `ratio:
 * null` because WCAG 2 is undefined for translucent colors.
 */
export declare function contrast({ color, against, backdrop, }: ContrastInput): ContrastResult;
export {};
