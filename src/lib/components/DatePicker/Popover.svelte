<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte'
  import * as focusTrap from 'focus-trap'
  import Button from '@lib/components/Button.svelte'
  import ButtonMenu, {
    type ContextClickHandler,
    type MenuItem,
  } from '@lib/components/Menu.svelte'
  import { placeAnchored } from '@lib/positioning/anchored.js'
  import { hasModalLayer, registerDismissLayer } from '@lib/dismiss/stack.js'
  import IconChevronLeft from '@lib/icons/20-chevron-left.svg?raw'
  import IconChevronRight from '@lib/icons/20-chevron-right.svg?raw'
  import IconMore from '@lib/icons/20-more.svg?raw'
  import Calendar from './Calendar.svelte'
  import TimeList from './TimeList.svelte'
  import FormatSettings from './FormatSettings.svelte'
  import { addMonths } from './calendar.js'
  import type { DateFormatPreferences } from './prefs.js'
  import type { DateMode, DateParts } from './format.js'

  interface Props {
    mode: DateMode
    /** The field's current value, or `null` while it is incomplete. */
    parts: DateParts | null
    prefs: DateFormatPreferences
    locale?: string
    weekStartsOn: number
    seconds: boolean
    /** Spacing between listed minutes and seconds. Default 1, every minute. */
    minuteStep?: number
    minParts?: DateParts
    maxParts?: DateParts
    isDateDisabled?: (date: Date) => boolean
    /** Whether the settings icon button is shown at all. */
    showSettings: boolean
    anchorEl: HTMLElement
    onclose: () => void
    /** The single place an edit made inside the popover reaches the field. */
    onpick: (parts: DateParts) => void
  }

  let {
    mode,
    parts,
    prefs,
    locale = undefined,
    weekStartsOn,
    seconds,
    minuteStep = 1,
    minParts = undefined,
    maxParts = undefined,
    isDateDisabled = undefined,
    showSettings,
    anchorEl,
    onclose,
    onpick,
  }: Props = $props()

  function defaultParts(): DateParts {
    const now = new Date()
    return mode === 'time'
      ? { year: 0, month: 1, day: 1, hour: 0, minute: 0, second: 0 }
      : {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: 0,
          minute: 0,
          second: 0,
        }
  }

  // The month the grid shows, independent of `parts`: browsing to a month
  // does not pick a date, and only Calendar's own `onNavigate` moves this
  // afterward. Seeded once, the same reason ColorPicker's popover seeds its
  // tab once at mount rather than from a continuously updating value.
  let displayYear = $state(
    untrack(() => parts?.year ?? new Date().getFullYear()),
  )
  let displayMonth = $state(
    untrack(() => parts?.month ?? new Date().getMonth() + 1),
  )

  function onCalendarPick(day: { year: number; month: number; day: number }) {
    onpick({ ...(parts ?? defaultParts()), ...day })
    // A single calendar pick is the whole answer for a date-only field.
    // datetime and time keep the popover open for the time list.
    if (mode === 'date') onclose()
  }

  function onNavigate(year: number, month: number) {
    displayYear = year
    displayMonth = month
  }

  const monthFormatter = $derived(
    new Intl.DateTimeFormat(locale, { month: 'long' }),
  )
  // Short on the trigger button itself: a full name like "September" next to
  // "October" would shift the header's width from month to month, which the
  // button's own flex: 1 (filling the row instead of sizing to its text) only
  // half fixes on its own. The month menu's own items stay long, where there
  // is no stability concern and the full name reads better.
  const monthLabelFormatter = $derived(
    new Intl.DateTimeFormat(locale, { month: 'short' }),
  )
  const monthLabel = $derived(
    monthLabelFormatter.format(new Date(displayYear, displayMonth - 1, 1)),
  )

  let openMonthMenu: ContextClickHandler | undefined = $state(undefined)
  let openYearMenu: ContextClickHandler | undefined = $state(undefined)

  const monthItems = $derived.by<MenuItem[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      return {
        label: monthFormatter.format(new Date(displayYear, i, 1)),
        checked: m === displayMonth,
        onClick: () => onNavigate(displayYear, m),
      }
    }),
  )

  const yearItems = $derived.by<MenuItem[]>(() => {
    const items: MenuItem[] = []
    for (let y = displayYear - 10; y <= displayYear + 10; y++) {
      items.push({
        label: String(y),
        checked: y === displayYear,
        onClick: () => onNavigate(y, displayMonth),
      })
    }
    return items
  })

  function prevMonth() {
    const next = addMonths(displayYear, displayMonth, -1)
    onNavigate(next.year, next.month)
  }
  function nextMonth() {
    const next = addMonths(displayYear, displayMonth, 1)
    onNavigate(next.year, next.month)
  }

  let settingsOpen = $state(false)

  // ---------- Positioning, focus, and dismissal ----------

  let popoverEl = $state<HTMLDivElement | undefined>(undefined)
  let position = $state<{ x: number; y: number; maxSize: number | undefined }>({
    x: 0,
    y: 0,
    maxSize: undefined,
  })
  let trap: focusTrap.FocusTrap | null = null
  let resizeObserver: ResizeObserver | null = null
  let releaseDismissLayer: (() => void) | null = null

  function recalculatePosition() {
    if (!popoverEl) return
    const anchor = anchorEl.getBoundingClientRect()
    // offsetWidth/offsetHeight rather than getBoundingClientRect(): the open
    // animation scales the popover from 0.92→1, so mid animation the visual
    // rect under reports the real footprint and the clamp below never fires.
    const rect = new DOMRect(
      0,
      0,
      popoverEl.offsetWidth,
      popoverEl.offsetHeight,
    )
    // clientWidth/clientHeight exclude the scrollbar gutter that
    // innerWidth/innerHeight include.
    const root = document.documentElement
    const placed = placeAnchored(
      anchor,
      rect,
      {
        innerWidth: root.clientWidth || window.innerWidth,
        innerHeight: root.clientHeight || window.innerHeight,
      },
      { side: 'block-end', offset: 4 },
    )
    position = { x: placed.x, y: placed.y, maxSize: placed.maxSize }
  }

  // The popover closes on its own outside click rather than on focus-trap's
  // `clickOutsideDeactivates`, because a click inside the nested format
  // settings modal would otherwise count as outside this popover and close
  // it out from under that modal. `hasModalLayer()` is what lets this stand
  // down while that modal (or anything else modal) is open.
  function onPointerDown(e: PointerEvent) {
    if (!popoverEl) return
    const target = e.target as Node
    if (popoverEl.contains(target) || anchorEl.contains(target)) return
    if (hasModalLayer()) return
    onclose()
  }

  onMount(async () => {
    await tick()
    recalculatePosition()
    try {
      popoverEl?.showPopover()
    } catch {
      // popover API not supported. Element still renders inline.
    }
    await tick()
    recalculatePosition()
    if (popoverEl) {
      trap = focusTrap.createFocusTrap(popoverEl, {
        clickOutsideDeactivates: false,
        escapeDeactivates: false,
        allowOutsideClick: true,
        returnFocusOnDeactivate: false,
        fallbackFocus: popoverEl,
      })
      trap.activate()
    }
    releaseDismissLayer = registerDismissLayer({
      dismiss: onclose,
      modal: false,
      label: 'Date picker',
    })
    if (typeof ResizeObserver !== 'undefined' && popoverEl) {
      resizeObserver = new ResizeObserver(() => recalculatePosition())
      resizeObserver.observe(popoverEl)
    }
    window.addEventListener('resize', recalculatePosition)
    window.addEventListener('scroll', recalculatePosition, true)
    window.addEventListener('pointerdown', onPointerDown, true)
  })

  onDestroy(() => {
    trap?.deactivate()
    try {
      popoverEl?.hidePopover()
    } catch {
      // ignore
    }
    resizeObserver?.disconnect()
    resizeObserver = null
    releaseDismissLayer?.()
    window.removeEventListener('resize', recalculatePosition)
    window.removeEventListener('scroll', recalculatePosition, true)
    window.removeEventListener('pointerdown', onPointerDown, true)
  })
</script>

<div
  bind:this={popoverEl}
  popover="manual"
  role="dialog"
  tabindex="-1"
  aria-label={mode === 'time' ? 'Time picker' : 'Date picker'}
  class="popover tint--card"
  style:left="{position.x}px"
  style:top="{position.y}px"
  style:max-height={position.maxSize ? `${position.maxSize}px` : undefined}
>
  <div class="header">
    {#if mode !== 'time'}
      <Button
        icon
        small
        variant="ghost"
        aria-label="Previous month"
        onclick={prevMonth}>{@html IconChevronLeft}</Button
      >
      <Button variant="ghost" small class="month" onclick={openMonthMenu}
        >{monthLabel}</Button
      >
      <ButtonMenu bind:contextClick={openMonthMenu} items={monthItems} />
      <Button variant="ghost" small class="year" onclick={openYearMenu}
        >{displayYear}</Button
      >
      <ButtonMenu bind:contextClick={openYearMenu} items={yearItems} />
      <Button
        icon
        small
        variant="ghost"
        aria-label="Next month"
        onclick={nextMonth}>{@html IconChevronRight}</Button
      >
    {/if}
    {#if showSettings}
      <Button
        icon
        small
        variant="ghost"
        class="settings"
        aria-label="Date and time format settings"
        onclick={() => (settingsOpen = true)}>{@html IconMore}</Button
      >
    {/if}
  </div>

  {#if mode !== 'time'}
    <Calendar
      year={displayYear}
      month={displayMonth}
      selected={parts}
      {weekStartsOn}
      {locale}
      {minParts}
      {maxParts}
      {isDateDisabled}
      {onNavigate}
      onPick={onCalendarPick}
    />
  {/if}

  {#if mode === 'datetime'}
    <div aria-hidden="true" class="section-divider"></div>
  {/if}

  {#if mode !== 'date'}
    <TimeList
      hour={parts?.hour ?? null}
      minute={parts?.minute ?? null}
      second={parts?.second ?? null}
      hourCycle={prefs.hourCycle}
      {seconds}
      {minuteStep}
      {locale}
      onPickHour={(h) => onpick({ ...(parts ?? defaultParts()), hour: h })}
      onPickMinute={(m) => onpick({ ...(parts ?? defaultParts()), minute: m })}
      onPickSecond={(s) => onpick({ ...(parts ?? defaultParts()), second: s })}
    />
  {/if}
</div>

<FormatSettings bind:open={settingsOpen} {locale} />

<style lang="sass">
.popover
  position: fixed
  z-index: 100
  width: 320px
  padding: var(--tint-size-12)
  color: var(--tint-text)
  display: flex
  flex-direction: column
  gap: var(--tint-size-8)
  // The UA [popover] stylesheet sets inset: 0, clear it so left/top apply.
  inset: unset
  overflow-y: auto
  overscroll-behavior: contain
  animation: datepicker-appear 250ms cubic-bezier(0.42, 1.67, 0.21, 0.90)

.header
  display: flex
  align-items: center
  gap: var(--tint-size-4)

  // Equal flex: 1 on both keeps the month and year the same width as each
  // other, and keeps that width constant as the displayed month changes
  // (the short name still varies from "May" to "Sep"), rather than the
  // month's own text sizing the button around it.
  > :global(.month), > :global(.year)
    flex: 1
    min-width: 0

  > :global(.settings)
    margin-inline-start: auto
    flex-shrink: 0

// Edge to edge within the popover's own padding, the same reasoning as the
// field's own divider between its date and time inputs.
.section-divider
  height: 1px
  margin-inline: calc(var(--tint-size-12) * -1)
  background-color: var(--tint-card-border)

@keyframes datepicker-appear
  0%
    opacity: 0
    transform: scale(0.92)
  100%
    opacity: 1
    transform: scale(1)

@media (prefers-reduced-motion: reduce)
  .popover
    animation: none

@media (forced-colors: active)
  .popover
    border: 1px solid CanvasText
  .section-divider
    background-color: ButtonText
</style>
