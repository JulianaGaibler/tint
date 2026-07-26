<script lang="ts">
  interface Props {
    // Id of the slider element
    id: string
    // Current value of the slider (can use bind:value)
    value?: number
    // Minimum value
    min?: number
    // Maximum value
    max?: number
    // Step increment
    step?: number
    // Whether the slider is disabled
    disabled?: boolean
    // Whether to show stepper points
    showSteps?: boolean
    // Whether to use small size (16px height, 12px thumb) or large (32px height, 28px thumb)
    small?: boolean
    // HTML element of the slider
    element?: HTMLInputElement | undefined
    // Event handler for when the value changes
    onchange?: (event: { value: number }) => void
    // Event handler for input (continuous updates while dragging)
    oninput?: (event: { value: number }) => void
    // aria-label of the slider
    'aria-label'?: string | undefined
    // aria-labelledby of the slider
    'aria-labelledby'?: string | undefined
    // aria-describedby of the slider
    'aria-describedby'?: string | undefined
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    id,
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    showSteps = false,
    small = true,
    element = $bindable(undefined),
    onchange = undefined,
    oninput = undefined,
    'aria-label': ariaLabel = undefined,
    'aria-labelledby': ariaLabelledby = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    class: className = '',
    ...elementProps
  }: Props = $props()

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    value = parseFloat(target.value)
    oninput?.({ value })
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement
    value = parseFloat(target.value)
    onchange?.({ value })
  }

  // Calculate step points for visual indicators
  const stepPoints = $derived(() => {
    if (!showSteps) return []
    const points: number[] = []
    const range = max - min
    const numSteps = Math.floor(range / step) + 1

    for (let i = 0; i < numSteps; i++) {
      const stepValue = min + i * step
      if (stepValue <= max) {
        const percentage = ((stepValue - min) / range) * 100
        points.push(percentage)
      }
    }

    return points
  })

  // Calculate fill percentage (0-100)
  const fillPercentage = $derived(() => {
    return ((value - min) / (max - min)) * 100
  })
</script>

<div
  class="slider-wrapper {className}"
  class:small
  class:disabled
  style="--fill-percentage: {fillPercentage()}"
>
  <input
    {disabled}
    {id}
    {min}
    {max}
    {step}
    type="range"
    aria-describedby={ariaDescribedby}
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledby}
    {value}
    bind:this={element}
    oninput={handleInput}
    onchange={handleChange}
    class="slider"
    {...elementProps}
  />

  <!-- Visual track -->
  <div class="slider-track" aria-hidden="true">
    <div class="slider-fill"></div>
  </div>

  {#if showSteps}
    <div class="step-points" aria-hidden="true">
      {#each stepPoints() as point (point)}
        <div class="step-point" style="left: {point}%"></div>
      {/each}
    </div>
  {/if}

  <!-- Visual thumb -->
  <div class="slider-thumb" aria-hidden="true"></div>
</div>

<style>.slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  --track-height: var(--tint-size-32);
  --track-radius: var(--tint-size-16);
  --thumb-size: calc(var(--tint-size-24) + 4px);
  --edge-padding: var(--tint-size-2);
  height: var(--track-height);
}
.slider-wrapper.small {
  --track-height: var(--tint-size-16);
  --track-radius: var(--tint-size-8);
  --thumb-size: var(--tint-size-12);
  --edge-padding: var(--tint-size-2);
}

.slider-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  height: var(--track-height);
  background: var(--tint-input-bg);
  border-radius: var(--track-radius);
  pointer-events: none;
  z-index: 0;
}

.slider-fill {
  height: 100%;
  background: var(--tint-action-primary);
  border-radius: var(--track-radius);
  transition: width 50ms ease-out;
  width: min(var(--edge-padding) + var(--thumb-size) + var(--edge-padding) + var(--fill-percentage) * (100% - var(--edge-padding) - var(--thumb-size) - var(--edge-padding)) / 100, 100%);
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: var(--tint-bg);
  border-radius: 50%;
  border: 2px solid var(--tint-action-primary);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 1;
  transition: left 50ms ease-out, transform 250ms cubic-bezier(0.42, 1.67, 0.21, 0.9);
  left: calc(var(--edge-padding) + var(--thumb-size) / 2 + var(--fill-percentage) * (100% - var(--edge-padding) - var(--thumb-size) - var(--edge-padding)) / 100);
}

.slider {
  appearance: none;
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: pointer;
  margin: 0;
  padding: 0;
  position: relative;
  z-index: 2;
  border-radius: var(--tint-size-32);
}
.slider:focus-visible {
  outline: 2px solid var(--tint-action-primary);
  outline-offset: 2px;
}
@media (forced-colors: active) {
  .slider:focus-visible {
    outline-color: CanvasText;
  }
}
.slider::-moz-range-track {
  width: 100%;
  height: var(--track-height);
  background: transparent;
  border: none;
}
.slider::-moz-range-progress {
  background: transparent;
}
.slider::-webkit-slider-thumb {
  appearance: none;
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: transparent;
  border: none;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  width: var(--thumb-size);
  height: var(--thumb-size);
  background: transparent;
  border: none;
  cursor: pointer;
}
.slider:hover + .slider-track ~ .slider-thumb {
  transform: translate(-50%, -50%) scale(1.25);
}

.slider-wrapper.disabled {
  opacity: 0.5;
}

.step-points {
  position: absolute;
  left: calc(var(--edge-padding) + var(--thumb-size) / 2);
  right: calc(var(--edge-padding) + var(--thumb-size) / 2);
  top: 50%;
  transform: translateY(-50%);
  height: var(--tint-size-2);
  pointer-events: none;
  z-index: 0;
}

.step-point {
  position: absolute;
  width: var(--tint-size-2);
  height: var(--tint-size-2);
  background: var(--tint-text-secondary);
  border-radius: 50%;
  transform: translateX(-50%);
}

.slider-wrapper.disabled .step-point {
  opacity: 0.5;
}

@media (forced-colors: active) {
  .slider-track {
    background: ButtonFace;
    border: 1px solid ButtonText;
    box-sizing: border-box;
  }
  .slider-fill {
    background: ButtonText;
  }
  .slider-thumb {
    background: ButtonFace;
    box-shadow: none;
  }
  .slider-wrapper.disabled .slider-track {
    border-color: GrayText;
  }
  .slider-wrapper.disabled .slider-fill {
    background: GrayText;
  }
  .slider-wrapper.disabled .slider-thumb {
    opacity: 1;
    background: GrayText;
  }
  .step-point {
    background: ButtonText;
  }
  .slider-wrapper.disabled .step-point {
    opacity: 1;
    background: GrayText;
  }
}</style>
