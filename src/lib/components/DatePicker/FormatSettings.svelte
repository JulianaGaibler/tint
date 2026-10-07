<script lang="ts">
  import Modal from '@lib/components/Modal.svelte'
  import LabeledToggleable from '@lib/components/LabeledToggleable.svelte'
  import Button from '@lib/components/Button.svelte'
  import IconClose from '@lib/icons/20-close.svg?raw'
  import { dateFormat } from '@lib/stores/dateFormat.svelte.js'
  import {
    localeDefaults,
    localeSeparator,
    resolveSeparator,
    type DateOrder,
    type DateSeparator,
  } from './prefs.js'

  interface Props {
    open: boolean
    locale?: string
    onclose?: () => void
  }

  let {
    open = $bindable(false),
    locale = undefined,
    onclose = undefined,
  }: Props = $props()

  const today = new Date()

  function formatExample(order: DateOrder, sep: string): string {
    const d = String(today.getDate()).padStart(2, '0')
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const y = String(today.getFullYear())
    if (order === 'DMY') return `${d}${sep}${m}${sep}${y}`
    if (order === 'MDY') return `${m}${sep}${d}${sep}${y}`
    return `${y}${sep}${m}${sep}${d}`
  }

  function dateExample(order: DateOrder): string {
    return formatExample(order, localeSeparator(locale, order))
  }

  function clockExample(hourCycle: 12 | 24): string {
    const sample = new Date(2000, 0, 1, 14, 30)
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: hourCycle === 12,
    }).format(sample)
  }

  // Each group's own `'default'` option unsets just that field's override,
  // independent of the other two: picking a custom separator does not have
  // to mean giving up a custom date order as well. `dateFormat.reset()`
  // below is the equivalent of choosing `'default'` in every group at once.
  const localeOrder = $derived(localeDefaults(locale).dateOrder)
  const localeHourCycle = $derived(localeDefaults(locale).hourCycle)

  interface Option<T> {
    value: 'default' | T
    name: string
    example: string
  }

  const dateOrderOptions: Option<DateOrder>[] = $derived([
    { value: 'default', name: 'Default', example: dateExample(localeOrder) },
    { value: 'DMY', name: 'Day, month, year', example: dateExample('DMY') },
    { value: 'MDY', name: 'Month, day, year', example: dateExample('MDY') },
    { value: 'YMD', name: 'Year, month, day', example: dateExample('YMD') },
  ])

  const hourCycleOptions: Option<12 | 24>[] = $derived([
    {
      value: 'default',
      name: 'Default',
      example: clockExample(localeHourCycle),
    },
    { value: 12, name: '12 hour clock', example: clockExample(12) },
    { value: 24, name: '24 hour clock', example: clockExample(24) },
  ])

  type ConcreteSeparator = Exclude<DateSeparator, 'auto'>
  const SEPARATOR_VALUES: ConcreteSeparator[] = ['/', '-', '.']
  const SEPARATOR_NAMES: Record<ConcreteSeparator, string> = {
    '/': 'Slash',
    '-': 'Dash',
    '.': 'Dot',
  }

  // The example borrows the current date order, since a separator on its own
  // has nothing to show: it only reads as a date alongside an order.
  function separatorExample(sep: DateSeparator): string {
    return formatExample(
      dateFormat.prefs.dateOrder,
      resolveSeparator(locale, dateFormat.prefs.dateOrder, sep),
    )
  }

  const separatorOptions: Option<ConcreteSeparator>[] = $derived([
    { value: 'default', name: 'Default', example: separatorExample('auto') },
    ...SEPARATOR_VALUES.map((value) => ({
      value,
      name: SEPARATOR_NAMES[value],
      example: separatorExample(value),
    })),
  ])

  function done() {
    open = false
    onclose?.()
  }
</script>

<Modal bind:open onclose={done} class="format-settings">
  <div class="header">
    <h2 class="tint--type-title-sans-3">Date and time format</h2>
    <Button icon small variant="ghost" aria-label="Close" onclick={done}>
      {@html IconClose}
    </Button>
  </div>

  <fieldset class="group">
    <legend class="tint--type-input-small">Date order</legend>
    {#each dateOrderOptions as option (option.value)}
      <LabeledToggleable
        id="dateformat-order-{option.value}"
        type="radio"
        label={option.name}
        description={option.example}
        checked={option.value === 'default'
          ? !dateFormat.isFieldOverridden('dateOrder')
          : dateFormat.isFieldOverridden('dateOrder') &&
            dateFormat.prefs.dateOrder === option.value}
        onchange={() =>
          option.value === 'default'
            ? dateFormat.resetField('dateOrder')
            : dateFormat.set({ dateOrder: option.value })}
      />
    {/each}
  </fieldset>

  <fieldset class="group">
    <legend class="tint--type-input-small">Clock</legend>
    {#each hourCycleOptions as option (option.value)}
      <LabeledToggleable
        id="dateformat-clock-{option.value}"
        type="radio"
        label={option.name}
        description={option.example}
        checked={option.value === 'default'
          ? !dateFormat.isFieldOverridden('hourCycle')
          : dateFormat.isFieldOverridden('hourCycle') &&
            dateFormat.prefs.hourCycle === option.value}
        onchange={() =>
          option.value === 'default'
            ? dateFormat.resetField('hourCycle')
            : dateFormat.set({ hourCycle: option.value })}
      />
    {/each}
  </fieldset>

  <fieldset class="group">
    <legend class="tint--type-input-small">Separator</legend>
    {#each separatorOptions as option (option.value)}
      <LabeledToggleable
        id="dateformat-separator-{option.value}"
        type="radio"
        label={option.name}
        description={option.example}
        checked={option.value === 'default'
          ? !dateFormat.isFieldOverridden('separator')
          : dateFormat.isFieldOverridden('separator') &&
            dateFormat.prefs.separator === option.value}
        onchange={() =>
          option.value === 'default'
            ? dateFormat.resetField('separator')
            : dateFormat.set({ separator: option.value })}
      />
    {/each}
  </fieldset>

  <p class="note tint--type-ui-small">
    Applies to every date field in this app.
  </p>

  <div class="actions">
    <Button
      variant="secondary"
      small
      disabled={!dateFormat.isOverridden}
      onclick={() => dateFormat.reset()}
    >
      Reset
    </Button>
  </div>
</Modal>

<style lang="sass">
// `[open]` scoped: the dialog's native display: none while closed comes from
// the UA stylesheet keyed to the same attribute, and an unconditional
// `display` here would override it, leaving the modal laid out and visible
// even when `open` is false.
:global(dialog.format-settings[open])
  display: flex
  flex-direction: column
  gap: var(--tint-size-16)

:global(.format-settings)
  box-sizing: border-box
  width: min(22rem, 100vw - var(--tint-size-32))
  max-height: min(32rem, 100vh - var(--tint-size-32))
  padding-inline: var(--tint-size-24)
  padding-block-end: var(--tint-size-24)
  overflow-y: auto
  @include tint.scrollbar-thin

// Sticky within the dialog's own scroll area, which is why the dialog
// carries no padding-block-start of its own: that padding lives here
// instead, so the header has nothing above it to stick below.
.header
  position: sticky
  inset-block-start: 0
  z-index: 1
  display: flex
  align-items: center
  justify-content: space-between
  gap: var(--tint-size-8)
  padding-block-start: var(--tint-size-24)
  background-color: var(--tint-bg)

  > h2
    margin: 0

.group
  border: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: var(--tint-size-8)

  > legend
    color: var(--tint-text-secondary)
    padding: 0
    margin-block-end: var(--tint-size-4)

.note
  color: var(--tint-text-secondary)
  margin: 0

.actions
  display: flex
  justify-content: flex-end
  gap: var(--tint-size-8)

@media (forced-colors: active)
  .note
    color: GrayText
  .header
    border-block-end: 1px solid ButtonText
</style>
