<script lang="ts">
  import Button from '@lib/components/Button.svelte'
  import IconClose from '@lib/icons/20-close.svg?raw'

  interface Props {
    // Icon of the message box @type {string | undefined}
    icon?: string | undefined
    // Visual tone. 'warning' colors the border + icon with the accent color. @type {'neutral' | 'warning'}
    tone?: 'neutral' | 'warning'
    // HTML element of the container @type {HTMLDivElement | undefined}
    element?: HTMLDivElement | undefined
    // Content of the message box @type {Snippet | undefined}
    children?: import('svelte').Snippet
    // Optional snippet rendered on the right side for action buttons. @type {Snippet | undefined}
    actions?: import('svelte').Snippet
    // Event handler for when closing the message box @type {(e: MouseEvent) => void | undefined}
    onclose?: (e: MouseEvent) => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    icon = undefined,
    tone = 'neutral',
    element = $bindable(undefined),
    onclose = undefined,
    children,
    actions,
    class: className = '',
  }: Props = $props()
</script>

<div
  class="box {className}"
  class:warning={tone === 'warning'}
  bind:this={element}
>
  {#if icon}
    <div class="icon" aria-hidden="true">{@html icon}</div>
  {/if}
  <div class="content">{@render children?.()}</div>
  {#if actions}
    <div class="actions">{@render actions()}</div>
  {/if}
  {#if onclose}
    <Button small icon aria-label="close" variant="ghost" onclick={onclose}>
      {@html IconClose}
    </Button>
  {/if}
</div>

<style lang="sass">
.box
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: tint.$size-4 tint.$size-8
  border: 2px solid var(--tint-text-secondary)
  border-radius: tint.$size-8
  padding: tint.$size-8

.box.warning
  border-color: var(--tint-text-accent)

.icon
  color: var(--tint-text-secondary)
  line-height: 0
  width: tint.$size-32
  height: tint.$size-32
  display: flex
  align-items: center
  justify-content: center
  flex: 0 0 auto

.box.warning .icon
  color: var(--tint-text-accent)

.content
  // Hard `min-width: 60%` forces the actions onto a new row when there
  // isn't room for them alongside the message. Without it, flex would
  // shrink content past min-content rather than wrap.
  flex: 1 1 60%
  min-width: 60%
  margin-block: tint.$size-4 + 1px
  color: var(--tint-text-primary)

.actions
  display: flex
  align-items: center
  gap: tint.$size-4
  flex: 0 0 auto
  // Right-align when inline AND when wrapped to a new row alone.
  margin-inline-start: auto

@media (forced-colors: active)
  .box
    border-color: GrayText
    .icon
      color: GrayText
    .content
      color: ButtonText
  .box.warning
    border-color: CanvasText
    .icon
      color: CanvasText
</style>
