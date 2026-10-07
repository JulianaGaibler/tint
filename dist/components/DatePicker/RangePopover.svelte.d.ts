import type { DateFormatPreferences } from './prefs.js';
import type { DateParts } from './format.js';
interface DayParts {
    year: number;
    month: number;
    day: number;
}
interface Props {
    start: DayParts | null;
    end: DayParts | null;
    /** Which end a calendar click fills next. */
    activeEnd: 'start' | 'end';
    prefs: DateFormatPreferences;
    locale?: string;
    weekStartsOn: number;
    minParts?: DateParts;
    maxParts?: DateParts;
    isDateDisabled?: (date: Date) => boolean;
    showSettings: boolean;
    anchorEl: HTMLElement;
    onclose: () => void;
    onpick: (day: DayParts) => void;
}
declare const RangePopover: import("svelte").Component<Props, {}, "">;
type RangePopover = ReturnType<typeof RangePopover>;
export default RangePopover;
