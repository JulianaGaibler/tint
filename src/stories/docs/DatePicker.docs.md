A date, datetime, or time field with typed segments and a calendar popover. Bind `value` and choose `mode`: `date` (the default), `datetime`, or `time`. `format` controls `value`'s shape: the default `iso` returns a local wall clock string, `date` returns a `Date`, and `timestamp` returns milliseconds. `value` is `null` while the field is empty.

The field has no way to know a browser's preferred date order or clock, only its locale, so a gear icon button in the popover opens a settings modal where a person sets day, month, year order and 12 or 24 hour time. That choice is shared by every DatePicker in the app, stored under the `tint:date-format` key.

```svelte
<script>
  import { DatePicker } from 'tint'
  let value = $state('2026-10-07')
</script>

<DatePicker label="Date" bind:value />
```

`min`, `max`, and `isDateDisabled` constrain which dates can be set. A typed value outside `min`/`max` clamps to the nearest bound, and one `isDateDisabled` rejects reverts to the last valid value, both announced to assistive tech.

`DateRangePicker` pairs a start and an end field, sharing one popover. It covers `date` mode only. Clicking a day fills whichever end was last focused and moves to the other, so fixing one end does not disturb the other, and picking an end before the start swaps the two rather than producing a backward range.

```svelte
<script>
  import { DateRangePicker } from 'tint'
  let value = $state({ start: null, end: null })
</script>

<DateRangePicker label="Trip dates" bind:value />
```
