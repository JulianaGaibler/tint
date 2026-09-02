<script lang="ts" module>
  import type { MenuItem } from './menu/MenuInternal.svelte'

  // eslint-disable-next-line no-import-assign
  export type { MenuItem }
  export { MENU_SEPARATOR } from './menu/MenuInternal.svelte'
</script>

<script lang="ts">
  import { MenuBehavior } from './menu/MenuInternal.svelte'
  import MenuInternal from './menu/MenuInternal.svelte'

  /**
   * A menu for suggesting completions next to text that is being typed, such as
   * a mention or an emoji picker inside an editor.
   *
   * It differs from `Menu` in who is in charge. `Menu` owns focus and the
   * keyboard, which is right for a context menu. This owns neither, because the
   * text field it belongs to cannot give them up: the caret has to stay put and
   * the field has to keep deciding which keystrokes reach the document. So the
   * host moves the highlight through `highlightedIndex`, accepts by reading its
   * own item at that index, and dismisses by setting `open` to false.
   *
   * The host is responsible for three things this component cannot do for it.
   * Claiming the arrow keys, `Enter` and `Escape` while it is open. Dismissing
   * it when the field loses focus or the surrounding container scrolls. And
   * rendering `role="combobox"`, `aria-expanded`, `aria-controls={id}` and
   * `aria-activedescendant={activeItemId}` on the field itself, since that is
   * the only element a screen reader is focused on.
   */
  interface Props {
    /** Whether the menu is shown. The host closes it. */
    open?: boolean
    /**
     * Where to put the menu. A caret rect is the motivating case, and
     * `EditorView.coordsAtPos` gives one directly. A rect with height means the
     * menu opens below the line rather than over it.
     *
     * @type {DOMRect | undefined}
     */
    anchorRect?: DOMRect | undefined
    /**
     * An element to anchor to instead, for a plain input. Followed as the page
     * scrolls.
     */
    anchorRef?: HTMLElement | undefined
    /**
     * The candidates. Rebuild it as the query narrows and the menu repositions
     * itself.
     *
     * @type {MenuItem[]}
     */
    items?: MenuItem[]
    /** The highlighted index, two way. -1 for nothing highlighted. */
    highlightedIndex?: number
    /**
     * Id of the highlighted item, for `aria-activedescendant` on the field.
     * Read only.
     */
    activeItemId?: string | undefined
    /** Id for the listbox, so the field can point `aria-controls` at it. */
    id?: string
    /**
     * Called when the menu asks to close, which is only ever from a click on an
     * item.
     */
    onclose?: () => void
    /**
     * Repositions the menu. Call it after the caret moves. Assigned by the
     * component.
     */
    recalculatePosition?: () => void
  }

  let {
    open = false,
    anchorRect = undefined,
    anchorRef = undefined,
    items = [],
    highlightedIndex = $bindable(-1),
    activeItemId = $bindable(undefined),
    id = undefined,
    onclose = undefined,
    recalculatePosition = $bindable(undefined),
  }: Props = $props()
</script>

{#if open && items.length > 0 && (anchorRef || anchorRect)}
  <MenuInternal
    {id}
    behavior={MenuBehavior.AUTOCOMPLETE}
    {anchorRef}
    {anchorRect}
    {items}
    bind:highlightedIndex
    bind:activeItemId
    bind:recalculatePosition
    takeFocus={false}
    handleKeys={false}
    overlay={false}
    closeOnClick={true}
    hide={() => onclose?.()}
  />
{/if}
