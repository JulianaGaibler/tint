// Locale derived defaults for date order and clock, and parsing for the stored
// override. Kept pure (no Svelte, no DOM) so the logic can be unit tested
// independently of the store that persists it.
const ORDER_KEYS = {
    day: 'DMY',
    month: 'MDY',
    year: 'YMD',
};
/**
 * Reads date order and clock from `Intl`, without consulting any stored
 * preference.
 *
 * Order comes from the position of `formatToParts`' first numeric part. `Intl`
 * only reports the three orders above: it never puts the year in the middle.
 * Clock comes from `resolvedOptions().hour12`, which answers from the locale's
 * default even though no `hour12` option was requested.
 */
export function localeDefaults(locale) {
    const formatter = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });
    const firstNumeric = formatter
        .formatToParts(new Date(2000, 0, 2))
        .find((part) => part.type in ORDER_KEYS);
    const dateOrder = firstNumeric ? ORDER_KEYS[firstNumeric.type] : 'YMD';
    const hour12 = new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
    }).resolvedOptions().hour12;
    const hourCycle = hour12 ? 12 : 24;
    return { dateOrder, hourCycle, separator: 'auto' };
}
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
export function localeSeparator(locale, order) {
    if (order === 'YMD')
        return '-';
    const parts = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    }).formatToParts(new Date(2000, 0, 2));
    const firstNumeric = parts.findIndex((part) => part.type in ORDER_KEYS);
    const literal = parts[firstNumeric + 1];
    const cleaned = literal === null || literal === void 0 ? void 0 : literal.value.replace(/[\s‎‏؜]/g, '');
    return cleaned && cleaned.length <= 2 ? cleaned : '/';
}
/**
 * The separator actually used: `pref` itself when the user chose one, or
 * `localeSeparator`'s own guess under `'auto'`.
 *
 * An explicit `'-'` or `'.'` applies even under `YMD`, unlike the auto case,
 * since choosing a separator by hand is a deliberate override of the ISO-ish
 * default `localeSeparator` falls back to for that order, not an accident of
 * locale data to guard against.
 */
export function resolveSeparator(locale, order, pref) {
    return pref === 'auto' ? localeSeparator(locale, order) : pref;
}
/**
 * Parses a stored preference, rejecting anything that is not the exact shape
 * expected.
 *
 * Storage can hold whatever a past version wrote, a hand edit, or nothing at
 * all, so every field is checked rather than trusted. An unparseable or
 * partially invalid value answers with an empty object instead of throwing,
 * which leaves `localeDefaults` to fill the gap.
 */
export function parsePreferences(raw) {
    if (!raw)
        return {};
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (_a) {
        return {};
    }
    if (typeof parsed !== 'object' || parsed === null)
        return {};
    const { dateOrder, hourCycle, separator } = parsed;
    const result = {};
    if (dateOrder === 'DMY' || dateOrder === 'MDY' || dateOrder === 'YMD') {
        result.dateOrder = dateOrder;
    }
    if (hourCycle === 12 || hourCycle === 24) {
        result.hourCycle = hourCycle;
    }
    if (separator === 'auto' ||
        separator === '/' ||
        separator === '-' ||
        separator === '.') {
        result.separator = separator;
    }
    return result;
}
