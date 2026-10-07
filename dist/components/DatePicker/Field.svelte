<script lang="ts">
  import type { Snippet } from 'svelte'
  import { untrack } from 'svelte'
  import Button from '../Button.svelte'
  import IconWarning from '../../icons/20-warning.svg?raw'
  // TODO: swap for a dedicated 20-clock.svg once one exists. The date icon
  // reads fine for a time-only field too, since nothing in the set is clock
  // shaped yet.
  import IconDate from '../../icons/20-date.svg?raw'
  import { generateUniqueId } from '../../actions/utils.js'

  interface Props {
    /** Floating label above the field. */
    label: string
    /** Whether to render the label raised, as if the field held a value. */
    filled: boolean
    helperText?: string
    error?: string
    fillWidth?: boolean
    disabled?: boolean
    id?: string
    /** Name for native form serialization. Paired with `serializedValue`. */
    name?: string
    /** The hidden input's value when `name` is set. */
    serializedValue?: string
    isOpen: boolean
    triggerLabel: string
    onTriggerClick: () => void
    /** Bindable ref to the trigger button, used to anchor the popover. */
    triggerElement?: HTMLButtonElement
    'aria-describedby'?: string
    class?: string
    /** The field's segment group or groups. */
    children: Snippet<[{ labelId: string; describedBy: string | undefined }]>
  }

  let {
    label,
    filled,
    helperText = undefined,
    error = undefined,
    fillWidth = true,
    disabled = false,
    id = undefined,
    name = undefined,
    serializedValue = undefined,
    isOpen,
    triggerLabel,
    onTriggerClick,
    triggerElement = $bindable(undefined),
    'aria-describedby': ariaDescribedby = undefined,
    class: className = '',
    children,
  }: Props = $props()

  $effect.pre(() => {
    if (helperText && ariaDescribedby) {
      throw new Error('[tint] cannot use both helperText and aria-describedby')
    }
  })

  // One-time ids, not meant to track `id` if a caller ever changed it live.
  const labelId = untrack(() =>
    id ? `${id}-label` : generateUniqueId('datepicker-label'),
  )
  const helperId = generateUniqueId('datepicker-helper')
  const describedBy = $derived(
    ariaDescribedby || (helperText || error ? helperId : undefined),
  )
</script>

<div class:error class:disabled class:fillWidth>
  <div class="box {className}">
    <div class="shell" class:filled>
      {@render children({ labelId, describedBy })}
      <Button
        bind:element={triggerElement}
        icon
        small
        variant="ghost"
        class="trigger"
        {disabled}
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onclick={onTriggerClick}
      >
        {@html IconDate}
      </Button>
    </div>
    <span id={labelId} class="tint--type-input-small label">{label}</span>

    {#if error}
      <span aria-hidden="true" class="warning-icon">{@html IconWarning}</span>
    {/if}

    {#if name}
      <input type="hidden" {name} value={serializedValue ?? ''} />
    {/if}
  </div>

  {#if helperText || error}
    <div id={helperId} class="helper-message tint--type-input-small">
      {error || helperText}
    </div>
  {/if}
</div>

<style>.disabled {
  opacity: 0.5;
}

.fillWidth {
  width: 100%;
}

.box {
  position: relative;
  height: var(--tint-size-48);
  line-height: normal;
}

.shell {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tint-size-12);
  background-color: var(--tint-input-bg);
  border-radius: var(--tint-radius-input);
  border: 2px solid transparent;
  width: 100%;
  height: 100%;
  padding-block: calc(var(--tint-size-12) + 7px) calc(var(--tint-size-12) - 7px);
  padding-inline: var(--tint-size-12);
  padding-inline-end: var(--tint-size-8);
}
.shell:focus-within {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .shell:focus-within {
    outline-color: CanvasText;
  }
}
.shell > :global(.trigger) {
  margin-inline-start: auto;
  flex-shrink: 0;
}

.label {
  color: var(--tint-text-secondary);
  position: absolute;
  inset-inline-start: var(--tint-size-12);
  inset-block-start: 50%;
  transform: translateY(-55%) scale(1.166);
  transform-origin: left top;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms;
  pointer-events: none;
}

.shell.filled + .label {
  transform: translateY(-106%) scale(1);
}

.helper-message {
  line-height: normal;
  color: var(--tint-text-secondary);
  padding-block: 0;
  padding-inline: var(--tint-size-12);
  padding-block-start: var(--tint-size-4);
}

.warning-icon {
  pointer-events: none;
  position: absolute;
  line-height: 0;
  inset-inline-end: var(--tint-size-48);
  inset-block-start: 0;
  margin: calc(var(--tint-size-12) + var(--tint-size-2));
  color: var(--tint-text-accent);
}

@media (forced-colors: active) {
  .shell {
    border-color: ButtonText;
  }
  .disabled {
    opacity: 1;
    color: GrayText;
  }
  .disabled .shell, .disabled .label {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }
  .disabled .helper-message {
    color: GrayText;
  }
}</style>
