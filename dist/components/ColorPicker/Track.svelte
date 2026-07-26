<script lang="ts">
  interface Props {
    /** Current value in [min, max]. */
    value: number
    /** Inclusive minimum. */
    min: number
    /** Inclusive maximum. */
    max: number
    /** Step for arrow keys. Defaults to (max-min)/100. */
    step?: number
    /** CSS background for the gradient track. */
    background: string
    /** Whether to show a checker underlay (for alpha tracks). */
    checker?: boolean
    /** Small variant (matches Slider's `small`). Default true. */
    small?: boolean
    /** Accessible label. */
    'aria-label': string
    /** Called continuously while dragging. */
    onChange: (value: number) => void
  }

  let {
    value,
    min,
    max,
    step = (max - min) / 100,
    background,
    checker = false,
    small = true,
    'aria-label': ariaLabel,
    onChange,
  }: Props = $props()

  let trackEl: HTMLDivElement
  let dragging = $state(false)

  const fraction = $derived(((value - min) / (max - min)) * 100)

  function pickFromEvent(ev: PointerEvent) {
    const rect = trackEl.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
    onChange(min + frac * (max - min))
  }
  function onPointerDown(ev: PointerEvent) {
    dragging = true
    trackEl.setPointerCapture(ev.pointerId)
    pickFromEvent(ev)
  }
  function onPointerMove(ev: PointerEvent) {
    if (!dragging) return
    pickFromEvent(ev)
  }
  function onPointerUp(ev: PointerEvent) {
    dragging = false
    if (trackEl.hasPointerCapture(ev.pointerId)) {
      trackEl.releasePointerCapture(ev.pointerId)
    }
  }
  function onKeydown(ev: KeyboardEvent) {
    const s = ev.shiftKey ? step * 10 : step
    let v = value
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') v -= s
    else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') v += s
    else if (ev.key === 'Home') v = min
    else if (ev.key === 'End') v = max
    else return
    ev.preventDefault()
    onChange(Math.max(min, Math.min(max, v)))
  }
</script>

<div
  class="track-wrapper"
  class:small
  role="slider"
  tabindex="0"
  aria-label={ariaLabel}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
  bind:this={trackEl}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onkeydown={onKeydown}
  style="--fill-percentage: {fraction}"
>
  <div class="track" class:checker aria-hidden="true">
    <div class="gradient" style="background: {background};"></div>
  </div>
  <span class="thumb" aria-hidden="true"></span>
</div>

<style>.track-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  --track-height: var(--tint-size-32);
  --track-radius: var(--tint-size-16);
  --thumb-size: calc(var(--tint-size-24) + 4px);
  --edge-padding: var(--tint-size-2);
  height: var(--track-height);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  border-radius: var(--track-radius);
}
.track-wrapper:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .track-wrapper:focus-visible {
    outline-color: CanvasText;
  }
}
.track-wrapper.small {
  --track-height: var(--tint-size-16);
  --track-radius: var(--tint-size-8);
  --thumb-size: var(--tint-size-12);
  --edge-padding: var(--tint-size-2);
}

.track {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  height: var(--track-height);
  border-radius: var(--track-radius);
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  isolation: isolate;
}

.track.checker::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: conic-gradient(rgba(0, 0, 0, 0.18) 25%, transparent 0 50%, rgba(0, 0, 0, 0.18) 0 75%, transparent 0);
  background-size: var(--tint-size-8) var(--tint-size-8);
  z-index: 0;
}

.gradient {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.thumb {
  position: absolute;
  top: 50%;
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: var(--tint-bg);
  border-radius: 50%;
  border: 2px solid var(--tint-action-primary);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 2;
  transition: transform 250ms cubic-bezier(0.42, 1.67, 0.21, 0.9);
  left: calc(var(--edge-padding) + var(--thumb-size) / 2 + var(--fill-percentage) * (100% - var(--edge-padding) - var(--thumb-size) - var(--edge-padding)) / 100);
  transform: translate(-50%, -50%);
}

.track-wrapper:hover .thumb {
  transform: translate(-50%, -50%) scale(1.25);
}

@media (forced-colors: active) {
  .track {
    border: 1px solid ButtonText;
    box-sizing: border-box;
  }
  .thumb {
    background: ButtonFace;
    box-shadow: none;
  }
}</style>
