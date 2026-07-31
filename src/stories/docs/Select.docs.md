Users pick one value from a dropdown list. Import `SELECT_SEPARATOR` and place it in `items` to draw a divider between groups.

```svelte
<script>
  import Select, { SELECT_SEPARATOR } from 'tint'
  let value
  const items = [
    { value: 'a', label: 'Apple' },
    { value: 'p', label: 'Pear' },
    SELECT_SEPARATOR,
    { value: 'c', label: 'Carrot' },
  ]
</script>

<Select label="Produce" {items} bind:value />
```
