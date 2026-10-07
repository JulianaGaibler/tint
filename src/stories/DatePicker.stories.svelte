<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import DatePicker from '@lib/components/DatePicker/DatePicker.svelte'
  import DateRangePicker from '@lib/components/DatePicker/DateRangePicker.svelte'
  import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
  import DatePickerDocs from './docs/DatePicker.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Components/DatePicker',
    component: DatePicker,
    args: {
      onchange: fn(),
    },
    parameters: { docs: { description: { component: DatePickerDocs } } },
  })

  const typesAndReformats = async ({ canvas }: any) => {
    const input = canvas.getByRole('textbox', { name: 'Date' })

    await userEvent.click(input)
    await userEvent.keyboard('{Home}')
    await userEvent.keyboard('09112027')

    // Three distinct numbers, with separators the field inserted on its own,
    // not the raw digits or a leftover placeholder. Which position each
    // number lands in depends on the locale's day, month, year order, which
    // is exactly what this test goes on to change.
    await expect(input.value).toMatch(/2027/)
    await expect(input.value).not.toMatch(/[dmy]/)

    const trigger = canvas.getByRole('button', { name: 'Open calendar' })
    await userEvent.click(trigger)
    const popover = await waitFor(
      () => {
        const el = document.querySelector('[role="dialog"]')
        if (!el) throw new Error('picker did not open')
        return el
      },
      { timeout: 5000 },
    )

    const gear = popover.querySelector<HTMLButtonElement>(
      'button[aria-label="Date and time format settings"]',
    )!
    await userEvent.click(gear)
    const modal = await waitFor(() => {
      const el = document.querySelector<HTMLDialogElement>('dialog[open]')
      if (!el) throw new Error('settings did not open')
      return el
    })

    const ymd = within(modal).getByRole('radio', { name: 'Year, month, day' })
    await userEvent.click(ymd)
    await userEvent.click(within(modal).getByRole('button', { name: 'Close' }))

    // The order flip is global, so the field reorders without being told its
    // value changed, landing on the unambiguous year-month-day shape with
    // the year, the one part every order agrees on, still intact.
    await waitFor(() => {
      expect(input.value).toMatch(/^2027\D\d{2}\D\d{2}$/)
    })

    // Escape closes the popover now that the modal is gone, not the modal a
    // second time.
    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeNull()
    })
    await expect(trigger).toHaveFocus()
  }
</script>

<script lang="ts">
  let dateValue = $state<string | null>('2026-10-07')
  let datetimeValue = $state<string | null>('2026-10-07T14:30:00')
  let timeValue = $state<string | null>('14:30')
  let rangeValue = $state<{ start: string | null; end: string | null }>({
    start: '2026-10-07',
    end: '2026-10-14',
  })
  let constrainedValue = $state<string | null>('2026-10-07')

  function isWeekend(date: Date): boolean {
    const day = date.getDay()
    return day === 0 || day === 6
  }
</script>

<Story
  name="Date"
  args={{ id: 'dp-date', label: 'Date', value: '2026-10-07' }}
  play={typesAndReformats}
>
  {#snippet template(args: any)}
    <DatePicker {...args} bind:value={dateValue} />
    <p style="margin-block-start:1em;">
      Bound value: <code>{dateValue}</code>
    </p>
  {/snippet}
</Story>

<Story
  name="Datetime with seconds"
  args={{
    id: 'dp-datetime',
    label: 'Date and time',
    mode: 'datetime',
    seconds: true,
    value: '2026-10-07T14:30:00',
  }}
>
  {#snippet template(args: any)}
    <DatePicker {...args} bind:value={datetimeValue} />
    <p style="margin-block-start:1em;">
      Bound value: <code>{datetimeValue}</code>
    </p>
  {/snippet}
</Story>

<Story
  name="Time"
  args={{ id: 'dp-time', label: 'Time', mode: 'time', value: '14:30' }}
>
  {#snippet template(args: any)}
    <DatePicker {...args} bind:value={timeValue} />
    <p style="margin-block-start:1em;">
      Bound value: <code>{timeValue}</code>
    </p>
  {/snippet}
</Story>

<Story name="Range">
  {#snippet template()}
    <DateRangePicker
      id="dp-range"
      label="Trip dates"
      bind:value={rangeValue}
      onchange={fn()}
    />
    <p style="margin-block-start:1em;">
      Bound value: <code>{JSON.stringify(rangeValue)}</code>
    </p>
  {/snippet}
</Story>

<!-- Weekends and dates outside October 2026 are unavailable. -->
<Story
  name="Constraints"
  args={{
    id: 'dp-constraints',
    label: 'Appointment',
    value: '2026-10-07',
    min: '2026-10-01',
    max: '2026-10-31',
  }}
>
  {#snippet template(args: any)}
    <DatePicker
      {...args}
      isDateDisabled={isWeekend}
      bind:value={constrainedValue}
    />
    <p style="margin-block-start:1em;">
      Bound value: <code>{constrainedValue}</code>
    </p>
  {/snippet}
</Story>
