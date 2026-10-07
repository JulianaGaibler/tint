import type { DateParts } from './format.js';
interface DayParts {
    year: number;
    month: number;
    day: number;
}
interface Props {
    /** The displayed month's year. */
    year: number;
    /** The displayed month, 1-12. */
    month: number;
    selected: DayParts | null;
    /**
     * For a range selection: the other, already picked end, so the span between
     * it and `selected` can be shaded. `undefined` for a single date field,
     * which never shades a range.
     */
    rangeOther?: DayParts | null;
    weekStartsOn: number;
    locale?: string;
    minParts?: DateParts;
    maxParts?: DateParts;
    isDateDisabled?: (date: Date) => boolean;
    /** Fires when keyboard navigation moves focus into a different month. */
    onNavigate: (year: number, month: number) => void;
    onPick: (day: DayParts) => void;
}
declare const Calendar: import("svelte").Component<Props, {}, "">;
type Calendar = ReturnType<typeof Calendar>;
export default Calendar;
