A Svelte action that shows a tooltip on hover or focus. Pass the text directly, or an options object to set the `offset` from the element.

```svelte
<script>
  import { tooltip } from 'tint/actions'
</script>

<button use:tooltip={'Copy to clipboard'}>Copy</button>
<button use:tooltip={{ text: 'Copy', offset: 8 }}>Copy</button>
```
