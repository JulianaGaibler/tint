<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import IconDragHandle from '@lib/icons/14-drag-handle.svg?raw'
  import { fn } from 'storybook/test'
  import ReorderableDocs from './docs/Reorderable.docs.md?raw'

  const { Story } = defineMeta({
    title: 'Actions/Reorderable',
    parameters: {
      actions: {
        handles: ['reorder', 'dragstarted', 'dragended'],
      },
      docs: { description: { component: ReorderableDocs } },
    },
  })
</script>

<script lang="ts">
  import {
    reorderable,
    type ReorderableOptions,
  } from '@src/lib/actions/reorderable'
  import Button from '@lib/components/Button.svelte'

  let items = $state(['Item 1', 'Item 2', 'Item 3', 'Item 4'])

  function handleReorder(detail: any) {
    const { draggedIndex, targetIndex, position } = detail

    // Update the items array to reflect the new order
    const newItems = [...items]
    const [draggedItem] = newItems.splice(draggedIndex, 1)

    let insertIndex = targetIndex
    if (draggedIndex < targetIndex) {
      insertIndex--
    }

    if (position === -1) {
      newItems.splice(insertIndex, 0, draggedItem)
    } else {
      newItems.splice(insertIndex + 1, 0, draggedItem)
    }

    items = newItems
  }

  function addItem() {
    items = [...items, `Item ${items.length + 1}`]
  }

  function resetItems() {
    items = ['Item 1', 'Item 2', 'Item 3', 'Item 4']
  }

  const reorderableOptions: ReorderableOptions = {
    itemSelector: 'li',
    onreorder: handleReorder,
    ondragstarted: fn().mockName('ondragstarted'),
    ondragended: fn().mockName('ondragended'),
  }

  const reorderableWithHandlesOptions: ReorderableOptions = {
    itemSelector: 'li',
    handleSelector: '.drag-handle',
    onreorder: handleReorder,
    ondragstarted: fn().mockName('ondragstarted'),
    ondragended: fn().mockName('ondragended'),
  }

  const reorderableWithKeyboardOptions: ReorderableOptions = {
    itemSelector: 'li',
    enableKeyboardReorder: true,
    onreorder: handleReorder,
    ondragstarted: fn().mockName('ondragstarted'),
    ondragended: fn().mockName('ondragended'),
  }

  let listA = $state(['Group A - 1', 'Group A - 2', 'Group A - 3'])
  let listB = $state(['Group B - 1', 'Group B - 2', 'Group B - 3'])

  function handleCrossContainerReorder(detail: any) {
    const { draggedElement, targetElement, position } = detail

    const draggedId = draggedElement.dataset.itemId
    const targetId = targetElement.dataset.itemId

    // Find source list and index
    let sourceList: string[] | undefined
    let sourceIndex = -1
    for (const list of [listA, listB]) {
      const idx = list.indexOf(draggedId)
      if (idx !== -1) {
        sourceList = list
        sourceIndex = idx
        break
      }
    }

    // Find target list and index
    let targetList: string[] | undefined
    let targetIndex = -1
    for (const list of [listA, listB]) {
      const idx = list.indexOf(targetId)
      if (idx !== -1) {
        targetList = list
        targetIndex = idx
        break
      }
    }

    if (!sourceList || !targetList || sourceIndex === -1 || targetIndex === -1)
      return

    // Remove from source
    const [item] = sourceList.splice(sourceIndex, 1)

    // Adjust target index if same list and source was before target
    if (sourceList === targetList && sourceIndex < targetIndex) {
      targetIndex--
    }

    // Insert into target
    if (position === -1) {
      targetList.splice(targetIndex, 0, item)
    } else {
      targetList.splice(targetIndex + 1, 0, item)
    }

    // Trigger reactivity
    listA = [...listA]
    listB = [...listB]
  }

  function resetCrossContainerItems() {
    listA = ['Group A - 1', 'Group A - 2', 'Group A - 3']
    listB = ['Group B - 1', 'Group B - 2', 'Group B - 3']
  }

  const crossContainerOptionsA: ReorderableOptions = {
    itemSelector: 'li',
    dropGroup: 'shared',
    onreorder: handleCrossContainerReorder,
    ondragstarted: fn().mockName('ondragstarted'),
    ondragended: fn().mockName('ondragended'),
  }

  const crossContainerOptionsB: ReorderableOptions = {
    itemSelector: 'li',
    dropGroup: 'shared',
    onreorder: handleCrossContainerReorder,
    ondragstarted: fn().mockName('ondragstarted'),
    ondragended: fn().mockName('ondragended'),
  }
</script>

<Story name="Basic List">
  <div>
    <h3 class="tint--type">Reorderable List Demo</h3>
    <p>Drag and drop items to reorder them:</p>

    <ul
      class="reorderable-list tint--card"
      use:reorderable={reorderableOptions}
    >
      {#each items as item (item)}
        <li class="list-item">
          <button class="item-content tint--type-input">
            {item}
          </button>
        </li>
      {/each}
    </ul>

    <div class="controls">
      <Button onclick={addItem}>Add Item</Button>
      <Button variant="secondary" onclick={resetItems}>Reset Order</Button>
    </div>
  </div>
</Story>

<Story name="With Drag Handles">
  <div>
    <h3 class="tint--type">Reorderable List with Drag Handles</h3>
    <p>Only the ⋮⋮ handle is draggable:</p>

    <ul
      class="reorderable-list tint--card"
      use:reorderable={reorderableWithHandlesOptions}
    >
      {#each items as item (item)}
        <li class="list-item">
          <span class="drag-handle" aria-label="Drag to reorder"
            >{@html IconDragHandle}</span
          >
          <button class="item-content tint--type-input">
            {item}
          </button>
        </li>
      {/each}
    </ul>

    <div class="controls">
      <Button onclick={addItem}>Add Item</Button>
      <Button variant="secondary" onclick={resetItems}>Reset Order</Button>
    </div>
  </div>
</Story>

<Story name="With Keyboard Support">
  <div>
    <h3 class="tint--type">Reorderable List with Keyboard Support</h3>
    <p>Focus an item and use Ctrl+Shift+Arrow Up/Down to reorder:</p>

    <ul
      class="reorderable-list tint--card"
      use:reorderable={reorderableWithKeyboardOptions}
    >
      {#each items as item (item)}
        <li class="list-item">
          <button class="item-content tint--type-input" tabindex="0">
            {item}
          </button>
        </li>
      {/each}
    </ul>

    <div class="controls">
      <Button onclick={addItem}>Add Item</Button>
      <Button variant="secondary" onclick={resetItems}>Reset Order</Button>
    </div>
  </div>
</Story>

<Story name="Cross-Container">
  <div>
    <h3 class="tint--type">Cross-Container Drag and Drop</h3>
    <p>
      Drag items between the two groups. Both lists share <code
        >dropGroup: 'shared'</code
      >:
    </p>

    <div class="cross-container-layout">
      <div>
        <h4 class="tint--type">Group A</h4>
        <ul
          class="reorderable-list tint--card"
          use:reorderable={crossContainerOptionsA}
        >
          {#each listA as item (item)}
            <li class="list-item" data-item-id={item}>
              <button class="item-content tint--type-input">
                {item}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <div>
        <h4 class="tint--type">Group B</h4>
        <ul
          class="reorderable-list tint--card"
          use:reorderable={crossContainerOptionsB}
        >
          {#each listB as item (item)}
            <li class="list-item" data-item-id={item}>
              <button class="item-content tint--type-input">
                {item}
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div class="controls">
      <Button variant="secondary" onclick={resetCrossContainerItems}
        >Reset</Button
      >
    </div>
  </div>
</Story>

<style lang="sass">
  .reorderable-list
    list-style: none
    padding: 0
    margin-block: 20px
    margin-inline: 0

  .list-item:not(:last-of-type)
    border-block-end: 1px solid var(--tint-card-border)

  .list-item
    display: flex
    align-items: center

  .item-content
    flex: 1
    padding-block: 12px
    padding-inline: 16px
    background: transparent
    border: none
    text-align: start

  .drag-handle
    padding-block: 12px
    padding-inline: 8px
    padding-inline-end: 0
    color: var(--tint-text-secondary)
    font-weight: bold
    user-select: none
    line-height: 1

  .controls
    display: flex
    gap: 12px
    margin-block: 20px
    margin-inline: 0

  .cross-container-layout
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 20px
    margin-block: 20px
    margin-inline: 0
</style>
