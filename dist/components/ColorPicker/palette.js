// Palette grouping, canonical matching, and search filtering helpers for the
// optional palette pane in ColorPicker. Kept pure (no Svelte, no DOM) so the
// logic can be unit-tested and so the popover bundle only pulls in what it
// renders.
import { parseColor, ColorParseError } from '../../color';
import { toHex } from '../../color/serialize';
/**
 * Split a palette into groups by the prefix-before-the-final-slash. Groups are
 * emitted in first-seen order so the caller controls display order via array
 * ordering. Items without a "/" land in the "" category.
 */
export function groupPalette(items) {
    const groups = new Map();
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const idx = item.name.lastIndexOf('/');
        const category = idx >= 0 ? item.name.slice(0, idx) : '';
        const leaf = idx >= 0 ? item.name.slice(idx + 1) : item.name;
        let list = groups.get(category);
        if (!list) {
            list = [];
            groups.set(category, list);
        }
        list.push({ leaf, item, index: i });
    }
    return Array.from(groups, ([category, entries]) => ({ category, entries }));
}
/**
 * Canonical form for matching: `#rrggbb` for opaque, `#rrggbbaa` for
 * translucent. Both palette tokens and the picker's current value go through
 * this exact function so `#ff0000` and `#ff0000ff` collapse to the same key,
 * while `#ff000080` stays distinct.
 *
 * Returns null when the input is unparseable so the caller can skip it instead
 * of throwing. `toHex` already drops a fully-opaque alpha, which is the
 * canonical form we want.
 */
export function canonicalize(css) {
    try {
        return toHex(parseColor(css)).toLowerCase();
    }
    catch (e) {
        if (e instanceof ColorParseError)
            return null;
        throw e;
    }
}
/**
 * Build a `canonical → palette index` map once per palette change. Multiple
 * tokens with the same canonical form (e.g. two aliases) collapse to the first
 * occurrence — designers see the row that comes first in the array.
 */
export function normalizePalette(items) {
    const map = new Map();
    for (let i = 0; i < items.length; i++) {
        const k = canonicalize(items[i].value);
        if (k && !map.has(k))
            map.set(k, i);
    }
    return map;
}
/**
 * Look up the palette entry matching a CSS color string. Returns null when no
 * entry matches or when the input can't be parsed.
 */
export function findPaletteMatch(items, normalized, currentCss) {
    const key = canonicalize(currentCss);
    if (!key)
        return null;
    const idx = normalized.get(key);
    if (idx === undefined)
        return null;
    return { index: idx, item: items[idx] };
}
/**
 * Filter grouped palette entries by a case-insensitive token match against each
 * entry's full name. The query is split on whitespace into tokens and every
 * token must appear as a substring of the name — so "yellow 30" matches
 * "color/yellow/30" (slash acts as a word separator from the user's POV).
 * Empty/whitespace queries pass everything through unchanged.
 */
export function filterPalette(groups, query) {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0)
        return groups;
    const out = [];
    for (const g of groups) {
        const kept = [];
        for (const e of g.entries) {
            const name = e.item.name.toLowerCase();
            if (tokens.every((t) => name.includes(t)))
                kept.push(e);
        }
        if (kept.length > 0)
            out.push({ category: g.category, entries: kept });
    }
    return out;
}
/**
 * Flatten visible groups into a row-ordered array. The PalettePicker uses this
 * to map a single `focusedIndex` to a specific entry for keyboard nav and
 * scroll-to-current. Section headers are not in the flat list — they're not
 * focusable.
 */
export function flattenGroups(groups) {
    const out = [];
    for (const g of groups)
        for (const e of g.entries)
            out.push(e);
    return out;
}
