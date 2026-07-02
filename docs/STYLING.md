# Styling

## Setup

Static CSS foundation. Users import `@luke-ui/react/stylesheet.css`. Apply `themeRootClassName`
(from `@luke-ui/react/theme`) to host element.

## Structure

- `tokens.ts`: Source of truth.
- `styles/vars.css.ts`: Theme variables.
- `styles/reset.css.ts`: Scoped reset (to `.luke-ui-reset`).
- `recipes/`: Shareable component recipes exported via `@luke-ui/react/recipes`.

## CSS Cascade Layers

All styles are placed in
[cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
to guarantee a predictable override order regardless of source order or specificity.

| Layer       | Purpose                                                      |
| ----------- | ------------------------------------------------------------ |
| `reset`     | Normalize browser defaults (box-sizing, margins, etc.)       |
| `theme`     | Design token custom properties and base typographic defaults |
| `recipes`   | Component styles (variants, compound variants)               |
| `utilities` | One-off overrides; highest-priority escape hatch             |

Use `styleInLayer` / `recipeInLayer` / `globalStyleInLayer` from `styles/layered-style.css.ts`.
These helpers prevent accidentally writing styles outside a layer.

Overrides that must beat component recipes go in the `utilities` layer, not `!important`. The
exception is styles that must also beat consumers' un-layered and inline styles — layers can't do
that. `LoadingSkeleton` uses `!important` (within the `utilities` layer) for exactly this: it forces
placeholder styles onto arbitrary wrapped children.

**Reduced-motion gotcha**: the global `prefers-reduced-motion` rule lives in the `reset` layer — the
lowest — so it cannot disable animations declared in `recipes` or `utilities`. Handle reduced motion
per animated recipe with an `@media (prefers-reduced-motion: reduce)` override (see
`recipes/loading-skeleton.css.ts`).

## Recipes API

Recipes are public and can be imported from `@luke-ui/react/recipes`.

```ts
import { button, link } from '@luke-ui/react/recipes';
```

## Styling Utilities

Styling utilities are public API, exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout and styling helpers for cases where component props are too narrow.

The current implementation is vendored `rainbow-sprinkles` in `@luke-ui/rainbow-sprinkles`. It
places all generated classes in the `utilities` cascade layer and supports responsive conditions and
pseudo-state conditions out of the box.

### `createSprinkles()` — layout utility

`createSprinkles(props)` returns `{ className, style }`. Spread both onto any element:

```tsx
import { createSprinkles } from '@luke-ui/react/styles';

const layout = createSprinkles({
	display: 'flex',
	gap: 'medium',
	padding: 'large',
});

return (
	<div className={layout.className} style={layout.style}>
		…
	</div>
);
```

Token-backed properties use the design-token scale (e.g. `padding: 'large'`). Enum-like properties
use CSS-native values (e.g. `display: 'flex'`). Numeric flex properties use string primitives
(`flexGrow: '1'`).

### Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints, so
only overrides need to be specified:

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { xsmall: 'column', medium: 'row' },
	gap: { xsmall: 'small', medium: 'large' },
});
```

### Pseudo-state conditions

Use condition objects for `hover` and `focus-visible` on supported properties:

```tsx
const interactive = createSprinkles({
	padding: 'medium',
	backgroundColor: { default: 'neutral', hover: 'neutralHover', focusVisible: 'input' },
});
```

### React Aria Components `render` prop

When you need to style the underlying DOM element directly, combine `createSprinkles` with RAC's
`render` prop. Use `mergeProps` from `@luke-ui/react/utils` to merge the provided DOM props with
`createSprinkles()` output so `className` and `style` are concatenated correctly:

```tsx
import { mergeProps } from '@luke-ui/react/utils';

const buttonBox = createSprinkles({ padding: 'medium' });

<Button
	render={(props) => (
		<button {...mergeProps(props, buttonBox)} type="button">
			Save
		</button>
	)}
>
	Save
</Button>;
```

### Shorthands

`px` and `py` expand to both inline or block padding sides. `p` expands to all four sides:

```tsx
const padded = createSprinkles({ px: 'large', py: 'small' });
```

### Available properties

The v1 surface covers:

- **Layout**: `display`, `flexDirection`, `justifyContent`, `alignItems`
- **Flex item**: `flexGrow`, `flexShrink`, `flexBasis`
- **Sizing**: `inlineSize`, `blockSize`, `minInlineSize`, `minBlockSize`, `maxInlineSize`,
  `maxBlockSize`
- **Gaps**: `gap`, `rowGap`, `columnGap`
- **Padding**: `padding`, `paddingInline`, `paddingBlock`, `paddingInlineStart`, `paddingInlineEnd`,
  `paddingBlockStart`, `paddingBlockEnd`
- **Overflow**: `overflow`, `overflowX`, `overflowY`, `textOverflow`
- **Pseudo-state**: `backgroundColor` (hover, focus-visible)
- **Shorthands**: `p`, `px`, `py`

Margin utilities are excluded from the initial surface. CSS-native values are used throughout (e.g.
`flex-start` rather than `start`).

Keep `@luke-ui/react/styles` as a separate export path from `@luke-ui/react/recipes`. Recipes are
for component-specific styles; styles are for general layout utilities.

## Implementation

- Use only CSS logical properties (e.g. `margin-inline-start`, `block-size`, `inset-inline`), not
  physical (`margin-left`, `height`, `left`/`right`).
- Align variant names with public props (`size`, `tone`).
- Boolean props use `is*` or `should*`.

## Limitations

No styling utility implementation or runtime theme context yet.
