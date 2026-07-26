<script lang="ts" generics="T = unknown">
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
    // Value for radio/checkbox buttons - the value this element represents
    value?: T
    // Group store for radio/checkbox groups
    groupStore?: GroupStore<T>
    // HTML element of the toggleable element
    element?: HTMLInputElement | HTMLButtonElement | undefined
    // Event handler for when the value changes
    onchange?: (event: {
      checked: boolean
      value?: T
      groupValue?: GroupStore<T>
    }) => void
    // Event handler for click (button/switch only)
    onclick?: (e: MouseEvent) => void
    // aria-label of the toggleable element
    'aria-label'?: string | undefined
    // aria-labelledby of the toggleable element
    'aria-labelledby'?: string | undefined
    // aria-describedby of the toggleable element
    'aria-describedby'?: string | undefined
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    type = 'checkbox',
    checked = $bindable(),
    disabled = false,
    value = null as T,
    groupStore = undefined,
    element = $bindable(undefined),
    onchange = undefined,
    onclick = undefined,
    'aria-label': ariaLabel = undefined,
    'aria-labelledby': ariaLabelledby = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    class: className = '',
    ...elementProps
  }: Props = $props()

  // Determine if this element is selected based on group store or checked prop
  const isSelected = $derived(() => {
    if (groupStore && value !== null && value !== undefined) {
      // Use the reactive store value
      if (groupStore.type === 'radio') {
        return $groupStore === value
      } else {
        return Array.isArray($groupStore) && $groupStore.includes(value)
      }
    }
    return checked || false
  })

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement

    if (groupStore && value !== null && value !== undefined) {
      // Use group store for radio/checkbox groups
      if (type === 'radio') {
        groupStore.select(value)
        onchange?.({ checked: true, value, groupValue: groupStore })
      } else if (type === 'checkbox') {
        groupStore.toggle(value)
        const newChecked = groupStore.isSelected(value)
        onchange?.({ checked: newChecked, value, groupValue: groupStore })
      }
    } else {
      // Individual checkbox or switch behavior
      checked = target.checked
      onchange?.({ checked: target.checked })
    }
  }

  function handleSwitchClick(event?: MouseEvent) {
    if (disabled) return

    // Call the custom onclick if provided
    if (onclick && event) {
      onclick(event)
    }

    if (groupStore && value !== null && value !== undefined) {
      // Switch with group store (treat like checkbox)
      groupStore.toggle(value)
      const newChecked = groupStore.isSelected(value)
      onchange?.({ checked: newChecked, value, groupValue: groupStore })
    } else {
      // Individual switch behavior
      checked = !checked
      onchange?.({ checked })
    }
  }
</script>

{#if type === 'switch'}
  <button
    type="button"
    {disabled}
    {id}
    aria-checked={isSelected()}
    aria-describedby={ariaDescribedby}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    bind:this={element}
    onclick={handleSwitchClick}
    role="switch"
    class={className}
    {...elementProps}
  ></button>
{:else if type === 'radio'}
  <input
    {disabled}
    {id}
    type="radio"
    aria-describedby={ariaDescribedby}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    checked={isSelected()}
    {value}
    bind:this={element}
    onchange={handleChange}
    class={className}
    {...elementProps}
  />
{:else}
  <input
    {disabled}
    {id}
    type="checkbox"
    aria-describedby={ariaDescribedby}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    checked={isSelected()}
    bind:this={element}
    onchange={handleChange}
    class={className}
    {...elementProps}
  />
{/if}

<style>input, button {
  appearance: none;
  background-color: transparent;
  margin: 0;
  width: var(--tint-size-24);
  height: var(--tint-size-24);
  border: var(--tint-border-width) solid var(--tint-action-primary);
  transform: translateY(-0.075em);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--tint-action-primary-text);
}
input:focus-visible, button:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  input:focus-visible, button:focus-visible {
    outline-color: CanvasText;
  }
}
input:not(:disabled):hover, button:not(:disabled):hover {
  background-color: var(--tint-action-secondary-hover);
}
input:not(:disabled):active, button:not(:disabled):active {
  background-color: var(--tint-action-secondary-active);
}
input::before, button::before {
  content: "";
  display: none;
  background: currentColor;
}

input:checked, button[aria-checked=true] {
  border-color: transparent;
  background-color: var(--tint-action-primary);
}
input:checked:not(:disabled):hover, button[aria-checked=true]:not(:disabled):hover {
  background-color: var(--tint-action-primary-hover);
}
input:checked:not(:disabled):active, button[aria-checked=true]:not(:disabled):active {
  background-color: var(--tint-action-primary-active);
}

button[role=switch] {
  width: var(--tint-size-40);
  color: var(--tint-action-primary);
  transform: translateY(-0.075em);
  justify-content: flex-start;
  border-radius: var(--tint-radius-button-pill);
}
button[role=switch]::before {
  display: block;
  forced-color-adjust: none;
  width: var(--tint-size-12);
  height: var(--tint-size-12);
  border-radius: 50%;
  position: relative;
  left: calc((var(--tint-size-24) - var(--tint-size-12)) / 2 - 1px);
  transition: left 250ms cubic-bezier(0.42, 1.67, 0.21, 0.9);
}
@media (prefers-reduced-motion: reduce) {
  button[role=switch]::before {
    transition: none;
  }
}
button[role=switch][aria-checked=true] {
  background-color: var(--tint-action-primary);
  color: var(--tint-action-primary-text);
}
button[role=switch][aria-checked=true]::before {
  left: calc(var(--tint-size-40) - var(--tint-size-12) - (var(--tint-size-24) - var(--tint-size-12)) / 2 - 1px);
}

/* Common styles for ::before pseudo-elements of toggleable inputs */
input[type=checkbox]::before,
input[type=radio]::before {
  display: block;
  scale: 0;
}
@media (prefers-reduced-motion: no-preference) {
  input[type=checkbox]::before,
  input[type=radio]::before {
    transition: scale 250ms cubic-bezier(0.42, 1.67, 0.21, 0.9);
  }
}

input[type=checkbox] {
  border-radius: var(--tint-size-4);
}
input[type=checkbox]::before {
  width: 14px;
  height: 14px;
  transform: scale(1.0001);
  clip-path: polygon(33% 100%, 27% 98%, 2% 73%, 0% 67%, 2% 61%, 8% 58%, 14% 61%, 32% 79%, 85% 3%, 90% 0%, 96% 2%, 100% 7%, 99% 13%, 40% 96%, 37% 99%, 34% 100%, 33% 100%, 33% 100%);
}

input[type=radio] {
  border-radius: 50%;
}
input[type=radio]::before {
  width: var(--tint-size-12);
  height: var(--tint-size-12);
  border-radius: 50%;
}

input[type=radio]:checked::before, input[type=checkbox]:checked::before {
  scale: 1;
}

input:disabled, button:disabled {
  opacity: 0.5;
}

@media (forced-colors: active) {
  input, button {
    outline-color: CanvasText;
  }
  input:not(:disabled):hover, input:not(:disabled):active, button:not(:disabled):hover, button:not(:disabled):active {
    color: SelectedItem;
    background-color: SelectedItemText;
  }
  input:not(:disabled):active, button:not(:disabled):active {
    border-color: ButtonText;
  }
  input:disabled, button:disabled {
    opacity: 1;
    background-color: ButtonFace;
    color: GrayText;
  }
  input:checked, button:checked {
    background-color: ButtonText;
    color: ButtonFace;
  }
  input:checked:not(:disabled):hover, input:checked:not(:disabled):active, button:checked:not(:disabled):hover, button:checked:not(:disabled):active {
    color: SelectedItemText;
    background-color: SelectedItem;
  }
  input:checked:not(:disabled):active, button:checked:not(:disabled):active {
    border-color: ButtonText;
  }
  input:checked:disabled, button:checked:disabled {
    background-color: GrayText;
    color: ButtonFace;
  }
  button {
    background-color: ButtonFace;
    color: ButtonText;
  }
  button[aria-checked=true] {
    background-color: ButtonText !important;
    color: ButtonFace !important;
  }
  button[aria-checked=true]:not(:disabled):hover, button[aria-checked=true]:not(:disabled):active {
    color: SelectedItemText !important;
    background-color: SelectedItem !important;
  }
  button[aria-checked=true]:not(:disabled):active {
    border-color: ButtonText !important;
  }
  button[aria-checked=true]:disabled {
    background-color: GrayText !important;
    color: ButtonFace !important;
  }
}</style>
