/** Which parts of a date the picker shows and lets the user set. */
export type DateMode = 'date' | 'datetime' | 'time';
export type DateValueFormat = 'iso' | 'date' | 'timestamp';
/**
 * The type `value` takes for a given `format`.
 *
 * `'iso'` is a local wall clock string with no timezone suffix, matching what a
 * native date input produces. `'date'` is a `Date` at the first existing
 * instant of the local day for `date` and `datetime` mode, or today's date
 * carrying the time for `time` mode. `'timestamp'` is milliseconds since the
 * epoch for `date` and `datetime` mode, or milliseconds since local midnight
 * for `time` mode.
 */
export type DateValueFor<F extends DateValueFormat> = F extends 'iso' ? string : F extends 'date' ? Date : number;
export interface DateRangeValue<F extends DateValueFormat> {
    start: DateValueFor<F> | null;
    end: DateValueFor<F> | null;
}
/**
 * The wall clock fields a DatePicker works with internally, independent of
 * `format`. `month` is 1 indexed to match the calendar a person reads, not
 * `Date`'s 0 indexed month.
 */
export interface DateParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}
