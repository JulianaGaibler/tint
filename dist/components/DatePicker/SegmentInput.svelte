<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    setDayPeriod,
    step,
    typeDigit,
    type Segment,
    type SegmentType,
  } from './segments.js'

  export interface SegmentLabels {
    day?: string
    month?: string
    year?: string
    hour?: string
    minute?: string
    second?: string
    dayPeriod?: string
    am?: string
    pm?: string
  }

  const DEFAULT_LABELS: Required<SegmentLabels> = {
    day: 'Day',
    month: 'Month',
    year: 'Year',
    hour: 'Hour',
    minute: 'Minute',
    second: 'Second',
    dayPeriod: 'AM or PM',
    am: 'AM',
    pm: 'PM',
  }

  interface Props {
    /** The segment list. Mutated in place as the user types, steps, or pastes. */
    segments: Segment[]
    /** Resolves a month's full name for the spoken announcement. */
    locale?: string
    /** Overrides for the English segment names and AM/PM strings. */
    labels?: SegmentLabels
    disabled?: boolean
    /** Exactly one of this and `aria-label` is required. */
    'aria-labelledby'?: string
    /**
     * The input's accessible name directly, for a second input in the same
     * field (a date range's end, or a datetime field's time half) where a
     * single shared label id cannot tell the two apart.
     */
    'aria-label'?: string
    'aria-describedby'?: string
    /**
     * Fires when focus enters or leaves the input. The owner uses this to stop
     * resyncing `segments` from an external value while the user is mid-edit,
     * the same reason ColorPicker's popover decides its tab once at mount
     * rather than from a continuously updating value.
     */
    onFocusChange?: (focused: boolean) => void
    class?: string
  }

  let {
    segments = $bindable(),
    locale = undefined,
    labels = {},
    disabled = false,
    'aria-labelledby': ariaLabelledby = undefined,
    'aria-label': ariaLabel = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    onFocusChange = undefined,
    class: className = '',
  }: Props = $props()

  $effect.pre(() => {
    if (!ariaLabelledby && !ariaLabel) {
      throw new Error(
        '[tint] SegmentInput needs either aria-labelledby or aria-label',
      )
    }
    if (ariaLabelledby && ariaLabel) {
      throw new Error(
        '[tint] SegmentInput cannot use both aria-labelledby and aria-label',
      )
    }
  })

  const resolvedLabels = $derived({ ...DEFAULT_LABELS, ...labels })

  const monthFormatter = $derived(
    new Intl.DateTimeFormat(locale, { month: 'long' }),
  )

  const PLACEHOLDER: Partial<Record<SegmentType, string>> = {
    day: 'dd',
    month: 'mm',
    year: 'yyyy',
    hour: 'hh',
    minute: 'mm',
    second: 'ss',
    dayPeriod: '—',
  }

  function displayText(segment: Segment): string {
    if (segment.type === 'literal') return segment.text ?? ''
    if (segment.value === null) return PLACEHOLDER[segment.type] ?? ''
    if (segment.type === 'dayPeriod') {
      return segment.value === 1 ? resolvedLabels.pm : resolvedLabels.am
    }
    return String(segment.value).padStart(segment.pad, '0')
  }

  /**
   * What a screen reader hears for the segment currently selected, since a
   * plain text input carries none of `role="spinbutton"`'s own narration.
   */
  function spokenValue(segment: Segment): string {
    if (segment.value === null) return 'empty'
    if (segment.type === 'month') {
      return monthFormatter.format(new Date(2000, segment.value - 1, 1))
    }
    if (segment.type === 'dayPeriod') {
      return segment.value === 1 ? resolvedLabels.pm : resolvedLabels.am
    }
    return String(segment.value)
  }

  const renderedValue = $derived(segments.map(displayText).join(''))

  /** Each segment's `[start, end)` run of characters in `renderedValue`. */
  const ranges = $derived.by(() => {
    let pos = 0
    return segments.map((segment) => {
      const length = displayText(segment).length
      const range = { start: pos, end: pos + length }
      pos += length
      return range
    })
  })

  const editableIndexes = $derived(
    segments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => segment.type !== 'literal')
      .map(({ index }) => index),
  )

  let inputEl = $state<HTMLInputElement | undefined>(undefined)
  let focusedIndex = $state(0)
  $effect(() => {
    if (segments[focusedIndex]?.type === 'literal') {
      focusedIndex = editableIndexes[0] ?? 0
    }
  })

  // Cleared on every segment change, so a digit typed right after Tab or an
  // arrow key starts a fresh segment instead of continuing whatever was
  // buffered for the one focus just left. Empty means "nothing typed into
  // this segment yet", which is also what tells the selection effect below
  // to highlight the whole segment rather than place a collapsed caret.
  let typedBuffer = $state('')

  let announcement = $state('')

  /**
   * Applies the current segment's selection to the input: the whole segment
   * when nothing has been typed into it yet, or a collapsed caret after
   * whatever has, and announces it for a screen reader.
   *
   * Called both reactively, from the `$effect` below, and directly from the
   * mouse handlers, which need it to run even when `focusedIndex` and
   * `typedBuffer` come out exactly as they already were, the same segment
   * clicked again. Svelte's effects only rerun on an actual change to a
   * dependency, so that case would otherwise leave the native click's own
   * collapsed caret in place instead of restoring the full segment.
   */
  function syncSelection() {
    const range = ranges[focusedIndex]
    if (!inputEl || !range) return
    if (typedBuffer === '') {
      inputEl.setSelectionRange(range.start, range.end)
    } else {
      const pos = range.start + typedBuffer.length
      inputEl.setSelectionRange(pos, pos)
    }
    const segment = segments[focusedIndex]
    if (segment) {
      const label = resolvedLabels[segment.type as keyof SegmentLabels]
      announcement = `${label} ${spokenValue(segment)}`
    }
  }

  // Runs after Svelte has written `renderedValue` into the input (effects
  // run post-render), since re-selecting against the old string's length
  // would land in the wrong place once the text has changed.
  $effect(() => {
    void renderedValue
    void focusedIndex
    void typedBuffer
    syncSelection()
  })

  function adjacentEditable(from: number, direction: 1 | -1): number | null {
    const at = editableIndexes.indexOf(from)
    const next = editableIndexes[at + direction]
    return next ?? null
  }

  function selectSegment(index: number) {
    focusedIndex = index
    typedBuffer = ''
    syncSelection()
  }

  function applyTyped(index: number, digit: number) {
    const result = typeDigit(segments[index], digit, typedBuffer)
    segments[index] = result.segment
    typedBuffer = result.buffer
    focusedIndex = index
    if (result.advance) {
      const next = adjacentEditable(index, 1)
      if (next !== null) {
        selectSegment(next)
        if (result.carry !== undefined) applyTyped(next, result.carry)
      }
    }
  }

  let snapshot: Segment[] | null = null

  function onFocus() {
    if (snapshot === null) {
      snapshot = segments.map((s) => ({ ...s }))
      onFocusChange?.(true)
    }
  }

  function onBlur() {
    snapshot = null
    typedBuffer = ''
    onFocusChange?.(false)
  }

  function segmentAtPosition(pos: number): number {
    for (const i of editableIndexes) {
      if (pos >= ranges[i].start && pos < ranges[i].end) return i
    }
    // Landed on a literal (or past either end): the nearest segment by
    // distance to its own boundary, not just the next one going forward, so
    // a click just past the end of a segment still lands on that segment
    // rather than skipping ahead to the one after it.
    let best = editableIndexes[0] ?? 0
    let bestDistance = Infinity
    for (const i of editableIndexes) {
      const distance = Math.min(
        Math.abs(ranges[i].start - pos),
        Math.abs(ranges[i].end - pos),
      )
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }
    return best
  }

  /**
   * A held mouse button is a native text selection drag. Even a press too
   * steady to count as an intentional drag by eye still moves the pointer by a
   * pixel or two, enough for the browser to collapse the clicked segment's
   * highlight to a bare caret while the button is still down, since a segment
   * is only ever selected as a whole or not. Reapplying the current segment's
   * own range on every move while the button is held cancels that out, so the
   * highlight stays put for the whole press rather than only snapping back once
   * it is released.
   */
  function onMouseDown(e: MouseEvent) {
    if (disabled || e.button !== 0) return
    // Defensive: a stray prior listener would only ever still be attached if
    // a mouseup somehow never reached the window between presses.
    window.removeEventListener('mousemove', onDragMove)
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragCleanup, { once: true })
  }

  onDestroy(() => {
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('mouseup', onDragCleanup)
  })

  function onDragMove() {
    if (!inputEl) return
    // The native caret still tracks the pointer even though its own
    // selection is being overridden, so this follows a genuine drag to a
    // different segment live rather than only resolving one on release.
    selectSegment(segmentAtPosition(inputEl.selectionStart ?? 0))
  }

  function onDragCleanup() {
    window.removeEventListener('mousemove', onDragMove)
  }

  /**
   * A plain click (no drag) still needs its own correction: the browser places
   * the native caret as part of the click's own default action, which the spec
   * runs only once the whole mousedown, mouseup, click sequence has finished
   * dispatching, after every listener's turn including this one. Calling
   * setSelectionRange from here directly would still lose to it. Deferring to a
   * fresh task is what reliably lands after it; a microtask is not late enough,
   * since it is the click event, dispatched after this one, that carries the
   * placement, not mouseup.
   */
  function onClick() {
    if (disabled || !inputEl) return
    // Synchronous: by this point mousedown's own default action has already
    // placed the native caret, so selectionStart already names the right
    // segment, and a keystroke typed right after this click must land there
    // immediately rather than wait on the deferred visual fix below.
    selectSegment(segmentAtPosition(inputEl.selectionStart ?? 0))
    // The click event's own caret placement is a second, separate default
    // action, which the spec runs only once the whole event has finished
    // dispatching, after every listener's turn including this one. It can
    // still override the call above for the visual selection alone, so a
    // fresh task, which reliably lands after it, redoes just that part.
    setTimeout(syncSelection, 0)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (disabled) return
    const segment = segments[focusedIndex]
    if (!segment) return

    if (e.key.length === 1 && e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      applyTyped(focusedIndex, Number(e.key))
      return
    }

    if (segment.type === 'dayPeriod' && /^[ap]$/i.test(e.key)) {
      e.preventDefault()
      segments[focusedIndex] = setDayPeriod(
        segment,
        e.key.toLowerCase() === 'a' ? 0 : 1,
      )
      return
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault()
        const multiplier = e.shiftKey ? 10 : 1
        const direction = e.key === 'ArrowUp' ? 1 : -1
        segments[focusedIndex] = step(segment, direction * multiplier)
        typedBuffer = ''
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const prev = adjacentEditable(focusedIndex, -1)
        if (prev !== null) selectSegment(prev)
        break
      }
      case 'ArrowRight': {
        e.preventDefault()
        const next = adjacentEditable(focusedIndex, 1)
        if (next !== null) selectSegment(next)
        break
      }
      case 'Home': {
        e.preventDefault()
        selectSegment(editableIndexes[0] ?? focusedIndex)
        break
      }
      case 'End': {
        e.preventDefault()
        selectSegment(
          editableIndexes[editableIndexes.length - 1] ?? focusedIndex,
        )
        break
      }
      case 'Backspace': {
        e.preventDefault()
        const wasEmpty = segment.value === null
        segments[focusedIndex] = { ...segment, value: null }
        typedBuffer = ''
        if (wasEmpty) {
          const prev = adjacentEditable(focusedIndex, -1)
          if (prev !== null) selectSegment(prev)
        }
        break
      }
      case 'Escape': {
        // Only an edit made since the input was last entered counts as
        // something to undo. Swallowing Escape unconditionally would make
        // the popover this field sits in impossible to dismiss.
        if (snapshot && JSON.stringify(snapshot) !== JSON.stringify(segments)) {
          e.preventDefault()
          segments = snapshot.map((s) => ({ ...s }))
          typedBuffer = ''
        }
        break
      }
    }
  }

  /**
   * A pasted date is read digit by digit from the start, the same path typing
   * it by hand would take, so `10/07/2026`, `10072026`, and anything else with
   * four digits of noise around the numbers all land the same way. Anything
   * that pastes as no digits at all (a word, an empty clipboard) is left for
   * the user to type over themselves.
   */
  function onPaste(e: ClipboardEvent) {
    if (disabled) return
    e.preventDefault()
    const digits = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
    if (!digits) return
    const first = editableIndexes[0]
    if (first === undefined) return
    selectSegment(first)
    for (const ch of digits) {
      applyTyped(focusedIndex, Number(ch))
    }
  }
</script>

<input
  bind:this={inputEl}
  type="text"
  inputmode="numeric"
  autocomplete="off"
  spellcheck="false"
  class="segment-input {className}"
  style="width: {renderedValue.length}ch"
  value={renderedValue}
  {disabled}
  aria-labelledby={ariaLabelledby}
  aria-label={ariaLabel}
  aria-describedby={ariaDescribedby}
  onkeydown={onKeyDown}
  onmousedown={onMouseDown}
  onclick={onClick}
  onfocus={onFocus}
  onblur={onBlur}
  onpaste={onPaste}
/><span class="tint--visually-hidden" aria-live="polite">{announcement}</span>

<style>.segment-input {
  appearance: none;
  box-sizing: border-box;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  color: currentColor;
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: text;
  outline: none;
}
.segment-input::selection {
  background-color: var(--tint-action-primary);
  color: var(--tint-action-primary-text);
}
.segment-input:disabled {
  cursor: not-allowed;
}

@media (forced-colors: active) {
  .segment-input::selection {
    background-color: Highlight;
    color: HighlightText;
  }
}</style>
