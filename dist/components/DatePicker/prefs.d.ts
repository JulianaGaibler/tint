/** Where day, month, and year fall relative to each other. */
export type DateOrder = 'DMY' | 'MDY' | 'YMD';
/** The punctuation between date components. `'auto'` follows the locale. */
export type DateSeparator = 'auto' | '/' | '-' | '.';
export interface DateFormatPreferences {
    dateOrder: DateOrder;
    hourCycle: 12 | 24;
    separator: DateSeparator;
}
/**
 * Reads date order and clock from `Intl`, without consulting any stored
 * preference.
 *
 * Order comes from the position of `formatToParts`' first numeric part. `Intl`
 * only reports the three orders above: it never puts the year in the middle.
 * Clock comes from `resolvedOptions().hour12`, which answers from the locale's
 * default even though no `hour12` option was requested.
 */
export declare function localeDefaults(locale?: string): DateFormatPreferences;
/**
 * The literal a locale puts between date components, for example `.` in `de-DE`
 * or `/` in `en-US`.
 *
 * `YMD` always answers `-`: that order only reads as the date it is in ISO
 * form, so a locale separator would misrepresent it. Otherwise the literal
 * comes from the same `formatToParts` call `localeDefaults` uses, read between
 * the first two numeric parts and with surrounding whitespace and Unicode
 * directional marks stripped. A literal that remains empty or longer than two
 * characters falls back to `/`, since some locales format with a word rather
 * than a punctuation mark between components.
 */
export declare function localeSeparator(locale: string | undefined, order: DateOrder): string;
/**
 * The separator actually used: `pref` itself when the user chose one, or
 * `localeSeparator`'s own guess under `'auto'`.
 *
 * An explicit `'-'` or `'.'` applies even under `YMD`, unlike the auto case,
 * since choosing a separator by hand is a deliberate override of the ISO-ish
 * default `localeSeparator` falls back to for that order, not an accident of
 * locale data to guard against.
 */
export declare function resolveSeparator(locale: string | undefined, order: DateOrder, pref: DateSeparator): string;
/**
 * Parses a stored preference, rejecting anything that is not the exact shape
 * expected.
 *
 * Storage can hold whatever a past version wrote, a hand edit, or nothing at
 * all, so every field is checked rather than trusted. An unparseable or
 * partially invalid value answers with an empty object instead of throwing,
 * which leaves `localeDefaults` to fill the gap.
 */
export declare function parsePreferences(raw: string | null): Partial<DateFormatPreferences>;
