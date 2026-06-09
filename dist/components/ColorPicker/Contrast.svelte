<script lang="ts">
  import type { ContrastResult, WcagLevel } from '../../color'
  import type { ContrastCategory } from './format'
  import Button from '../Button.svelte'
  import Menu, {
    MENU_SEPARATOR,
    type MenuItem,
  } from '../Menu.svelte'
  import IconTune from '../../icons/20-tune.svg?raw'

  export type CurveMode = 'none' | 'aa' | 'aaa'

  interface Props {
    /** Current contrast computation (against the picked color). */
    result: ContrastResult
    /**
     * Whether the picked color is foreground or background. Only affects the
     * preview square's role labelling.
     */
    role: 'foreground' | 'background'
    /** CSS string for the counterpart color (rendered as the preview backdrop). */
    againstCss: string
    /** CSS string for the picked color (rendered as the preview foreground). */
    pickedCss: string
    /** Active WCAG category. Bindable so the parent can read it for curves. */
    category: ContrastCategory
    /** Active curve overlay mode. Bindable so the parent can read it. */
    curveMode: CurveMode
    /** Notification when the user picks a new category. */
    onCategoryChange: (c: ContrastCategory) => void
    /** Notification when the user changes the curve overlay choice. */
    onCurveModeChange: (m: CurveMode) => void
  }

  let {
    result,
    role,
    againstCss,
    pickedCss,
    category,
    curveMode,
    onCategoryChange,
    onCurveModeChange,
  }: Props = $props()

  // Per-category WCAG 2 thresholds. UI ("non-text") has only an AA-level
  // 3:1 floor. The AAA option is still exposed for UI, capped at the AA
  // value, so the AAA curve still draws meaningfully.
  const THRESHOLDS: Record<
    ContrastCategory,
    { aa: number; aaa: number; label: string }
  > = {
    body: { aa: 4.5, aaa: 7, label: 'Body text' },
    large: { aa: 3, aaa: 4.5, label: 'Large text' },
    ui: { aa: 3, aaa: 3, label: 'UI controls' },
  }

  function levelFor(ratio: number, cat: ContrastCategory): WcagLevel {
    const t = THRESHOLDS[cat]
    if (ratio >= t.aaa) return 'AAA'
    if (ratio >= t.aa) return 'AA'
    return 'fail'
  }

  const level = $derived(
    result.ratio == null ? 'fail' : levelFor(result.ratio, category),
  )

  const ratioText = $derived(
    result.ratio == null ? '—' : `${result.ratio.toFixed(2)}:1`,
  )

  // Menu items: category radio + separator + curve radio.
  let openMenu = $state<((e: Event) => void) | undefined>(undefined)

  const menuItems: MenuItem[] = $derived.by(() => {
    const cats: ContrastCategory[] = ['body', 'large', 'ui']
    const ratio = result.ratio
    const ratioStr = ratio == null ? '—' : ratio.toFixed(2)
    const catItems: MenuItem[] = cats.map((c) => {
      const t = THRESHOLDS[c]
      const hint = ratio == null ? `AA ≥ ${t.aa}` : `${ratioStr} / AA ${t.aa}`
      return {
        label: `${t.label} (${hint})`,
        checked: category === c,
        onClick: () => onCategoryChange(c),
      }
    })
    const curves: { value: CurveMode; label: string }[] = [
      { value: 'none', label: 'No curve' },
      { value: 'aa', label: 'Show AA curve' },
      { value: 'aaa', label: 'Show AAA curve' },
    ]
    const curveItems: MenuItem[] = curves.map((c) => ({
      label: c.label,
      checked: curveMode === c.value,
      onClick: () => onCurveModeChange(c.value),
    }))
    return [...catItems, MENU_SEPARATOR, ...curveItems]
  })
</script>

<section class="contrast" aria-label="WCAG 2 contrast">
  <span
    class="preview"
    style="background: {role === 'foreground'
      ? againstCss
      : pickedCss}; color: {role === 'foreground' ? pickedCss : againstCss};"
    aria-hidden="true"
  >
    A
  </span>

  <span class="ratio">{ratioText}</span>

  <span class={`level level-${level.toLowerCase()}`}>
    {level === 'fail' ? 'Fail' : level}
  </span>

  <Menu items={menuItems} bind:contextClick={openMenu} />

  <Button
    small
    icon
    variant="ghost"
    aria-label="Contrast settings"
    tooltip="Contrast settings"
    onclick={(e) => openMenu?.(e)}
  >
    {@html IconTune}
  </Button>

  {#if result.reason === 'alpha-without-backdrop'}
    <p class="hint">
      Pass <code>backdrop</code> so alpha can be flattened before WCAG 2.
    </p>
  {:else if result.clipped}
    <p class="hint">Wide-gamut color clipped to sRGB for WCAG 2.</p>
  {/if}
</section>

<style>.contrast {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--tint-input-bg);
}

.preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  font: inherit;
  font-weight: 700;
  font-size: 1.1em;
  line-height: 1;
  flex-shrink: 0;
}

.ratio {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  font-weight: 600;
  color: var(--tint-text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  font-size: 0.85em;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--tint-card-border);
  color: var(--tint-text);
}

.level-fail {
  color: var(--tint-text-accent);
  border-color: var(--tint-text-accent);
}

.hint {
  grid-column: 1/-1;
  margin: 0;
  font-size: 0.72em;
  color: var(--tint-text-secondary);
}

@media (forced-colors: active) {
  .level {
    border-color: CanvasText;
  }
  .level-fail {
    color: CanvasText;
    border-color: CanvasText;
  }
}</style>
