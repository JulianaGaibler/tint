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

Set `align="top"` for a dialog that should sit near the top of the window rather than in the middle, which is where a command palette belongs. Override `--tint-modal-inset-block` through the `class` prop to change how far down it sits.

## Escape

Escape goes through the dismissal stack, so the innermost open thing closes first. A menu opened inside a modal takes the first press and the modal takes the second.

A field that wants Escape for itself keeps it by cancelling the key, which is what tint's own `TextField` does to revert an edit. Anything that cancels Escape without closing something should call `dismissTop()` to hand the key back.

`onclose` fires once per close, from the point the dialog is actually closed. A modal that is closed and reopened before that report lands never reports the close, because it never finished closing.
