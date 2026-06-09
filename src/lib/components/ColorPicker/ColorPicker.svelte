<script lang="ts" generics="F extends ColorFormat = 'hex'">
  import type { Snippet } from 'svelte'
  import type {
    ColorFormat,
    ContrastOptions,
    ValueFor,
    WideGamutMode,
  } from './format'
  import type { Color } from '@lib/color'
  import IconWarning from '@lib/icons/20-warning.svg?raw'
  import { shellToCss } from './shell-serialize'

  interface Props {
    /** Bindable value. Type derived from `format`. */
    value: ValueFor<F>
    /** Visible label above the input. */
    label: string
    /** Output format. Default 'hex'. Controls value's TS type. */
    format?: F
    /** Show alpha slider in the popover. Default false. */
    alpha?: boolean
    /** Optional contrast check shown in the popover. */
    contrast?: ContrastOptions
    /**
     * Surface a warning when the picked color is outside the output gamut.
     * Default true.
     */
    gamutWarning?: boolean
    /**
     * How to render the picker canvas. 'auto' picks based on the display.
     * Default 'auto'.
     */
    wideGamut?: WideGamutMode
    /** Helper text under the input. Mutually exclusive with `error`. */
    helperText?: string
    /** Replace helperText with an error message + warning icon. */
    error?: string
    /** Disable the input. */
    disabled?: boolean
    /** Fill parent width. Default true. */
    fillWidth?: boolean
    /** Id of the rendered button. */
    id?: string
    /** Name for native form serialization. When set, a hidden input is emitted. */
    name?: string
    /** Bindable ref to the button element. */
    element?: HTMLButtonElement
    /** Fires with the new value + the parsed Color on every change. */
    onchange?: (e: { value: ValueFor<F>; color: Color }) => void
    /** External describing element id (ARIA). */
    'aria-describedby'?: string
    /** Extra classes on the box. */
    class?: string
    /** Optional snippet for custom swatch content. */
    swatchOverlay?: Snippet
  }

  let {
    value = $bindable(),
    label,
    format = 'hex' as F,
    alpha = false,
    contrast = undefined,
    gamutWarning = true,
    wideGamut = 'auto',
    helperText = undefined,
    error = undefined,
    disabled = false,
    fillWidth = true,
    id = undefined,
    name = undefined,
    element = $bindable(undefined),
    onchange = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    class: className = '',
    swatchOverlay = undefined,
  }: Props = $props()

  $effect.pre(() => {
    if (helperText && ariaDescribedby) {
      throw new Error('[tint] cannot use both helperText and aria-describedby')
    }
  })

  // Closed-state swatch CSS, computed via the shell serializer so the
  // shell stays independent of `@lib/color`.
  const displayCss = $derived(shellToCss(format, value))

  // Popover module is loaded on first open and cached.
  type PopoverModule = typeof import('./Popover.svelte')
  let Popover = $state<PopoverModule['default'] | undefined>(undefined)
  let isOpen = $state(false)

  async function openPicker() {
    if (disabled) return
    if (!Popover) {
      Popover = (await import('./Popover.svelte')).default
    }
    isOpen = true
  }

  function closePicker() {
    isOpen = false
    element?.focus()
  }

  function handleChange(e: { value: unknown; color: Color }) {
    value = e.value as ValueFor<F>
    onchange?.({ value: e.value as ValueFor<F>, color: e.color })
  }
</script>

<div class:error class:disabled class:fillWidth>
  <div class="box {className}">
    <button
      bind:this={element}
      type="button"
      class="input tint--type-input"
      class:filled={value !== undefined && value !== ''}
      {id}
      {disabled}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-describedby={ariaDescribedby ||
        (helperText || error ? `${id ?? 'colorpicker'}-helpertext` : undefined)}
      onclick={openPicker}
    >
      <span class="display-value">{displayCss}</span>
    </button>
    <label class="tint--type-input-small" for={id}>{label}</label>

    {#if error}
      <span aria-hidden="true" class="warning-icon">{@html IconWarning}</span>
    {/if}

    <span aria-hidden="true" class="swatch-wrap">
      <span class="swatch-checker"></span>
      <span class="swatch" style="background: {displayCss};"></span>
      {#if swatchOverlay}{@render swatchOverlay()}{/if}
    </span>

    {#if name}
      <input type="hidden" {name} value={displayCss} />
    {/if}
  </div>

  {#if helperText || error}
    <div
      id="{id ?? 'colorpicker'}-helpertext"
      class="helper-message tint--type-input-small"
    >
      {error || helperText}
    </div>
  {/if}

  {#if isOpen && Popover && element}
    <Popover
      bind:value
      {format}
      {alpha}
      {contrast}
      {gamutWarning}
      {wideGamut}
      anchorEl={element}
      onclose={closePicker}
      onpick={handleChange}
    />
  {/if}
</div>

<style lang="sass">
.disabled
  opacity: 0.5
.fillWidth
  width: 100%

.box
  position: relative
  height: tint.$size-48
  line-height: normal

  > .input
    appearance: none
    box-sizing: border-box
    background-color: var(--tint-input-bg)
    color: currentColor
    border-radius: tint.$input-radius
    border: 2px solid transparent
    width: 100%
    height: 100%
    margin: 0
    padding: (tint.$size-12 + 7px) tint.$size-12 (tint.$size-12 - 7px) tint.$size-12
    padding-inline-end: (tint.$size-32 + tint.$size-16)
    text-align: start
    cursor: pointer
    @include tint.effect-focus

  > .input[disabled]
    cursor: not-allowed

  > label
    color: var(--tint-text-secondary)
    position: absolute
    left: tint.$size-12
    right: initial
    top: 50%
    transform: translateY(-55%) scale(1.166)
    transform-origin: left top
    transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), color 150ms
    pointer-events: none

  .input.filled + label
    transform: translateY(-106%) scale(1.0)

.display-value
  display: block
  font-variant-numeric: tabular-nums
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.helper-message
  line-height: normal
  color: var(--tint-text-secondary)
  padding: 0 tint.$size-12
  padding-block-start: tint.$size-4

.warning-icon
  pointer-events: none
  position: absolute
  line-height: 0
  right: 0
  top: 0
  margin: (tint.$size-12 + tint.$size-2)
  color: var(--tint-text-accent)

.swatch-wrap
  position: absolute
  right: tint.$size-12
  top: 50%
  transform: translateY(-50%)
  width: tint.$size-24
  height: tint.$size-24
  border-radius: 50%
  overflow: hidden
  pointer-events: none
  isolation: isolate

.swatch-checker
  position: absolute
  inset: 0
  background-image: conic-gradient(rgba(0,0,0,0.18) 25%, transparent 0 50%, rgba(0,0,0,0.18) 0 75%, transparent 0)
  background-size: tint.$size-8 tint.$size-8

.swatch
  position: absolute
  inset: 0
  border-radius: 50%
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1)

.error .swatch
  box-shadow: inset 0 0 0 1px var(--tint-text-accent)

@media (forced-colors: active)
  .box > .input
    border-color: ButtonText
  .disabled
    opacity: 1
    color: GrayText
    .box > .input, .box > label
      background-color: ButtonFace
      color: GrayText
      border-color: GrayText
    .helper-message, .warning-icon
      color: GrayText
  .swatch
    box-shadow: inset 0 0 0 1px ButtonText
</style>
