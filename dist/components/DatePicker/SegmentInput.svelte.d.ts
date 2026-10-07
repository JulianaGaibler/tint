import { type Segment } from './segments.js';
export interface SegmentLabels {
    day?: string;
    month?: string;
    year?: string;
    hour?: string;
    minute?: string;
    second?: string;
    dayPeriod?: string;
    am?: string;
    pm?: string;
}
interface Props {
    /** The segment list. Mutated in place as the user types, steps, or pastes. */
    segments: Segment[];
    /** Resolves a month's full name for the spoken announcement. */
    locale?: string;
    /** Overrides for the English segment names and AM/PM strings. */
    labels?: SegmentLabels;
    disabled?: boolean;
    /** Exactly one of this and `aria-label` is required. */
    'aria-labelledby'?: string;
    /**
     * The input's accessible name directly, for a second input in the same
     * field (a date range's end, or a datetime field's time half) where a
     * single shared label id cannot tell the two apart.
     */
    'aria-label'?: string;
    'aria-describedby'?: string;
    /**
     * Fires when focus enters or leaves the input. The owner uses this to stop
     * resyncing `segments` from an external value while the user is mid-edit,
     * the same reason ColorPicker's popover decides its tab once at mount
     * rather than from a continuously updating value.
     */
    onFocusChange?: (focused: boolean) => void;
    class?: string;
}
declare const SegmentInput: import("svelte").Component<Props, {}, "segments">;
type SegmentInput = ReturnType<typeof SegmentInput>;
export default SegmentInput;
