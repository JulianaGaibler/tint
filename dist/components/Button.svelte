<script lang="ts">
  import type {
    HTMLButtonAttributes,
    HTMLAnchorAttributes,
  } from 'svelte/elements'
  import LoadingIndicator from './LoadingIndicator.svelte'
  import { tooltip } from '../actions'

  type Props = HTMLButtonAttributes &
    HTMLAnchorAttributes & {
      // Type of the button. Valid values are @type {'primary' | 'secondary' | 'ghost'}
      variant?: 'primary' | 'secondary' | 'ghost'
      // Use small version of the button
      small?: boolean
      // Expects an icon to be passed in the slot if true
      icon?: boolean
      // If true or false, the button will be a toggle button @type {boolean | undefined}
      toggled?: boolean | undefined
      // Text to show in a tooltip when hovering over the button @type {string | undefined}
      tooltip?: string | undefined
      // If href is provided, this will open the link in a new tab
      external?: boolean
      // Disables the button
      disabled?: boolean
      // Shows loading state for buttons (has no effect on links)
      loading?: boolean
      // If true, the button will be of type submit
      submit?: boolean
      // aria-label of the button @type {string | undefined}
      title?: string | undefined
      // ARIA label of the button @type {string | undefined}
      'aria-label'?: string | undefined
      // tabindex of the button @type {number | undefined}
      tabindex?: number | undefined
      // ARIA role override @type {string | undefined}
      role?: string | undefined
      // ARIA checked state for radio buttons @type {boolean | undefined}
      'aria-checked'?: boolean | undefined
      // HTML element of the button @type {HTMLButtonElement | HTMLAnchorElement | HTMLSpanElement | undefined}
      element?:
        | HTMLButtonElement
        | HTMLAnchorElement
        | HTMLSpanElement
        | undefined
      // Content of the button @type {Snippet | undefined}
      children?: import('svelte').Snippet
      // Click event handler @type {(e: MouseEvent) => void | undefined}
      onclick?: (e: MouseEvent) => void
      // A space separated list of CSS classes.
      class?: string
    }

  let {
    variant = 'secondary',
    small = false,
    icon = false,
    toggled = undefined,
    href = undefined,
    external = false,
    download = undefined,
    disabled = false,
    loading = false,
    submit = false,
    formmethod = undefined,
    title = undefined,
    'aria-label': ariaLabel = undefined,
    tabindex = undefined,
    role: roleOverride = undefined,
    'aria-checked': ariaChecked = undefined,
    element = $bindable(undefined),
    children,
    onclick = undefined,
    onkeypress = undefined,
    onkeydown = undefined,
    tooltip: tooltipText = undefined,
    class: className = '',
    ...elementProps
  }: Props = $props()

  $effect.pre(() => {
    if (icon && !title && !ariaLabel && !tooltipText) {
      throw new Error(
        '[tint] Icon buttons need at least a title, aria-label, or tooltip',
      )
    }
    if (variant === 'primary' && toggled !== undefined) {
      throw new Error('[tint] Primary buttons cannot be toggled')
    }
    if (href && toggled !== undefined) {
      throw new Error('[tint] Links cannot be toggled')
    }
  })

  let role = $derived(
    roleOverride || (toggled !== undefined ? 'switch' : undefined),
  )
  let ariaPressed = $derived(toggled !== undefined ? toggled : undefined)
  let _variant = $derived(
    toggled === undefined ? variant : toggled ? 'primary' : variant,
  )

  // For buttons, disable when loading. For links, loading has no effect
  let isDisabled = $derived(href ? disabled : disabled || loading)
  let loadingSize = $derived<16 | 24>(small ? 16 : 24)
</script>

{#if href && disabled}
  <span
    {title}
    aria-disabled="true"
    aria-label={ariaLabel}
    bind:this={element}
    use:tooltip={tooltipText}
    class:icon
    class:small
    class={`tint--button tint--type-action ${_variant} ${className}`}
    {...elementProps as Record<string, unknown>}>{@render children?.()}</span
  >
{:else if href}
  <a
    {download}
    {href}
    {tabindex}
    {title}
    aria-label={ariaLabel}
    bind:this={element}
    use:tooltip={tooltipText}
    class:icon
    class:small
    class={`tint--button tint--type-action ${_variant} ${className}`}
    rel={external ? 'noopener' : undefined}
    target={external ? '_blank' : undefined}
    {...elementProps}>{@render children?.()}</a
  >
{:else}
  <button
    disabled={isDisabled}
    {role}
    {tabindex}
    {title}
    {formmethod}
    aria-label={ariaLabel}
    aria-pressed={ariaPressed}
    aria-checked={ariaChecked}
    bind:this={element}
    class:icon
    class:small
    class:loading
    class={`tint--button tint--type-action ${_variant} ${className}`}
    {onclick}
    {onkeypress}
    {onkeydown}
    use:tooltip={tooltipText}
    type={submit ? 'submit' : 'button'}
    {...elementProps}
  >
    <span class="button-content" class:visually-hidden={loading}>
      {@render children?.()}
    </span>
    {#if loading}
      <div class="loading-overlay">
        <LoadingIndicator size={loadingSize} />
      </div>
    {/if}
  </button>
{/if}

<style>a.tint--button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--tint-action-secondary-text);
  text-decoration: none;
}

.tint--button {
  vertical-align: top;
  box-sizing: border-box;
  min-height: var(--tint-size-48);
  padding: var(--tint-size-8) var(--tint-size-24);
  background-color: transparent;
  border: var(--tint-border-width) solid var(--tint-action-secondary);
  color: var(--tint-action-secondary-text);
  border-radius: var(--tint-radius-button);
  flex-shrink: 0;
}
.tint--button:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .tint--button:focus-visible {
    outline-color: CanvasText;
  }
}
.tint--button > :global(*) {
  pointer-events: none;
}
.tint--button.icon {
  padding: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: var(--tint-size-48);
  height: var(--tint-size-48);
}
.tint--button.small {
  min-height: var(--tint-size-32);
  padding: var(--tint-size-2) var(--tint-size-16);
  border-radius: var(--tint-radius-button-pill);
}
.tint--button.small.icon {
  padding: 0;
  width: var(--tint-size-32);
  height: var(--tint-size-32);
}
@media (forced-colors: none), (prefers-contrast: no-preference) {
  .tint--button:global(.ghost) {
    border-color: transparent;
    outline-offset: 0;
  }
}

button.tint--button {
  position: relative;
}
button.tint--button.loading {
  pointer-events: none;
}
button.tint--button .button-content {
  display: inherit;
}
button.tint--button .button-content.visually-hidden {
  opacity: 0;
}
button.tint--button .loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

button.tint--button:not(:disabled):hover, a.tint--button:not(:disabled):hover {
  background-color: var(--tint-action-secondary-hover);
}
button.tint--button:not(:disabled):active, a.tint--button:not(:disabled):active {
  background-color: var(--tint-action-secondary-active);
}
button.tint--button:global(.primary), a.tint--button:global(.primary) {
  background-color: var(--tint-action-primary);
  border-color: transparent;
  color: var(--tint-action-primary-text);
}
button.tint--button:global(.primary):not(:disabled):hover, a.tint--button:global(.primary):not(:disabled):hover {
  background-color: var(--tint-action-primary-hover);
}
button.tint--button:global(.primary):not(:disabled):active, a.tint--button:global(.primary):not(:disabled):active {
  background-color: var(--tint-action-primary-active);
}

button.tint--button:disabled, a:disabled, span.tint--button {
  opacity: 0.5;
}

@media (forced-colors: active) {
  button.tint--button, a.tint--button {
    forced-color-adjust: none;
    background-color: ButtonFace;
    border-color: ButtonText;
    color: ButtonText;
  }
  button.tint--button:not(:disabled):hover, button.tint--button:not(:disabled):active, a.tint--button:not(:disabled):hover, a.tint--button:not(:disabled):active {
    background-color: SelectedItemText;
    border-color: SelectedItem;
    color: SelectedItem;
  }
  button.tint--button:not(:disabled):active, a.tint--button:not(:disabled):active {
    border-color: ButtonText;
  }
  button.tint--button:disabled, a.tint--button:disabled {
    opacity: 1;
    background-color: ButtonFace;
    border: 2px solid GrayText;
    color: GrayText;
  }
  button.tint--button:global(.primary), a.tint--button:global(.primary) {
    background-color: ButtonText;
    border: 2px solid ButtonFace;
    color: ButtonFace;
  }
  button.tint--button:global(.primary):not(:disabled):hover, button.tint--button:global(.primary):not(:disabled):active, a.tint--button:global(.primary):not(:disabled):hover, a.tint--button:global(.primary):not(:disabled):active {
    background-color: SelectedItem;
    border-color: SelectedItemText;
    color: SelectedItemText;
  }
  button.tint--button:global(.primary):not(:disabled):active, a.tint--button:global(.primary):not(:disabled):active {
    border-color: SelectedItem;
  }
  button.tint--button:global(.primary):disabled, a.tint--button:global(.primary):disabled {
    background-color: GrayText;
    border: 2px solid ButtonFace;
    color: ButtonFace;
  }
}</style>
