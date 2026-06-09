// Output-format types for the ColorPicker.
//
// The `format` prop drives the type of `value` through `ValueFor<F>`:
// `format='hex'` → `value: string`, `format='oklch'` → `value: OklchValue`,
// and so on. The value-object types are re-exported from `@lib/color` so
// the ColorPicker's public API doesn't force consumers to import from two
// entry points.
export {};
