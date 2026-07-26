<script lang="ts">
  import Button from './Button.svelte'
  import IconClose from '../icons/20-close.svg?raw'

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

<style>.box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tint-size-4) var(--tint-size-8);
  border: 2px solid var(--tint-text-secondary);
  border-radius: var(--tint-radius-card);
  padding: var(--tint-size-8);
}

.box.warning {
  border-color: var(--tint-text-accent);
}

.icon {
  color: var(--tint-text-secondary);
  line-height: 0;
  width: var(--tint-size-32);
  height: var(--tint-size-32);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.box.warning .icon {
  color: var(--tint-text-accent);
}

.content {
  flex: 1 1 60%;
  min-width: 60%;
  margin-block: calc(var(--tint-size-4) + 1px);
  color: var(--tint-text-primary);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--tint-size-4);
  flex: 0 0 auto;
  margin-inline-start: auto;
}

@media (forced-colors: active) {
  .box {
    border-color: GrayText;
  }
  .box .icon {
    color: GrayText;
  }
  .box .content {
    color: ButtonText;
  }
  .box.warning {
    border-color: CanvasText;
  }
  .box.warning .icon {
    color: CanvasText;
  }
}</style>
