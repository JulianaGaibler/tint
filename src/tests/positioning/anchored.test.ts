import { describe, it, expect } from 'vitest'
import {
  placeAnchored,
  WINDOW_PADDING,
  type AnchoredSide,
} from '@lib/positioning/anchored'

const VIEWPORT = { innerWidth: 1000, innerHeight: 800 }
const SURFACE = new DOMRect(0, 0, 200, 100)

const anchorAt = (x: number, y: number, w = 40, h = 20) =>
  new DOMRect(x, y, w, h)

/** Centre of the surface along the axis the given side shifts its arrow on. */
const arrowTip = (
  placement: { x: number; y: number; side: AnchoredSide; arrowOffset: number },
  surface = SURFACE,
) => {
  const onBlockAxis = placement.side.startsWith('block')
  const start = onBlockAxis ? placement.x : placement.y
  const size = onBlockAxis ? surface.width : surface.height
  return start + size / 2 + placement.arrowOffset
}

describe('placeAnchored, side selection', () => {
  it('keeps the requested side when it fits', () => {
    const anchor = anchorAt(500, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.side).toBe('block-end')
    expect(at.y).toBe(anchor.y + anchor.height)
    expect(at.maxSize).toBeUndefined()
  })

  it('flips to the opposite side when the requested one is short', () => {
    // 40px below the anchor, which is less than the surface's 100.
    const anchor = anchorAt(500, 740)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.side).toBe('block-start')
    expect(at.y).toBe(anchor.y - SURFACE.height)
  })

  it('flips on the inline axis too', () => {
    const anchor = anchorAt(880, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'inline-end' })
    expect(at.side).toBe('inline-start')
    expect(at.x).toBe(anchor.x - SURFACE.width)
  })

  it('applies the offset and the arrow size as one gap', () => {
    const anchor = anchorAt(500, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, {
      side: 'block-end',
      offset: 4,
      arrowSize: 6,
    })
    expect(at.y).toBe(anchor.y + anchor.height + 10)
  })

  it('measures the gap from the anchor when placed before it', () => {
    const anchor = anchorAt(500, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, {
      side: 'block-start',
      offset: 4,
      arrowSize: 6,
    })
    expect(at.y).toBe(anchor.y - 10 - SURFACE.height)
  })
})

describe('placeAnchored, shrinking', () => {
  it('caps the surface and keeps the roomier side when neither fits', () => {
    const tall = new DOMRect(0, 0, 200, 700)
    // 300 above, 480 below, and the surface wants 700.
    const anchor = anchorAt(500, 300)
    const at = placeAnchored(anchor, tall, VIEWPORT, { side: 'block-start' })
    expect(at.side).toBe('block-end')
    expect(at.maxSize).toBe(
      VIEWPORT.innerHeight - WINDOW_PADDING - (anchor.y + anchor.height),
    )
    expect(at.y).toBe(anchor.y + anchor.height)
  })

  it('leaves maxSize unset whenever either side has room', () => {
    const anchor = anchorAt(500, 740)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.maxSize).toBeUndefined()
  })

  it('never reports a negative cap', () => {
    const huge = new DOMRect(0, 0, 200, 5000)
    const at = placeAnchored(anchorAt(500, 0, 40, 800), huge, VIEWPORT)
    expect(at.maxSize).toBe(0)
  })
})

describe('placeAnchored, cross axis and arrow', () => {
  it('centres on the anchor and leaves the arrow alone', () => {
    const anchor = anchorAt(500, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.x).toBe(anchor.x + (anchor.width - SURFACE.width) / 2)
    expect(at.arrowOffset).toBe(0)
  })

  it('shifts off the start edge and sends the arrow back', () => {
    const anchor = anchorAt(0, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.x).toBe(WINDOW_PADDING)
    expect(at.arrowOffset).toBeLessThan(0)
    expect(arrowTip(at)).toBeCloseTo(anchor.x + anchor.width / 2)
  })

  it('shifts off the end edge and sends the arrow forward', () => {
    const anchor = anchorAt(960, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'block-end' })
    expect(at.x).toBe(VIEWPORT.innerWidth - WINDOW_PADDING - SURFACE.width)
    expect(at.arrowOffset).toBeGreaterThan(0)
    expect(arrowTip(at)).toBeCloseTo(anchor.x + anchor.width / 2)
  })

  it('shifts on the block axis for an inline side', () => {
    const anchor = anchorAt(500, 0)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, { side: 'inline-end' })
    expect(at.y).toBe(WINDOW_PADDING)
    expect(at.arrowOffset).toBeLessThan(0)
    expect(arrowTip(at)).toBeCloseTo(anchor.y + anchor.height / 2)
  })

  it('holds the arrow inside the surface by arrowPadding', () => {
    const anchor = anchorAt(0, 400)
    const at = placeAnchored(anchor, SURFACE, VIEWPORT, {
      side: 'block-end',
      arrowPadding: 90,
    })
    expect(at.arrowOffset).toBe(-(SURFACE.width / 2 - 90))
  })
})
