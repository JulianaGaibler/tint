<script lang="ts">
  import Button from './Button.svelte'
  import IconClose from '../icons/20-close.svg?raw'

  interface Props {
    // Icon of the message box @type {string | undefined}
    icon?: string | undefined
    // HTML element of the container @type {HTMLDivElement | undefined}
    element?: HTMLDivElement | undefined
    // Content of the message box @type {Snippet | undefined}
    children?: import('svelte').Snippet
    // Optional snippet rendered on the right side for action buttons. @type {Snippet | undefined}
    actions?: import('svelte').Snippet
    // Whether to show the close button. @type {boolean}
    dismissable?: boolean
    // Event handler for when closing the message box @type {(e: MouseEvent) => void | undefined}
    onclose?: (e: MouseEvent) => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    icon = undefined,
    element = $bindable(undefined),
    dismissable = true,
    onclose = undefined,
    children,
    actions,
    class: className = '',
  }: Props = $props()

  let showClose = $derived(dismissable && !!onclose)
</script>

<div
  class="box {className}"
  class:no-icon={!icon}
  class:no-close={!showClose}
  bind:this={element}
>
  {#if icon}
    <!-- Own column so its inline-end border draws a full-height divider. -->
    <div class="aside" aria-hidden="true">
      <div class="icon">{@html icon}</div>
    </div>
  {/if}
  <div class="main">
    <div class="content">{@render children?.()}</div>
    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
    {#if showClose}
      <Button small icon aria-label="close" variant="ghost" onclick={onclose}>
        {@html IconClose}
      </Button>
    {/if}
  </div>
</div>

<style>.box {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--tint-card-border);
  border-radius: var(--tint-radius-card);
  background: var(--tint-bg-secondary);
  overflow: clip;
}

.aside {
  display: flex;
  align-items: flex-start;
  flex: 0 0 auto;
  padding: var(--tint-size-8);
  border-inline-end: 1px solid var(--tint-card-border);
  background: var(--tint--message-box-aside-bg, transparent);
}

.icon {
  color: var(--tint-text-secondary);
  line-height: 0;
  width: var(--tint-size-32);
  height: var(--tint-size-32);
  display: flex;
  align-items: center;
  justify-content: center;
}

.main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--tint-size-4) var(--tint-size-8);
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--tint-size-8);
  padding-inline-start: var(--tint-size-16);
}

.box.no-close .main {
  padding-inline-end: var(--tint-size-16);
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
  .box .aside {
    border-color: GrayText;
  }
  .box .icon {
    color: GrayText;
  }
  .box .content {
    color: ButtonText;
  }
  .box .aside {
    border-color: CanvasText;
  }
  .box .icon {
    color: CanvasText;
  }
}</style>
