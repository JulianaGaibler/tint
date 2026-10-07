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
  import FormatSettings from './FormatSettings.svelte'
  import { addMonths } from './calendar.js'
  import type { DateFormatPreferences } from './prefs.js'
  import type { DateParts } from './format.js'

  interface DayParts {
    year: number
    month: number
    day: number
  }

  interface Props {
    start: DayParts | null
    end: DayParts | null
    /** Which end a calendar click fills next. */
    activeEnd: 'start' | 'end'
    prefs: DateFormatPreferences
    locale?: string
    weekStartsOn: number
    minParts?: DateParts
    maxParts?: DateParts
    isDateDisabled?: (date: Date) => boolean
    showSettings: boolean
    anchorEl: HTMLElement
    onclose: () => void
    onpick: (day: DayParts) => void
  }

  let {
    start,
    end,
    activeEnd,
    locale = undefined,
    weekStartsOn,
    minParts = undefined,
    maxParts = undefined,
    isDateDisabled = undefined,
    showSettings,
    anchorEl,
    onclose,
    onpick,
  }: Props = $props()

  const active = $derived(activeEnd === 'start' ? start : end)
  const other = $derived(activeEnd === 'start' ? end : start)

  // Mirrors Popover.svelte's own month navigation. Kept separate rather than
  // shared, since this popover has no time list or mode branching to carry
  // that abstraction would need.
  let displayYear = $state(
    untrack(() => active?.year ?? other?.year ?? new Date().getFullYear()),
  )
  let displayMonth = $state(
    untrack(() => active?.month ?? other?.month ?? new Date().getMonth() + 1),
  )

  function onNavigate(year: number, month: number) {
    displayYear = year
    displayMonth = month
  }

  const monthFormatter = $derived(
    new Intl.DateTimeFormat(locale, { month: 'long' }),
  )
  // Short on the trigger button itself, the same reason Popover.svelte's own
  // header uses it: a full name's varying width would shift the chevrons and
  // the year from month to month. The month menu's own items stay long.
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
  // Identical to Popover.svelte's own. See that file for the reasoning
  // behind each choice; duplicated rather than shared, since Svelte has no
  // lightweight way to share stateful mount logic across two components
  // without a custom hook abstraction neither popover otherwise needs.

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
    const rect = new DOMRect(
      0,
      0,
      popoverEl.offsetWidth,
      popoverEl.offsetHeight,
    )
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
      label: 'Date range picker',
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
  aria-label="Date range picker"
  class="popover tint--card"
  style:left="{position.x}px"
  style:top="{position.y}px"
  style:max-height={position.maxSize ? `${position.maxSize}px` : undefined}
>
  <div class="header">
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

  <p class="active-end tint--type-ui-small">
    Picking the {activeEnd === 'start' ? 'start' : 'end'} date
  </p>

  <Calendar
    year={displayYear}
    month={displayMonth}
    selected={active}
    rangeOther={other}
    {weekStartsOn}
    {locale}
    {minParts}
    {maxParts}
    {isDateDisabled}
    {onNavigate}
    onPick={onpick}
  />
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
  inset: unset
  overflow-y: auto
  overscroll-behavior: contain
  animation: datepicker-appear 250ms cubic-bezier(0.42, 1.67, 0.21, 0.90)

.header
  display: flex
  align-items: center
  gap: var(--tint-size-4)

  // Equal flex: 1 on both keeps the month and year the same width as each
  // other, and keeps that width constant as the displayed month changes.
  > :global(.month), > :global(.year)
    flex: 1
    min-width: 0

  > :global(.settings)
    margin-inline-start: auto
    flex-shrink: 0

.active-end
  margin: 0
  color: var(--tint-text-secondary)
  text-align: center

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
</style>
