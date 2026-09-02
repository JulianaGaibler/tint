<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import SuggestionMenu, {
    type MenuItem,
  } from '@lib/components/SuggestionMenu.svelte'

  const NAMES = [
    'Ada Lovelace',
    'Alan Turing',
    'Grace Hopper',
    'Katherine Johnson',
    'Barbara Liskov',
    'Radia Perlman',
  ]

  let field = $state<HTMLInputElement | undefined>(undefined)
  let value = $state('Try typing @a here')
  let open = $state(false)
  let query = $state('')
  let highlightedIndex = $state(-1)
  let activeItemId = $state<string | undefined>(undefined)
  let anchorRect = $state<DOMRect | undefined>(undefined)

  const candidates = $derived(
    NAMES.filter((name) => name.toLowerCase().includes(query.toLowerCase())),
  )

  const items: MenuItem[] = $derived(
    candidates.map((name) => ({
      label: name,
      onClick: () => accept(name),
    })),
  )

  /**
   * A real editor would use `EditorView.coordsAtPos`. An input has no such
   * thing, so this measures the field and offsets by the trigger's position in
   * the text.
   */
  function caretRect(): DOMRect | undefined {
    if (!field) return undefined
    const box = field.getBoundingClientRect()
    const at = value.lastIndexOf('@')
    const approxCharWidth = 7
    const x = box.x + 12 + Math.max(at, 0) * approxCharWidth
    return new DOMRect(x, box.y + 6, 2, box.height - 12)
  }

  function reread() {
    const at = value.lastIndexOf('@')
    if (at === -1) {
      open = false
      return
    }
    const after = value.slice(at + 1)
    // A space ends the trigger, the same way it would in an editor.
    if (/\s/.test(after)) {
      open = false
      return
    }
    query = after
    anchorRect = caretRect()
    open = true
    // The list narrowed, so the top match is the sensible thing to accept. That policy lives
    // here rather than in the component.
    highlightedIndex = 0
  }

  function accept(name: string) {
    const at = value.lastIndexOf('@')
    value = `${value.slice(0, at)}@${name} `
    open = false
    field?.focus()
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!open || candidates.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        highlightedIndex = (highlightedIndex + 1) % candidates.length
        break
      case 'ArrowUp':
        event.preventDefault()
        highlightedIndex =
          (highlightedIndex - 1 + candidates.length) % candidates.length
        break
      case 'Enter': {
        const chosen = candidates[highlightedIndex]
        if (!chosen) return
        event.preventDefault()
        accept(chosen)
        break
      }
      case 'Escape':
        event.preventDefault()
        open = false
        break
    }
  }

  const { Story } = defineMeta({
    title: 'Components/SuggestionMenu',
    component: SuggestionMenu,
    render: child,
    parameters: {
      docs: {
        description: {
          component:
            'A completion list for text being typed. The host owns focus, the keyboard and ' +
            'dismissal, so this story stands in for an editor: type `@` followed by letters ' +
            'to open it, arrow through it, press Enter to accept and Escape to dismiss. Focus ' +
            'never leaves the field, which is the whole point.',
        },
      },
    },
  })
</script>

{#snippet child()}
  <div class="wrap">
    <label class="tint--type-input-small" for="suggestion-field">Comment</label>
    <input
      id="suggestion-field"
      class="tint--type-input"
      bind:this={field}
      bind:value
      oninput={reread}
      onkeydown={onKeyDown}
      role="combobox"
      aria-expanded={open}
      aria-controls="suggestion-list"
      aria-activedescendant={activeItemId}
      aria-autocomplete="list"
    />
    <p class="tint--type-ui-small">
      Focus stays in the field the whole time, which is what lets an editor keep
      the caret.
    </p>

    <SuggestionMenu
      id="suggestion-list"
      {open}
      {anchorRect}
      {items}
      bind:highlightedIndex
      bind:activeItemId
      onclose={() => (open = false)}
    />
  </div>
{/snippet}

<Story name="Mentions in a field" />

<style lang="sass">
  .wrap
    display: flex
    flex-direction: column
    gap: var(--tint-size-8)
    max-inline-size: 26rem
    padding: var(--tint-size-24)

  input
    padding: var(--tint-size-12)
    border: var(--tint-border-width) solid var(--tint-action-secondary)
    border-radius: var(--tint-radius-input)
    background: var(--tint-input-bg)
    color: var(--tint-text)

  p
    margin: 0
    color: var(--tint-text-secondary)
</style>
