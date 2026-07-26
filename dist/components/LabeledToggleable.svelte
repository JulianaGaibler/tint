<script lang="ts" generics="T">
  import Toggleable from './Toggleable.svelte'
  import Label from './Label.svelte'
  import type { Snippet } from 'svelte'
  import type { GroupStore } from '../stores/index.js'

  interface Props {
    // Id of the toggleable element
    id: string
    // Type of the toggleable element
    type?: 'checkbox' | 'radio' | 'switch'
    // Whether the toggleable element is checked (can use bind:checked)
    checked?: boolean
    // Whether the toggleable element is disabled
    disabled?: boolean
    // Value of the toggleable element (for use with group store)
    value?: T
    // Group store for radio/checkbox groups
    groupStore?: GroupStore<T>
    // Label text (used if no label slot provided)
    label?: string | undefined
    // Optional icon HTML for the label (used only with text label)
    icon?: string | undefined
    // Description text (used if no description slot provided)
    description?: string | undefined
    // HTML element of the toggleable element
    element?: HTMLInputElement | HTMLButtonElement | undefined
    // Event handler for when the value changes
    onchange?: (event: {
      checked: boolean
      value?: T
      groupValue?: GroupStore<T>
    }) => void
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
    type = 'checkbox',
    checked = $bindable(),
    disabled = false,
    value = undefined,
    groupStore = undefined,
    label = undefined,
    icon = undefined,
    description = undefined,
    element = $bindable(undefined),
    onchange = undefined,
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

<div class="labeled-toggleable {className}">
  <Toggleable
    {id}
    {type}
    bind:checked
    {disabled}
    {value}
    {groupStore}
    aria-labelledby={labelId}
    aria-describedby={descriptionId}
    bind:element
    {onchange}
  />

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
</div>

<style>.labeled-toggleable {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--tint-size-12);
  align-items: start;
}

:global(.labeled-toggleable .toggleable) {
  margin-block-start: 0.125em;
}</style>
