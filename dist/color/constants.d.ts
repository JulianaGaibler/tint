/**
 * The OKLCH chroma value the picker uses as the X-axis maximum on its 2D chart.
 * sRGB's gamut peaks around 0.32-0.36 depending on hue, while Display-P3
 * reaches ~0.45. 0.37 is the common "shows just past sRGB on every hue" choice
 * (matches the oklch.com picker).
 *
 * Shared between Canvas.svelte's pixel paint and curves.ts's SVG sampling so
 * the two coordinate spaces never drift apart.
 */
export declare const CHROMA_MAX = 0.37;
