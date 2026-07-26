<script lang="ts">
  import Slider from './Slider.svelte'
  import Label from './Label.svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    // Id of the slider element
    id: string
    // Current value of the slider (can use bind:value)
    value?: number
    // Minimum value
    min?: number
    // Maximum value
    max?: number
    // Step increment
    step?: number
    // Whether the slider is disabled
    disabled?: boolean
    // Whether to show stepper points
    showSteps?: boolean
    // Size variant: true for small (16px height, 12px thumb), false for large (32px height, 28px thumb)
    small?: boolean
    // Label text (used if no label slot provided)
    label?: string | undefined
    // Optional icon HTML for the label (used only with text label)
    icon?: string | undefined
    // Description text (used if no description slot provided)
    description?: string | undefined
    // HTML element of the slider
    element?: HTMLInputElement | undefined
    // Event handler for when the value changes
    onchange?: (event: { value: number }) => void
    // Event handler for input (continuous updates while dragging)
    oninput?: (event: { value: number }) => void
    // Label slot
    labelSlot?: Snippet
    // Description slot
    descriptionSlot?: Snippet
    // Additional content slot
    children?: Snippet
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showSteps = false,
    small = true,
    label = undefined,
    icon = undefined,
    description = undefined,
    element = $bindable(undefined),
    onchange = undefined,
    oninput = undefined,
    labelSlot,
    descriptionSlot,
    children,
    class: className = '',
  }: Props = $props()

  // Generate IDs for accessibility
  const labelId = $derived(`${id}-label`)
  const descriptionId = $derived(
    description || descriptionSlot ? `${id}-description` : undefined,
  )
</script>

<div class="labeled-slider {className}">
  <Label
    for={id}
    id={labelId}
    {label}
    {icon}
    {description}
    {descriptionId}
    {labelSlot}
    {descriptionSlot}
    {disabled}
  >
    {#if children}
      {@render children()}
    {/if}
  </Label>

  <Slider
    {id}
    bind:value
    {min}
    {max}
    {step}
    {disabled}
    {showSteps}
    {small}
    aria-labelledby={labelId}
    aria-describedby={descriptionId}
    bind:element
    {onchange}
    {oninput}
  />
</div>

<style lang="sass">
.labeled-slider
  display: grid
  gap: var(--tint-size-8)
</style>
