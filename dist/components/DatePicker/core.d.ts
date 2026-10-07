import type { DateMode, DateParts, DateValueFor, DateValueFormat } from './format.js';
/**
 * The first instant of the local calendar day `year`-`month`-`day`.
 *
 * Not necessarily midnight. A day on which DST starts at midnight, as it did in
 * Brazil before 2019, has no 00:00: the clock goes straight from 23:59 to
 * 01:00. The day number is still correct for whatever instant the engine
 * resolves the wall clock fields to, so that instant, rather than an asserted
 * midnight, is what a `date` mode value means.
 */
export declare function firstInstantOfLocalDay(year: number, month: number, day: number): Date;
/**
 * Parses a `value` of the given `format` into `DateParts`, or `null` when the
 * value represents no date at all.
 *
 * Throws on a string that does not match the ISO shape `mode` expects: that is
 * a caller passing a malformed value, not a user clearing the field, which
 * always comes through as `null` or `''`.
 */
export declare function valueToParts<F extends DateValueFormat>(mode: DateMode, format: F, value: DateValueFor<F> | null | undefined): DateParts | null;
/**
 * Serializes `DateParts` into a `value` of the given `format`.
 *
 * `opts.seconds` controls whether an `'iso'` output carries a `:ss` segment. It
 * has no effect on `'date'` or `'timestamp'`, which always carry full
 * precision.
 */
export declare function partsToValue<F extends DateValueFormat>(mode: DateMode, format: F, parts: DateParts, opts?: {
    seconds?: boolean;
}): DateValueFor<F>;
