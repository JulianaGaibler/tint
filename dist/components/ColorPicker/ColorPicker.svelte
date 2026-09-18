<script lang="ts" generics="F extends ColorFormat = 'hex'">
  import type { Snippet } from 'svelte'
  import type {
    ColorFormat,
    ContrastOptions,
    ValueFor,
    WideGamutMode,
  } from './format'
  import type { Color } from '../../color'
  import IconWarning from '../../icons/20-warning.svg?raw'
  import {
    shellToCss,
    canonicalCss,
    splitCanonicalAlpha,
  } from './shell-serialize'
  import type { PaletteColor } from './palette'

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
    /**
     * Optional palette of named colors. When provided (and non-empty), the
     * popover shows a Custom/Palette tab strip; the Palette pane lets users
     * pick a token by name, with category headers, search, and keyboard nav.
     * Names use "/" to denote categories: "color/red/70" groups under
     * "color/red" alongside other "color/red/*" entries.
     */
    palette?: PaletteColor[]
    /**
     * Let a palette token carry an opacity. The Palette pane gains an alpha
     * slider, picking a token keeps the current alpha instead of resetting it,
     * and token matching ignores alpha so the name survives. Requires `alpha`,
     * which is what decides whether the value may carry alpha at all. Default
     * false.
     */
    paletteAlpha?: boolean
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
    palette = undefined,
    paletteAlpha = false,
  }: Props = $props()

  $effect.pre(() => {
    if (helperText && ariaDescribedby) {
      throw new Error('[tint] cannot use both helperText and aria-describedby')
    }
  })

  // Closed-state swatch CSS, computed via the shell serializer so the
  // shell stays independent of `@lib/color`.
  const displayCss = $derived(shellToCss(format, value))

  // `alpha` governs whether the value may carry alpha at all, so the palette
  // opacity feature rides on it rather than overriding it.
  const paletteAlphaOn = $derived(alpha && paletteAlpha)

  // Normalize the palette once for shell-side matching. The shell deliberately
  // avoids importing the full color engine, so we match via DOM-based
  // canonicalization in shell-serialize. The result is a Map<canonical, name>.
  const palettelookup = $derived.by(() => {
    if (!palette || palette.length === 0) return null
    // Pure lookup rebuilt by this $derived on palette change and never mutated
    // afterward, so a plain Map (not SvelteMap) is correct here.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const m = new Map<string, string>()
    for (const p of palette) {
      const k = paletteAlphaOn
        ? splitCanonicalAlpha(p.value).base
        : canonicalCss(p.value)
      if (k && !m.has(k)) m.set(k, p.name)
    }
    return m
  })

  // When the current value matches a palette entry, prefer its name over the
  // raw hex/CSS string in the closed-state display. With palette opacity on,
  // the alpha is carried alongside so the display can append it.
  const paletteMatch = $derived.by<{ name: string; alpha: number } | null>(
    () => {
      if (!palettelookup) return null
      if (!paletteAlphaOn) {
        const name = palettelookup.get(canonicalCss(displayCss))
        return name ? { name, alpha: 1 } : null
      }
      const { base, alpha: a } = splitCanonicalAlpha(displayCss)
      const name = palettelookup.get(base)
      return name ? { name, alpha: a } : null
    },
  )

  // Split the palette name at its final "/" so the leaf segment can be kept
  // visible even when the prefix overflows. A below-full opacity trails the
  // name as a percentage.
  const paletteNameParts = $derived.by<{
    prefix: string
    leaf: string
    opacity: string
  } | null>(() => {
    if (!paletteMatch) return null
    const { name } = paletteMatch
    const pct = Math.round(paletteMatch.alpha * 100)
    const opacity = pct < 100 ? ` (${pct}%)` : ''
    const idx = name.lastIndexOf('/')
    if (idx < 0) return { prefix: '', leaf: name, opacity }
    return {
      prefix: name.slice(0, idx + 1),
      leaf: name.slice(idx + 1),
      opacity,
    }
  })

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
      {#if paletteNameParts}
        <span class="display-value display-value--palette">
          <span class="prefix">{paletteNameParts.prefix}</span><span
            class="leaf">{paletteNameParts.leaf}</span
          >{#if paletteNameParts.opacity}<span class="opacity"
              >{paletteNameParts.opacity}</span
            >{/if}
        </span>
      {:else}
        <span class="display-value">{displayCss}</span>
      {/if}
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
      {palette}
      {paletteAlpha}
      anchorEl={element}
      onclose={closePicker}
      onpick={handleChange}
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
  padding-inline-end: calc(var(--tint-size-32) + var(--tint-size-16));
  text-align: start;
  cursor: pointer;
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
.box > .input[disabled] {
  cursor: not-allowed;
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
.box .input.filled + label {
  transform: translateY(-106%) scale(1);
}

.display-value {
  display: block;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.display-value--palette {
  display: flex;
  max-width: 100%;
  min-width: 0;
  font-variant-numeric: normal;
  overflow: visible;
}
.display-value--palette > .prefix {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.display-value--palette > .leaf {
  flex-shrink: 0;
  white-space: nowrap;
}
.display-value--palette > .opacity {
  flex-shrink: 0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--tint-text-secondary);
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
  inset-inline-end: 0;
  inset-block-start: 0;
  margin: calc(var(--tint-size-12) + var(--tint-size-2));
  color: var(--tint-text-accent);
}

.swatch-wrap {
  position: absolute;
  inset-inline-end: var(--tint-size-12);
  inset-block-start: 50%;
  transform: translateY(-50%);
  width: var(--tint-size-24);
  height: var(--tint-size-24);
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.swatch-checker {
  position: absolute;
  inset: 0;
  background-image: conic-gradient(rgba(0, 0, 0, 0.18) 25%, transparent 0 50%, rgba(0, 0, 0, 0.18) 0 75%, transparent 0);
  background-size: var(--tint-size-8) var(--tint-size-8);
}

.swatch {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.error .swatch {
  box-shadow: inset 0 0 0 1px var(--tint-text-accent);
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
  .swatch {
    box-shadow: inset 0 0 0 1px ButtonText;
  }
}</style>
