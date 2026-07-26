<script lang="ts" module>
  export const SELECT_SEPARATOR = Symbol('separator')
</script>

<script lang="ts">
  import type { HTMLSelectAttributes } from 'svelte/elements'
  import IconWarning from '../icons/20-warning.svg?raw'
  import IconDropdown from '../icons/14-dropdown.svg?raw'

  type T = $$Generic
  interface SelectItem {
    value: T
    label: string
    disabled?: boolean
  }

  interface Props extends HTMLSelectAttributes {
    // Value of the current selected item (can use bind:value) @type {string|undefined}
    value: T | undefined
    // The items of the select @type {(SelectItem | typeof SELECT_SEPARATOR)[]}
    items: (SelectItem | typeof SELECT_SEPARATOR)[]
    // The label of the select @type {string}
    label: string
    // Adds a helper text to the select @type {string|undefined}
    helperText?: string | undefined
    // Marks the select as invalid and adds the error text and icon @type {string|undefined}
    error?: string | undefined
    // Fills the width of the parent container @type {boolean}
    fillWidth?: boolean
    // HTML element of the select @type {HTMLSelectElement | undefined}
    element?: HTMLSelectElement | undefined
    // Event handler for when the value changes @type {(e: Event) => void|undefined}
    onchange?: (e: Event) => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    value = $bindable(),
    items,
    label,
    helperText = undefined,
    error = undefined,
    fillWidth = true,
    element = $bindable(undefined),
    onchange = undefined,
    disabled = false,
    id = undefined,
    class: className = '',
    'aria-describedby': ariaDescribedby = undefined,
    ...elementProps
  }: Props = $props()

  $effect.pre(() => {
    if (helperText && ariaDescribedby) {
      throw new Error(
        '[tint] You can not use both helperText and aria-describedby',
      )
    }
  })

  function noValue(val: T | undefined) {
    return val === undefined || val === ''
  }
</script>

<div class:error class:disabled class:fillWidth>
  <div class="box {className}">
    <select
      aria-describedby={ariaDescribedby || helperText
        ? 'textfield-helpertext'
        : undefined}
      aria-errormessage={error ? 'textfield-helpertext' : undefined}
      aria-invalid={error ? 'true' : undefined}
      bind:this={element}
      bind:value
      {onchange}
      {disabled}
      {id}
      class:filled={!noValue(value)}
      class="input tint--type-input"
      {...elementProps}
    >
      {#if noValue(value)}
        <option value="" disabled selected hidden></option>
      {/if}
      {#each items as item, i (item === SELECT_SEPARATOR ? `sep-${i}` : item.value)}
        {#if item === SELECT_SEPARATOR}
          <hr />
        {:else}
          <option value={item.value} disabled={item.disabled}
            >{item.label}</option
          >
        {/if}
      {/each}
    </select>
    <label class="tint--type-input-small" for={id}>{label}</label>
    {#if error}
      <span aria-hidden="true" class="warning-icon">{@html IconWarning}</span>
    {/if}
    <span aria-hidden="true" class="dropdown">{@html IconDropdown}</span>
  </div>
  {#if helperText || error}
    <div
      id="textfield-helpertext"
      class="helper-message tint--type-input-small"
    >
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
.box > .input {
  appearance: none;
  box-sizing: border-box;
  background-color: var(--tint-input-bg);
  color: currentColor;
  border-radius: var(--tint-radius-input);
  border: 2px solid transparent;
  width: 100%;
  height: 100%;
  margin: 0;
  padding-block: calc(var(--tint-size-12) + 7px) calc(var(--tint-size-12) - 7px);
  padding-inline: var(--tint-size-12);
  padding-inline-end: calc(var(--tint-size-8) * 3 + var(--tint-size-32));
}
.box > .input:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .box > .input:focus-visible {
    outline-color: CanvasText;
  }
}
.box > label {
  color: var(--tint-text-secondary);
  position: absolute;
  inset-inline-start: var(--tint-size-12);
  inset-inline-end: initial;
  inset-block-start: 50%;
  transform: translateY(-55%) scale(1.166);
  transform-origin: left top;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms;
  pointer-events: none;
}

.input.filled + label, .input:-webkit-autofill + label {
  transform: translateY(-106%) scale(1);
}

.input:autofill + label {
  transform: translateY(-106%) scale(1);
}

.helper-message {
  line-height: normal;
  color: var(--tint-text-secondary);
  padding-block: 0;
  padding-inline: var(--tint-size-12);
  padding-block-start: var(--tint-size-4);
}

.warning-icon, .dropdown {
  pointer-events: none;
  position: absolute;
  line-height: 0;
  inset-inline-end: 0;
  inset-block-start: 0;
  margin-block: var(--tint-size-16);
  margin-inline: var(--tint-size-12);
  color: var(--tint-text-secondary);
}

.warning-icon {
  margin: calc(var(--tint-size-12) + var(--tint-size-2));
  inset-inline-end: var(--tint-size-16);
  color: var(--tint-text-accent);
}

@media (forced-colors: active) {
  .box > .input {
    border-color: ButtonText;
  }
  .disabled {
    opacity: 1;
    color: GrayText;
  }
  .disabled .box > .input, .disabled .box > label {
    background-color: ButtonFace;
    color: GrayText;
    border-color: GrayText;
  }
  .disabled .helper-message, .disabled .warning-icon, .disabled .dropdown {
    color: GrayText;
  }
}
select option {
  font-size: 0.875rem;
  font-family: var(--tint-font-sans);
  font-weight: 500;
}
select, select::picker(select) {
  appearance: base-select;
}</style>
