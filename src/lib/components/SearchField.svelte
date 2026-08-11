<script lang="ts">
  import Button from './Button.svelte'
  import IconSearch from '../icons/20-search.svg?raw'

  interface Props {
    // Id of the text field @type {string}
    id: string
    // Value of the text field (can use bind:value) @type {string}
    value: string
    // The label of the text field @type {string}
    label?: string
    // Disables the text field @type {boolean}
    disabled?: boolean
    // Keeps the backdrop, the search button and the text padding even when the field is empty @type {boolean}
    filledBackdrop?: boolean
    // HTML element of the text field @type {HTMLInputElement | undefined}
    elementInput?: HTMLInputElement | undefined
    // HTML element of the button @type {HTMLButtonElement | undefined}
    elementButton?: HTMLButtonElement | undefined
    // Event handler for when the search button is clicked @type {(value: string) => void}
    onsearch?: (term: string) => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    value = $bindable(),
    label = 'Search',
    disabled = false,
    filledBackdrop = false,
    elementInput = $bindable(undefined),
    elementButton = $bindable(undefined),
    onsearch = undefined,
    class: className = '',
  }: Props = $props()
</script>

<div class="box {className}" class:disabled>
  <input
    {disabled}
    {id}
    aria-label={label}
    bind:this={elementInput}
    bind:value
    class:filled={value?.length > 0 || filledBackdrop}
    class="input tint--type-input"
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        onsearch?.(value)
      }
    }}
    placeholder={label}
  />
  <Button
    aria-label="Search"
    bind:element={elementButton}
    disabled={disabled || !value || value.length === 0}
    icon
    onclick={() => onsearch?.(value)}
    small
    variant="ghost"
  >
    {@html IconSearch}
  </Button>
</div>

<style lang="sass">
.disabled
  opacity: 0.5
.box
  position: relative
  height: var(--tint-size-48)
  width: 100%
  line-height: normal
  > :global(button.tint--button)
    position: absolute
    inset-inline-end: 0
    margin: var(--tint-size-8)
    visibility: hidden
  > .input
    color: var(--tint-text)
    position: absolute
    inset: 0
    box-sizing: border-box
    background: transparent
    border-radius: var(--tint-radius-input)
    border: 2px solid transparent
    width: 100%
    height: 100%
    margin: 0
    padding-block: var(--tint-size-12)
    padding-inline: var(--tint-size-24)
    padding-inline-start: var(--tint-size-4)
    padding-inline-end: calc(var(--tint-size-8) * 2 + var(--tint-size-32))
    transition: padding-inline-start 0.2s ease-in-out, background-color 0.2s ease-in-out
    @include tint.effect-focus
    @media (prefers-reduced-motion: reduce)
      transition: none
    &::placeholder
      color: var(--tint-text-secondary)

.input:focus, .input.filled, .input:-webkit-autofill
  padding-inline-start: var(--tint-size-24)
  background-color: var(--tint-input-bg)
  & + :global(button.tint--button)
    visibility: visible
// has to be seperate as chrome doesn't apply the rule when using :autofill
.input:autofill
  padding-inline-start: var(--tint-size-24)
  background-color: var(--tint-input-bg)
  & + :global(button.tint--button)
    visibility: visible

@media (forced-colors: active)
  .box > .input
    border-color: ButtonText
    padding-inline-start: var(--tint-size-24)
  .disabled
    opacity: 1
    color: GrayText
    > .input
      background-color: ButtonFace
      color: GrayText
      border-color: GrayText
</style>
