A dropdown menu of actions. Set `variant` to `button` to anchor the menu to the element that opened it, or `context` to open it at the pointer. You receive an opener through `bind:contextClick` and attach it to the trigger. Import `MENU_SEPARATOR` to draw a divider between items.

```svelte
<script>
  import ButtonMenu, { MENU_SEPARATOR } from 'tint/components/Menu.svelte'
  let open
  const items = [
    { label: 'Rename', onClick: rename },
    { label: 'Duplicate', hint: '⌘D', onClick: duplicate },
    MENU_SEPARATOR,
    { label: 'Delete', onClick: remove },
  ]
</script>

<div oncontextmenu={open}>Right-click me</div>
<ButtonMenu variant="context" {items} bind:contextClick={open} />
```

`hint` is secondary text at the end of an item's row, for a keyboard shortcut. Hints line up with
each other, and typeahead matches the label only.
