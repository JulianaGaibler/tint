<script lang="ts">
  import { untrack } from 'svelte'
  import {
    addMonths,
    daysInMonth,
    isDisabled,
    monthGrid,
    sameDay,
    type CalendarDay,
  } from './calendar.js'
  import { firstInstantOfLocalDay } from './core.js'
  import type { DateParts } from './format.js'

  interface DayParts {
    year: number
    month: number
    day: number
  }

  interface Props {
    /** The displayed month's year. */
    year: number
    /** The displayed month, 1-12. */
    month: number
    selected: DayParts | null
    /**
     * For a range selection: the other, already picked end, so the span between
     * it and `selected` can be shaded. `undefined` for a single date field,
     * which never shades a range.
     */
    rangeOther?: DayParts | null
    weekStartsOn: number
    locale?: string
    minParts?: DateParts
    maxParts?: DateParts
    isDateDisabled?: (date: Date) => boolean
    /** Fires when keyboard navigation moves focus into a different month. */
    onNavigate: (year: number, month: number) => void
    onPick: (day: DayParts) => void
  }

  let {
    year,
    month,
    selected,
    rangeOther = undefined,
    weekStartsOn,
    locale = undefined,
    minParts = undefined,
    maxParts = undefined,
    isDateDisabled = undefined,
    onNavigate,
    onPick,
  }: Props = $props()

  const weeks = $derived(monthGrid(year, month, weekStartsOn))

  const weekdayFormatter = $derived(
    new Intl.DateTimeFormat(locale, { weekday: 'short' }),
  )
  const weekdayHeaders = $derived(
    (weeks[0] ?? []).map((d) =>
      weekdayFormatter.format(new Date(d.year, d.month - 1, d.day)),
    ),
  )

  const cellFormatter = $derived(
    new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  )

  const now = new Date()
  const today = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }

  function disabledFor(d: CalendarDay): boolean {
    const parts: DateParts = {
      year: d.year,
      month: d.month,
      day: d.day,
      hour: 0,
      minute: 0,
      second: 0,
    }
    return isDisabled(parts, { min: minParts, max: maxParts, isDateDisabled })
  }

  function dayKey(d: DayParts): number {
    return new Date(d.year, d.month - 1, d.day).getTime()
  }

  const rangeBounds = $derived.by(() => {
    if (!selected || !rangeOther) return null
    return dayKey(selected) <= dayKey(rangeOther)
      ? { lo: selected, hi: rangeOther }
      : { lo: rangeOther, hi: selected }
  })

  function inRange(d: DayParts): boolean {
    if (!rangeBounds) return false
    const k = dayKey(d)
    return k >= dayKey(rangeBounds.lo) && k <= dayKey(rangeBounds.hi)
  }

  function labelFor(d: CalendarDay): string {
    const date = firstInstantOfLocalDay(d.year, d.month, d.day)
    let label = cellFormatter.format(date)
    if (sameDay(d, today)) label += ', today'
    if (rangeOther && sameDay(d, rangeOther))
      label += ', other end of the range'
    if (disabledFor(d)) label += ', unavailable'
    return label
  }

  // The day holding roving tabindex. Independent of `selected`, since
  // navigating the grid with arrow keys does not commit anything until
  // Enter or Space.
  let focused = $state<DayParts>(
    untrack(() => {
      if (selected && selected.year === year && selected.month === month) {
        return { ...selected }
      }
      return { year, month, day: 1 }
    }),
  )

  // Keeps `focused` on the displayed month when the caller changes `year`/
  // `month` from outside, for instance through the header's month menu.
  // When the change came from this component's own `onNavigate` call below,
  // `focused` already agrees and this is a no-op.
  $effect(() => {
    const y = year
    const m = month
    untrack(() => {
      if (focused.year === y && focused.month === m) return
      focused = {
        year: y,
        month: m,
        day: Math.min(focused.day, daysInMonth(y, m)),
      }
    })
  })

  let elements: Record<string, HTMLButtonElement | undefined> = {}

  function key(d: DayParts): string {
    return `${d.year}-${d.month}-${d.day}`
  }

  function moveFocus(next: DayParts) {
    focused = next
    if (next.year !== year || next.month !== month)
      onNavigate(next.year, next.month)
    // The target cell is not necessarily in the DOM yet this tick when the
    // month just changed, so the focus call is queued for after Svelte's
    // next update.
    queueMicrotask(() => elements[key(next)]?.focus())
  }

  function addDays(from: DayParts, delta: number): DayParts {
    const date = new Date(from.year, from.month - 1, from.day + delta)
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    }
  }

  function onKeyDown(e: KeyboardEvent, d: CalendarDay) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(addDays(d, -1))
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(addDays(d, 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        moveFocus(addDays(d, -7))
        break
      case 'ArrowDown':
        e.preventDefault()
        moveFocus(addDays(d, 7))
        break
      case 'Home': {
        e.preventDefault()
        const dow = new Date(d.year, d.month - 1, d.day).getDay()
        moveFocus(addDays(d, -((dow - weekStartsOn + 7) % 7)))
        break
      }
      case 'End': {
        e.preventDefault()
        const dow = new Date(d.year, d.month - 1, d.day).getDay()
        moveFocus(addDays(d, 6 - ((dow - weekStartsOn + 7) % 7)))
        break
      }
      case 'PageUp': {
        e.preventDefault()
        // Moves by a month (or, with Shift, a year), keeping the same day of
        // month where the target has one, same as the ARIA date grid pattern.
        const target = e.shiftKey
          ? { year: d.year - 1, month: d.month }
          : addMonths(d.year, d.month, -1)
        moveFocus({
          ...target,
          day: Math.min(d.day, daysInMonth(target.year, target.month)),
        })
        break
      }
      case 'PageDown': {
        e.preventDefault()
        const target = e.shiftKey
          ? { year: d.year + 1, month: d.month }
          : addMonths(d.year, d.month, 1)
        moveFocus({
          ...target,
          day: Math.min(d.day, daysInMonth(target.year, target.month)),
        })
        break
      }
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!disabledFor(d)) onPick(d)
        break
    }
  }
</script>

<div class="calendar">
  <div class="headers" role="row">
    {#each weekdayHeaders as heading, i (i)}
      <span role="columnheader" class="heading">{heading}</span>
    {/each}
  </div>
  <div role="grid" aria-label="Calendar">
    {#each weeks as week, weekIndex (weekIndex)}
      <div role="row" class="week">
        {#each week as d (key(d))}
          {@const isSelected = selected !== null && sameDay(d, selected)}
          {@const isOtherEnd = !!rangeOther && sameDay(d, rangeOther)}
          {@const isFocusable =
            focused.year === d.year &&
            focused.month === d.month &&
            focused.day === d.day}
          <button
            type="button"
            bind:this={elements[key(d)]}
            role="gridcell"
            class="day"
            class:outside={d.outside}
            class:selected={isSelected}
            class:other-end={isOtherEnd}
            class:in-range={inRange(d)}
            class:today={sameDay(d, today)}
            class:disabled={disabledFor(d)}
            tabindex={isFocusable ? 0 : -1}
            aria-selected={isSelected || isOtherEnd}
            aria-disabled={disabledFor(d) || undefined}
            aria-label={labelFor(d)}
            onclick={() => {
              focused = d
              if (!disabledFor(d)) onPick(d)
            }}
            onkeydown={(e) => onKeyDown(e, d)}
          >
            {d.day}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style lang="sass">
.calendar
  display: flex
  flex-direction: column
  gap: var(--tint-size-4)

.headers, .week
  display: grid
  grid-template-columns: repeat(7, 1fr)

.heading
  text-align: center
  color: var(--tint-text-secondary)
  font-variant-numeric: tabular-nums

.day
  appearance: none
  box-sizing: border-box
  background: none
  border: none
  border-radius: var(--tint-radius-button-pill)
  aspect-ratio: 1
  width: 100%
  color: currentColor
  cursor: pointer
  font-variant-numeric: tabular-nums
  @include tint.effect-focus

  &:hover
    background-color: var(--tint-action-secondary-hover)

  &.outside
    color: var(--tint-text-secondary)

  &.today
    font-weight: bold

  &.in-range
    background-color: var(--tint-action-secondary-hover)
    border-radius: 0

  &.selected, &.other-end
    background-color: var(--tint-action-primary)
    color: var(--tint-action-primary-text)
    border-radius: var(--tint-radius-button-pill)

  &.other-end
    background-color: transparent
    color: currentColor
    box-shadow: inset 0 0 0 2px var(--tint-action-primary)

  &.disabled
    color: var(--tint-text-secondary)
    cursor: not-allowed
    text-decoration: line-through

@media (forced-colors: active)
  .day.selected, .day.other-end
    outline: 2px solid Highlight
  .day.disabled
    color: GrayText
</style>
