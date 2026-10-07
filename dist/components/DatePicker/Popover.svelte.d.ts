import type { DateFormatPreferences } from './prefs.js';
import type { DateMode, DateParts } from './format.js';
interface Props {
    mode: DateMode;
    /** The field's current value, or `null` while it is incomplete. */
    parts: DateParts | null;
    prefs: DateFormatPreferences;
    locale?: string;
    weekStartsOn: number;
    seconds: boolean;
    /** Spacing between listed minutes and seconds. Default 1, every minute. */
    minuteStep?: number;
    minParts?: DateParts;
    maxParts?: DateParts;
    isDateDisabled?: (date: Date) => boolean;
    /** Whether the settings icon button is shown at all. */
    showSettings: boolean;
    anchorEl: HTMLElement;
    onclose: () => void;
    /** The single place an edit made inside the popover reaches the field. */
    onpick: (parts: DateParts) => void;
}
declare const Popover: import("svelte").Component<Props, {}, "">;
type Popover = ReturnType<typeof Popover>;
export default Popover;
