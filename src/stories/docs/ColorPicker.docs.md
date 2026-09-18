A color picker with a popover for fine adjustment. Bind `value` and choose the output `format`: the default `hex` returns a string, while the OKLCH, RGB, HSL, and Display-P3 formats return a structured object. A contrast panel and an out-of-gamut warning are built in. Pass `palette` to add a pane of named tokens, and add `paletteAlpha` alongside `alpha` to let a token carry an opacity: the pane gains an opacity slider, picking a token keeps the opacity already dialed in, and the value reads as `color/red/30 (20%)`.

```svelte
<script>
  import { ColorPicker } from 'tint'
  let value = '#3366ffff'
</script>

<ColorPicker label="Accent" bind:value />
```
