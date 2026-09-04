A card anchored to an element and pointing at it with an arrow, for advertising
a surface during onboarding or asking whether the user wants to do something.

It does not block the page, does not close on a click outside, and never closes
on its own. It closes when `open` goes back to false, which is why the content
has to carry a control that does so. The content carries no padding, as
`Modal`'s does not, and `label` names the callout for assistive technology.

```svelte
<script>
  let anchor = $state()
  let open = $state(false)
</script>

<button bind:this={anchor} onclick={() => (open = true)}>Filters</button>
<Callout {anchor} bind:open label="Filters are new">
  <p>Narrow the list down.</p>
  <Button onclick={() => (open = false)}>Got it</Button>
</Callout>
```

Write `<Callout>` right after its anchor. A popover keeps its place in the
document for tab order, so that is what puts the callout one Tab away.

`side` picks the preferred side and flips when that side has no room. Neither
side having room caps the callout to the roomier one and scrolls its content.
The arrow slides along the edge to stay over the anchor when a viewport edge
pushes the card off centre. The callout follows its anchor as the page scrolls
and hides while the anchor is off screen, without changing `open`.

## Focus and Escape

Opening never moves focus, since a callout can appear without the user having
asked for it. A screen reader hears `label` through a live region instead. Set
`takeFocus` for a callout that opens in answer to a click, which moves focus to
its first control and drops the announcement.

Escape closes the callout from inside it or from its anchor, and is left alone
everywhere else. A callout that blocks nothing must not answer for a key aimed
at a menu or a field somewhere else.
