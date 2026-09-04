<script lang="ts">
  import IconWarning from '../icons/20-warning.svg?raw'
  import IconClose from '../icons/14-close.svg?raw'
  import type { FullAutoFill } from 'svelte/elements'
  import { debounce } from '../utils/timing'
  import MenuInternal, {
    MENU_SEPARATOR,
    MenuBehavior,
    type MenuItem,
  } from './menu/MenuInternal.svelte'
  import { untrack } from 'svelte'

  type T = $$Generic
  interface AutocompleteItem {
    value: T
    label: string
    hint?: string
  }
  interface DynamicResult {
    items: AutocompleteItem[]
    allowAdd?: boolean
  }

  interface Props {
    // Id of the text field in the autocomplete @type {string}
    id: string
    // The selected value @type {T | undefined}
    value: T | undefined
    // Available items to select from @type {AutocompleteItem[]}
    items: AutocompleteItem[]
    // When set, allows to customize search results. Results need to be present in items. @type {(search: string) => DynamicResult | Promise<DynamicResult>}
    dynamicItems?: (search: string) => DynamicResult | Promise<DynamicResult>
    // Gets called when a new item is supposed to be added.
    onitemadded?: (label: string) => void
    // The label of the text field @type {string}
    label: string
    // The autocomplete of the text field @type {string|undefined}
    autocomplete?: FullAutoFill | undefined
    // Adds a helper text to the text field @type {string|undefined}
    helperText?: string | undefined
    // Marks the text field as invalid and adds the error text and icon @type {string|undefined}
    error?: string | undefined
    // Disables the text field @type {boolean}
    disabled?: boolean
    // Fills the width of the parent container @type {boolean}
    fillWidth?: boolean
    // Allows free text input that doesn't need to match available items. When enabled, the value will always be set to the text content (label) rather than the item's value property. @type {boolean}
    allowFreeText?: boolean
    // Id of the element that describes the text field @type {string|undefined}
    'aria-describedby'?: string | undefined
    // HTML element of the text field @type {HTMLInputElement | undefined}
    element?: HTMLInputElement | undefined
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    value = $bindable(),
    items,
    onitemadded = undefined,
    dynamicItems = undefined,
    label,
    autocomplete = undefined,
    helperText = undefined,
    error = undefined,
    disabled = false,
    fillWidth = true,
    allowFreeText = false,
    'aria-describedby': ariaDescribedby = undefined,
    element = $bindable(undefined),
    class: className = '',
  }: Props = $props()

  let fieldValue = $state('')
  let showMenu = $state(false)
  let boxElement = $state<HTMLElement | undefined>(undefined)
  let isUserTyping = $state(false) // Track when user is actively typing
  let menuId = $derived(`${id}-menu`)
  let debouncedDynamicItems = $derived(
    dynamicItems
      ? debounce((search: string) => {
          const result = dynamicItems(search)

          if (result instanceof Promise) {
            result
              .then((promiseResult) => {
                // Only update if this search is still relevant
                untrack(() => {
                  if (search === fieldValue) {
                    updateMenuItems(
                      promiseResult.items,
                      promiseResult.allowAdd || false,
                      true,
                    )
                  }
                })
              })
              .catch((error) => {
                console.error('Search failed:', error)
              })
          } else {
            // Synchronous results
            untrack(() => {
              if (search === fieldValue) {
                updateMenuItems(result.items, result.allowAdd || false, true)
              }
            })
          }

          return result
        }, 300)
      : undefined,
  )
  let justClosed = false

  // Computed state
  let selectedItem = $derived(
    value ? items.find((item) => item.value === value) : undefined,
  )
  let hasValue = $derived(value !== undefined && value !== null)

  // ---- Menu items

  let menuItems = $state<MenuItem<T | undefined>[]>([])

  function updateMenuItems(
    items: AutocompleteItem[],
    allowAdd = false,
    open = false,
  ) {
    if (items.length === 0 && !allowAdd) {
      menuItems = []
      return
    }

    const updatedMenuItems: MenuItem<T | undefined>[] = items.map((item) => ({
      label: item.label,
      hint: item.hint,
      data: item.value,
      checked: hasValue && value === item.value,
      onClick: () => {
        selectItem(item.value)
      },
    }))

    if (allowAdd) {
      if (items.length) {
        updatedMenuItems.push(MENU_SEPARATOR)
      }
      updatedMenuItems.push({
        label: `Add "${fieldValue}"`,
        data: undefined,
        onClick: () => {
          showMenu = false
          onitemadded?.(fieldValue)
          fieldValue = ''
        },
      })
    }

    menuItems = updatedMenuItems
    if (open) {
      showMenu = true
    }
  }

  let lastProcessedFieldValue = $state('')

  $effect(() => {
    // Only process field value changes if it's actually different to prevent loops
    if (fieldValue !== lastProcessedFieldValue) {
      lastProcessedFieldValue = fieldValue
      fieldValueChanged(fieldValue)
    }
  })

  function fieldValueChanged(_value: string) {
    if (debouncedDynamicItems === undefined) {
      // For non-dynamic items, show entire list when empty or filter when typing
      if (fieldValue.length === 0) {
        updateMenuItems(items)
      } else {
        const filteredItems = items.filter((item) =>
          item.label.toLowerCase().includes(fieldValue.toLowerCase()),
        )
        updateMenuItems(filteredItems)
      }
      return
    }

    // For dynamic items, only search when field value deviates from selected value
    if (fieldValue.length === 0) {
      menuItems = []
      return
    }

    // Check if field value matches the selected item label
    const selectedLabel = selectedItem?.label || ''
    if (fieldValue === selectedLabel && hasValue && !allowFreeText) {
      menuItems = []
      return
    }

    untrack(() => {
      debouncedDynamicItems(fieldValue)

      // Clear menu immediately to show loading state
      menuItems = []

      // The debounced function will handle the result when it executes
    })
  }

  // ---- Attribute validation

  $effect.pre(() => {
    if (helperText && ariaDescribedby) {
      throw new Error(
        '[tint] You can not use both helperText and ariaDescribedby',
      )
    }
  })

  // ---- Event handlers

  function fieldOnInput() {
    isUserTyping = true // Mark that user is actively typing

    // In free text mode, update the value immediately
    if (allowFreeText) {
      value = fieldValue as T
    }

    // Show menu based on available items and field content
    if (debouncedDynamicItems === undefined) {
      // For non-dynamic items, show menu if there are items to show
      showMenu = menuItems.length > 0
    } else {
      // For dynamic items, show menu if there are items and field has content
      showMenu = menuItems.length > 0 && fieldValue.length > 0
    }
  }

  function onBoxClick(e: MouseEvent) {
    // focus the text field but only if the box has been clicked directly
    // and not a child element
    if (e.target === boxElement) {
      element?.focus()
    }
  }

  function selectItem(itemValue: T) {
    if (disabled) return
    isUserTyping = false // User has made a selection, not typing anymore

    const selectedItemLabel =
      items.find((item) => item.value === itemValue)?.label || ''

    if (allowFreeText) {
      // In free text mode, use the label as the value
      value = selectedItemLabel as T
      fieldValue = selectedItemLabel
    } else {
      // Standard mode, use the item's value
      value = itemValue
      fieldValue = selectedItemLabel
    }

    showMenu = false
  }

  function clearValue() {
    if (disabled) return
    isUserTyping = false // User cleared the value, not typing anymore
    value = undefined
    fieldValue = ''
    element?.focus()
  }

  function closeMenu() {
    showMenu = false
    justClosed = true
    isUserTyping = false // User stopped typing when menu closes

    if (allowFreeText) {
      // In free text mode, keep whatever the user typed
      value = fieldValue as T
    } else {
      if (!hasValue) {
        fieldValue = ''
      } else {
        // When menu closes and there's a value, restore the selected item's label
        fieldValue = selectedItem?.label || ''
      }
    }
  }

  function onBlur() {
    // Don't reset the field if the menu is open (user might be clicking on menu items)
    if (showMenu) {
      return
    }

    isUserTyping = false // User stopped typing when field loses focus

    if (allowFreeText) {
      // In free text mode, accept whatever the user typed
      value = fieldValue as T
    } else {
      if (hasValue) {
        // Always restore the selected item's label when blurring
        fieldValue = selectedItem?.label || ''
      } else {
        // If no value is selected, clear the field
        fieldValue = ''
      }
    }
  }

  function onFocusOut(e: FocusEvent) {
    if (!showMenu) return
    const container = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (relatedTarget && container.contains(relatedTarget)) return
    requestAnimationFrame(() => {
      if (!showMenu) return
      if (container.contains(document.activeElement)) return
      closeMenu()
    })
  }

  function onFocus() {
    if (justClosed) {
      justClosed = false
      return
    }

    // Don't reset isUserTyping here - let the user continue typing if they want

    if (hasValue && !allowFreeText) {
      // Show the selected value when focused if there's a value (non-free text mode)
      if (fieldValue === '') {
        fieldValue = selectedItem?.label || ''
      }

      // For non-dynamic items, show entire list when focused
      if (debouncedDynamicItems === undefined) {
        updateMenuItems(items, false, true)
      }
      // For dynamic items, don't show menu initially (user needs to type)
    } else if (!hasValue && !allowFreeText) {
      // When no value is selected, show all items for non-dynamic lists (non-free text mode)
      if (debouncedDynamicItems === undefined) {
        updateMenuItems(items, false, true)
      }
    } else if (allowFreeText) {
      // In free text mode, show suggestions if available
      if (debouncedDynamicItems === undefined && fieldValue.length === 0) {
        updateMenuItems(items, false, true)
      }
    }
  }

  // Update field value when value changes externally
  // Only update if the user isn't actively typing and the field doesn't have focus
  $effect(() => {
    const fieldHasFocus = element === document.activeElement

    if (allowFreeText) {
      // In free text mode, sync field value with the value prop when not typing
      if (!isUserTyping && !fieldHasFocus) {
        fieldValue = (value as string) || ''
      }
    } else {
      // Original behavior for non-free text mode
      if (hasValue && selectedItem) {
        // Only update if the field value doesn't match and user isn't typing and field doesn't have focus
        if (!isUserTyping && !fieldHasFocus) {
          fieldValue = selectedItem.label
        }
      } else if (!hasValue) {
        // Only clear if user isn't typing and field doesn't have focus
        if (!isUserTyping && !fieldHasFocus) {
          fieldValue = ''
        }
      }
    }
  })
</script>

<div class:error class:disabled class:fillWidth onfocusout={onFocusOut}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="box {className}"
    class:has-value={hasValue || (allowFreeText && fieldValue.length > 0)}
    onclick={onBoxClick}
    bind:this={boxElement}
  >
    <input
      {disabled}
      {id}
      aria-describedby={ariaDescribedby || helperText
        ? 'textfield-helpertext'
        : undefined}
      aria-errormessage={error ? 'textfield-helpertext' : undefined}
      aria-invalid={error ? 'true' : undefined}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={showMenu}
      aria-controls={showMenu ? menuId : undefined}
      {autocomplete}
      oninput={fieldOnInput}
      onblur={onBlur}
      onfocus={onFocus}
      bind:this={element}
      bind:value={fieldValue}
      class:filled={fieldValue.length > 0 || hasValue || showMenu}
      class="input tint--type-input"
    />
    <label class="tint--type-input-small" for={id}>{label}</label>
    {#if allowFreeText ? fieldValue.length > 0 : hasValue}
      <button
        type="button"
        class="clear-button"
        title="Clear selection"
        aria-label="Clear selection"
        {disabled}
        onclick={clearValue}
      >
        {@html IconClose}
      </button>
    {/if}
    {#if error}
      <span aria-hidden="true" class="warning-icon">{@html IconWarning}</span>
    {/if}
  </div>
  {#if helperText || error}
    <div
      id="textfield-helpertext"
      class="helper-message tint--type-input-small"
    >
      {error || helperText}
    </div>
  {/if}
  {#if showMenu && element && menuItems}
    <MenuInternal
      id={menuId}
      behavior={MenuBehavior.AUTOCOMPLETE}
      anchorRef={element}
      closeOnClick={true}
      items={menuItems}
      hide={closeMenu}
    />
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
  width: 100%;
}
.box > .input {
  box-sizing: border-box;
  color: currentColor;
  background-color: var(--tint-input-bg);
  border: 2px solid transparent;
  border-radius: var(--tint-radius-input);
  width: 100%;
  height: 100%;
  margin: 0;
  padding-block: calc(var(--tint-size-12) + 7px) calc(var(--tint-size-12) - 7px);
  padding-inline: var(--tint-size-12);
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
@media (prefers-reduced-motion: reduce) {
  .box > label {
    transition: none;
  }
}

.input:focus + label, .input.filled + label, .input:-webkit-autofill + label {
  transform: translateY(-106%) scale(1);
}

.input:autofill + label {
  transform: translateY(-106%) scale(1);
}

.clear-button {
  background: none;
  border: none;
  border-radius: var(--tint-size-4);
  height: var(--tint-size-24);
  width: var(--tint-size-24);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: absolute;
  inset-inline-end: var(--tint-size-12);
  inset-block-start: 50%;
  transform: translateY(-50%);
}
.clear-button:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .clear-button:focus-visible {
    outline-color: CanvasText;
  }
}
.clear-button:not(:disabled):hover {
  background-color: var(--tint-action-secondary-hover);
}
.clear-button:not(:disabled):active {
  background-color: var(--tint-action-secondary-active);
}
@media (forced-colors: active) {
  .clear-button:not(:disabled):hover, .clear-button:not(:disabled):active {
    background-color: SelectedItem;
    border-color: SelectedItemText;
    color: SelectedItemText;
  }
  .clear-button:not(:disabled):active {
    border-color: SelectedItem;
  }
}

.error .input {
  padding-inline-end: calc(var(--tint-size-8) * 2 + var(--tint-size-32));
}

.has-value .input {
  padding-inline-end: calc(var(--tint-size-8) * 2 + var(--tint-size-24));
}

.error .has-value .input {
  padding-inline-end: calc(var(--tint-size-8) * 3 + var(--tint-size-32) + var(--tint-size-24));
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
  inset-inline-end: 0;
  inset-block-start: 0;
  line-height: 0;
  margin: calc(var(--tint-size-12) + var(--tint-size-2));
  color: var(--tint-text-accent);
}

.has-value .warning-icon {
  inset-inline-end: calc(var(--tint-size-24) + var(--tint-size-8));
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
  .disabled .helper-message, .disabled .warning-icon {
    color: GrayText;
  }
}</style>
