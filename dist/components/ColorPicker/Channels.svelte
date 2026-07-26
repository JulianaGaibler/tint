<script lang="ts">
  import TextField from '../TextField.svelte'
  import { untrack } from 'svelte'
  import type { EditorSpace } from './core'

  interface Props {
    editor: EditorSpace
    components: [number, number, number]
    alpha: number
    showAlpha: boolean
    /**
     * The canonical hex/CSS string for the current color. The hex field
     * displays this whenever it isn't being actively edited.
     */
    hexOrCss: string
    onChannel: (index: 0 | 1 | 2, value: number) => void
    onAlpha: (value: number) => void
    /**
     * Try to apply `value` as a color. Return true when applied, false when the
     * input couldn't be parsed. On false, the field silently reverts to
     * `hexOrCss` with no red border or error message.
     */
    onHex: (value: string) => boolean
  }

  let {
    editor,
    components,
    alpha,
    showAlpha,
    hexOrCss,
    onChannel,
    onAlpha,
    onHex,
  }: Props = $props()

  // ---------- Hex / CSS field: free-form editor with commit/revert ----------
  // Local mirror of `hexOrCss` so the user can type anything without the
  // canonical value clobbering mid-edit. Escape-to-revert is handled by
  // TextField's preEditValue. On commit (Enter / blur), unparseable input
  // snaps back to the canonical hex.
  let hexInput = $state(untrack(() => hexOrCss))
  let hexFocused = $state(false)

  // Skip the sync while the field is focused. Otherwise an upstream
  // change (slider drag, channel input) would overwrite mid-edit.
  $effect(() => {
    const next = hexOrCss
    if (untrack(() => hexFocused)) return
    hexInput = next
  })

  function handleHexCommit(value: string) {
    if (onHex(value)) {
      // Parent accepted the input. The field keeps focus, so the
      // not-focused effect doesn't fire and `hexInput` stays as typed.
      return
    }
    // Invalid input: silently revert to the canonical hex.
    hexInput = hexOrCss
  }

  type ChannelMeta = {
    label: string
    min: number
    max: number
    step: number
    decimals: number
  }
  // `decimals` is sized for Alt-stepping (step × 0.1) so the fine
  // increment can render. `format()` trims trailing fractional zeros,
  // so on-grid values still display as integers.
  const meta: [ChannelMeta, ChannelMeta, ChannelMeta] = $derived.by(() => {
    if (editor === 'hsl') {
      return [
        { label: 'H', min: 0, max: 360, step: 1, decimals: 1 },
        { label: 'S', min: 0, max: 100, step: 1, decimals: 1 },
        { label: 'L', min: 0, max: 100, step: 1, decimals: 1 },
      ]
    }
    if (editor === 'oklch') {
      return [
        { label: 'L', min: 0, max: 1, step: 0.01, decimals: 3 },
        { label: 'C', min: 0, max: 0.4, step: 0.001, decimals: 4 },
        { label: 'H', min: 0, max: 360, step: 1, decimals: 1 },
      ]
    }
    return [
      { label: 'R', min: 0, max: 255, step: 1, decimals: 1 },
      { label: 'G', min: 0, max: 255, step: 1, decimals: 1 },
      { label: 'B', min: 0, max: 255, step: 1, decimals: 1 },
    ]
  })

  function format(value: number, m: ChannelMeta): string {
    if (!Number.isFinite(value)) return ''
    const fixed = value.toFixed(m.decimals)
    // Only trim when there's a decimal. Otherwise we'd strip trailing
    // zeros from integer values ("220" would become "22").
    if (!fixed.includes('.')) return fixed
    return fixed.replace(/0+$/, '').replace(/\.$/, '')
  }

  function commitChannel(index: 0 | 1 | 2, raw: string) {
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    const m = meta[index]
    const clamped = Math.max(m.min, Math.min(m.max, num))
    onChannel(index, clamped)
  }

  function commitAlpha(raw: string) {
    const num = Number(raw)
    if (!Number.isFinite(num)) return
    onAlpha(Math.max(0, Math.min(1, num)))
  }
</script>

<div class="grid" class:show-alpha={showAlpha}>
  {#each meta as m, i (i)}
    <TextField
      label={m.label}
      value={format(components[i], m)}
      step={m.step}
      min={m.min}
      max={m.max}
      oncommit={(v) => commitChannel(i as 0 | 1 | 2, v)}
      commitOnEnter
    />
  {/each}
  {#if showAlpha}
    <TextField
      label="α"
      value={format(alpha, {
        label: 'α',
        min: 0,
        max: 1,
        step: 0.01,
        decimals: 3,
      })}
      step={0.01}
      min={0}
      max={1}
      oncommit={(v) => commitAlpha(v)}
      commitOnEnter
    />
  {/if}
</div>
<div class="hex-row">
  <TextField
    label="Hex / CSS"
    bind:value={hexInput}
    onfocus={() => (hexFocused = true)}
    onblur={() => (hexFocused = false)}
    oncommit={handleHexCommit}
    commitOnEnter
  />
</div>

<style>.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--tint-size-8);
}

.grid.show-alpha {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.hex-row {
  margin-block-start: var(--tint-size-8);
}</style>
