/**
 * A Svelte action that makes items inside an element reorderable via drag and
 * drop. Based on Mozilla's moz-reorderable-list implementation.
 *
 * @param element - The container element that will have reorderable children
 * @param options - Configuration options for the reorderable behavior
 * @returns Action object with update and destroy methods
 */

export interface ReorderableOptions {
  /** Selector for elements that should be reorderable. Defaults to "li" */
  itemSelector?: string
  /**
   * Optional selector for drag handles within each item. If not provided, the
   * entire item is draggable
   */
  handleSelector?: string
  /** Called when an item is dropped in a new position */
  onreorder?: (detail: ReorderEventDetail) => void
  /** Called when an item starts being dragged */
  ondragstarted?: (detail: DragEventDetail) => void
  /** Called when an item finishes being dragged */
  ondragended?: (detail: DragEventDetail) => void
  /** Enable keyboard reordering with Ctrl+Shift+Arrow keys. Defaults to true */
  enableKeyboardReorder?: boolean
  /**
   * Identifier for cross-container drag-and-drop. Containers sharing the same
   * dropGroup accept drops from each other.
   */
  dropGroup?: string
}

export interface ReorderEventDetail {
  /** The element that was dragged */
  draggedElement: Element
  /** The element over which the dragged element was dropped */
  targetElement: Element
  /**
   * The position of the drop relative to the target element. -1 means before, 0
   * means after
   */
  position: -1 | 0
  /** Index of the dragged element */
  draggedIndex: number
  /** Index of the target element */
  targetIndex: number
}

export interface DragEventDetail {
  /** The element being dragged */
  draggedElement: Element
}

const REORDER_PROP = '__reorderableIndex'
const DRAG_DATA_TYPE_PREFIX = 'text/reorderable-item/'

/** Tracks which handler instance owns the current drag operation */
let activeDragHandler: ReorderableHandler | null = null

function setActiveDragHandler(handler: ReorderableHandler | null) {
  activeDragHandler = handler
}

function isInSameGroup(a: ReorderableHandler, b: ReorderableHandler): boolean {
  return a.dropGroup !== undefined && a.dropGroup === b.dropGroup
}

interface ElementWithIndex extends Element {
  [REORDER_PROP]?: number
}

interface DropTargetInfo {
  targetElement: Element
  targetIndex: number
  position: -1 | 0
}

class ReorderableHandler {
  private element: HTMLElement
  private options: ReorderableOptions
  private draggedElement: Element | null = null
  private dropTargetInfo: DropTargetInfo | null = null
  private mutationObserver: MutationObserver | null = null
  private items: Element[] = []
  private indicator: HTMLElement | null = null

  get dropGroup(): string | undefined {
    return this.options.dropGroup
  }

  getDraggedElement(): Element | null {
    return this.draggedElement
  }

  hideIndicator() {
    if (this.indicator) {
      this.indicator.hidden = true
    }
  }

  constructor(element: HTMLElement, options: ReorderableOptions) {
    this.element = element
    this.options = {
      itemSelector: 'li',
      enableKeyboardReorder: true,
      ...options,
    }
    this.setup()
  }

  private setup() {
    // Add container class to the element
    this.element.classList.add('tint--reorderable-container')

    // Add handle class if handleSelector is provided
    if (this.options.handleSelector) {
      this.element.classList.add('tint--handle')
    }

    // If the container has overflow, ensure it has position relative
    const computedStyle = window.getComputedStyle(this.element)
    if (
      computedStyle.overflow === 'auto' ||
      computedStyle.overflow === 'scroll' ||
      computedStyle.overflowY === 'auto' ||
      computedStyle.overflowY === 'scroll'
    ) {
      if (computedStyle.position === 'static') {
        this.element.style.position = 'relative'
      }
    }

    // Create visual drop indicator
    this.potentiallyCreateIndicator()

    // Get initial items and make them draggable
    this.getItems()
    this.addDraggableAttribute()

    // Set up event listeners
    this.element.addEventListener('dragstart', this.onDragStart)
    this.element.addEventListener('dragover', this.onDragOver)
    this.element.addEventListener('dragleave', this.onDragLeave)
    this.element.addEventListener('dragend', this.onDragEnd)
    this.element.addEventListener('drop', this.onDrop)

    // Add keyboard support if enabled
    if (this.options.enableKeyboardReorder) {
      this.element.addEventListener('keydown', this.onKeyDown)
    }

    // Watch for DOM changes
    this.mutationObserver = new MutationObserver(this.onMutation)
    this.mutationObserver.observe(this.element, {
      childList: true,
      subtree: true,
    })
  }

  private potentiallyCreateIndicator() {
    // Remove existing indicator if it exists but is detached
    if (this.indicator && !this.indicator.parentNode) {
      this.indicator = null
    }

    // Only create if we don't have one or it's not in the DOM
    if (!this.indicator || !this.indicator.parentNode) {
      this.indicator = document.createElement('div')
      this.indicator.className = 'tint--reorderable-indicator'
      this.indicator.hidden = true
      this.indicator.setAttribute('aria-hidden', 'true')

      // Ensure the container has position relative or absolute for proper positioning
      const computedStyle = window.getComputedStyle(this.element)
      if (computedStyle.position === 'static') {
        this.element.style.position = 'relative'
      }

      // Make sure the overflow container can have positioned elements within
      if (
        computedStyle.overflow === 'auto' ||
        computedStyle.overflow === 'scroll' ||
        computedStyle.overflowY === 'auto' ||
        computedStyle.overflowY === 'scroll'
      ) {
        this.element.style.position = 'relative'
      }

      this.element.appendChild(this.indicator)
    }
  }

  private getItems() {
    this.items = Array.from(
      this.element.querySelectorAll(this.options.itemSelector!),
    )
    this.items.forEach((item, i) => {
      ;(item as ElementWithIndex)[REORDER_PROP] = i
    })
  }

  private addDraggableAttribute(root?: Element) {
    const items = root
      ? this.getElementsBySelector(this.options.itemSelector!, root)
      : this.items

    for (const item of items) {
      if (item instanceof HTMLElement) {
        if (this.options.handleSelector) {
          // When handleSelector is provided, make the item not draggable
          // and only make the handles draggable
          item.draggable = false
          const handles = item.querySelectorAll(this.options.handleSelector)
          handles.forEach((handle) => {
            if (handle instanceof HTMLElement) {
              handle.draggable = true
            }
          })
        } else {
          // When no handleSelector, the entire item is draggable
          item.draggable = true
        }
      }
    }
  }

  private getElementsBySelector(selector: string, root: Element): Element[] {
    const elements: Element[] = []
    if (root.matches(selector)) {
      elements.push(root)
    }
    elements.push(...Array.from(root.querySelectorAll(selector)))
    return elements
  }

  private onMutation = (mutationList: MutationRecord[]) => {
    let needsUpdate = false
    let indicatorRemoved = false

    for (const mutation of mutationList) {
      if (mutation.addedNodes.length || mutation.removedNodes.length) {
        needsUpdate = true
      }

      // Check if our indicator was removed
      for (const removedNode of Array.from(mutation.removedNodes)) {
        if (removedNode === this.indicator) {
          indicatorRemoved = true
        }
      }

      for (const addedNode of Array.from(mutation.addedNodes)) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          this.addDraggableAttribute(addedNode as Element)
        }
      }
    }

    // Restore indicator if it was removed
    if (indicatorRemoved || (this.indicator && !this.indicator.parentNode)) {
      this.potentiallyCreateIndicator()
    }

    if (needsUpdate) {
      this.getItems()
    }
  }

  private onDragStart = (event: DragEvent) => {
    const target = event.target as Element

    // Find the draggable element that initiated this drag
    // This could be the target itself or a parent element up to the list item
    let draggableElement: Element | null = target
    let draggedElement: Element | null = null

    // Walk up the parent chain to find a draggable element within our container
    while (draggableElement && draggableElement !== this.element) {
      if (
        draggableElement instanceof HTMLElement &&
        draggableElement.draggable
      ) {
        // Found a draggable element, now find the list item that contains it
        draggedElement = draggableElement.closest(this.options.itemSelector!)
        break
      }
      draggableElement = draggableElement.parentElement
    }

    if (!draggedElement) {
      return
    }

    const dragIndex = this.getItemIndex(draggedElement)
    if (dragIndex === -1) {
      return
    }

    event.stopPropagation()

    this.options.ondragstarted?.({
      draggedElement,
    })

    // Set data transfer for drag operation
    if (event.dataTransfer) {
      const documentId =
        draggedElement.ownerDocument.documentElement.id || 'reorderable'
      event.dataTransfer.setData(
        `${DRAG_DATA_TYPE_PREFIX}${documentId}`,
        dragIndex.toString(),
      )
      event.dataTransfer.effectAllowed = 'move'
    }

    this.draggedElement = draggedElement
    setActiveDragHandler(this)
    draggedElement.classList.add('dragging')
  }

  private onDragOver = (event: DragEvent) => {
    if (
      activeDragHandler !== null &&
      activeDragHandler !== this &&
      !isInSameGroup(activeDragHandler, this)
    ) {
      return
    }

    if (activeDragHandler !== null && activeDragHandler !== this) {
      activeDragHandler.hideIndicator()
    }

    this.dropTargetInfo = this.getDropTargetInfo(event)

    // Ensure indicator exists
    this.potentiallyCreateIndicator()

    if (!this.dropTargetInfo || !this.indicator) {
      if (this.indicator) {
        this.indicator.hidden = true
      }
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const { targetIndex, position } = this.dropTargetInfo
    const item = this.items[targetIndex]

    if (!item) {
      this.indicator.hidden = true
      return
    }

    // Calculate the correct position by considering:
    // 1. The container's own scroll position
    // 2. The position of the item relative to the container
    const containerScrollTop = this.element.scrollTop || 0

    // Calculate the item's position within the scrollable container
    // This accounts for both the element's position and the container's scroll
    const itemTopRelativeToContainer =
      item.getBoundingClientRect().top -
      this.element.getBoundingClientRect().top +
      containerScrollTop

    const itemBottomRelativeToContainer =
      itemTopRelativeToContainer + item.getBoundingClientRect().height

    this.indicator.hidden = false
    if (position < 0) {
      this.indicator.style.top = `${itemTopRelativeToContainer}px`
    } else {
      this.indicator.style.top = `${itemBottomRelativeToContainer}px`
    }
  }

  private onDragLeave = (event: DragEvent) => {
    const relatedTarget = event.relatedTarget as Element | null

    // If cursor moved to another element inside our container, do nothing
    if (relatedTarget && this.element.contains(relatedTarget)) {
      return
    }

    // Cursor left our container entirely. Hide the indicator.
    if (this.indicator) {
      this.indicator.hidden = true
    }
  }

  private onDrop = (event: DragEvent) => {
    if (
      activeDragHandler !== null &&
      activeDragHandler !== this &&
      !isInSameGroup(activeDragHandler, this)
    )
      return

    const draggedElement =
      this.draggedElement ?? activeDragHandler?.getDraggedElement() ?? null
    this.dropTargetInfo = this.getDropTargetInfo(event)
    if (!draggedElement || !this.dropTargetInfo) {
      return
    }

    // Don't emit the reorder event if the dragged element is dropped on itself
    if (draggedElement === this.dropTargetInfo.targetElement) {
      this.onDragEnd()
      return
    }

    // Don't emit the reorder event if inserting after the previous element
    // or before the next element (no actual reordering needed)
    const draggedIndex = this.getItemIndex(draggedElement)
    const targetIndex = this.dropTargetInfo.targetIndex
    const position = this.dropTargetInfo.position

    if (draggedIndex !== -1) {
      if (
        (position === 0 && targetIndex === draggedIndex - 1) || // Inserting after previous element
        (position === -1 && targetIndex === draggedIndex + 1) // Inserting before next element
      ) {
        this.onDragEnd()
        return
      }
    }

    event.preventDefault()
    event.stopPropagation()

    this.options.onreorder?.({
      draggedElement,
      targetElement: this.dropTargetInfo.targetElement,
      position: this.dropTargetInfo.position,
      draggedIndex,
      targetIndex,
    })

    if (this.indicator) {
      this.indicator.hidden = true
    }

    this.onDragEnd()
  }

  private onDragEnd = () => {
    // Sometimes dragend is not fired when the element is dropped. To ensure that
    // we clean up, onDragEnd is also called from onDrop; so it might be called
    // multiple times.
    if (this.draggedElement == null) {
      return
    }

    this.options.ondragended?.({
      draggedElement: this.draggedElement,
    })

    if (this.indicator) {
      this.indicator.hidden = true
    }
    this.draggedElement.classList.remove('dragging')
    this.draggedElement = null
    activeDragHandler = null
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const reorderInfo = this.evaluateKeyDownEvent(event)
    if (!reorderInfo) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    // Store the focused element to restore focus after reordering
    const focusedElement = event.target as Element

    // Call the reorder handler
    this.options.onreorder?.(reorderInfo)

    // Restore focus to the moved element after a microtask to allow DOM updates
    requestAnimationFrame(() => {
      if (
        focusedElement &&
        typeof (focusedElement as HTMLElement).focus === 'function'
      ) {
        ;(focusedElement as HTMLElement).focus()
      }
    })
  }

  private evaluateKeyDownEvent(
    event: KeyboardEvent,
  ): ReorderEventDetail | null {
    const direction = isReorderKeyboardEvent(event)
    if (direction === 0) {
      return null
    }

    const fromEl = this.getTargetItemFromKeyboardEvent(event)
    if (!fromEl) {
      return null
    }

    const fromIndex = this.getItemIndex(fromEl)
    if (fromIndex === -1) {
      return null
    }

    // If index is 0 and direction is -1, or index is last and direction is 1, do nothing
    if (
      (fromIndex === 0 && direction === -1) ||
      (fromIndex === this.items.length - 1 && direction === 1)
    ) {
      return null
    }

    const targetElement = this.items[fromIndex + direction]
    if (!targetElement) {
      return null
    }

    return {
      draggedElement: fromEl,
      targetElement,
      position: Math.min(direction, 0) as -1 | 0,
      draggedIndex: fromIndex,
      targetIndex: fromIndex + direction,
    }
  }

  private getTargetItemFromKeyboardEvent(event: KeyboardEvent): Element | null {
    const target = event.target as Element
    return target.closest(this.options.itemSelector!)
  }

  private getDropTargetInfo(event: DragEvent): DropTargetInfo | null {
    const targetItem = this.getTargetItemFromEvent(event)
    if (!targetItem) {
      return null
    }

    const targetIndex = this.getItemIndex(targetItem)
    if (targetIndex === -1) {
      return null
    }

    const rect = targetItem.getBoundingClientRect()
    const threshold = rect.height * 0.5
    const position: -1 | 0 = event.clientY < rect.top + threshold ? -1 : 0

    return {
      targetElement: targetItem,
      targetIndex,
      position,
    }
  }

  private getItemIndex(item: Element): number {
    return (item as ElementWithIndex)[REORDER_PROP] ?? -1
  }

  private getTargetItemFromEvent(event: DragEvent): Element | null {
    const target = event.target as Element
    return target.closest(this.options.itemSelector!)
  }

  update(newOptions: ReorderableOptions) {
    const hadHandles = !!this.options.handleSelector
    const hasHandles = !!newOptions.handleSelector
    const hadKeyboard = !!this.options.enableKeyboardReorder
    const hasKeyboard = !!newOptions.enableKeyboardReorder

    this.options = {
      itemSelector: 'li',
      enableKeyboardReorder: true,
      ...newOptions,
    }

    // Update CSS class based on handleSelector
    if (hadHandles !== hasHandles) {
      if (hasHandles) {
        this.element.classList.add('tint--handle')
      } else {
        this.element.classList.remove('tint--handle')
      }
    }

    // Update keyboard event listener
    if (hadKeyboard !== hasKeyboard) {
      if (hasKeyboard) {
        this.element.addEventListener('keydown', this.onKeyDown)
      } else {
        this.element.removeEventListener('keydown', this.onKeyDown)
      }
    }

    this.getItems()
    this.addDraggableAttribute()
  }

  destroy() {
    if (activeDragHandler === this) {
      activeDragHandler = null
    }

    // Remove container classes from the element
    this.element.classList.remove('tint--reorderable-container')
    this.element.classList.remove('tint--handle')

    // Clean up event listeners
    this.element.removeEventListener('dragstart', this.onDragStart)
    this.element.removeEventListener('dragover', this.onDragOver)
    this.element.removeEventListener('dragleave', this.onDragLeave)
    this.element.removeEventListener('dragend', this.onDragEnd)
    this.element.removeEventListener('drop', this.onDrop)

    if (this.options.enableKeyboardReorder) {
      this.element.removeEventListener('keydown', this.onKeyDown)
    }

    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
    }

    // Remove indicator
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator)
    }

    // Clean up draggable attributes
    this.items.forEach((item) => {
      if (item instanceof HTMLElement) {
        item.draggable = false
        if (this.options.handleSelector) {
          const handles = item.querySelectorAll(this.options.handleSelector)
          handles.forEach((handle) => {
            if (handle instanceof HTMLElement) {
              handle.draggable = false
            }
          })
        }
      }
    })
  }
}

/**
 * Checks if the given keyboard event is a reorder keyboard event
 * (ctrl+shift+up/down).
 *
 * Can be used instead of the automatic reorder keyboard event handling by the
 * reorderable action.
 *
 * @param event - The keyboard event to check
 * @returns 0 if the event is not a reorder keyboard event, -1 if the event is a
 *   reorder up event, 1 if the event is a reorder down event
 */
export function isReorderKeyboardEvent(event: KeyboardEvent): 0 | -1 | 1 {
  if (event.code !== 'ArrowUp' && event.code !== 'ArrowDown') {
    return 0
  }
  if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) {
    return 0
  }
  return event.code === 'ArrowUp' ? -1 : 1
}

/**
 * Svelte action to make items inside an element reorderable via drag and drop.
 *
 * Usage:
 *
 * ```tsx
 * ;<ul
 *   use:reorderable={{
 *     itemSelector: 'li',
 *     onreorder: (detail) => {
 *       // Handle reorder event
 *       console.log(
 *         'Moved item from',
 *         detail.draggedIndex,
 *         'to',
 *         detail.targetIndex,
 *       )
 *     },
 *   }}
 * >
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 *   <li>Item 3</li>
 * </ul>
 * ```
 *
 * @param element - The container element
 * @param options - Configuration options
 */
export function reorderable(
  element: HTMLElement,
  options: ReorderableOptions = {},
) {
  const handler = new ReorderableHandler(element, options)

  return {
    update(newOptions: ReorderableOptions) {
      handler.update(newOptions)
    },
    destroy() {
      handler.destroy()
    },
  }
}
