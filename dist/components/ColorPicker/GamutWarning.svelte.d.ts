interface Props {
    /** Human-readable name of the output gamut, e.g. "sRGB" or "Display-P3". */
    gamut: string;
    /** The clipped CSS string we'd emit if the user accepts the clip. */
    clippedCss: string;
    /** Apply the clipped value. */
    onClip: () => void;
}
declare const GamutWarning: import("svelte").Component<Props, {}, "">;
type GamutWarning = ReturnType<typeof GamutWarning>;
export default GamutWarning;
