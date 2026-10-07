<script lang="ts">
  interface Props {
    hour: number | null
    minute: number | null
    second: number | null
    hourCycle: 12 | 24
    seconds: boolean
    /**
     * Spacing between listed minutes and seconds. Default 1, every minute. The
     * field's own segments always accept any value regardless; this only limits
     * what the list offers, for a caller content with coarser steps such as
     * 15.
     */
    minuteStep?: number
    locale?: string
    onPickHour: (hour: number) => void
    onPickMinute: (minute: number) => void
    onPickSecond: (second: number) => void
  }

  let {
    hour,
    minute,
    second,
    hourCycle,
    seconds,
    minuteStep = 1,
    locale = undefined,
    onPickHour,
    onPickMinute,
    onPickSecond,
  }: Props = $props()

  const hourOptions = Array.from({ length: 24 }, (_, h) => h)
  const minuteOptions = $derived(
    Array.from(
      { length: Math.ceil(60 / minuteStep) },
      (_, i) => i * minuteStep,
    ),
  )

  const hourFormatter = $derived(
    new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hour12: hourCycle === 12,
    }),
  )

  function hourLabel(h: number): string {
    return hourFormatter.format(new Date(2000, 0, 1, h))
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0')
  }

  interface ColumnProps {
    label: string
    options: number[]
    value: number | null
    formatOption: (n: number) => string
    onPick: (n: number) => void
  }

  function closestIndex(options: number[], value: number | null): number {
    if (value === null) return 0
    let best = 0
    for (let i = 1; i < options.length; i++) {
      if (Math.abs(options[i] - value) < Math.abs(options[best] - value))
        best = i
    }
    return best
  }
</script>

{#snippet column(p: ColumnProps)}
  {@const focusedIndex = closestIndex(p.options, p.value)}
  <div class="column">
    <span class="column-label tint--type-input-small">{p.label}</span>
    <div role="listbox" aria-label={p.label} class="list">
      {#each p.options as option, index (option)}
        {@const isSelected = p.value === option}
        <button
          type="button"
          role="option"
          class="option"
          class:selected={isSelected}
          aria-selected={isSelected}
          tabindex={index === focusedIndex ? 0 : -1}
          onclick={() => p.onPick(option)}
          onkeydown={(e) => {
            if (
              e.key !== 'ArrowUp' &&
              e.key !== 'ArrowDown' &&
              e.key !== 'Home' &&
              e.key !== 'End'
            )
              return
            e.preventDefault()
            const list = e.currentTarget.parentElement
            const next =
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? p.options.length - 1
                  : (((index + (e.key === 'ArrowDown' ? 1 : -1)) %
                      p.options.length) +
                      p.options.length) %
                    p.options.length
            const target = list?.children[next] as HTMLElement | undefined
            target?.focus()
          }}>{p.formatOption(option)}</button
        >
      {/each}
    </div>
  </div>
{/snippet}

<div class="time-list">
  {@render column({
    label: 'Hour',
    options: hourOptions,
    value: hour,
    formatOption: hourLabel,
    onPick: onPickHour,
  })}
  {@render column({
    label: 'Minute',
    options: minuteOptions,
    value: minute,
    formatOption: pad,
    onPick: onPickMinute,
  })}
  {#if seconds}
    {@render column({
      label: 'Second',
      options: minuteOptions,
      value: second,
      formatOption: pad,
      onPick: onPickSecond,
    })}
  {/if}
</div>

<style>.time-list {
  display: flex;
  gap: var(--tint-size-4);
  max-height: 12rem;
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.column-label {
  color: var(--tint-text-secondary);
  text-align: center;
  padding-block-end: var(--tint-size-4);
}

.list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  scrollbar-width: thin;
  scrollbar-color: var(--tint-text-secondary) transparent;
}
.list::-webkit-scrollbar {
  width: var(--tint-size-8);
  height: var(--tint-size-8);
}
.list::-webkit-scrollbar-track {
  background: transparent;
}
.list::-webkit-scrollbar-thumb {
  background-color: var(--tint-text-secondary);
  border-radius: var(--tint-size-8);
}
.list::-webkit-scrollbar-thumb:hover {
  background-color: var(--tint-text);
}

.option {
  appearance: none;
  box-sizing: border-box;
  background: none;
  border: none;
  border-radius: var(--tint-radius-button);
  padding-block: var(--tint-size-4);
  text-align: center;
  color: currentColor;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.option:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .option:focus-visible {
    outline-color: CanvasText;
  }
}
.option:hover {
  background-color: var(--tint-action-secondary-hover);
}
.option.selected {
  background-color: var(--tint-action-primary);
  color: var(--tint-action-primary-text);
}

@media (forced-colors: active) {
  .option.selected {
    outline: 2px solid Highlight;
  }
}</style>
