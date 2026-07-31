A modal dialog controlled with `bind:open`. By default it uses the native `showModal`, which handles focus for you. Set `notClosable` to keep it open, which switches to `show` with a focus trap.

```svelte
<script>
  let open = false
</script>

<button onclick={() => (open = true)}>Open</button>
<Modal bind:open>
  <p>Modal content</p>
</Modal>
```
