interface Props {
    /** Current value in [min, max]. */
    value: number;
    /** Inclusive minimum. */
    min: number;
    /** Inclusive maximum. */
    max: number;
    /** Step for arrow keys. Defaults to (max-min)/100. */
    step?: number;
    /** CSS background for the gradient track. */
    background: string;
    /** Whether to show a checker underlay (for alpha tracks). */
    checker?: boolean;
    /** Small variant (matches Slider's `small`). Default true. */
    small?: boolean;
    /** Accessible label. */
    'aria-label': string;
    /** Called continuously while dragging. */
    onChange: (value: number) => void;
}
declare const Track: import("svelte").Component<Props, {}, "">;
type Track = ReturnType<typeof Track>;
export default Track;
