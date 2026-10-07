interface Props {
    hour: number | null;
    minute: number | null;
    second: number | null;
    hourCycle: 12 | 24;
    seconds: boolean;
    /**
     * Spacing between listed minutes and seconds. Default 1, every minute. The
     * field's own segments always accept any value regardless; this only limits
     * what the list offers, for a caller content with coarser steps such as
     * 15.
     */
    minuteStep?: number;
    locale?: string;
    onPickHour: (hour: number) => void;
    onPickMinute: (minute: number) => void;
    onPickSecond: (second: number) => void;
}
declare const TimeList: import("svelte").Component<Props, {}, "">;
type TimeList = ReturnType<typeof TimeList>;
export default TimeList;
