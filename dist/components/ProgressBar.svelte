<script lang="ts">
  import { onMount } from 'svelte'

  // Component props interface
  interface Props {
    progress?: number
    active?: boolean
    showProgress?: boolean
    // A space separated list of CSS classes.
    class?: string
  }

  // Props with defaults
  let {
    progress = 25,
    active = true,
    showProgress = false,
    class: className = '',
  }: Props = $props()

  let roundedProgress = $derived(Math.round(progress))

  // DOM element references
  let canvasElement = $state<HTMLCanvasElement | null>(null)
  let containerElement = $state<HTMLDivElement | null>(null)

  // Animation constants
  const ANIMATION_DURATION = 500 // Duration for amplitude and progress animations in ms
  const PADDING = 8 // Padding in px for left, right, and between squiggle and straight line
  const SQUIGGLE_CYCLES = 4 // Fixed number of wave cycles in the squiggle
  const PHASE_SPEED = 8 // Radians per second for the moving squiggle
  const STROKE_WIDTH = 4

  // Animation state
  let phase = 0
  let animationFrame: number
  let accentColor = '#000000'
  let lastTimestamp = 0

  // Animated values
  let currentProgress = $state(0)
  let currentAmplitude = 0

  // Animation tracking
  let progressStartTime: number | null = null
  let progressStartValue = 0
  let progressTargetValue = 0

  let amplitudeStartTime: number | null = null
  let amplitudeStartValue = 0
  let amplitudeTargetValue = 0

  // Accessibility and motion preferences
  let prefersReducedMotion = false

  /** Gets the current accent color from CSS custom properties */
  function getAccentColor(): string {
    if (!canvasElement) return '#007aff'
    const style = getComputedStyle(canvasElement)
    return style.getPropertyValue('color') || '#007aff'
  }

  /** Updates accent color if it has changed and redraws the canvas */
  function updateAccentColorAndRedraw(): void {
    const newColor = getAccentColor()
    if (newColor !== accentColor) {
      accentColor = newColor
      draw()
    }
  }

  /** Easing function for smooth animations (ease-out) */
  function easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  /** Adds a new progress value to animate to, ensuring smooth transitions */
  function setProgressTarget(newProgress: number): void {
    // Always restart animation from current position to new target
    progressTargetValue = newProgress
    progressStartValue = currentProgress
    progressStartTime = null // Reset to start new animation on next frame
  }

  /** Updates animated progress value */
  function updateProgress(timestamp: number): void {
    if (progressStartTime === null) {
      progressStartTime = timestamp
      progressStartValue = currentProgress
    }

    const elapsed = timestamp - progressStartTime
    const t = Math.min(elapsed / ANIMATION_DURATION, 1)
    const easedT = easeOut(t)

    currentProgress =
      progressStartValue + (progressTargetValue - progressStartValue) * easedT

    if (t >= 1) {
      progressStartTime = null
      currentProgress = progressTargetValue
    }
  }

  /** Updates animated amplitude value */
  function updateAmplitude(timestamp: number): void {
    if (amplitudeStartTime === null) {
      amplitudeStartTime = timestamp
      amplitudeStartValue = currentAmplitude
    }

    const elapsed = timestamp - amplitudeStartTime
    const t = Math.min(elapsed / ANIMATION_DURATION, 1)
    const easedT = easeOut(t)

    currentAmplitude =
      amplitudeStartValue +
      (amplitudeTargetValue - amplitudeStartValue) * easedT

    if (t >= 1) {
      amplitudeStartTime = null
      currentAmplitude = amplitudeTargetValue
    }
  }

  /** Main drawing function that renders the progress indicator */
  function draw(): void {
    if (!canvasElement || !containerElement) return

    // Setup canvas with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1
    const width = containerElement.clientWidth
    const height = containerElement.clientHeight

    canvasElement.width = width * dpr
    canvasElement.height = height * dpr
    canvasElement.style.width = width + 'px'
    canvasElement.style.height = height + 'px'

    const ctx = canvasElement.getContext('2d')
    if (!ctx) return

    // Reset and scale context
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    // Setup drawing style
    ctx.lineWidth = STROKE_WIDTH
    ctx.lineCap = 'round'
    ctx.globalAlpha = 1

    // Calculate dimensions
    const drawableWidth = width - 2 * PADDING
    const progressPx = PADDING + (drawableWidth * currentProgress) / 100
    const centerY = height / 2

    // Draw animated squiggly line (progress portion)
    ctx.strokeStyle = accentColor
    const squiggleStartX = PADDING
    const squiggleEndX = Math.max(squiggleStartX, progressPx - PADDING)

    if (squiggleEndX > squiggleStartX) {
      const squiggleLength = squiggleEndX - squiggleStartX

      ctx.moveTo(squiggleStartX, centerY)
      ctx.beginPath()

      // Generate squiggle points with height-adjusted frequency
      // Scale frequency based on container height to maintain visual consistency
      const baseFrequency = 50 // Base frequency for 12px height
      const heightScaledFrequency = baseFrequency * (height / 12)

      const steps = Math.max(16, Math.floor(squiggleLength / 2))
      for (let i = 0; i <= steps; i++) {
        const x = squiggleStartX + (squiggleLength * i) / steps
        // Use height-scaled frequency to maintain consistent visual frequency
        const t = x / heightScaledFrequency
        const y =
          centerY +
          currentAmplitude * Math.sin(2 * Math.PI * SQUIGGLE_CYCLES * t + phase)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Draw straight line (remaining portion)
    if (progress < 100) {
      ctx.beginPath()
      const straightStartX = Math.max(progressPx, PADDING)
      const straightEndX = width - PADDING

      ctx.moveTo(straightStartX, centerY)
      ctx.strokeStyle = accentColor
      ctx.globalAlpha = 0.5 // 50% opacity for incomplete portion
      ctx.lineTo(straightEndX, centerY)
      ctx.stroke()
    }
  }

  /** Handles canvas resize events */
  function resizeCanvas(): void {
    draw()
  }

  /** Main animation loop */
  function animate(timestamp: number): void {
    // Initialize timestamp on first frame
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp
    }

    const deltaTime = timestamp - lastTimestamp
    lastTimestamp = timestamp

    // Check if we need to start a progress animation
    if (progressStartTime === null && currentProgress !== progressTargetValue) {
      progressStartTime = timestamp
      progressStartValue = currentProgress
    }

    // Check if we need to start an amplitude animation
    if (
      amplitudeStartTime === null &&
      currentAmplitude !== amplitudeTargetValue
    ) {
      amplitudeStartTime = timestamp
      amplitudeStartValue = currentAmplitude
    }

    // Update animated values
    if (progressStartTime !== null) {
      updateProgress(timestamp)
    }
    if (amplitudeStartTime !== null) {
      updateAmplitude(timestamp)
    }

    // Update phase for squiggle animation (respect motion preferences)
    // Convert deltaTime from milliseconds to seconds and multiply by phase speed
    if (!prefersReducedMotion) {
      phase += PHASE_SPEED * (deltaTime / 1000)
    }

    draw()
    animationFrame = requestAnimationFrame(animate)
  }

  /** Checks for reduced motion preference */
  function checkReducedMotion(): void {
    prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  }

  /** Determines target amplitude based on component state */
  function calculateTargetAmplitude(): number {
    const shouldHaveAmplitude =
      active &&
      !(progress === 0 && currentProgress < 0.5) &&
      !(progress === 100 && currentProgress > 99.5) &&
      currentProgress > 0 &&
      currentProgress < 100
    return shouldHaveAmplitude
      ? (containerElement?.clientHeight || 12) / 4 - STROKE_WIDTH / 2
      : 0
  }

  // Reactive statements to handle prop changes
  $effect(() => {
    // React to progress prop changes
    if (progress !== currentProgress || progress !== progressTargetValue) {
      setProgressTarget(progress)
    }
  })

  $effect(() => {
    // React to active prop changes
    const newAmplitudeTarget = calculateTargetAmplitude()
    if (amplitudeTargetValue !== newAmplitudeTarget) {
      amplitudeTargetValue = newAmplitudeTarget
      amplitudeStartTime = null // Reset animation
    }
  })

  // Component lifecycle
  onMount(() => {
    // Initialize values
    accentColor = getAccentColor()
    checkReducedMotion()
    currentProgress = progress
    progressTargetValue = progress
    lastTimestamp = 0 // Initialize timestamp tracking

    // Set initial amplitude
    amplitudeTargetValue = calculateTargetAmplitude()
    currentAmplitude = amplitudeTargetValue

    // Start animation loop
    resizeCanvas()
    animationFrame = requestAnimationFrame(animate)

    // Setup event listeners
    window.addEventListener('resize', resizeCanvas)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', checkReducedMotion)

    // Poll for CSS variable changes (for inherited changes)
    const colorInterval = setInterval(updateAccentColorAndRedraw, 5000)

    // Cleanup function
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      mediaQuery.removeEventListener('change', checkReducedMotion)
      cancelAnimationFrame(animationFrame)
      clearInterval(colorInterval)
    }
  })
</script>

<!-- Progress indicator container with proper accessibility -->
<div
  class="progress-wrapper {className}"
  role="progressbar"
  aria-valuenow={roundedProgress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Progress: ${roundedProgress}%`}
>
  <!-- Optional progress text display -->
  {#if showProgress}
    <div class="progress-text" aria-hidden="true">
      {roundedProgress}%
    </div>
  {/if}

  <!-- Main progress indicator -->
  <div bind:this={containerElement} class="progress-container">
    <canvas bind:this={canvasElement} class="progress-canvas" aria-hidden="true"
    ></canvas>
  </div>

  <!-- Screen reader only text for accessibility -->
  <div class="tint--visually-hidden">
    Progress indicator showing {roundedProgress} percent complete{#if active},
      currently active{:else}, inactive{/if}
  </div>
</div>

<style>.progress-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: currentColor;
  background-color: color-mix(in srgb, transparent 90%, currentColor);
  padding: var(--tint-size-8);
  border-radius: var(--tint-radius-button-pill);
  white-space: nowrap;
  user-select: none;
  min-width: 4.5ch;
  text-align: center;
}

.progress-container {
  flex: 1;
  height: 16px;
  position: relative;
  min-width: 0;
}

.progress-canvas {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}</style>
