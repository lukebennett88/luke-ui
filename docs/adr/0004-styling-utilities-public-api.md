# Styling utilities as public API

Styling utilities are public API, exported from `@luke-ui/react/styles` as named
exports. They provide token-aware, type-safe layout helpers for cases where
component props are too narrow.

## Decision

Rainbow Sprinkles was chosen over vanilla-extract Sprinkles. Rainbow Sprinkles
uses `assignInlineVars` to emit dynamic CSS custom properties at runtime rather
than generating static classes for every token-value combination. This avoids
class-name bloat when the token scale grows and keeps the generated CSS bundle
small — the static utilities layer defines only property-level classes, not
value-level classes. The trade-off is that values are applied via inline
`style`, which raises specificity but is acceptable for the `utilities` cascade
layer (the highest-priority escape hatch).

## Rejected alternatives

- **Polymorphic `Box` component**: rejected because it introduces the same
  polymorphism issues that make React Aria Components' `render` prop preferable.
- **Spreading style props onto every component**: rejected because it would bloat
  component APIs and blur the boundary between component-specific recipes and
  consumer layout utilities.
- **Library-author only API**: rejected because consumers repeatedly need safe
  layout composition without inline styles, as shown by the middle-truncation
  story example.

## Consequences

- `@luke-ui/react/styles` exports `createSprinkles()` as the public layout utility function.
- The initial surface covers layout, flex-item behavior, sizing, token-backed gaps
  and padding, overflow, and text overflow. Margin utilities are excluded.
- Values are CSS-native, property names are logical where possible.
- Responsive values and pseudo-state conditions (`hover`, `focus-visible`) are in
  scope for v1.
- Object notation is used for responsive values; array notation may be added later.
- Rainbow Sprinkles condition syntax is used for pseudo-states.
- Utilities live in the `utilities` cascade layer, below recipes.
- Layer helpers (`styleInLayer`, `recipeInLayer`) remain internal.
- No React render-prop helper is added until a real repeated need appears.
