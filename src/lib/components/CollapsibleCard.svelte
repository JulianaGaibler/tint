<script lang="ts">
  import IconChevron from '@lib/icons/20-chevron-down.svg?raw'

  interface Props {
    // Whether the card is expanded. @type {boolean}
    open?: boolean
    // Background variant. @type {'bg' | 'bg-secondary'}
    variant?: 'bg' | 'bg-secondary'
    // Pads the body to match the summary. Set false for edge-to-edge content. @type {boolean}
    padded?: boolean
    // HTML element of the container @type {HTMLDivElement | undefined}
    element?: HTMLDivElement | undefined
    // Summary label shown in the top row. @type {Snippet | undefined}
    summary?: import('svelte').Snippet
    // Body content, revealed when the card is open. @type {Snippet | undefined}
    children?: import('svelte').Snippet
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    open = $bindable(false),
    variant = 'bg',
    padded = true,
    element = $bindable(undefined),
    summary,
    children,
    class: className = '',
  }: Props = $props()
</script>

<div
  class="card {className}"
  class:secondary={variant === 'bg-secondary'}
  class:padded
  bind:this={element}
>
  <details bind:open>
    <summary class="summary">
      <div class="chevron" aria-hidden="true">{@html IconChevron}</div>
      <div class="summary-text">{@render summary?.()}</div>
    </summary>
    <div class="separator" aria-hidden="true"></div>
    <div class="body">{@render children?.()}</div>
  </details>
</div>

<style lang="sass">
.card
  display: block
  border: 1px solid var(--tint-card-border)
  border-radius: var(--tint-radius-card)
  background: var(--tint-bg)
  color: var(--tint-text-primary)
  overflow: clip

.card.secondary
  background: var(--tint-bg-secondary)

.summary
  display: flex
  align-items: center
  gap: var(--tint-size-8)
  padding-block: var(--tint-size-12)
  padding-inline: var(--tint-size-16)
  cursor: pointer
  user-select: none
  // Remove the native disclosure triangle.
  list-style: none
  &::-webkit-details-marker
    display: none
  &:hover
    background: color-mix(in srgb, transparent, var(--tint-text) 6%)
  // Inset so the ring stays visible despite the card's `overflow: clip`.
  &:focus-visible
    outline: 2px solid var(--tint-action-primary)
    outline-offset: -2px
    @media (forced-colors: active)
      outline-color: CanvasText

.chevron
  flex: 0 0 auto
  inline-size: var(--tint-size-16)
  block-size: var(--tint-size-16)
  line-height: 0
  color: var(--tint-text-secondary)
  transition: transform 0.2s ease
  :global(svg)
    inline-size: 100%
    block-size: 100%

details[open] .chevron
  transform: rotate(180deg)

.summary-text
  flex: 1 1 auto
  min-inline-size: 0

.separator
  border-block-start: 1px solid var(--tint-card-border)

.body
  padding: 0

.card.padded .body
  padding-block: var(--tint-size-12)
  padding-inline: var(--tint-size-16)

@media (forced-colors: active)
  .card
    border-color: GrayText
  .separator
    border-color: GrayText
  .chevron
    color: CanvasText
</style>
