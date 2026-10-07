<script lang="ts" generics="F extends DateValueFormat = 'iso'">
  import { tick, untrack } from 'svelte'
  import Field from './Field.svelte'
  import SegmentInput, { type SegmentLabels } from './SegmentInput.svelte'
  import {
    buildSegments,
    clampDayToMonth,
    partsFromSegments,
    type Segment,
  } from './segments.js'
  import { firstInstantOfLocalDay, partsToValue, valueToParts } from './core.js'
  import { clampToRange, weekStartFromLocale } from './calendar.js'
  import { resolveSeparator, type DateOrder } from './prefs.js'
  import { dateFormat } from '../../stores/dateFormat.svelte.js'
  import type {
    DateParts,
    DateRangeValue,
    DateValueFor,
    DateValueFormat,
  } from './format.js'

  // Date only: a range field that also carried a time of day would need two
  // simultaneous time lists in the popover, which is a substantially
  // different interaction this version does not take on.
  const MODE = 'date' as const

  interface Props {
    /** Bindable value. `start`/`end` are each `null` while that end is empty. */
    value: DateRangeValue<F>
    /** Visible label above the field. */
    label: string
    /** Output format. Default 'iso'. Controls `value`'s TS type. */
    format?: F
    min?: DateValueFor<F>
    max?: DateValueFor<F>
    isDateDisabled?: (date: Date) => boolean
    locale?: string
    weekStartsOn?: number
    dateOrder?: DateOrder
    labels?: SegmentLabels
    helperText?: string
    error?: string
    disabled?: boolean
    fillWidth?: boolean
    id?: string
    /** Name prefix for native form serialization: `${name}-start`/`${name}-end`. */
    name?: string
    element?: HTMLDivElement
    onchange?: (value: DateRangeValue<F>) => void
    'aria-describedby'?: string
    class?: string
  }

  let {
    value = $bindable(),
    label,
    format = 'iso' as F,
    min = undefined,
    max = undefined,
    isDateDisabled = undefined,
    locale = undefined,
    weekStartsOn = undefined,
    dateOrder = undefined,
    labels = {},
    helperText = undefined,
    error = undefined,
    disabled = false,
    fillWidth = true,
    id = undefined,
    name = undefined,
    element = $bindable(undefined),
    onchange = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    class: className = '',
  }: Props = $props()

  const showSettings = $derived(dateOrder === undefined)

  $effect(() => {
    dateFormat.init()
  })

  const effectivePrefs = $derived({
    dateOrder: dateOrder ?? dateFormat.prefs.dateOrder,
    hourCycle: dateFormat.prefs.hourCycle,
    separator: dateFormat.prefs.separator,
  })
  const separator = $derived(
    resolveSeparator(
      locale,
      effectivePrefs.dateOrder,
      effectivePrefs.separator,
    ),
  )
  const resolvedWeekStartsOn = $derived(
    weekStartsOn ?? weekStartFromLocale(locale),
  )

  const minParts = $derived(
    min !== undefined
      ? (valueToParts(MODE, format, min) ?? undefined)
      : undefined,
  )
  const maxParts = $derived(
    max !== undefined
      ? (valueToParts(MODE, format, max) ?? undefined)
      : undefined,
  )

  let activeEnd = $state<'start' | 'end'>('start')
  let hasFocusStart = $state(false)
  let hasFocusEnd = $state(false)

  let segmentsStart = $state<Segment[]>(
    untrack(() =>
      buildSegments(
        MODE,
        effectivePrefs,
        separator,
        valueToParts(MODE, format, value.start ?? null),
        {},
      ),
    ),
  )
  let segmentsEnd = $state<Segment[]>(
    untrack(() =>
      buildSegments(
        MODE,
        effectivePrefs,
        separator,
        valueToParts(MODE, format, value.end ?? null),
        {},
      ),
    ),
  )

  $effect(() => {
    if (hasFocusStart) return
    const parts = valueToParts(MODE, format, value.start ?? null)
    segmentsStart = buildSegments(MODE, effectivePrefs, separator, parts, {})
  })
  $effect(() => {
    if (hasFocusEnd) return
    const parts = valueToParts(MODE, format, value.end ?? null)
    segmentsEnd = buildSegments(MODE, effectivePrefs, separator, parts, {})
  })

  const filled = $derived(
    segmentsStart.some((s) => s.type !== 'literal' && s.value !== null) ||
      segmentsEnd.some((s) => s.type !== 'literal' && s.value !== null),
  )

  function valuesEqual(a: unknown, b: unknown): boolean {
    if (a instanceof Date && b instanceof Date)
      return a.getTime() === b.getTime()
    return a === b
  }

  function announceText(parts: DateParts, suffix: string): string {
    const date = firstInstantOfLocalDay(parts.year, parts.month, parts.day)
    const formatted = new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
    }).format(date)
    return `${formatted} ${suffix}`
  }

  let announcement = $state('')
  let lastValidStart: DateParts | null = untrack(() =>
    valueToParts(MODE, format, value.start ?? null),
  )
  let lastValidEnd: DateParts | null = untrack(() =>
    valueToParts(MODE, format, value.end ?? null),
  )

  /**
   * Clamps and validates one end's segments, in place, the same pipeline
   * DatePicker runs for its single value. Returns the settled parts, or `null`
   * while that end is still incomplete. Run for `start` and `end`
   * independently; swapping an inverted range is handled separately, once both
   * ends are known to be individually valid.
   */
  function settle(
    segments: Segment[],
    setSegments: (next: Segment[]) => void,
    lastValid: DateParts | null,
    setLastValid: (next: DateParts) => void,
  ): DateParts | null {
    const parts = partsFromSegments(segments)
    if (parts === null) return null

    const dayFixed = clampDayToMonth(parts)
    if (dayFixed !== parts) {
      setSegments(buildSegments(MODE, effectivePrefs, separator, dayFixed, {}))
      return null
    }

    const rangeClamped = clampToRange(dayFixed, {
      min: minParts,
      max: maxParts,
    })
    if (rangeClamped !== dayFixed) {
      setSegments(
        buildSegments(MODE, effectivePrefs, separator, rangeClamped, {}),
      )
      announcement = announceText(
        rangeClamped,
        '(clamped to the allowed range)',
      )
      return null
    }

    const rejected = isDateDisabled?.(
      firstInstantOfLocalDay(
        rangeClamped.year,
        rangeClamped.month,
        rangeClamped.day,
      ),
    )
    if (rejected) {
      setSegments(buildSegments(MODE, effectivePrefs, separator, lastValid, {}))
      announcement = announceText(rangeClamped, 'is unavailable')
      return null
    }

    setLastValid(rangeClamped)
    return rangeClamped
  }

  function partsKey(p: DateParts): number {
    return firstInstantOfLocalDay(p.year, p.month, p.day).getTime()
  }

  $effect(() => {
    const startParts = settle(
      segmentsStart,
      (s) => (segmentsStart = s),
      lastValidStart,
      (p) => (lastValidStart = p),
    )
    const endParts = settle(
      segmentsEnd,
      (s) => (segmentsEnd = s),
      lastValidEnd,
      (p) => (lastValidEnd = p),
    )

    if (startParts && endParts && partsKey(startParts) > partsKey(endParts)) {
      segmentsStart = buildSegments(
        MODE,
        effectivePrefs,
        separator,
        endParts,
        {},
      )
      segmentsEnd = buildSegments(
        MODE,
        effectivePrefs,
        separator,
        startParts,
        {},
      )
      return
    }

    const nextStart =
      startParts !== null ? partsToValue(MODE, format, startParts, {}) : null
    const nextEnd =
      endParts !== null ? partsToValue(MODE, format, endParts, {}) : null
    if (
      !valuesEqual(nextStart, value.start) ||
      !valuesEqual(nextEnd, value.end)
    ) {
      value = {
        start: nextStart as DateValueFor<F> | null,
        end: nextEnd as DateValueFor<F> | null,
      }
      onchange?.(value)
    }
  })

  const serializedStart = $derived.by(() => {
    const parts = partsFromSegments(segmentsStart)
    return parts ? partsToValue(MODE, 'iso', parts, {}) : ''
  })
  const serializedEnd = $derived.by(() => {
    const parts = partsFromSegments(segmentsEnd)
    return parts ? partsToValue(MODE, 'iso', parts, {}) : ''
  })

  // Popover module is loaded on first open and cached.
  type PopoverModule = typeof import('./RangePopover.svelte')
  let Popover = $state<PopoverModule['default'] | undefined>(undefined)
  let isOpen = $state(false)
  let triggerEl = $state<HTMLButtonElement | undefined>(undefined)

  async function openPicker() {
    if (disabled) return
    if (!Popover) {
      Popover = (await import('./RangePopover.svelte')).default
    }
    isOpen = true
  }

  async function closePicker() {
    isOpen = false
    // See DatePicker.svelte's own closePicker for why this waits a tick
    // before focusing: the popover's focus trap is still active at this
    // point and would otherwise pull focus straight back.
    await tick()
    triggerEl?.focus()
  }

  function onPick(day: { year: number; month: number; day: number }) {
    const other =
      activeEnd === 'start'
        ? partsFromSegments(segmentsEnd)
        : partsFromSegments(segmentsStart)
    // Picking a day on the wrong side of the other end still produces a
    // valid range: it becomes whichever end keeps start before end, and the
    // next pick resumes on the other one.
    const picked: DateParts = { ...day, hour: 0, minute: 0, second: 0 }
    const invertsRange =
      other !== null &&
      (activeEnd === 'start'
        ? partsKey(picked) > partsKey(other)
        : partsKey(picked) < partsKey(other))
    const fillsStart = invertsRange
      ? activeEnd === 'end'
      : activeEnd === 'start'

    if (fillsStart) {
      segmentsStart = buildSegments(MODE, effectivePrefs, separator, picked, {})
    } else {
      segmentsEnd = buildSegments(MODE, effectivePrefs, separator, picked, {})
    }
    activeEnd = fillsStart ? 'end' : 'start'
  }
</script>

<div bind:this={element} class="date-range-picker {className}">
  <Field
    {label}
    {filled}
    {helperText}
    {error}
    {fillWidth}
    {disabled}
    {id}
    {isOpen}
    triggerLabel="Open calendar"
    onTriggerClick={openPicker}
    bind:triggerElement={triggerEl}
    aria-describedby={ariaDescribedby}
  >
    {#snippet children({ describedBy })}
      <SegmentInput
        bind:segments={segmentsStart}
        {locale}
        {labels}
        {disabled}
        class="range-start"
        aria-label="Start date"
        aria-describedby={describedBy}
        onFocusChange={(focused) => {
          hasFocusStart = focused
          if (focused) activeEnd = 'start'
        }}
      />
      <span aria-hidden="true" class="range-dash">–</span>
      <SegmentInput
        bind:segments={segmentsEnd}
        {locale}
        {labels}
        {disabled}
        class="range-end"
        aria-label="End date"
        aria-describedby={describedBy}
        onFocusChange={(focused) => {
          hasFocusEnd = focused
          if (focused) activeEnd = 'end'
        }}
      />
    {/snippet}
  </Field>

  {#if name}
    <input type="hidden" name="{name}-start" value={serializedStart} />
    <input type="hidden" name="{name}-end" value={serializedEnd} />
  {/if}

  <span class="tint--visually-hidden" aria-live="polite">{announcement}</span>

  {#if isOpen && Popover && triggerEl}
    <Popover
      start={partsFromSegments(segmentsStart)}
      end={partsFromSegments(segmentsEnd)}
      {activeEnd}
      prefs={effectivePrefs}
      {locale}
      weekStartsOn={resolvedWeekStartsOn}
      {minParts}
      {maxParts}
      {isDateDisabled}
      {showSettings}
      anchorEl={triggerEl}
      onclose={closePicker}
      onpick={onPick}
    />
  {/if}
</div>

<style>.date-range-picker {
  display: contents;
}

.range-dash {
  color: var(--tint-text-secondary);
  padding-inline: var(--tint-size-4);
}

:global(input.segment-input.range-start),
:global(input.segment-input.range-end) {
  box-sizing: content-box;
  background-color: var(--tint-bg);
  box-shadow: inset 0 0 0 1px var(--tint-card-border);
  border-radius: var(--tint-radius-input);
  padding-inline: var(--tint-size-8);
  padding-block: var(--tint-size-4);
}

:global(input.segment-input.range-start) {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

:global(input.segment-input.range-end) {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}

@media (forced-colors: active) {
  :global(input.segment-input.range-start),
  :global(input.segment-input.range-end) {
    box-shadow: inset 0 0 0 1px ButtonText;
  }
}</style>
