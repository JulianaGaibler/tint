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
    DateMode,
    DateParts,
    DateValueFor,
    DateValueFormat,
  } from './format.js'

  interface Props {
    /**
     * Bindable value. Type derived from `format`. `null` while the field is
     * empty.
     */
    value: DateValueFor<F> | null
    /** Visible label above the field. */
    label: string
    /** Which parts of a date to show and let the user set. Default 'date'. */
    mode?: DateMode
    /** Output format. Default 'iso'. Controls value's TS type. */
    format?: F
    /** Lower bound, in the same shape `value` takes. */
    min?: DateValueFor<F>
    /** Upper bound, in the same shape `value` takes. */
    max?: DateValueFor<F>
    /** Rejects individual dates, independent of `min`/`max`. */
    isDateDisabled?: (date: Date) => boolean
    /** Show and accept seconds. Default false. */
    seconds?: boolean
    /**
     * Spacing between the minutes (and seconds) the popover's time list offers.
     * Default 1, every minute. The field's own segments always accept any value
     * regardless of this, so a coarser step such as 15 only trims the list, not
     * what can be typed.
     */
    minuteStep?: number
    /**
     * Locale used for month names, weekday order, and the date separator.
     * Defaults to the runtime's own locale. Does not affect the stored date
     * order or clock preference, which is shared site wide by design, see
     * `tint/stores`' `dateFormat`.
     */
    locale?: string
    /** First day of the week, 0 for Sunday. Defaults to `locale`'s own. */
    weekStartsOn?: number
    /**
     * Pins the day, month, year order, hiding the settings icon button. Omit to
     * follow the user's stored preference, or the locale default when they have
     * not set one.
     */
    dateOrder?: DateOrder
    /** Pins the clock, hiding the settings icon button. */
    hourCycle?: 12 | 24
    /** Overrides for the English segment names and AM/PM strings. */
    labels?: SegmentLabels
    /** Helper text under the field. Mutually exclusive with `error`. */
    helperText?: string
    /** Replace helperText with an error message and warning icon. */
    error?: string
    disabled?: boolean
    /** Fill parent width. Default true. */
    fillWidth?: boolean
    id?: string
    /** Name for native form serialization. Always serializes as iso. */
    name?: string
    /** Bindable ref to the field's outer element. */
    element?: HTMLDivElement
    /**
     * Fires on every settled change to `value`, including once at mount if the
     * incoming value needs normalizing, for instance seconds dropped because
     * `seconds` is false, or a value outside `min`/`max` clamped.
     */
    onchange?: (value: DateValueFor<F> | null) => void
    /** External describing element id (ARIA). */
    'aria-describedby'?: string
    class?: string
  }

  let {
    value = $bindable(),
    label,
    mode = 'date',
    format = 'iso' as F,
    min = undefined,
    max = undefined,
    isDateDisabled = undefined,
    seconds = false,
    minuteStep = 1,
    locale = undefined,
    weekStartsOn = undefined,
    dateOrder = undefined,
    hourCycle = undefined,
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

  // The settings icon button configures the shared, site wide preference, so
  // it has nothing to offer once the caller has pinned the order or the
  // clock: showing it would suggest a per-field setting that is not one.
  const showSettings = $derived(
    dateOrder === undefined && hourCycle === undefined,
  )

  $effect(() => {
    dateFormat.init()
  })

  const effectivePrefs = $derived({
    dateOrder: dateOrder ?? dateFormat.prefs.dateOrder,
    hourCycle: hourCycle ?? dateFormat.prefs.hourCycle,
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

  // `?? undefined` only matters for a caller passing an empty string as an
  // iso `min`/`max`, which `valueToParts` reads as "no value" rather than a
  // real bound.
  const minParts = $derived(
    min !== undefined
      ? (valueToParts(mode, format, min) ?? undefined)
      : undefined,
  )
  const maxParts = $derived(
    max !== undefined
      ? (valueToParts(mode, format, max) ?? undefined)
      : undefined,
  )

  // Datetime mode is two independent inputs, one for the date and one for
  // the time, so it gets two independent segment lists. `date` and `time`
  // mode only ever populate the one they need; the other stays `[]` and is
  // never rendered. `currentParts`/`rebuildFrom` below are what let the rest
  // of this component treat all three modes uniformly despite that.
  let hasFocusDate = $state(false)
  let hasFocusTime = $state(false)
  const hasFocus = $derived(hasFocusDate || hasFocusTime)

  function seedDateSegments(parts: DateParts | null): Segment[] {
    return mode === 'time'
      ? []
      : buildSegments('date', effectivePrefs, separator, parts, {})
  }
  function seedTimeSegments(parts: DateParts | null): Segment[] {
    return mode === 'date'
      ? []
      : buildSegments('time', effectivePrefs, separator, parts, { seconds })
  }

  // Seeded once from the props in scope at mount. The `$effect` below is what
  // keeps this in sync with `value` afterward, not a reactive read here.
  let dateSegments = $state<Segment[]>(
    untrack(() => seedDateSegments(valueToParts(mode, format, value ?? null))),
  )
  let timeSegments = $state<Segment[]>(
    untrack(() => seedTimeSegments(valueToParts(mode, format, value ?? null))),
  )

  /**
   * The value as currently typed, merged across both segment lists. `null`
   * while either half mode actually uses is still incomplete. Reads both
   * `dateSegments` and `timeSegments`, so calling this from inside an `$effect`
   * makes both its dependencies, same as reading them directly would.
   */
  function currentParts(): DateParts | null {
    if (mode === 'date') return partsFromSegments(dateSegments)
    if (mode === 'time') return partsFromSegments(timeSegments)
    const datePart = partsFromSegments(dateSegments)
    const timePart = partsFromSegments(timeSegments)
    if (datePart === null || timePart === null) return null
    return {
      ...datePart,
      hour: timePart.hour,
      minute: timePart.minute,
      second: timePart.second,
    }
  }

  function rebuildFrom(parts: DateParts | null) {
    dateSegments = seedDateSegments(parts)
    timeSegments = seedTimeSegments(parts)
  }

  $effect(() => {
    if (hasFocus) return
    rebuildFrom(valueToParts(mode, format, value ?? null))
  })

  const filled = $derived(
    [...dateSegments, ...timeSegments].some(
      (s) => s.type !== 'literal' && s.value !== null,
    ),
  )

  function valuesEqual(a: unknown, b: unknown): boolean {
    if (a instanceof Date && b instanceof Date)
      return a.getTime() === b.getTime()
    return a === b
  }

  function announceText(parts: DateParts, suffix: string): string {
    const date =
      mode === 'time'
        ? new Date(2000, 0, 1, parts.hour, parts.minute, parts.second)
        : firstInstantOfLocalDay(parts.year, parts.month, parts.day)
    const formatted = new Intl.DateTimeFormat(locale, {
      ...(mode === 'time' ? { timeStyle: 'short' } : { dateStyle: 'long' }),
    }).format(date)
    return `${formatted} ${suffix}`
  }

  let announcement = $state('')
  let lastValidParts: DateParts | null = untrack(() =>
    valueToParts(mode, format, value ?? null),
  )

  // The single place a completed edit becomes the outward `value`, the day
  // month clamp applies, and an out of range or disabled date is caught.
  // Reads both segment lists to notice an edit; writes them back for a clamp
  // or a revert, which is why those writes are wrapped in `untrack` rather
  // than left to register as a dependency of this same effect.
  $effect(() => {
    const parts = currentParts()
    if (parts === null) {
      if (value !== null && value !== undefined) {
        value = null
        onchange?.(null)
      }
      return
    }

    const dayFixed = clampDayToMonth(parts)
    if (dayFixed !== parts) {
      rebuildFrom(dayFixed)
      return
    }

    const rangeClamped = clampToRange(dayFixed, {
      min: minParts,
      max: maxParts,
    })
    if (rangeClamped !== dayFixed) {
      rebuildFrom(rangeClamped)
      announcement = announceText(
        rangeClamped,
        '(clamped to the allowed range)',
      )
      return
    }

    const rejected = isDateDisabled?.(
      firstInstantOfLocalDay(
        rangeClamped.year,
        rangeClamped.month,
        rangeClamped.day,
      ),
    )
    if (rejected) {
      rebuildFrom(lastValidParts)
      announcement = announceText(rangeClamped, 'is unavailable')
      return
    }

    lastValidParts = rangeClamped
    const next = partsToValue(mode, format, rangeClamped, { seconds })
    if (!valuesEqual(next, value)) {
      value = next
      onchange?.(next)
    }
  })

  const serializedValue = $derived.by(() => {
    const parts = currentParts()
    return parts ? partsToValue(mode, 'iso', parts, { seconds }) : ''
  })

  // Popover module is loaded on first open and cached.
  type PopoverModule = typeof import('./Popover.svelte')
  let Popover = $state<PopoverModule['default'] | undefined>(undefined)
  let isOpen = $state(false)
  let triggerEl = $state<HTMLButtonElement | undefined>(undefined)

  async function openPicker() {
    if (disabled) return
    if (!Popover) {
      Popover = (await import('./Popover.svelte')).default
    }
    isOpen = true
  }

  async function closePicker() {
    isOpen = false
    // The popover's own focus trap is still active until it unmounts, which
    // has not happened yet at this point when Escape triggered the close:
    // this runs from the dismiss stack, not from the trap's own deactivate
    // hook the way ColorPicker's popover closes. Waiting a tick lets the
    // trap tear down first, so it cannot pull focus straight back.
    await tick()
    triggerEl?.focus()
  }

  function onPick(parts: DateParts) {
    rebuildFrom(parts)
  }
</script>

<div bind:this={element} class="date-picker {className}">
  <Field
    {label}
    {filled}
    {helperText}
    {error}
    {fillWidth}
    {disabled}
    {id}
    {name}
    {serializedValue}
    {isOpen}
    triggerLabel={mode === 'time' ? 'Open time picker' : 'Open calendar'}
    onTriggerClick={openPicker}
    bind:triggerElement={triggerEl}
    aria-describedby={ariaDescribedby}
  >
    {#snippet children({ labelId, describedBy })}
      {#if mode !== 'time'}
        <SegmentInput
          bind:segments={dateSegments}
          {locale}
          {labels}
          {disabled}
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          onFocusChange={(focused) => (hasFocusDate = focused)}
        />
      {/if}
      {#if mode === 'datetime'}
        <span aria-hidden="true" class="divider"></span>
      {/if}
      {#if mode !== 'date'}
        <SegmentInput
          bind:segments={timeSegments}
          {locale}
          {labels}
          {disabled}
          aria-label={mode === 'datetime' ? 'Time' : undefined}
          aria-labelledby={mode === 'time' ? labelId : undefined}
          aria-describedby={describedBy}
          onFocusChange={(focused) => (hasFocusTime = focused)}
        />
      {/if}
    {/snippet}
  </Field>

  <span class="tint--visually-hidden" aria-live="polite">{announcement}</span>

  {#if isOpen && Popover && triggerEl}
    <Popover
      {mode}
      parts={currentParts()}
      prefs={effectivePrefs}
      {locale}
      weekStartsOn={resolvedWeekStartsOn}
      {seconds}
      {minuteStep}
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

<style>.date-picker {
  display: contents;
}

.divider {
  align-self: stretch;
  width: 1px;
  background-color: var(--tint-card-border);
}

@media (forced-colors: active) {
  .divider {
    background-color: ButtonText;
  }
}</style>
