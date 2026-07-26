<script lang="ts">
  import Button from './Button.svelte'

  type T = $$Generic
  interface SegmentItem {
    value: T
    label?: string
    icon?: string
    'aria-label'?: string
    title?: string
    disabled?: boolean
    class?: string
    tooltip?: string
  }

  interface Props {
    // Id of the segmented control @type {string}
    id: string
    // Value of the current selected item (can use bind:value) @type {T | undefined}
    value: T | undefined
    // The items of the segmented control @type {SegmentItem[]}
    items: SegmentItem[]
    // Screen reader only label for the segmented control @type {string | undefined}
    label?: string | undefined
    // Id of an external element that labels this segmented control @type {string | undefined}
    'aria-labelledby'?: string | undefined
    // Disables the entire segmented control @type {boolean}
    disabled?: boolean
    // Use small version of the buttons @type {boolean}
    small?: boolean
    // Id of the element that describes the segmented control @type {string | undefined}
    'aria-describedby'?: string | undefined
    // HTML element of the segmented control container @type {HTMLFieldSetElement | undefined}
    element?: HTMLFieldSetElement | undefined
    // Event handler for when the value changes @type {(value: T) => void | undefined}
    onchange?: (value: T) => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    value = $bindable(),
    items,
    label = undefined,
    'aria-labelledby': ariaLabelledby = undefined,
    disabled = false,
    small = false,
    'aria-describedby': ariaDescribedby = undefined,
    element = $bindable(undefined),
    onchange = undefined,
    class: className = '',
  }: Props = $props()

  $effect.pre(() => {
    if (!label && !ariaLabelledby) {
      throw new Error(
        '[tint] You must provide either a label or ariaLabelledby for accessibility',
      )
    }

    if (label && ariaLabelledby) {
      throw new Error('[tint] You can not use both label and ariaLabelledby')
    }
  })

  // Track which button should be focusable
  let focusedIndex = $state<number>(0)
  let buttonElements: HTMLButtonElement[] = []

  // Update focused index when value changes
  $effect(() => {
    if (value !== undefined) {
      const selectedIndex = items.findIndex((item) => item.value === value)
      if (selectedIndex !== -1) {
        focusedIndex = selectedIndex
      }
    } else {
      // If no value is selected, focus the first non-disabled item
      const firstEnabledIndex = items.findIndex((item) => !item.disabled)
      focusedIndex = firstEnabledIndex !== -1 ? firstEnabledIndex : 0
    }
  })

  function handleSegmentClick(segmentValue: T, index: number) {
    if (disabled) return
    value = segmentValue
    focusedIndex = index
    onchange?.(segmentValue)
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (disabled) return

    const enabledItems = items
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => !item.disabled)

    const currentEnabledIndex = enabledItems.findIndex(
      (item) => item.originalIndex === index,
    )

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault()
        if (currentEnabledIndex > 0) {
          const prevIndex = currentEnabledIndex - 1
          const prevItem = enabledItems[prevIndex]
          focusedIndex = prevItem.originalIndex
          value = prevItem.value
          onchange?.(prevItem.value)
          buttonElements[prevItem.originalIndex]?.focus()
        }
        break
      }

      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault()
        if (currentEnabledIndex < enabledItems.length - 1) {
          const nextIndex = currentEnabledIndex + 1
          const nextItem = enabledItems[nextIndex]
          focusedIndex = nextItem.originalIndex
          value = nextItem.value
          onchange?.(nextItem.value)
          buttonElements[nextItem.originalIndex]?.focus()
        }
        break
      }

      case ' ':
      case 'Enter': {
        event.preventDefault()
        const currentItem = items[index]
        if (!currentItem.disabled) {
          value = currentItem.value
          focusedIndex = index
          onchange?.(currentItem.value)
        }
        break
      }
    }
  }

  function getSegmentId(index: number): string {
    return `${id}-segment-${index}`
  }
</script>

<fieldset
  {id}
  bind:this={element}
  class="segmented-control {className}"
  class:disabled
  class:small
  aria-describedby={ariaDescribedby}
  {disabled}
>
  {#if label}
    <legend class="tint--type-input-small visually-hidden">{label}</legend>
  {/if}
  <div class="segments" role="radiogroup" aria-labelledby={ariaLabelledby}>
    {#each items as item, index (item.value)}
      {@const isSelected = value === item.value}
      {@const isIconOnly = !!(item.icon && !item.label)}
      {@const shouldBeFocusable = focusedIndex === index}
      <Button
        id={getSegmentId(index)}
        variant={isSelected ? 'primary' : 'ghost'}
        {small}
        icon={isIconOnly}
        disabled={disabled || item.disabled}
        role="radio"
        aria-checked={isSelected}
        aria-label={item['aria-label'] || (isIconOnly ? item.title : undefined)}
        title={item.title}
        tabindex={shouldBeFocusable ? 0 : -1}
        onclick={() => handleSegmentClick(item.value, index)}
        onkeydown={(e) => handleKeyDown(e, index)}
        bind:element={buttonElements[index]}
        tooltip={item.tooltip}
        class={`segment ${item.class || ''}`}
      >
        {#if item.icon}
          {@html item.icon}
        {:else if item.label}
          {item.label}
        {/if}
      </Button>
    {/each}
  </div>
</fieldset>

<style>.segmented-control {
  border: none;
  padding: 0;
  margin: 0;
  background: none;
  width: 100%;
}
.segmented-control.disabled {
  opacity: 0.5;
}
.segmented-control.small .segments {
  border-radius: 24px;
}

.segments {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: stretch;
  padding: var(--tint-size-8);
  background-color: var(--tint-input-bg);
  border-radius: 20px;
}

:global(.segment) {
  flex: 1;
  min-width: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (forced-colors: active) {
  .segmented-control.disabled {
    opacity: 1;
    color: GrayText;
  }
  .segmented-control.disabled .segments {
    color: GrayText;
  }
}</style>
