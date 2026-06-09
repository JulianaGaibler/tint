import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  reorderable,
  isReorderKeyboardEvent,
  type ReorderableOptions,
} from '@src/lib/actions/reorderable'

// Helper to create a container with list items
function createList(
  itemCount: number,
  options?: Partial<ReorderableOptions>,
): {
  element: HTMLUListElement
  destroy: () => void
  update: (o: ReorderableOptions) => void
} {
  const ul = document.createElement('ul')
  document.body.appendChild(ul)

  for (let i = 0; i < itemCount; i++) {
    const li = document.createElement('li')
    li.textContent = `Item ${i + 1}`
    li.dataset.itemId = `item-${i + 1}`
    ul.appendChild(li)
  }

  const onreorder = vi.fn()
  const action = reorderable(ul, {
    itemSelector: 'li',
    onreorder,
    ...options,
  })

  return {
    element: ul,
    destroy: action.destroy,
    update: action.update,
  }
}

function createDragEvent(
  type: string,
  target: Element,
  overrides: Partial<DragEvent> = {},
): DragEvent {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as DragEvent
  Object.defineProperty(event, 'target', { value: target })
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      setData: vi.fn(),
      effectAllowed: 'uninitialized',
      types: [],
    },
  })
  Object.defineProperty(event, 'clientY', { value: overrides.clientY ?? 0 })
  if ('relatedTarget' in overrides) {
    Object.defineProperty(event, 'relatedTarget', {
      value: overrides.relatedTarget,
    })
  }
  return event
}

describe('isReorderKeyboardEvent', () => {
  it('returns -1 for Ctrl+Shift+ArrowUp', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowUp',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(-1)
  })

  it('returns 1 for Ctrl+Shift+ArrowDown', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowDown',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(1)
  })

  it('returns 0 for non-reorder keys', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowLeft',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(0)
  })

  it('returns 0 when modifier keys are missing', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowUp',
      ctrlKey: false,
      shiftKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(0)
  })

  it('returns 0 when alt is pressed', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowUp',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(0)
  })

  it('returns 0 when meta is pressed', () => {
    const event = new KeyboardEvent('keydown', {
      code: 'ArrowUp',
      ctrlKey: true,
      shiftKey: true,
      metaKey: true,
    })
    expect(isReorderKeyboardEvent(event)).toBe(0)
  })
})

describe('reorderable action', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('makes items draggable', () => {
    const { element, destroy } = createList(3)
    const items = element.querySelectorAll('li')

    items.forEach((item) => {
      expect(item.draggable).toBe(true)
    })

    destroy()
  })

  it('adds container class', () => {
    const { element, destroy } = createList(3)
    expect(element.classList.contains('tint--reorderable-container')).toBe(true)
    destroy()
  })

  it('adds handle class when handleSelector is set', () => {
    const ul = document.createElement('ul')
    document.body.appendChild(ul)
    for (let i = 0; i < 2; i++) {
      const li = document.createElement('li')
      const handle = document.createElement('span')
      handle.className = 'drag-handle'
      li.appendChild(handle)
      ul.appendChild(li)
    }

    const action = reorderable(ul, {
      itemSelector: 'li',
      handleSelector: '.drag-handle',
    })

    expect(ul.classList.contains('tint--handle')).toBe(true)

    // Items themselves should not be draggable
    const items = ul.querySelectorAll('li')
    items.forEach((item) => {
      expect((item as HTMLElement).draggable).toBe(false)
    })

    // Handles should be draggable
    const handles = ul.querySelectorAll('.drag-handle')
    handles.forEach((handle) => {
      expect((handle as HTMLElement).draggable).toBe(true)
    })

    action.destroy()
  })

  it('creates a hidden indicator element', () => {
    const { element, destroy } = createList(3)
    const indicator = element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement

    expect(indicator).not.toBeNull()
    expect(indicator.hidden).toBe(true)

    destroy()
  })

  it('cleans up on destroy', () => {
    const { element, destroy } = createList(3)

    destroy()

    expect(element.classList.contains('tint--reorderable-container')).toBe(
      false,
    )
    expect(element.querySelector('.tint--reorderable-indicator')).toBeNull()

    const items = element.querySelectorAll('li')
    items.forEach((item) => {
      expect((item as HTMLElement).draggable).toBe(false)
    })
  })

  it('fires ondragstarted on dragstart', () => {
    const ondragstarted = vi.fn()
    const { element, destroy } = createList(3, { ondragstarted })

    const item = element.querySelectorAll('li')[0]
    const event = createDragEvent('dragstart', item)
    item.dispatchEvent(event)

    expect(ondragstarted).toHaveBeenCalledWith(
      expect.objectContaining({ draggedElement: item }),
    )

    destroy()
  })

  it('adds dragging class on dragstart', () => {
    const { element, destroy } = createList(3)

    const item = element.querySelectorAll('li')[0]
    const event = createDragEvent('dragstart', item)
    item.dispatchEvent(event)

    expect(item.classList.contains('dragging')).toBe(true)

    destroy()
  })

  describe('update', () => {
    it('updates options dynamically', () => {
      const ul = document.createElement('ul')
      document.body.appendChild(ul)
      for (let i = 0; i < 2; i++) {
        const li = document.createElement('li')
        const handle = document.createElement('span')
        handle.className = 'drag-handle'
        li.appendChild(handle)
        ul.appendChild(li)
      }

      const action = reorderable(ul, { itemSelector: 'li' })

      // Initially no handle class
      expect(ul.classList.contains('tint--handle')).toBe(false)

      // Update to use handles
      action.update({ itemSelector: 'li', handleSelector: '.drag-handle' })
      expect(ul.classList.contains('tint--handle')).toBe(true)

      action.destroy()
    })
  })
})

describe('cross-container drag-and-drop (dropGroup)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('blocks cross-container dragover without dropGroup', () => {
    const listA = createList(3)
    const listB = createList(3)

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Try dragover on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const rect = itemB.getBoundingClientRect()
    const dragOverEvent = createDragEvent('dragover', itemB, {
      clientY: rect.top + 5,
    })
    itemB.dispatchEvent(dragOverEvent)

    // Without dropGroup, indicator on list B should remain hidden
    const indicatorB = listB.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorB.hidden).toBe(true)

    listA.destroy()
    listB.destroy()
  })

  it('allows cross-container dragover with matching dropGroup', () => {
    const listA = createList(3, { dropGroup: 'test-group' })
    const listB = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Dragover on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const dragOverEvent = createDragEvent('dragover', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dragOverEvent)

    // With matching dropGroup, the event should be accepted (preventDefault called)
    // The indicator visibility depends on getDropTargetInfo which relies on getBoundingClientRect
    // In jsdom this returns zeros, but the guard should at least not block the event
    expect(dragOverEvent.defaultPrevented).toBe(true)

    listA.destroy()
    listB.destroy()
  })

  it('blocks cross-container dragover with different dropGroups', () => {
    const listA = createList(3, { dropGroup: 'group-a' })
    const listB = createList(3, { dropGroup: 'group-b' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Dragover on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const dragOverEvent = createDragEvent('dragover', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dragOverEvent)

    // Different dropGroups should block
    const indicatorB = listB.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorB.hidden).toBe(true)

    listA.destroy()
    listB.destroy()
  })

  it('fires onreorder on cross-container drop with matching dropGroup', () => {
    const onreorderA = vi.fn()
    const onreorderB = vi.fn()

    const listA = createList(3, {
      dropGroup: 'test-group',
      onreorder: onreorderA,
    })
    const listB = createList(3, {
      dropGroup: 'test-group',
      onreorder: onreorderB,
    })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Drop on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const dropEvent = createDragEvent('drop', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dropEvent)

    // B's onreorder should fire with A's dragged element
    expect(onreorderB).toHaveBeenCalledWith(
      expect.objectContaining({
        draggedElement: itemA,
      }),
    )
    // A's onreorder should not fire
    expect(onreorderA).not.toHaveBeenCalled()

    listA.destroy()
    listB.destroy()
  })

  it('blocks cross-container drop without dropGroup', () => {
    const onreorderB = vi.fn()

    const listA = createList(3)
    const listB = createList(3, { onreorder: onreorderB })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Drop on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const dropEvent = createDragEvent('drop', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dropEvent)

    // Without dropGroup, B's onreorder should not fire
    expect(onreorderB).not.toHaveBeenCalled()

    listA.destroy()
    listB.destroy()
  })

  it('reports source index as draggedIndex for cross-container drops', () => {
    // draggedIndex comes from __reorderableIndex stored on the DOM element by
    // the source handler, so it reflects the element's position in source list
    const onreorderB = vi.fn()

    const listA = createList(3, { dropGroup: 'test-group' })
    const listB = createList(3, {
      dropGroup: 'test-group',
      onreorder: onreorderB,
    })

    // Start drag on list A item 0
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Drop on list B item 1
    const itemB = listB.element.querySelectorAll('li')[1]
    const dropEvent = createDragEvent('drop', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dropEvent)

    expect(onreorderB).toHaveBeenCalledWith(
      expect.objectContaining({
        draggedElement: itemA,
        draggedIndex: 0,
        targetIndex: 1,
      }),
    )

    listA.destroy()
    listB.destroy()
  })

  it('hides source indicator when target dragover fires', () => {
    const listA = createList(3, { dropGroup: 'test-group' })
    const listB = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Dragover on list A to show A's indicator
    const dragOverA = createDragEvent('dragover', itemA, { clientY: 0 })
    itemA.dispatchEvent(dragOverA)

    const indicatorA = listA.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorA.hidden).toBe(false)

    // Dragover on list B should hide A's indicator
    const itemB = listB.element.querySelectorAll('li')[1]
    const dragOverB = createDragEvent('dragover', itemB, { clientY: 0 })
    itemB.dispatchEvent(dragOverB)

    expect(indicatorA.hidden).toBe(true)

    listA.destroy()
    listB.destroy()
  })

  it('hides source indicator on dragleave when relatedTarget is outside container', () => {
    const listA = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Dragover on list A to show indicator
    const dragOverA = createDragEvent('dragover', itemA, { clientY: 0 })
    itemA.dispatchEvent(dragOverA)

    const indicatorA = listA.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorA.hidden).toBe(false)

    // Create an element outside the container (simulates a group label)
    const outsideElement = document.createElement('div')
    outsideElement.className = 'group-label'
    document.body.appendChild(outsideElement)

    // Dragleave with relatedTarget outside the container
    const dragLeaveEvent = createDragEvent('dragleave', itemA, {
      relatedTarget: outsideElement,
    } as Partial<DragEvent>)
    listA.element.dispatchEvent(dragLeaveEvent)

    expect(indicatorA.hidden).toBe(true)

    outsideElement.remove()
    listA.destroy()
  })

  it('keeps indicator visible on dragleave when relatedTarget is inside container', () => {
    const listA = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA0 = listA.element.querySelectorAll('li')[0]
    const itemA1 = listA.element.querySelectorAll('li')[1]
    const dragStartEvent = createDragEvent('dragstart', itemA0)
    itemA0.dispatchEvent(dragStartEvent)

    // Dragover on list A to show indicator
    const dragOverA = createDragEvent('dragover', itemA0, { clientY: 0 })
    itemA0.dispatchEvent(dragOverA)

    const indicatorA = listA.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorA.hidden).toBe(false)

    // Dragleave with relatedTarget still inside the container
    const dragLeaveEvent = createDragEvent('dragleave', itemA0, {
      relatedTarget: itemA1,
    } as Partial<DragEvent>)
    listA.element.dispatchEvent(dragLeaveEvent)

    // Indicator should remain visible
    expect(indicatorA.hidden).toBe(false)

    listA.destroy()
  })

  it('hides indicator on dragleave when relatedTarget is null (cursor left window)', () => {
    const listA = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Dragover on list A to show indicator
    const dragOverA = createDragEvent('dragover', itemA, { clientY: 0 })
    itemA.dispatchEvent(dragOverA)

    const indicatorA = listA.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorA.hidden).toBe(false)

    // Dragleave with null relatedTarget (cursor left browser window)
    const dragLeaveEvent = createDragEvent('dragleave', itemA, {
      relatedTarget: null,
    } as Partial<DragEvent>)
    listA.element.dispatchEvent(dragLeaveEvent)

    expect(indicatorA.hidden).toBe(true)

    listA.destroy()
  })

  it('hides target indicator after cross-container drop', () => {
    const listA = createList(3, { dropGroup: 'test-group' })
    const listB = createList(3, { dropGroup: 'test-group' })

    // Start drag on list A
    const itemA = listA.element.querySelectorAll('li')[0]
    const dragStartEvent = createDragEvent('dragstart', itemA)
    itemA.dispatchEvent(dragStartEvent)

    // Drop on list B
    const itemB = listB.element.querySelectorAll('li')[1]
    const dropEvent = createDragEvent('drop', itemB, {
      clientY: 0,
    })
    itemB.dispatchEvent(dropEvent)

    const indicatorB = listB.element.querySelector(
      '.tint--reorderable-indicator',
    ) as HTMLElement
    expect(indicatorB.hidden).toBe(true)

    listA.destroy()
    listB.destroy()
  })
})
