<script lang="ts" module>
  // Module-scoped counter for per-instance ids. Stable across the document,
  // doesn't depend on $props.id() (which only landed in Svelte 5.20 while
  // the package's peerDep is 5.16+).
  let nextPaletteUid = 0
</script>

<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import IconSearch from '../../icons/20-search.svg?raw'
  import {
    groupPalette,
    normalizePalette,
    findPaletteMatch,
    filterPalette,
    flattenGroups,
    type PaletteColor,
    type PaletteEntry,
  } from './palette'

  interface Props {
    palette: PaletteColor[]
    /** Current picker value as a CSS color string (already serialized). */
    currentCss: string
    /** Fires when the user commits a row (click or Enter). */
    onpick: (value: string) => void
  }

  let { palette, currentCss, onpick }: Props = $props()

  const uid = `p${++nextPaletteUid}`

  const groups = $derived(groupPalette(palette))
  const normalized = $derived(normalizePalette(palette))
  const match = $derived(findPaletteMatch(palette, normalized, currentCss))

  let query = $state('')
  const filtered = $derived(filterPalette(groups, query))
  const flat = $derived<PaletteEntry[]>(flattenGroups(filtered))

  let focusedIndex = $state(-1)
  let inputEl: HTMLInputElement | undefined = $state(undefined)
  // Indexed by the *stable* palette index (entry.index), not the flat
  // (visible-row) index — that way filtering doesn't leave stale slots that
  // we'd need to reset. bind:this cleans up to null automatically when a row
  // unmounts (e.g. filtered out by search).
  let optionElements: (HTMLDivElement | null)[] = $state([])

  // Reset focus to the top when the visible set changes. Without this,
  // typing into the search would leave focusedIndex pointing at a row that's
  // no longer in `flat`, so Enter would commit a different row or nothing.
  $effect(() => {
    void filtered // re-run when the filter result changes
    untrack(() => {
      focusedIndex = flat.length > 0 ? 0 : -1
    })
  })

  // Initial focus state: if the current color is a palette member, point at
  // it and scroll it into view. Run inside onMount so the row <div>s have
  // mounted and their bind:this has populated optionElements.
  onMount(() => {
    inputEl?.focus()
    if (match) {
      const i = flat.findIndex((e) => e.index === match.index)
      if (i >= 0) {
        focusedIndex = i
        const el = optionElements[match.index]
        if (el) el.scrollIntoView({ block: 'nearest' })
      }
    }
  })

  function commit(entry: PaletteEntry) {
    onpick(entry.item.value)
  }

  function setFocus(i: number) {
    if (i < 0 || i >= flat.length) return
    focusedIndex = i
    const entry = flat[i]
    optionElements[entry.index]?.scrollIntoView({ block: 'nearest' })
  }

  function onKeyDown(e: KeyboardEvent) {
    if (flat.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocus(
          focusedIndex < 0 ? 0 : Math.min(flat.length - 1, focusedIndex + 1),
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocus(focusedIndex <= 0 ? 0 : focusedIndex - 1)
        break
      case 'Home':
        e.preventDefault()
        setFocus(0)
        break
      case 'End':
        e.preventDefault()
        setFocus(flat.length - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0) commit(flat[focusedIndex])
        break
      // Escape falls through to the popover's existing close handler.
    }
  }

  function optionId(flatIdx: number): string {
    return `palette-${uid}-opt-${flatIdx}`
  }

  const ariaLabel = $derived(
    match
      ? `Search palette, current selection: ${match.item.name}`
      : 'Search palette',
  )

  const activeDescendant = $derived(
    focusedIndex >= 0 && focusedIndex < flat.length
      ? optionId(focusedIndex)
      : undefined,
  )

  const listboxId = `palette-${uid}-listbox`
</script>

<div class="palette">
  <div class="search-row">
    <span class="search-icon" aria-hidden="true">{@html IconSearch}</span>
    <input
      bind:this={inputEl}
      bind:value={query}
      type="text"
      role="combobox"
      class="search tint--type-input"
      placeholder="Search"
      autocomplete="off"
      spellcheck="false"
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-expanded="true"
      aria-activedescendant={activeDescendant}
      aria-label={ariaLabel}
      onkeydown={onKeyDown}
    />
  </div>

  <div id={listboxId} role="listbox" class="listbox">
    {#if flat.length === 0}
      <div role="status" class="empty">No matches</div>
    {:else}
      {#each filtered as group (group.category || '__none__')}
        {#if group.category}
          <div class="category tint--type-ui-small" aria-hidden="true">
            {group.category}
          </div>
        {/if}
        {#each group.entries as entry (entry.index)}
          {@const flatIdx = flat.findIndex((e) => e.index === entry.index)}
          {@const isSelected = match?.index === entry.index}
          {@const isFocused = flatIdx === focusedIndex}
          <!-- Combobox option: real focus stays on the search input; this
            row is announced via aria-activedescendant. tabindex="-1" keeps
            it programmatically focusable but out of the tab order.
            Keyboard handling lives on the combobox input, not here. -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <div
            role="option"
            id={optionId(flatIdx)}
            class="row"
            tabindex="-1"
            aria-selected={isSelected}
            data-focused={isFocused ? 'true' : undefined}
            bind:this={optionElements[entry.index]}
            onclick={() => commit(entry)}
            onmouseenter={() => (focusedIndex = flatIdx)}
          >
            <span class="swatch-wrap" aria-hidden="true">
              <span class="swatch-checker"></span>
              <span class="swatch" style:background-color={entry.item.value}
              ></span>
            </span>
            <span class="leaf-label tint--type-ui-small">{entry.leaf}</span>
          </div>
        {/each}
      {/each}
    {/if}
  </div>
</div>

<style>.palette {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-inline: calc(var(--tint-size-12) * -1);
}

.search-row {
  position: relative;
  height: var(--tint-size-40);
  flex: 0 0 auto;
  margin-inline: var(--tint-size-12);
  margin-block-end: var(--tint-size-8);
}

.search-icon {
  position: absolute;
  left: var(--tint-size-8);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  line-height: 0;
  color: var(--tint-text-secondary);
}
.search-icon > :global(svg) {
  width: var(--tint-size-16);
  height: var(--tint-size-16);
}

.search {
  box-sizing: border-box;
  background-color: var(--tint-input-bg);
  color: var(--tint-text);
  border-radius: var(--tint-radius-input);
  border: 2px solid transparent;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0 var(--tint-size-8) 0 var(--tint-size-32);
  appearance: none;
}
.search:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .search:focus-visible {
    outline-color: CanvasText;
  }
}
.search::placeholder {
  color: var(--tint-text-secondary);
}

.listbox {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  padding: 0 0 var(--tint-size-4) 0;
  margin: 0;
  border-block-start: 1px solid var(--tint-card-border);
}

.category {
  color: var(--tint-text-secondary);
  padding: var(--tint-size-8) var(--tint-size-8) var(--tint-size-4) var(--tint-size-8);
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--tint-bg);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--tint-size-8);
  padding: var(--tint-size-4) var(--tint-size-8);
  cursor: pointer;
  user-select: none;
  min-height: var(--tint-size-32);
}

.row[data-focused=true], .row:hover {
  background: var(--tint-action-secondary-hover);
}

.row[aria-selected=true] {
  background: var(--tint-action-secondary-hover);
}
.row[aria-selected=true] .swatch {
  box-shadow: inset 0 0 0 2px var(--tint-action-primary);
}

.swatch-wrap {
  position: relative;
  width: var(--tint-size-24);
  height: var(--tint-size-24);
  border-radius: var(--tint-size-4);
  overflow: hidden;
  flex-shrink: 0;
  isolation: isolate;
}

.swatch-checker {
  position: absolute;
  inset: 0;
  background-image: conic-gradient(rgba(0, 0, 0, 0.18) 25%, transparent 0 50%, rgba(0, 0, 0, 0.18) 0 75%, transparent 0);
  background-size: var(--tint-size-8) var(--tint-size-8);
}

.swatch {
  position: absolute;
  inset: 0;
  border-radius: var(--tint-size-4);
  box-shadow: inset 0 0 0 1px var(--tint-card-border);
}

.leaf-label {
  color: var(--tint-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.empty {
  padding: var(--tint-size-16) var(--tint-size-8);
  color: var(--tint-text-secondary);
  text-align: center;
}

@media (forced-colors: active) {
  .search {
    border-color: ButtonText;
  }
  .row[aria-selected=true], .row[data-focused=true] {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}</style>
