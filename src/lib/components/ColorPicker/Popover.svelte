<script lang="ts">
  import { onMount, onDestroy, tick, untrack } from 'svelte'
  import * as focusTrap from 'focus-trap'
  import { convert, makeColor, type Color } from '@lib/color'
  import { CHROMA_MAX } from '@lib/color/constants'
  import { toCss, toHex } from '@lib/color/serialize'
  import { inSrgb, inP3, clipTo, maxChromaIn } from '@lib/color/gamut'
  import {
    contrast as wcagContrast,
    type ContrastResult,
  } from '@lib/color/contrast'
  import { parseColor, ColorParseError } from '@lib/color'
  import SegmentedControl from '@lib/components/SegmentedControl.svelte'
  import TextField from '@lib/components/TextField.svelte'
  import Button from '@lib/components/Button.svelte'
  import IconCopy from '@lib/icons/20-copy.svg?raw'
  import IconDone from '@lib/icons/20-done.svg?raw'
  import IconLock from '@lib/icons/20-lock.svg?raw'
  import IconLockUnlocked from '@lib/icons/20-lock-unlocked.svg?raw'
  import Canvas from './Canvas.svelte'
  import Track from './Track.svelte'
  import Channels from './Channels.svelte'
  import ContrastPanel from './Contrast.svelte'
  import GamutWarning from './GamutWarning.svelte'
  import {
    sampleGamutBoundary,
    sampleRelativeChromaCurve,
    sampleContrastCurve,
    type ChartCurve,
  } from './curves'
  import type { ContrastCategory } from './format'
  import type { CurveMode } from './Contrast.svelte'
  import {
    valueToColor,
    colorToValue,
    placePopover,
    type EditorSpace,
    type PopoverPlacement,
  } from './core'
  import type {
    ColorFormat,
    ContrastOptions,
    ValueFor,
    WideGamutMode,
  } from './format'

  interface Props {
    value: unknown
    format: ColorFormat
    alpha: boolean
    contrast?: ContrastOptions
    gamutWarning: boolean
    wideGamut: WideGamutMode
    anchorEl: HTMLElement
    onclose: () => void
    onpick?: (e: { value: unknown; color: Color }) => void
  }

  let {
    value = $bindable(),
    format,
    alpha,
    contrast: contrastOpts,
    gamutWarning,
    wideGamut,
    anchorEl,
    onclose,
    onpick,
  }: Props = $props()

  // ---------- Internal authoritative state ----------

  function initialEditor(f: ColorFormat): EditorSpace {
    if (f === 'oklch' || f === 'oklab') return 'oklch'
    if (f === 'hsl') return 'hsl'
    if (f === 'rgb' || f === 'p3') return 'rgb'
    return 'hsl' // hex/css/color default
  }

  function initialColor(): Color {
    try {
      return valueToColor(format, value as ValueFor<typeof format>)
    } catch (e) {
      if (e instanceof ColorParseError) {
        return makeColor('srgb', [0, 0, 0], 1, { legacy: true })
      }
      throw e
    }
  }

  let editor = $state<EditorSpace>(untrack(() => initialEditor(format)))
  let color = $state<Color>(untrack(() => initialColor()))

  // Project the authoritative color into the editor's native space so
  // channel inputs and the canvas can read components directly.
  function inEditor(c: Color, e: EditorSpace): Color {
    const target = e === 'hsl' ? 'hsl' : e === 'oklch' ? 'oklch' : 'srgb'
    return c.space === target ? c : convert(c, target)
  }

  const editorColor = $derived(inEditor(color, editor))

  function safeHue(c: Color, e: EditorSpace): number {
    // Hue for the slider in editor `e`. The RGB editor also uses a hue
    // slider, so it derives hue via HSL.
    if (e === 'oklch') {
      const okl = c.space === 'oklch' ? c : convert(c, 'oklch')
      return Number.isFinite(okl.components[2]) ? okl.components[2] : 0
    }
    const hsl = c.space === 'hsl' ? c : convert(c, 'hsl')
    return Number.isFinite(hsl.components[0]) ? hsl.components[0] : 0
  }

  // Track hue separately so the slider doesn't snap when chroma drops
  // to 0 (where hue is mathematically undefined).
  let hue = $state<number>(untrack(() => safeHue(editorColor, editor)))

  // ---------- Relative-chroma lock (OKLCH editor) ----------
  // While engaged, L/H changes keep perceptual saturation constant by
  // recomputing chroma from a cached % of the max chroma available at
  // the current L/H. Inspired by Doko-Zero's OkColor plugin.
  let lockRelativeChroma = $state(false)
  let lockedRelativePct = $state(50)
  const lockGamut: 'srgb' | 'display-p3' = $derived(
    format === 'p3' ? 'display-p3' : 'srgb',
  )

  function relativeChromaPct(l: number, c: number, h: number): number {
    const max = maxChromaIn(l, h, lockGamut)
    if (max <= 0) return 0
    return Math.max(0, Math.min(100, (c / max) * 100))
  }

  function chromaForRelativePct(l: number, h: number, pct: number): number {
    return (pct / 100) * maxChromaIn(l, h, lockGamut)
  }

  // ---------- Wide-gamut detection ----------

  let p3Available = $state(false)
  const effectiveWideGamut = $derived(
    wideGamut === 'p3' ? true : wideGamut === 'srgb' ? false : p3Available,
  )

  onMount(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      p3Available = window.matchMedia('(color-gamut: p3)').matches
    }
  })

  // ---------- Canvas / slider derivations ----------

  const canvasXY = $derived.by(() => {
    const c = editorColor.components
    if (editor === 'oklch') {
      return { x: Math.min(1, c[1] / CHROMA_MAX), y: 1 - c[0] }
    }
    if (editor === 'hsl') {
      return { x: c[1] / 100, y: 1 - c[2] / 100 }
    }
    // RGB editor shares the HSL canvas plane for navigation.
    const hsl = convert(color, 'hsl').components
    return { x: hsl[1] / 100, y: 1 - hsl[2] / 100 }
  })

  // ---------- Hue slider background ----------

  const hueTrackBg = $derived.by(() => {
    if (editor === 'oklch') {
      // Hold L and C constant at values that stay vivid on P3 displays.
      const stops = [0, 60, 120, 180, 240, 300, 360]
        .map((h) => `oklch(0.7 0.15 ${h})`)
        .join(', ')
      return `linear-gradient(to right, ${stops})`
    }
    return 'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))'
  })

  // ---------- Alpha slider background ----------

  const alphaTrackBg = $derived.by(() => {
    const opaque = { ...color, alpha: 1 } as Color
    const transparent = { ...color, alpha: 0 } as Color
    return `linear-gradient(to right, ${toCss(transparent)}, ${toCss(opaque)})`
  })

  // ---------- Output sync ----------

  /**
   * Update the authoritative color and propagate the new value out.
   *
   * `opts.refreshHue` resyncs the slider's hue to the color's actual hue. Used
   * when the color was set from a source that may have a different hue (hex/CSS
   * paste, clipping, editor switch). Direct user interactions with the canvas /
   * alpha slider / non-hue channel inputs leave the hue slider alone, so
   * dragging alpha doesn't reset hue to 0.
   */
  function emit(next: Color, opts: { refreshHue?: boolean } = {}) {
    color = next
    if (opts.refreshHue) {
      hue = safeHue(next, editor)
    }
    const out = colorToValue(format, next)
    value = out as typeof value
    onpick?.({ value: out, color: next })
  }

  // ---------- Mutations ----------

  function pickFromCanvas(px: number, py: number) {
    if (editor === 'oklch') {
      const l = 1 - py
      let c: number
      if (lockRelativeChroma) {
        // Lock engaged: ignore the X axis and follow the iso-curve at
        // the new L for the locked %. The user changes the locked value
        // via the "Relative chroma %" input or by releasing the lock.
        c = chromaForRelativePct(l, hue, lockedRelativePct)
      } else {
        c = px * CHROMA_MAX
      }
      emit(makeColor('oklch', [l, c, hue], color.alpha))
    } else if (editor === 'hsl') {
      const s = px * 100
      const l = (1 - py) * 100
      emit(makeColor('hsl', [hue, s, l], color.alpha))
    } else {
      const s = px * 100
      const l = (1 - py) * 100
      const fromHsl = convert(
        makeColor('hsl', [hue, s, l], color.alpha),
        'srgb',
      )
      emit(fromHsl)
    }
  }

  function changeHue(h: number) {
    hue = h
    if (editor === 'oklch') {
      const [l, c] = editorColor.components
      const nextC = lockRelativeChroma
        ? chromaForRelativePct(l, h, lockedRelativePct)
        : c
      emit(makeColor('oklch', [l, nextC, h], color.alpha))
    } else if (editor === 'hsl') {
      const [, s, l] = editorColor.components
      emit(makeColor('hsl', [h, s, l], color.alpha))
    } else {
      const hsl = convert(color, 'hsl')
      emit(
        convert(
          makeColor(
            'hsl',
            [h, hsl.components[1], hsl.components[2]],
            color.alpha,
          ),
          'srgb',
        ),
      )
    }
  }

  function changeAlpha(a: number) {
    emit({ ...color, alpha: a })
  }

  function setChannel(index: 0 | 1 | 2, v: number) {
    const ec = inEditor(color, editor)
    const comps: [number, number, number] = [
      ec.components[0],
      ec.components[1],
      ec.components[2],
    ]
    if (editor === 'rgb') {
      // RGB inputs are 0-255. sRGB internally is 0-1.
      comps[index] = v / 255
    } else {
      comps[index] = v
    }
    if (editor === 'oklch') {
      // Lock: L or H edits recompute chroma from the locked %.
      // A direct C edit re-snapshots the % so the lock follows.
      if (lockRelativeChroma && (index === 0 || index === 2)) {
        comps[1] = chromaForRelativePct(comps[0], comps[2], lockedRelativePct)
      }
      if (index === 1) {
        lockedRelativePct = relativeChromaPct(comps[0], comps[1], comps[2])
      }
      if (index === 2) hue = v
    }
    if (editor === 'hsl' && index === 0) hue = v
    const next = makeColor(ec.space, comps, color.alpha)
    emit(next)
  }

  /**
   * Try to apply the user-typed CSS string. Returns true on success so the hex
   * field knows the value was accepted. On parse failure returns false and the
   * field reverts to the canonical hex.
   */
  function commitHex(input: string): boolean {
    try {
      const c = parseColor(input)
      emit(c, { refreshHue: true })
      return true
    } catch (e) {
      if (e instanceof ColorParseError) return false
      throw e
    }
  }

  function switchEditor(next: EditorSpace) {
    editor = next
    hue = safeHue(inEditor(color, next), next)
    // Disengage the lock when leaving OKLCH (the concept only applies there).
    if (next !== 'oklch') lockRelativeChroma = false
  }

  function toggleLockRelativeChroma() {
    if (lockRelativeChroma) {
      lockRelativeChroma = false
      return
    }
    const okl = color.space === 'oklch' ? color : convert(color, 'oklch')
    lockedRelativePct = relativeChromaPct(
      okl.components[0],
      okl.components[1],
      okl.components[2],
    )
    lockRelativeChroma = true
  }

  // ---------- Relative chroma input ----------

  /**
   * What the relative-chroma input displays: the current absolute chroma
   * expressed as % of the max at this L/H, whether or not the lock is on.
   */
  const currentRelativePct = $derived.by(() => {
    const okl = color.space === 'oklch' ? color : convert(color, 'oklch')
    return relativeChromaPct(
      okl.components[0],
      okl.components[1],
      okl.components[2],
    )
  })

  /**
   * Format the relative chroma %: integers display as integers, but the field
   * carries 1 decimal of precision so Alt-Arrow stepping is visible.
   */
  function formatRelativePct(n: number): string {
    if (!Number.isFinite(n)) return '0'
    const fixed = n.toFixed(1)
    if (!fixed.includes('.')) return fixed
    return fixed.replace(/0+$/, '').replace(/\.$/, '')
  }

  function onRelativePctInput(raw: string) {
    // `Number("")` is 0, so an empty field would snap the color to
    // greyscale mid-edit. Skip empty / non-numeric input. The derived
    // value re-fills the field once a digit is typed.
    if (raw.trim() === '') return
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    const pct = Math.max(0, Math.min(100, n))
    const okl = color.space === 'oklch' ? color : convert(color, 'oklch')
    const [l, , h] = okl.components
    const newC = chromaForRelativePct(l, h, pct)
    if (lockRelativeChroma) lockedRelativePct = pct
    emit(makeColor('oklch', [l, newC, h], color.alpha))
  }

  // ---------- Chart curves ----------

  const canvasCurves = $derived.by<ChartCurve[]>(() => {
    const list: ChartCurve[] = []
    // Gamut + relative-chroma curves describe OKLCH-space shapes that
    // don't map cleanly to HSL coordinates.
    if (editor === 'oklch') {
      list.push(sampleGamutBoundary(hue, lockGamut))
      if (lockRelativeChroma) {
        list.push(sampleRelativeChromaCurve(hue, lockedRelativePct, lockGamut))
      }
    }
    // Contrast curve is editor-agnostic: it only depends on luminance
    // against the fixed `against` color.
    if (curveMode !== 'none' && contrastOpts) {
      const t = CONTRAST_THRESHOLDS[category]
      const target = curveMode === 'aa' ? t.aa : t.aaa
      const curveSpace = editor === 'oklch' ? 'oklch' : 'hsl'
      const curve = sampleContrastCurve(
        hue,
        contrastOpts.against,
        target,
        curveSpace,
        lockGamut,
      )
      if (curve) list.push(curve)
    }
    return list
  })

  // ---------- Channels view ----------

  const channelsView = $derived.by<{
    components: [number, number, number]
    alpha: number
  }>(() => {
    const ec = inEditor(color, editor)
    if (editor === 'rgb') {
      return {
        components: [
          ec.components[0] * 255,
          ec.components[1] * 255,
          ec.components[2] * 255,
        ],
        alpha: color.alpha,
      }
    }
    return {
      components: [ec.components[0], ec.components[1], ec.components[2]],
      alpha: color.alpha,
    }
  })

  const hexCurrent = $derived.by(() => {
    if (alpha && color.alpha < 1) return toHex(color)
    return toCss(color)
  })

  // ---------- Contrast & gamut ----------

  const contrastResult = $derived.by<ContrastResult | null>(() => {
    if (!contrastOpts) return null
    try {
      const against = parseColor(contrastOpts.against)
      const backdrop = contrastOpts.backdrop
        ? parseColor(contrastOpts.backdrop)
        : undefined
      return wcagContrast({ color, against, backdrop })
    } catch (e) {
      if (e instanceof ColorParseError) return null
      throw e
    }
  })

  /**
   * WCAG 2 category selected via the tune menu. Initialized from the `category`
   * ContrastOption, falls back to body.
   */
  let category = $state<ContrastCategory>(
    untrack(() => contrastOpts?.category ?? 'body'),
  )
  /** Whether (and which) contrast curve to render on the canvas. */
  let curveMode = $state<CurveMode>('none')

  const CONTRAST_THRESHOLDS: Record<
    ContrastCategory,
    { aa: number; aaa: number }
  > = {
    body: { aa: 4.5, aaa: 7 },
    large: { aa: 3, aaa: 4.5 },
    ui: { aa: 3, aaa: 3 },
  }

  const outOfGamut = $derived.by(() => {
    if (!gamutWarning) return false
    if (format === 'p3') return !inP3(color)
    // hex / css / rgb / hsl output is sRGB-bound.
    if (format === 'hex' || format === 'rgb' || format === 'hsl') {
      return !inSrgb(color)
    }
    return false
  })

  const clippedCss = $derived.by(() => {
    if (!outOfGamut) return ''
    if (format === 'p3') return toCss(clipTo(color, 'display-p3'))
    return toHex(clipTo(color, 'srgb'))
  })

  function clipToGamut() {
    const target = format === 'p3' ? 'display-p3' : 'srgb'
    emit(clipTo(color, target), { refreshHue: true })
  }

  // ---------- Copyable hex ----------

  const copyableHex = $derived(toHex(color))
  let copied = $state(false)
  let copyTimeout: number | undefined

  async function copyHex() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(copyableHex)
      copied = true
      if (copyTimeout) window.clearTimeout(copyTimeout)
      copyTimeout = window.setTimeout(() => {
        copied = false
      }, 1200)
    } catch {
      // user denied or no permission. Ignore.
    }
  }

  // ---------- Popover positioning + focus-trap ----------

  let popoverEl: HTMLDivElement | undefined = $state(undefined)
  let position = $state<{ x: number; y: number; placement: PopoverPlacement }>({
    x: 0,
    y: 0,
    placement: 'top-left',
  })
  let trap: focusTrap.FocusTrap | null = null
  let resizeObserver: ResizeObserver | null = null

  function recalculatePosition() {
    if (!popoverEl) return
    const anchor = anchorEl.getBoundingClientRect()
    const rect = popoverEl.getBoundingClientRect()
    // `documentElement.clientWidth/clientHeight` excludes the visible
    // scrollbar (`window.innerWidth/innerHeight` includes it), so the
    // popover won't overflow into the scrollbar gutter when the anchor
    // sits near the right or bottom edge.
    const root = document.documentElement
    position = placePopover(anchor, rect, {
      innerWidth: root.clientWidth || window.innerWidth,
      innerHeight: root.clientHeight || window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    })
  }

  onMount(async () => {
    await tick()
    recalculatePosition()
    try {
      popoverEl?.showPopover()
    } catch {
      // popover API not supported. Element still renders inline.
    }
    await tick()
    recalculatePosition()
    if (popoverEl) {
      trap = focusTrap.createFocusTrap(popoverEl, {
        clickOutsideDeactivates: true,
        escapeDeactivates: true,
        returnFocusOnDeactivate: false,
        onDeactivate: () => onclose(),
      })
      trap.activate()
    }
    // Reposition on size change: toggling the alpha / contrast / gamut
    // rows can grow the popover past the viewport otherwise.
    if (typeof ResizeObserver !== 'undefined' && popoverEl) {
      resizeObserver = new ResizeObserver(() => recalculatePosition())
      resizeObserver.observe(popoverEl)
    }
    window.addEventListener('resize', recalculatePosition)
    window.addEventListener('scroll', recalculatePosition, true)
  })

  onDestroy(() => {
    trap?.deactivate()
    try {
      popoverEl?.hidePopover()
    } catch {
      // ignore
    }
    resizeObserver?.disconnect()
    resizeObserver = null
    window.removeEventListener('resize', recalculatePosition)
    window.removeEventListener('scroll', recalculatePosition, true)
    if (copyTimeout) window.clearTimeout(copyTimeout)
  })

  function onPopoverKey(ev: KeyboardEvent) {
    if (ev.key === 'Escape') {
      ev.preventDefault()
      onclose()
    }
  }

  // ---------- SegmentedControl items ----------

  const editorItems = [
    { value: 'rgb' as EditorSpace, label: 'RGB' },
    { value: 'oklch' as EditorSpace, label: 'OKLCH' },
    { value: 'hsl' as EditorSpace, label: 'HSL' },
  ]
</script>

<div
  bind:this={popoverEl}
  popover="manual"
  role="dialog"
  tabindex="-1"
  aria-label="Color picker"
  class="popover tint--card popover-{position.placement}"
  style:left="{position.x}px"
  style:top="{position.y}px"
  onkeydown={onPopoverKey}
>
  <Canvas
    {editor}
    {hue}
    x={canvasXY.x}
    y={canvasXY.y}
    chromaMax={CHROMA_MAX}
    wideGamut={effectiveWideGamut}
    curves={canvasCurves}
    onPick={pickFromCanvas}
  />

  <div class="track-wrap">
    <Track
      value={hue}
      min={0}
      max={360}
      step={1}
      background={hueTrackBg}
      aria-label="Hue"
      onChange={changeHue}
    />
  </div>

  {#if alpha}
    <div class="track-wrap">
      <Track
        value={color.alpha}
        min={0}
        max={1}
        step={0.01}
        background={alphaTrackBg}
        checker
        aria-label="Alpha"
        onChange={changeAlpha}
      />
    </div>
  {/if}

  <div class="toggle-wrap">
    <SegmentedControl
      id="color-editor-toggle"
      label="Color model"
      items={editorItems}
      value={editor}
      small
      onchange={(v) => switchEditor(v)}
    />
  </div>

  {#if editor === 'oklch'}
    <div class="relative-row">
      <TextField
        label="Relative chroma %"
        value={formatRelativePct(currentRelativePct)}
        step={1}
        min={0}
        max={100}
        oninput={(e) =>
          onRelativePctInput((e.target as HTMLInputElement).value)}
        oncommit={(v) => onRelativePctInput(v)}
      />
      <Button
        small
        icon
        variant="ghost"
        toggled={lockRelativeChroma}
        aria-label={lockRelativeChroma
          ? `Unlock relative chroma (${Math.round(lockedRelativePct)}%)`
          : 'Lock relative chroma'}
        tooltip={lockRelativeChroma
          ? `Relative chroma locked at ${Math.round(lockedRelativePct)}%`
          : 'Lock relative chroma'}
        onclick={toggleLockRelativeChroma}
      >
        {@html lockRelativeChroma ? IconLock : IconLockUnlocked}
      </Button>
    </div>
  {/if}

  <Channels
    {editor}
    components={channelsView.components}
    alpha={channelsView.alpha}
    showAlpha={alpha}
    hexOrCss={hexCurrent}
    onChannel={setChannel}
    onAlpha={changeAlpha}
    onHex={commitHex}
  />

  {#if outOfGamut}
    <GamutWarning
      gamut={format === 'p3' ? 'Display-P3' : 'sRGB'}
      {clippedCss}
      onClip={clipToGamut}
    />
  {/if}

  {#if contrastOpts && contrastResult}
    <ContrastPanel
      result={contrastResult}
      role={contrastOpts.role ?? 'foreground'}
      againstCss={contrastOpts.against}
      pickedCss={toCss(color)}
      {category}
      {curveMode}
      onCategoryChange={(c) => (category = c)}
      onCurveModeChange={(m) => (curveMode = m)}
    />
  {/if}

  <footer class="footer-row">
    <button
      type="button"
      class="hex-copy"
      title={copied ? 'Copied' : 'Click to copy'}
      aria-label={copied ? 'Hex copied' : `Copy hex ${copyableHex}`}
      onclick={copyHex}
    >
      <code class="hex-copy__value">{copyableHex}</code>
      <span class="hex-copy__hint" aria-hidden="true">
        {@html copied ? IconDone : IconCopy}
      </span>
    </button>
    <span class="display-tag" aria-live="polite">
      Display: {effectiveWideGamut ? 'P3' : 'sRGB'}
    </span>
  </footer>
</div>

<style lang="sass">
.popover
  position: absolute
  z-index: 100
  width: 280px
  padding: tint.$size-12
  border-radius: tint.$size-12
  background: var(--tint-bg)
  color: var(--tint-text)
  display: flex
  flex-direction: column
  gap: tint.$size-8
  inset: unset
  border: 0
  box-shadow: var(--tint-card-shadow, 0 8px 32px rgba(0, 0, 0, 0.18))
  // Cap height to the viewport (minus the placePopover PAD per side)
  // so tall content (canvas + alpha + contrast + gamut warning) can't
  // overflow when anchored near a viewport edge. Inner sections scroll.
  // The chart's box-shadow + 12px padding mask the seam.
  max-height: calc(100dvh - #{tint.$size-16})
  overflow-y: auto
  overscroll-behavior: contain
  // Corner-aware open animation: scales toward the anchor so the
  // popover grows out of the input. Matches MenuInternal's easing.
  animation: color-picker-appear 250ms cubic-bezier(0.42, 1.67, 0.21, 0.90)

.popover.popover-top-left
  transform-origin: top left
.popover.popover-top-right
  transform-origin: top right
.popover.popover-bottom-left
  transform-origin: bottom left
.popover.popover-bottom-right
  transform-origin: bottom right

@keyframes color-picker-appear
  0%
    opacity: 0
    transform: scale(0.92)
  100%
    opacity: 1
    transform: scale(1)

@media (prefers-reduced-motion: reduce)
  .popover
    animation: none

.track-wrap
  padding: tint.$size-4 0

.toggle-wrap
  margin-block-start: tint.$size-4

.relative-row
  display: grid
  grid-template-columns: 1fr auto
  align-items: center
  gap: tint.$size-8

.footer-row
  display: flex
  align-items: center
  justify-content: space-between
  gap: tint.$size-8
  margin-block-start: tint.$size-4
  font-size: 0.78em
  color: var(--tint-text-secondary)

.hex-copy
  display: inline-flex
  align-items: center
  gap: tint.$size-4
  appearance: none
  background: transparent
  border: 0
  padding: tint.$size-2 0
  margin: 0
  color: var(--tint-text)
  cursor: pointer
  border-radius: tint.$size-4
  @include tint.effect-focus
  &:hover
    color: var(--tint-text-link)

.hex-copy__value
  font-variant-numeric: tabular-nums
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
  font-size: inherit
  user-select: all

.hex-copy__hint
  display: inline-flex
  align-items: center
  line-height: 0
  color: var(--tint-text-secondary)
  // Optical fit for the 20px copy icon at this row height.
  > :global(svg)
    width: tint.$size-16
    height: tint.$size-16

.display-tag
  white-space: nowrap

@media (forced-colors: active)
  .popover
    border: 1px solid CanvasText
</style>
