# Styling utilities are public API

Styling utilities are public API, exported as named exports from `@luke-ui/react/styles`. They
provide token-aware, type-safe layout helpers for cases where component props are too narrow.

## Decision

Use Rainbow Sprinkles instead of vanilla-extract Sprinkles.

Rainbow Sprinkles uses `assignInlineVars` to emit dynamic CSS custom properties at runtime. It does
not generate a static class for every token-value combination. That keeps the generated CSS bundle
small as the token scale grows, because the static utilities layer defines property-level classes
rather than value-level classes.

The tradeoff is that values are applied through inline `style`, which raises specificity. That is
acceptable because the utilities layer is already the highest-priority escape hatch.

## Rejected options

- **Polymorphic `Box` component**: rejected because it introduces the same polymorphism issues that
  make React Aria Components' `render` prop preferable.
- **Style props on every component**: rejected because it would bloat component APIs and blur the
  boundary between component-specific recipes and consumer layout utilities.
- **Library-author-only API**: rejected because consumers repeatedly need safe layout composition
  without writing inline styles.

## Consequences

- `@luke-ui/react/styles` exports `createSprinkles()` as a public layout utility.
- The initial surface covers layout, flex-item behaviour, sizing, token-backed gaps, token-backed
  padding, overflow, and text overflow.
- Margin utilities are excluded.
- Values are CSS-native.
- Property names are logical where possible.
- Responsive values and pseudo-state conditions (`hover`, `focus-visible`) are in scope for v1.
- Responsive values use object notation. Array notation may be added later.
- Pseudo-states use Rainbow Sprinkles condition syntax.
- Utilities live in the `utilities` cascade layer.
- Layer helpers such as `styleInLayer` and `recipeInLayer` remain internal.
- No React component wrapper is added for this API.
