A Svelte action that makes a list reorderable by drag and drop, with keyboard support. Apply it to the list container and handle `onreorder`. Use `handleSelector` to limit dragging to a handle, and `dropGroup` to move items between lists.

```svelte
<script>
  import { reorderable } from 'tint/actions'
  let items = ['One', 'Two', 'Three']
</script>

<ul
  use:reorderable={{ onreorder: (e) => reorder(e), handleSelector: '.handle' }}
>
  {#each items as item}
    <li><span class="handle">::</span> {item}</li>
  {/each}
</ul>
```
