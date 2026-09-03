/**
 * Refcounted `overflow: hidden` on the body.
 *
 * Separate from the dismissal stack because the two do not line up. A modal
 * that cannot be closed by the user locks scrolling and is not a dismissal
 * layer at all. Refcounted because the inner of two open modals closing must
 * not give the page its scrollbar back, and the previous value is restored
 * rather than cleared, so a host that had already set `overflow` keeps it.
 */
export declare function lockBodyScroll(): () => void;
/** Test seam. Not exported from the package. */
export declare function resetBodyScrollLock(): void;
