<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { hslToSrgb } from '@lib/color/convert'
  import { makeColor } from '@lib/color/types'
  import { convert } from '@lib/color/convert'
  import { CHROMA_MAX } from '@lib/color/constants'
  import type { EditorSpace } from './core'
  import type { ChartCurve } from './curves'

  interface Props {
    /** Which color model the canvas represents. */
    editor: EditorSpace
    /** Hue (0-360) for HSL / OKLCH editor. Ignored for RGB. */
    hue: number
    /** Selected X position in [0, 1]. */
    x: number
    /** Selected Y position in [0, 1]. */
    y: number
    /** Maximum chroma to display on the OKLCH chart's X axis. */
    chromaMax?: number
    /** Whether to render the canvas using Display-P3 CSS for wide-gamut. */
    wideGamut?: boolean
    /** Curves drawn over the canvas. Pass `undefined` or `[]` to hide. */
    curves?: ChartCurve[]
    /** Callback when the user drags / clicks. */
    onPick: (x: number, y: number) => void
  }

  let {
    editor,
    hue,
    x = $bindable(),
    y = $bindable(),
    chromaMax = CHROMA_MAX,
    wideGamut = false,
    curves = undefined,
    onPick,
  }: Props = $props()

  const LOW_RES = 32
  // Pick a backing size that stays sharp on Retina without blowing the
  // idle budget on 4K screens. The picker is ~250-300px wide, so this
  // lands between 128 (1× displays) and 384 (3× displays).
  const HIGH_RES = (() => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1
    return Math.min(512, Math.max(128, Math.ceil(128 * dpr)))
  })()

  let canvasEl: HTMLCanvasElement
  let containerEl: HTMLDivElement
  let dragging = $state(false)

  // Stable id for the legend so we can wire aria-describedby.
  const legendId = `color-picker-legend-${Math.floor(Math.random() * 1e9).toString(36)}`

  const labeledCurves = $derived(curves ? curves.filter((c) => c.label) : [])

  // ---------- Scratch canvas (OffscreenCanvas with HTMLCanvasElement fallback) ----------

  type Scratch =
    | { kind: 'off'; canvas: OffscreenCanvas }
    | { kind: 'dom'; canvas: HTMLCanvasElement }

  function makeScratch(size: number): Scratch {
    if (typeof OffscreenCanvas !== 'undefined') {
      return { kind: 'off', canvas: new OffscreenCanvas(size, size) }
    }
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    return { kind: 'dom', canvas: c }
  }

  // ---------- Idle scheduler with Safari fallback ----------

  type IdleHandle = number
  const scheduleIdle = (cb: () => void): IdleHandle =>
    typeof requestIdleCallback === 'function'
      ? (requestIdleCallback(cb, { timeout: 150 }) as unknown as IdleHandle)
      : (window.setTimeout(cb, 0) as unknown as IdleHandle)
  const cancelIdle = (h: IdleHandle): void => {
    if (typeof cancelIdleCallback === 'function') cancelIdleCallback(h)
    else window.clearTimeout(h)
  }
  let highResHandle: IdleHandle | null = null

  // ---------- Per-pixel painter (resolution-parameterized) ----------

  function buildImageData(
    ctx: CanvasRenderingContext2D,
    size: number,
  ): ImageData {
    const image = ctx.createImageData(size, size, {
      colorSpace: wideGamut ? 'display-p3' : 'srgb',
    })
    const data = image.data
    const denom = size - 1
    for (let yi = 0; yi < size; yi++) {
      const yNorm = yi / denom
      for (let xi = 0; xi < size; xi++) {
        const xNorm = xi / denom
        let r = 0,
          g = 0,
          b = 0
        if (editor === 'hsl') {
          const s = xNorm * 100
          const l = (1 - yNorm) * 100
          const srgb = hslToSrgb([hue, s, l])
          r = srgb[0]
          g = srgb[1]
          b = srgb[2]
        } else if (editor === 'oklch') {
          const c = xNorm * chromaMax
          const l = 1 - yNorm
          const okl = makeColor('oklch', [l, c, hue])
          const dest = wideGamut ? 'display-p3' : 'srgb'
          const srgb = convert(okl, dest).components
          r = srgb[0]
          g = srgb[1]
          b = srgb[2]
        } else {
          // RGB editor reuses the HSL plane for navigation.
          const s = xNorm * 100
          const l = (1 - yNorm) * 100
          const srgb = hslToSrgb([hue, s, l])
          r = srgb[0]
          g = srgb[1]
          b = srgb[2]
        }
        const clipped = r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1
        r = Math.max(0, Math.min(1, r))
        g = Math.max(0, Math.min(1, g))
        b = Math.max(0, Math.min(1, b))
        // Dim out-of-gamut pixels in addition to the SVG boundary line.
        // The line marks the edge, the dimming reinforces "past it".
        const dim = clipped ? 0.85 : 1
        const idx = (yi * size + xi) * 4
        data[idx + 0] = Math.round(r * 255 * dim)
        data[idx + 1] = Math.round(g * 255 * dim)
        data[idx + 2] = Math.round(b * 255 * dim)
        data[idx + 3] = 255
      }
    }
    return image
  }

  // ---------- Two-phase paint ----------

  function paint(): void {
    if (!canvasEl) return
    // Ensure the backing buffer matches HIGH_RES (set once on mount + DPR).
    if (canvasEl.width !== HIGH_RES) canvasEl.width = HIGH_RES
    if (canvasEl.height !== HIGH_RES) canvasEl.height = HIGH_RES

    const ctx = canvasEl.getContext('2d', {
      colorSpace: wideGamut ? 'display-p3' : 'srgb',
    })
    if (!ctx) return

    // Phase 1: low-res, painted to a scratch canvas, drawn scaled up.
    const lowImg = buildImageData(ctx, LOW_RES)
    const scratch = makeScratch(LOW_RES)
    if (scratch.kind === 'off') {
      const sc = scratch.canvas.getContext(
        '2d',
      ) as OffscreenCanvasRenderingContext2D | null
      if (sc) sc.putImageData(lowImg, 0, 0)
    } else {
      const sc = scratch.canvas.getContext(
        '2d',
      ) as CanvasRenderingContext2D | null
      if (sc) sc.putImageData(lowImg, 0, 0)
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(scratch.canvas, 0, 0, HIGH_RES, HIGH_RES)

    // Phase 2: high-res, scheduled on idle. Cancel any pending high-res
    // paint first so a rapid hue drag never backs up multiple paints.
    if (highResHandle !== null) cancelIdle(highResHandle)
    highResHandle = scheduleIdle(() => {
      const highImg = buildImageData(ctx, HIGH_RES)
      ctx.putImageData(highImg, 0, 0)
      highResHandle = null
    })
  }

  // Re-paint when hue, editor, chromaMax, or wideGamut changes.
  // (Not when x/y change. The cursor moves over the same canvas.)
  $effect(() => {
    const _trigger = `${editor}-${hue}-${chromaMax}-${wideGamut}`
    void _trigger
    requestAnimationFrame(() => {
      untrack(() => paint())
    })
  })

  onMount(() => {
    paint()
    return () => {
      if (highResHandle !== null) cancelIdle(highResHandle)
    }
  })

  // ---------- Pointer + keyboard ----------

  function pickFromEvent(ev: PointerEvent) {
    const rect = containerEl.getBoundingClientRect()
    const px = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
    const py = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height))
    onPick(px, py)
  }

  function onPointerDown(ev: PointerEvent) {
    dragging = true
    containerEl.setPointerCapture(ev.pointerId)
    pickFromEvent(ev)
  }
  function onPointerMove(ev: PointerEvent) {
    if (!dragging) return
    pickFromEvent(ev)
  }
  function onPointerUp(ev: PointerEvent) {
    dragging = false
    if (containerEl.hasPointerCapture(ev.pointerId)) {
      containerEl.releasePointerCapture(ev.pointerId)
    }
  }

  function onKeydown(ev: KeyboardEvent) {
    const step = ev.shiftKey ? 0.1 : 0.01
    let nx = x
    let ny = y
    if (ev.key === 'ArrowLeft') nx -= step
    else if (ev.key === 'ArrowRight') nx += step
    else if (ev.key === 'ArrowUp') ny -= step
    else if (ev.key === 'ArrowDown') ny += step
    else return
    ev.preventDefault()
    nx = Math.max(0, Math.min(1, nx))
    ny = Math.max(0, Math.min(1, ny))
    onPick(nx, ny)
  }
</script>

<div
  class="container"
  role="slider"
  tabindex="0"
  aria-label="2D color picker"
  aria-describedby={labeledCurves.length > 0 ? legendId : undefined}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(x * 100)}
  aria-valuetext="x {Math.round(x * 100)}%, y {Math.round(y * 100)}%"
  bind:this={containerEl}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onkeydown={onKeydown}
>
  <canvas
    bind:this={canvasEl}
    width={HIGH_RES}
    height={HIGH_RES}
    aria-hidden="true"
  ></canvas>

  {#if curves && curves.length > 0}
    <svg
      class="overlay"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <!-- All curves render the same way: a dark drop-stroke for legibility
           on light canvas regions + a white top-stroke. The wrapping <g>'s
           `stroke-dasharray` (set per `overlay-<style>` class) is inherited
           by both paths, so the dash pattern stays in sync. -->
      {#each curves as curve (curve.id)}
        <g class={`overlay-curve overlay-${curve.style}`}>
          <path d={curve.d} class="overlay-shadow" />
          <path d={curve.d} class="overlay-light" />
        </g>
      {/each}
    </svg>
  {/if}

  <span
    class="cursor"
    aria-hidden="true"
    style="left: {x * 100}%; top: {y * 100}%;"
  ></span>
</div>

{#if labeledCurves.length > 0}
  <ul class="legend" id={legendId} aria-label="Chart legend">
    {#each labeledCurves as curve (curve.id)}
      <li>
        <span class={`swatch swatch-${curve.style}`} aria-hidden="true"></span>
        {curve.label}
      </li>
    {/each}
  </ul>
{/if}

<style lang="sass">
.container
  position: relative
  width: 100%
  aspect-ratio: 1 / 1
  border-radius: tint.$size-8
  overflow: hidden
  cursor: crosshair
  touch-action: none
  user-select: none
  @include tint.effect-focus

canvas
  width: 100%
  height: 100%
  display: block
  image-rendering: auto

.overlay
  position: absolute
  inset: 0
  width: 100%
  height: 100%
  pointer-events: none

// Shared stroke params. Only the pattern differs per curve style.
.overlay-curve :global(path)
  fill: none
  stroke-width: 1.25
  vector-effect: non-scaling-stroke

.overlay-shadow
  stroke: rgba(0, 0, 0, 0.55)
  // Slight offset for the "shadow" half of the double-stroke. With
  // preserveAspectRatio="none", this offset scales with the container
  // aspect ratio, but the canvas is square so it stays uniform.
  transform: translate(0.5px, 0.5px)

.overlay-light
  stroke: rgba(255, 255, 255, 0.95)

// Differentiate curves by stroke pattern, not by color. The dasharray
// lives on the wrapping <g>, so it inherits into both paths and the
// shadow+light stay in lockstep.
.overlay-boundary
  // solid, no dasharray
.overlay-iso
  stroke-dasharray: 3 2
.overlay-contrast
  // dotted: round caps make the dots actually round
  stroke-dasharray: 0.1 2.5
  stroke-linecap: round

.cursor
  position: absolute
  width: tint.$size-12
  height: tint.$size-12
  border-radius: 50%
  background: transparent
  border: 2px solid #fff
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5)
  transform: translate(-50%, -50%)
  pointer-events: none

.legend
  margin: tint.$size-4 0 0 0
  padding: 0
  list-style: none
  display: flex
  flex-wrap: wrap
  gap: tint.$size-8
  font-size: 0.72em
  color: var(--tint-text-secondary)

.legend li
  display: inline-flex
  align-items: center
  gap: tint.$size-4

.legend .swatch
  display: inline-block
  width: 16px
  height: 0
  // Single color for all swatches. The line pattern is what tells them
  // apart. Uses the popover's text color so it's legible on either theme.
  border-top: 2px solid var(--tint-text)
  vertical-align: middle

.legend .swatch-boundary
  // solid (default)
.legend .swatch-iso
  border-top-style: dashed
.legend .swatch-contrast
  border-top-style: dotted
</style>
