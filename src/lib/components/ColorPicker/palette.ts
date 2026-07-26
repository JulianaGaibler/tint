// Palette grouping, canonical matching, and search filtering helpers for the
// optional palette pane in ColorPicker. Kept pure (no Svelte, no DOM) so the
// logic can be unit-tested and so the popover bundle only pulls in what it
// renders.

import { parseColor, ColorParseError } from '@lib/color'
import { toHex } from '@lib/color/serialize'

export interface PaletteColor {
  /**
   * Slash-separated name. The final segment is the leaf shown in the row;
   * everything before is the category path used as a group header. Examples:
   * "color/red/70" → header "color/red", leaf "70". "accent" with no "/" →
   * headerless group, leaf "accent".
   */
  name: string
  /** Any CSS color string the engine can parse. Normalized for matching. */
  value: string
}

export interface PaletteEntry {
  /** The leaf segment of `item.name`. */
  leaf: string
  /** The original palette item. */
  item: PaletteColor
  /** Index into the original `palette` array — stable across filters. */
  index: number
}

export interface PaletteGroup {
  /** Category path (everything before the final `/`). "" for ungrouped. */
  category: string
  entries: PaletteEntry[]
}

/**
 * Split a palette into groups by the prefix-before-the-final-slash. Groups are
 * emitted in first-seen order so the caller controls display order via array
 * ordering. Items without a "/" land in the "" category.
 */
export function groupPalette(items: PaletteColor[]): PaletteGroup[] {
  const groups = new Map<string, PaletteEntry[]>()
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const idx = item.name.lastIndexOf('/')
    const category = idx >= 0 ? item.name.slice(0, idx) : ''
    const leaf = idx >= 0 ? item.name.slice(idx + 1) : item.name
    let list = groups.get(category)
    if (!list) {
      list = []
      groups.set(category, list)
    }
    list.push({ leaf, item, index: i })
  }
  return Array.from(groups, ([category, entries]) => ({ category, entries }))
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
export function canonicalize(css: string): string | null {
  try {
    return toHex(parseColor(css)).toLowerCase()
  } catch (e) {
    if (e instanceof ColorParseError) return null
    throw e
  }
}

/**
 * Build a `canonical → palette index` map once per palette change. Multiple
 * tokens with the same canonical form (e.g. two aliases) collapse to the first
 * occurrence — designers see the row that comes first in the array.
 */
export function normalizePalette(items: PaletteColor[]): Map<string, number> {
  const map = new Map<string, number>()
  for (let i = 0; i < items.length; i++) {
    const k = canonicalize(items[i].value)
    if (k && !map.has(k)) map.set(k, i)
  }
  return map
}

/**
 * Look up the palette entry matching a CSS color string. Returns null when no
 * entry matches or when the input can't be parsed.
 */
export function findPaletteMatch(
  items: PaletteColor[],
  normalized: Map<string, number>,
  currentCss: string,
): { index: number; item: PaletteColor } | null {
  const key = canonicalize(currentCss)
  if (!key) return null
  const idx = normalized.get(key)
  if (idx === undefined) return null
  return { index: idx, item: items[idx] }
}

/**
 * Filter grouped palette entries by a case-insensitive token match against each
 * entry's full name. The query is split on whitespace into tokens and every
 * token must appear as a substring of the name — so "yellow 30" matches
 * "color/yellow/30" (slash acts as a word separator from the user's POV).
 * Empty/whitespace queries pass everything through unchanged.
 */
export function filterPalette(
  groups: PaletteGroup[],
  query: string,
): PaletteGroup[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return groups
  const out: PaletteGroup[] = []
  for (const g of groups) {
    const kept: PaletteEntry[] = []
    for (const e of g.entries) {
      const name = e.item.name.toLowerCase()
      if (tokens.every((t) => name.includes(t))) kept.push(e)
    }
    if (kept.length > 0) out.push({ category: g.category, entries: kept })
  }
  return out
}

/**
 * Flatten visible groups into a row-ordered array. The PalettePicker uses this
 * to map a single `focusedIndex` to a specific entry for keyboard nav and
 * scroll-to-current. Section headers are not in the flat list — they're not
 * focusable.
 */
export function flattenGroups(groups: PaletteGroup[]): PaletteEntry[] {
  const out: PaletteEntry[] = []
  for (const g of groups) for (const e of g.entries) out.push(e)
  return out
}
