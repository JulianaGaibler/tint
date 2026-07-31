A confirmation or acknowledgment dialog with a promise-based API. Bind `openDialog`, then call it and await the result, which is `true` when the action button is clicked.

```svelte
<script>
  let openDialog
  async function confirmDelete() {
    const ok = await openDialog({
      heading: 'Delete file?',
      actionLabel: 'Delete',
    })
    if (ok) remove()
  }
</script>

<Dialog bind:openDialog variant="transaction" />
<button onclick={confirmDelete}>Delete</button>
```
