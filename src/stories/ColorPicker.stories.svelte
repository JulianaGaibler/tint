<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import ColorPicker from '@lib/components/ColorPicker/ColorPicker.svelte'
  import { fn } from 'storybook/test'

  const { Story } = defineMeta({
    title: 'Components/ColorPicker',
    component: ColorPicker,
    args: {
      onchange: fn(),
    },
  })
</script>

<script lang="ts">
  import type { PaletteColor } from '@lib/components/ColorPicker/palette'

  let hex = $state('#3366cc')
  let hexAlpha = $state('#3366cc99')
  let oklchVal = $state({ l: 0.7, c: 0.18, h: 22, alpha: 1 })
  let rgbVal = $state({ r: 51, g: 102, b: 204, alpha: 1 })
  let hslVal = $state({ h: 220, s: 60, l: 50, alpha: 1 })
  let p3Val = $state({ r: 1, g: 0.2, b: 0.4, alpha: 1 })
  let contrastFg = $state('#1e1d25')
  let contrastFgAlpha = $state('#1e1d2580')
  let outOfGamut = $state('#ff0000')

  // A representative ~120-entry palette: 12 hues × 10 shades. Hues sampled
  // around the HSL hue wheel; shades step lightness from 5% (darkest) to
  // 95% (lightest) at a fixed saturation. The exact values don't matter for
  // the picker — what matters is exercising the grouping, matching, search,
  // and keyboard nav at a realistic scale.
  const HUES: { name: string; h: number }[] = [
    { name: 'red', h: 0 },
    { name: 'orange', h: 30 },
    { name: 'yellow', h: 55 },
    { name: 'lime', h: 90 },
    { name: 'green', h: 130 },
    { name: 'teal', h: 170 },
    { name: 'cyan', h: 195 },
    { name: 'blue', h: 220 },
    { name: 'indigo', h: 250 },
    { name: 'violet', h: 275 },
    { name: 'magenta', h: 305 },
    { name: 'pink', h: 335 },
  ]
  const SHADES = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]

  const designSystemPalette: PaletteColor[] = HUES.flatMap((hue) =>
    SHADES.map((l) => ({
      name: `color/${hue.name}/${l}`,
      value: `hsl(${hue.h} 70% ${l}%)`,
    })),
  ).concat([
    // A few ungrouped entries to exercise the headerless path.
    { name: 'background', value: '#ffffff' },
    { name: 'foreground', value: '#1e1d25' },
    { name: 'accent', value: '#3366cc' },
  ])

  let paletteHex = $state('hsl(0 70% 55%)') // matches color/red/55
  let paletteHexNoMatch = $state('#abcdef')
</script>

<!-- Default: outputs an 8-character hex string. -->
<Story
  name="Basic (hex)"
  args={{
    id: 'cp-basic',
    label: 'Brand color',
    value: '#3366cc',
    format: 'hex',
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={hex} />
    <p style="margin-top:1em;">Bound value: <code>{hex}</code></p>
  {/snippet}
</Story>

<!-- Output value is a structured OKLCH object. The picker preserves the
  full OKLCH precision on round-trip. -->
<Story
  name="Structured OKLCH"
  args={{
    id: 'cp-oklch',
    label: 'Accent',
    format: 'oklch',
    value: { l: 0.7, c: 0.18, h: 22, alpha: 1 },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={oklchVal} />
    <p style="margin-top:1em;">
      Bound value: <code>{JSON.stringify(oklchVal)}</code>
    </p>
  {/snippet}
</Story>

<!-- Structured RGB output. -->
<Story
  name="Structured RGB"
  args={{
    id: 'cp-rgb',
    label: 'Background',
    format: 'rgb',
    value: { r: 51, g: 102, b: 204, alpha: 1 },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={rgbVal} />
    <p style="margin-top:1em;">
      Bound value: <code>{JSON.stringify(rgbVal)}</code>
    </p>
  {/snippet}
</Story>

<!-- Structured HSL output. -->
<Story
  name="Structured HSL"
  args={{
    id: 'cp-hsl',
    label: 'Highlight',
    format: 'hsl',
    value: { h: 220, s: 60, l: 50, alpha: 1 },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={hslVal} />
    <p style="margin-top:1em;">
      Bound value: <code>{JSON.stringify(hslVal)}</code>
    </p>
  {/snippet}
</Story>

<!-- Display-P3 output. Useful for wide-gamut displays. -->
<Story
  name="Display-P3 wide gamut"
  args={{
    id: 'cp-p3',
    label: 'Wide-gamut color',
    format: 'p3',
    value: { r: 1, g: 0.2, b: 0.4, alpha: 1 },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={p3Val} />
    <p style="margin-top:1em;">
      Bound value: <code>{JSON.stringify(p3Val)}</code>
    </p>
  {/snippet}
</Story>

<!-- Alpha slider + 8-digit hex output. -->
<Story
  name="With alpha"
  args={{
    id: 'cp-alpha',
    label: 'Translucent',
    alpha: true,
    value: '#3366cc99',
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={hexAlpha} />
    <p style="margin-top:1em;">Bound value: <code>{hexAlpha}</code></p>
  {/snippet}
</Story>

<!-- Contrast check against white. The popover shows the WCAG 2 ratio
  and AA/AAA badges. -->
<Story
  name="Contrast check"
  args={{
    id: 'cp-contrast',
    label: 'Body text color',
    value: '#1e1d25',
    contrast: { against: '#ffffff', role: 'foreground', category: 'body' },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={contrastFg} />
    <p style="margin-top:1em;">Bound value: <code>{contrastFg}</code></p>
  {/snippet}
</Story>

<!-- Contrast with translucent foreground over a flatten-against backdrop.
  Without `backdrop`, the picker shows "undefined" because WCAG 2 is undefined
  for translucent colors. -->
<Story
  name="Contrast w/ alpha + backdrop"
  args={{
    id: 'cp-contrast-alpha',
    label: 'Translucent text',
    alpha: true,
    value: '#1e1d2580',
    contrast: {
      against: '#ffffff',
      backdrop: '#ffffff',
      role: 'foreground',
      category: 'body',
    },
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={contrastFgAlpha} />
    <p style="margin-top:1em;">Bound value: <code>{contrastFgAlpha}</code></p>
  {/snippet}
</Story>

<!-- Pick a saturated OKLCH color via the popover to see the gamut warning
  when the output format requires sRGB. -->
<Story
  name="Out-of-gamut warning"
  args={{
    id: 'cp-gamut',
    label: 'High-impact accent',
    helperText:
      'Try opening the picker, switch to OKLCH, drag chroma far right.',
    value: '#ff0000',
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={outOfGamut} />
    <p style="margin-top:1em;">Bound value: <code>{outOfGamut}</code></p>
  {/snippet}
</Story>

<Story
  name="Disabled"
  args={{
    id: 'cp-disabled',
    label: 'Brand color',
    value: '#3366cc',
    disabled: true,
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} />
  {/snippet}
</Story>

<Story
  name="Error"
  args={{
    id: 'cp-error',
    label: 'Brand color',
    value: '#3366cc',
    error: 'This color does not match brand guidelines.',
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} />
  {/snippet}
</Story>

<Story
  name="Helper text"
  args={{
    id: 'cp-helper',
    label: 'Brand color',
    value: '#3366cc',
    helperText: 'Use the picker to choose a brand-safe color.',
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} />
  {/snippet}
</Story>

<!-- 120-entry palette (12 hues × 10 shades) + 3 ungrouped tokens.
  Initial value matches a palette entry, so the popover opens on the
  Palette tab with that row highlighted and scrolled into view. -->
<Story
  name="With palette (matched)"
  args={{
    id: 'cp-palette-match',
    label: 'Design token',
    value: 'hsl(0 70% 55%)',
    palette: designSystemPalette,
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={paletteHex} />
    <p style="margin-top:1em;">Bound value: <code>{paletteHex}</code></p>
  {/snippet}
</Story>

<!-- Short viewport + tall content (alpha + contrast). With the trigger
  vertically centered, neither above nor below the anchor has full room for
  the popover, so `placePopover` falls back to its shrink-and-scroll path:
  the popover anchors against the trigger on whichever side has more space
  and caps `maxHeight` to that space, letting its inner sections scroll. -->
<Story
  name="Constrained viewport"
  args={{
    id: 'cp-constrained',
    label: 'Brand color',
    alpha: true,
    value: '#1e1d2580',
    contrast: {
      against: '#ffffff',
      backdrop: '#ffffff',
      role: 'foreground',
      category: 'body',
    },
  }}
  parameters={{
    viewport: { defaultViewport: 'mobile1' },
  }}
>
  {#snippet template(args: any)}
    <div style="padding-block: 35vh;">
      <ColorPicker {...args} bind:value={hexAlpha} />
    </div>
  {/snippet}
</Story>

<!-- Same palette, but the initial value isn't a member.
  The popover defaults to the Custom tab. -->
<Story
  name="With palette (unmatched)"
  args={{
    id: 'cp-palette-unmatched',
    label: 'Design token',
    value: '#abcdef',
    palette: designSystemPalette,
  }}
>
  {#snippet template(args: any)}
    <ColorPicker {...args} bind:value={paletteHexNoMatch} />
    <p style="margin-top:1em;">Bound value: <code>{paletteHexNoMatch}</code></p>
  {/snippet}
</Story>
