<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    // ID of the element this label is for
    for: string
    // ID of the label element (for aria-labelledby)
    id: string
    // Label text (used if no labelSlot provided)
    label?: string | undefined
    // Optional icon HTML for the label (used only with text label)
    icon?: string | undefined
    // Description text (used if no descriptionSlot provided)
    description?: string | undefined
    // ID of the description element (for aria-describedby)
    descriptionId?: string | undefined
    // Label slot
    labelSlot?: Snippet
    // Description slot
    descriptionSlot?: Snippet
    // Additional content slot
    children?: Snippet
    // Whether the label is disabled
    disabled?: boolean
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    for: forId,
    id,
    label = undefined,
    icon = undefined,
    description = undefined,
    descriptionId = undefined,
    labelSlot,
    descriptionSlot,
    children,
    disabled = false,
    class: className = '',
  }: Props = $props()
</script>

<div class="label-content {className}" class:disabled>
  <label for={forId} {id} class="label tint--type-ui">
    {#if labelSlot}
      <span>{@render labelSlot()}</span>
    {:else if label}
      {#if icon}
        <span class="icon" aria-hidden="true">{@html icon}</span>
      {/if}
      <span class="text">{label}</span>
    {/if}
  </label>

  {#if description || descriptionSlot}
    <div id={descriptionId} class="description tint--type-ui-small">
      {#if descriptionSlot}
        {@render descriptionSlot()}
      {:else if description}
        {description}
      {/if}
    </div>
  {/if}

  {#if children}
    <div class="additional-content">
      {@render children()}
    </div>
  {/if}
</div>

<style>.label-content {
  display: grid;
}

.label {
  display: flex;
  align-items: center;
  gap: var(--tint-size-8);
  font-weight: var(--tint-font-weight-sans-regular);
  color: var(--tint-text-primary);
  cursor: pointer;
}
.label .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.label .icon :global(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
.label .text {
  line-height: 1.4;
}

.description {
  color: var(--tint-text-secondary);
  line-height: 1.4;
}

.additional-content {
  margin-block-start: var(--tint-size-4);
}

.label-content.disabled .label {
  color: var(--tint-text-disabled);
  cursor: not-allowed;
}
.label-content.disabled .description {
  color: var(--tint-text-disabled);
}</style>
