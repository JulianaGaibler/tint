<script module lang="ts">
  // Which frame to show when the animation is not running (stopped,
  // reduced-motion, or before autoplay starts). A number is a zero-based
  // frame index.
  export type FilmstripStaticFrame = 'first' | 'last' | number

  // Imperative handle exposed via bind:this.
  export interface FilmstripInstance {
    // Start or resume playback.
    play(): void
    // Freeze on the current frame.
    pause(): void
    // Stop and return to the static frame.
    stop(): void
    // Restart playback from the first frame.
    restart(): void
    // Jump to a frame and pause on it.
    seek(frame: number): void
  }

  // Global keyframes: the animation-name is applied via an inline style (see
  // stripStyle), and inline styles are not scoped by Svelte, so the keyframes
  // must be global. The `-global-` prefix opts the definition out of scoping;
  // the name referenced elsewhere is `tint-filmstrip`.
  const KEYFRAME_NAME = 'tint-filmstrip'
</script>

<script lang="ts">
  import { onMount, untrack } from 'svelte'

  type Status = 'idle' | 'running' | 'paused' | 'finished'

  interface Props {
    // The filmstrip SVG source: a horizontal sprite-sheet whose root width is
    // frameSize * frameCount and height is frameSize. Rendered with {@html},
    // so it must be trusted or sanitized upstream.
    svg: string
    // Duration in milliseconds for one full pass through all frames. Takes
    // precedence over `fps` when both are set.
    duration?: number
    // Frames per second. Used to derive `duration` when `duration` is unset.
    // Defaults to 60 when neither `duration` nor `fps` is given.
    fps?: number
    // Override the number of frames. Defaults to the root SVG width / height.
    frameCount?: number
    // Override the source frame size in px. Defaults to the root SVG height.
    frameSize?: number
    // Displayed size of a single frame in px (square). Defaults to frameSize.
    renderSize?: number
    // Whether the animation loops. Default false (plays once).
    loop?: boolean
    // Start playing on mount. Default true.
    autoplay?: boolean
    // Two-way bindable playback state; mirrors play()/pause()/stop().
    playing?: boolean
    // Frame to display when not animating. Defaults to 'last' for one-shots
    // and 'first' for looping animations.
    staticFrame?: FilmstripStaticFrame
    // Accessible label. If omitted the graphic is treated as decorative.
    label?: string
    // Fired once when a non-looping animation completes.
    oncomplete?: () => void
    // Fired when playback starts (play or restart).
    onplay?: () => void
    // Fired when playback pauses.
    onpause?: () => void
    // A space separated list of CSS classes.
    class?: string
  }

  let {
    svg,
    duration,
    fps,
    frameCount: frameCountProp,
    frameSize: frameSizeProp,
    renderSize,
    loop = false,
    autoplay = true,
    playing = $bindable(false),
    staticFrame,
    label,
    oncomplete,
    onplay,
    onpause,
    class: className = '',
  }: Props = $props()

  // --- Structural values (SSR-safe: pure string parsing, no DOMParser) ---

  const structural = $derived(parseFilmstrip(svg))
  const frameCount = $derived(
    Math.max(1, frameCountProp ?? structural.frameCount),
  )
  const frameSize = $derived(frameSizeProp ?? structural.frameSize)
  const display = $derived(renderSize ?? frameSize)
  const totalDuration = $derived(duration ?? (frameCount / (fps ?? 60)) * 1000)

  // --- Playback state ---

  let status = $state<Status>('idle')
  let prefersReducedMotion = $state(false)
  let mounted = $state(false)
  // Forces the strip node to be recreated so a CSS animation restarts cleanly.
  let animationKey = $state(0)
  // When set, the strip shows this exact frame (via seek) instead of animating.
  let seekIndex = $state<number | null>(null)

  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let cycleStart = 0
  let elapsedBeforePause = 0

  // The animation is only allowed to run once mounted (client-side), when
  // motion is permitted and there is more than one frame to show.
  const canAnimate = $derived(
    mounted && !prefersReducedMotion && frameCount > 1,
  )

  // Whether the strip is currently in an animating state (as opposed to
  // showing a single static frame).
  const animate = $derived(
    canAnimate &&
      seekIndex === null &&
      (status === 'running' || status === 'paused' || status === 'finished'),
  )

  const stripStyle = $derived.by(() => {
    const base = `inline-size:${display * frameCount}px;block-size:${display}px;`
    if (animate) {
      // steps() needs a literal integer, so the timing function is built here
      // rather than in the scoped stylesheet. Looping uses steps(N) over the
      // full width; one-shots use jump-none so they rest on the last frame.
      const timing = loop
        ? `steps(${frameCount})`
        : `steps(${frameCount}, jump-none)`
      const end = loop ? '-100%' : `${(-(frameCount - 1) / frameCount) * 100}%`
      return (
        `${base}--fs-end:${end};` +
        `animation-name:${KEYFRAME_NAME};` +
        `animation-duration:${totalDuration}ms;` +
        `animation-timing-function:${timing};` +
        `animation-iteration-count:${loop ? 'infinite' : 1};` +
        `animation-fill-mode:forwards;`
      )
    }
    // Static: translate to a single frame. Before autoplay kicks in we show
    // the first frame to avoid a flash of the resting frame.
    const idx =
      seekIndex ??
      (status === 'idle' && autoplay && !prefersReducedMotion
        ? 0
        : resolveStaticFrame())
    const offset = frameCount > 1 ? (-idx / frameCount) * 100 : 0
    return `${base}transform:translateX(${offset}%);`
  })

  // --- Helpers ---

  function readLen(tag: string, attr: string): number | null {
    const match = tag.match(
      new RegExp(`\\s${attr}\\s*=\\s*["']?\\s*([\\d.]+)`, 'i'),
    )
    return match ? parseFloat(match[1]) : null
  }

  function parseFilmstrip(src: string): {
    frameCount: number
    frameSize: number
    exact: boolean
  } {
    // Only the first (root) <svg> tag carries reliable structural attributes.
    const rootTag = src.match(/<svg\b[^>]*>/i)?.[0] ?? ''
    const width = readLen(rootTag, 'width')
    const height = readLen(rootTag, 'height')
    const viewBox = rootTag
      .match(/viewBox\s*=\s*["']([\d.eE+\-\s,]+)["']/i)?.[1]
      ?.trim()
      .split(/[\s,]+/)
      .map(Number)
    const hasViewBox = viewBox?.length === 4
    const size = height ?? (hasViewBox ? viewBox![3] : NaN)
    const totalWidth = width ?? (hasViewBox ? viewBox![2] : NaN)
    if (
      !size ||
      !totalWidth ||
      !Number.isFinite(size) ||
      !Number.isFinite(totalWidth)
    ) {
      return { frameCount: 1, frameSize: 16, exact: false }
    }
    const raw = totalWidth / size
    const count = Math.max(1, Math.round(raw))
    return {
      frameCount: count,
      frameSize: size,
      exact: Math.abs(raw - count) < 0.01,
    }
  }

  function resolveStaticFrame(): number {
    const frame = staticFrame ?? (loop ? 'first' : 'last')
    if (frame === 'first') return 0
    if (frame === 'last') return frameCount - 1
    return Math.max(0, Math.min(frameCount - 1, Math.round(frame)))
  }

  function clearTimer() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function armTimer(ms: number) {
    // Looping animations never complete, so they need no fallback timer.
    if (loop) return
    clearTimer()
    timeoutId = setTimeout(onSegmentEnd, ms)
  }

  function remainingMs(): number {
    return Math.max(0, totalDuration - elapsedBeforePause)
  }

  // Single completion handler shared by the animationend event and the
  // timeout fallback; whichever fires first runs it and the guard makes the
  // second a no-op. animationend is not guaranteed to fire, hence the timer.
  function onSegmentEnd() {
    if (status !== 'running') return
    clearTimer()
    status = 'finished'
    playing = false
    oncomplete?.()
  }

  function handleAnimationEnd(event: AnimationEvent) {
    if (event.animationName !== KEYFRAME_NAME) return
    onSegmentEnd()
  }

  // Start playback from the first frame with a freshly recreated node.
  function begin() {
    clearTimer()
    elapsedBeforePause = 0
    seekIndex = null
    status = 'running'
    playing = true
    animationKey += 1
    cycleStart = performance.now()
    armTimer(totalDuration)
    onplay?.()
  }

  // --- Imperative API (exposed via bind:this) ---

  export function play() {
    if (!canAnimate) return
    if (status === 'running') return
    if (status === 'paused' && seekIndex === null) {
      // Resume: the CSS animation continues from where it froze, so re-arm the
      // fallback with the remaining time to stay aligned.
      status = 'running'
      playing = true
      cycleStart = performance.now()
      armTimer(remainingMs())
      onplay?.()
      return
    }
    begin()
  }

  export function pause() {
    if (status !== 'running') return
    elapsedBeforePause += performance.now() - cycleStart
    status = 'paused'
    playing = false
    clearTimer()
    onpause?.()
  }

  export function stop() {
    clearTimer()
    elapsedBeforePause = 0
    seekIndex = null
    status = 'idle'
    playing = false
  }

  export function restart() {
    if (!canAnimate) return
    begin()
  }

  export function seek(frame: number) {
    clearTimer()
    elapsedBeforePause = 0
    seekIndex = Math.max(0, Math.min(frameCount - 1, Math.round(frame)))
    status = 'paused'
    playing = false
  }

  // --- Lifecycle ---

  onMount(() => {
    mounted = true
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion = query.matches
    const onChange = () => (prefersReducedMotion = query.matches)
    query.addEventListener('change', onChange)
    return () => {
      query.removeEventListener('change', onChange)
      clearTimer()
    }
  })

  // (Re)initialise whenever the source or its structural inputs change.
  $effect(() => {
    // Reading these into an object registers them as reset dependencies.
    const deps = {
      svg,
      frameCount,
      totalDuration,
      loop,
      autoplay,
      reduced: prefersReducedMotion,
      ready: mounted,
    }
    untrack(() => {
      if (!deps.ready) return
      stop()
      if (deps.reduced) {
        // No motion: one-shots resolve to their completed frame, so notify
        // consumers that gate on completion.
        if (!deps.loop) oncomplete?.()
        return
      }
      if (deps.autoplay && deps.frameCount > 1) begin()
    })
  })

  // Keep the bindable `playing` prop in sync with external writes.
  $effect(() => {
    const want = playing
    untrack(() => {
      if (want && status !== 'running') play()
      else if (!want && status === 'running') pause()
    })
  })

  // Dev-only hint when the frame count could not be inferred cleanly.
  $effect(() => {
    const info = structural
    const overridden = frameCountProp !== undefined
    const ready = mounted
    untrack(() => {
      if (!ready || overridden || info.exact) return
      if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
        console.warn(
          `[Filmstrip] Could not cleanly infer the frame count from the SVG ` +
            `(width is not a multiple of height). Using ${info.frameCount}. ` +
            `Pass the \`frameCount\` prop to override.`,
        )
      }
    })
  })
</script>

<div
  class={`tint--filmstrip ${className}`}
  style={`--fs-display:${display}px`}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  {#key animationKey}
    <div
      class="strip"
      class:running={animate && status === 'running'}
      class:paused={animate && (status === 'paused' || status === 'finished')}
      style={stripStyle}
      onanimationend={handleAnimationEnd}
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html svg}
    </div>
  {/key}
</div>

<style lang="sass">
  .tint--filmstrip
    display: inline-block
    overflow: hidden
    inline-size: var(--fs-display)
    block-size: var(--fs-display)
    line-height: 0
    color: currentColor

  .strip
    display: block
    will-change: transform
    animation-play-state: paused

    &.running
      animation-play-state: running

    &.paused
      animation-play-state: paused

    > :global(svg)
      display: block
      inline-size: 100%
      block-size: 100%

  @keyframes -global-tint-filmstrip
    from
      transform: translateX(0)
    to
      transform: translateX(var(--fs-end, -100%))

  @media (prefers-reduced-motion: reduce)
    .strip
      animation: none !important
</style>
