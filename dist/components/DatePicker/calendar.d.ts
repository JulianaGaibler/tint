import type { DateParts } from './format.js';
/** One cell in a month grid. */
export interface CalendarDay {
    year: number;
    month: number;
    day: number;
    /** True for a day that belongs to the adjacent month, shown to fill the grid. */
    outside: boolean;
}
export declare function daysInMonth(year: number, month: number): number;
/** `month` shifted by `delta`, wrapping the year. */
export declare function addMonths(year: number, month: number, delta: number): {
    year: number;
    month: number;
};
export declare function sameDay(a: Pick<DateParts, 'year' | 'month' | 'day'>, b: Pick<DateParts, 'year' | 'month' | 'day'>): boolean;
export interface DateRangeOptions {
    min?: DateParts;
    max?: DateParts;
}
/** `parts`, moved onto `min` or `max` when it falls outside that range. */
export declare function clampToRange(parts: DateParts, { min, max }: DateRangeOptions): DateParts;
export interface DateDisabledOptions extends DateRangeOptions {
    isDateDisabled?: (date: Date) => boolean;
}
/** Whether `parts` falls outside `min`/`max` or is rejected by `isDateDisabled`. */
export declare function isDisabled(parts: DateParts, { min, max, isDateDisabled }: DateDisabledOptions): boolean;
/**
 * The first day of the week for `locale`, as a JS `Date#getDay()` index (0 for
 * Sunday).
 *
 * `Intl.Locale#getWeekInfo` reports it Unicode style, 1 for Monday through 7
 * for Sunday, which `% 7` converts: Monday through Saturday map to themselves,
 * and Sunday's 7 maps to 0. The method is missing on some engines, and some
 * engines throw on a locale string they do not recognize, so either falls back
 * to Monday rather than guessing.
 *
 * `Intl.Locale`, unlike `Intl.DateTimeFormat`, has no notion of "the runtime's
 * own locale" and requires an explicit tag. Resolving through
 * `Intl.DateTimeFormat` first is what lets `locale` stay optional here too.
 */
export declare function weekStartFromLocale(locale?: string): number;
/**
 * The 6×7 grid a month view displays, including the leading and trailing days
 * of the adjacent months that fill the first and last week.
 */
export declare function monthGrid(year: number, month: number, weekStartsOn: number): CalendarDay[][];
