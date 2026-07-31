A color picker with a popover for fine adjustment. Bind `value` and choose the output `format`: the default `hex` returns a string, while the OKLCH, RGB, HSL, and Display-P3 formats return a structured object. A contrast panel and an out-of-gamut warning are built in.

```svelte
<script>
  import { ColorPicker } from 'tint'
  let value = '#3366ffff'
</script>

<ColorPicker label="Accent" bind:value />
```
