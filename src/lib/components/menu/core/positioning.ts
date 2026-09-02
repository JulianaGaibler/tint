import {
  type MenuBehaviorType,
  MenuBehavior,
  type Vec2,
  WINDOW_PADDING,
  TOP_MENU_OFFSET,
  LEFT_MENU_OFFSET,
} from './types'

/**
 * Determines if a point lies within a triangle using barycentric coordinates
 * Used for safe area detection during mouse navigation to submenus
 */
export function checkIfInTriangle(a: Vec2, b: Vec2, c: Vec2, s: Vec2) {
  const as_x = s.x - a.x
  const as_y = s.y - a.y

  const s_ab = (b.x - a.x) * as_y - (b.y - a.y) * as_x > 0

  if ((c.x - a.x) * as_y - (c.y - a.y) * as_x > 0 == s_ab) return false
  if ((c.x - b.x) * (s.y - b.y) - (c.y - b.y) * (s.x - b.x) > 0 != s_ab)
    return false

  return true
}

/**
 * Calculates optimal positioning for a menu considering window boundaries
 * Handles different menu types (context, select, autocomplete) and positioning
 * logic
 */
export function calculatePosition(
  depth: number,
  parentItemRect: DOMRect,
  menuRect: DOMRect,
  behavior: MenuBehaviorType,
  windowDimensions: {
    innerWidth: number
    innerHeight: number
    scrollX: number
    scrollY: number
  },
  relativeDistance?: number,
) {
  const coords: {
    x: number
    y: number
    endAlign: boolean
    height: number | undefined
    minWidth: number | undefined
    animationOrigin?: string
  } = {
    x: 0,
    y: 0,
    endAlign: true,
    height: undefined,
    minWidth: undefined,
    animationOrigin: undefined,
  }

  // Set minimum width for select and autocomplete menus to match parent
  if (
    behavior === MenuBehavior.SELECT ||
    behavior === MenuBehavior.AUTOCOMPLETE
  ) {
    coords.minWidth = parentItemRect.width
  }

  if (behavior === MenuBehavior.SELECT && relativeDistance) {
    // > SELECT MENU POSITIONING
    coords.x = parentItemRect.x - 16 - 14
    coords.y = parentItemRect.y - relativeDistance - 16
    coords.animationOrigin = 'top-left'

    if (
      coords.x + menuRect.width >
      windowDimensions.innerWidth - WINDOW_PADDING
    ) {
      coords.x = windowDimensions.innerWidth - menuRect.width - WINDOW_PADDING
      coords.animationOrigin = 'top-right'
    }
  } else if (depth === 0 && behavior === MenuBehavior.AUTOCOMPLETE) {
    // > AUTOCOMPLETE ROOT MENU POSITIONING
    coords.x = parentItemRect.x

    const spaceBelow =
      windowDimensions.innerHeight -
      WINDOW_PADDING -
      (parentItemRect.y + parentItemRect.height)
    const spaceAbove = parentItemRect.y - WINDOW_PADDING

    if (menuRect.height <= spaceBelow && spaceBelow >= spaceAbove) {
      coords.y = parentItemRect.y + parentItemRect.height
      coords.animationOrigin = 'top-left'
    } else if (menuRect.height <= spaceAbove && spaceAbove > spaceBelow) {
      coords.y = parentItemRect.y - menuRect.height
      coords.animationOrigin = 'bottom-left'
    } else if (spaceAbove > spaceBelow) {
      coords.y = WINDOW_PADDING
      coords.height = spaceAbove
      coords.animationOrigin = 'bottom-left'
    } else {
      coords.y = parentItemRect.y + parentItemRect.height
      coords.height = spaceBelow
      coords.animationOrigin = 'top-left'
    }

    // Handle horizontal overflow
    if (
      coords.x + menuRect.width >
      windowDimensions.innerWidth - WINDOW_PADDING
    ) {
      if (parentItemRect.width) {
        coords.x = parentItemRect.x + parentItemRect.width - menuRect.width
      } else {
        coords.x = windowDimensions.innerWidth - menuRect.width - WINDOW_PADDING
      }
      coords.animationOrigin = coords.animationOrigin!.replace('left', 'right')
    }
  } else if (depth === 0) {
    // > ROOT MENU POSITIONING
    coords.x = parentItemRect.x
    coords.y = parentItemRect.y + parentItemRect.height
    coords.animationOrigin = 'top-left'

    if (
      coords.x + menuRect.width >
      windowDimensions.innerWidth - WINDOW_PADDING
    ) {
      if (parentItemRect.width) {
        coords.x = parentItemRect.x + parentItemRect.width - menuRect.width
        coords.animationOrigin = 'top-right'
      } else {
        coords.x = windowDimensions.innerWidth - menuRect.width - WINDOW_PADDING
        coords.animationOrigin = 'top-right'
      }
    }

    if (
      coords.y + menuRect.height >
      windowDimensions.innerHeight - WINDOW_PADDING
    ) {
      coords.y = parentItemRect.y - menuRect.height
      coords.animationOrigin =
        coords.animationOrigin === 'top-right' ? 'bottom-right' : 'bottom-left'
    }
  } else {
    // > SUBMENU POSITIONING
    coords.x = parentItemRect.x + parentItemRect.width + LEFT_MENU_OFFSET
    coords.y = parentItemRect.y - TOP_MENU_OFFSET
    coords.animationOrigin = 'top-left'

    if (
      coords.x + menuRect.width >
      windowDimensions.innerWidth - WINDOW_PADDING
    ) {
      coords.endAlign = false
      coords.x = parentItemRect.x - menuRect.width
      coords.animationOrigin = 'top-right'
    }
  }

  // > VERTICAL OVERFLOW HANDLING
  if (
    coords.y + menuRect.height >
    windowDimensions.innerHeight - WINDOW_PADDING
  ) {
    coords.y = windowDimensions.innerHeight - menuRect.height - WINDOW_PADDING

    if (coords.y < WINDOW_PADDING) {
      coords.height =
        windowDimensions.innerHeight - coords.y - WINDOW_PADDING * 2
    }
  }

  // > TOP OVERFLOW HANDLING
  if (coords.y < WINDOW_PADDING) {
    coords.y = WINDOW_PADDING

    if (
      coords.y + menuRect.height >
      windowDimensions.innerHeight - WINDOW_PADDING
    ) {
      coords.height =
        windowDimensions.innerHeight - coords.y - WINDOW_PADDING * 2
    }
  }

  // > LEFT OVERFLOW HANDLING
  // Shared rather than per-branch, because a root menu can also be anchored close to the left
  // edge. That only shows up with a narrow anchor, such as a text caret, since an anchor with
  // width is pushed inwards by its own left edge.
  if (coords.x < WINDOW_PADDING) {
    coords.x = WINDOW_PADDING
  }

  // > SCROLL OFFSET COMPENSATION
  coords.y += windowDimensions.scrollY
  coords.x += windowDimensions.scrollX

  if (!coords.animationOrigin) {
    coords.animationOrigin = 'top-left'
  }

  return coords
}
