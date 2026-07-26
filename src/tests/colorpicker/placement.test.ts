import { describe, it, expect } from 'vitest'
import { placePopover } from '@lib/components/ColorPicker/core'

const WIN = { innerWidth: 1024, innerHeight: 768 }
const POPOVER = new DOMRect(0, 0, 280, 400)

const anchorAt = (x: number, y: number, w = 200, h = 48) =>
  new DOMRect(x, y, w, h)

describe('placePopover — corner selection', () => {
  it('top-left placement: anchor in top-left corner of viewport', () => {
    // Below has room (320px from anchor bottom to viewport bottom > 400? no)
    // Actually need to pick an anchor where below+right both fit.
    const anchor = anchorAt(40, 80)
    const result = placePopover(anchor, POPOVER, WIN)
    expect(result.placement).toBe('top-left')
    // Below the anchor
    expect(result.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
    // Extending right from the anchor's left
    expect(result.x).toBe(anchor.x)
  })

  it('top-right placement: anchor near right edge, room below', () => {
    // Right side of viewport: anchor.x = 800, anchor.width = 200 ⇒ anchor.x+w = 1000.
    // spaceRight = 1024-8-800 = 216, less than popover width 280, so flips left.
    // spaceBelow >> 400 with anchor.y=80, so vertical stays top.
    const anchor = anchorAt(800, 80)
    const result = placePopover(anchor, POPOVER, WIN)
    expect(result.placement).toBe('top-right')
    expect(result.y).toBeGreaterThanOrEqual(anchor.y + anchor.height)
    // Right edge at anchor's right edge
    expect(result.x + POPOVER.width).toBe(anchor.x + anchor.width)
  })

  it('bottom-left placement: anchor near bottom of viewport, room right', () => {
    // Bottom: anchor.y = 700, spaceBelow = 768-8-748 = 12 ≪ 400, flips above.
    // spaceAbove = 700-8 = 692 ≥ 400 ✓
    const anchor = anchorAt(40, 700)
    const result = placePopover(anchor, POPOVER, WIN)
    expect(result.placement).toBe('bottom-left')
    // Above the anchor (top of popover sits above anchor.y - popover.height)
    expect(result.y + POPOVER.height).toBe(anchor.y)
    expect(result.x).toBe(anchor.x)
  })

  it('bottom-right placement: anchor near bottom-right corner', () => {
    const anchor = anchorAt(800, 700)
    const result = placePopover(anchor, POPOVER, WIN)
    expect(result.placement).toBe('bottom-right')
    expect(result.y + POPOVER.height).toBe(anchor.y)
    expect(result.x + POPOVER.width).toBe(anchor.x + anchor.width)
  })
})

describe('placePopover viewport clamping', () => {
  it('clamps to viewport when neither side fits vertically', () => {
    // A popover taller than the entire viewport. No orientation fits,
    // so clamp to PAD on the longer side.
    const tallPopover = new DOMRect(0, 0, 280, 900)
    const anchor = anchorAt(40, 400)
    const result = placePopover(anchor, tallPopover, WIN)
    // Y should be at or near WINDOW_PADDING (8) since nothing fits.
    expect(result.y).toBe(8)
    // Placement is whichever direction had more space (above vs below).
    expect(['top-left', 'bottom-left']).toContain(result.placement)
  })

  it('clamps to viewport on horizontal overflow', () => {
    const widePopover = new DOMRect(0, 0, 1200, 400)
    const anchor = anchorAt(40, 80)
    const result = placePopover(anchor, widePopover, WIN)
    // Either flush-left at PAD or flush-right at viewport-PAD. With a
    // popover wider than the viewport, the clamp pushes it to negative
    // territory and we settle at PAD.
    expect(result.x).toBe(8)
  })
})

describe('placePopover — narrow popovers always fit somewhere', () => {
  it('a small popover at any anchor position lands in a corner placement', () => {
    const small = new DOMRect(0, 0, 200, 120)
    const positions: [number, number][] = [
      [40, 80],
      [40, 700],
      [800, 80],
      [800, 700],
      [400, 400],
    ]
    for (const [x, y] of positions) {
      const result = placePopover(anchorAt(x, y), small, WIN)
      expect([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]).toContain(result.placement)
      // Final position must be on-screen (≥ PAD and ≤ viewport - PAD).
      expect(result.x).toBeGreaterThanOrEqual(8)
      expect(result.x + 200).toBeLessThanOrEqual(WIN.innerWidth - 8 + 0.001)
      expect(result.y).toBeGreaterThanOrEqual(8)
      expect(result.y + 120).toBeLessThanOrEqual(WIN.innerHeight - 8 + 0.001)
    }
  })
})
