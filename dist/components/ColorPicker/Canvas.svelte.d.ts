import type { EditorSpace } from './core';
import type { ChartCurve } from './curves';
interface Props {
    /** Which color model the canvas represents. */
    editor: EditorSpace;
    /** Hue (0-360) for HSL / OKLCH editor. Ignored for RGB. */
    hue: number;
    /** Selected X position in [0, 1]. */
    x: number;
    /** Selected Y position in [0, 1]. */
    y: number;
    /** Maximum chroma to display on the OKLCH chart's X axis. */
    chromaMax?: number;
    /** Whether to render the canvas using Display-P3 CSS for wide-gamut. */
    wideGamut?: boolean;
    /** Curves drawn over the canvas. Pass `undefined` or `[]` to hide. */
    curves?: ChartCurve[];
    /** Callback when the user drags / clicks. */
    onPick: (x: number, y: number) => void;
}
declare const Canvas: import("svelte").Component<Props, {}, "x" | "y">;
type Canvas = ReturnType<typeof Canvas>;
export default Canvas;
