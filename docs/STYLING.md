# Styling

## Setup

Luke UI ships a static CSS foundation. Consumers import `@luke-ui/react/stylesheet.css` and apply
`themeRootClassName` from `@luke-ui/react/theme` to the host element.

## Structure

- `tokens.ts`: token source of truth.
- `styles/vars.css.ts`: theme variables.
- `styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `recipes/`: component recipes exported through `@luke-ui/react/recipes`.

## CSS cascade layers

All styles live in
[cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
so override order does not depend on source order or specificity.

| Layer       | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `reset`     | Browser defaults such as box sizing and margins    |
| `theme`     | Design token custom properties and base typography |
| `recipes`   | Component styles, variants, and compound variants  |
| `utilities` | One-off overrides and layout escape hatches        |

Use `styleInLayer`, `recipeInLayer`, and `globalStyleInLayer` from `styles/layered-style.css.ts`.
These helpers keep styles inside a named layer.

Overrides that must beat component recipes belong in the `utilities` layer, not in `!important`.

The exception is styles that must also beat consumers' un-layered or inline styles. Layers cannot
beat those. `LoadingSkeleton` uses `!important` inside the `utilities` layer for this reason: it
must force placeholder styles onto arbitrary wrapped children.

Reduced motion needs recipe-level handling. The global `prefers-reduced-motion` rule lives in the
`reset` layer, so it cannot disable animations declared in `recipes` or `utilities`. Animated
recipes should add their own `@media (prefers-reduced-motion: reduce)` override. See
`recipes/loading-skeleton.css.ts`.

## Recipes API

Recipes are public and can be imported from `@luke-ui/react/recipes`.

```ts
import { button, link } from '@luke-ui/react/recipes';
```

## Styling utilities

Styling utilities are public API, exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

The current implementation vendors `rainbow-sprinkles` in `@luke-ui/rainbow-sprinkles`. It places
generated classes in the `utilities` layer and supports responsive values plus `hover` and
`focus-visible` conditions.

### `createSprinkles()` layout utility

`createSprinkles(props)` returns `{ className, style }`. Spread both onto the element.

```tsx
import { createSprinkles } from '@luke-ui/react/styles';

const layout = createSprinkles({
	display: 'flex',
	gap: 'medium',
	padding: 'large',
});

return (
	<div className={layout.className} style={layout.style}>
		...
	</div>
);
```

Token-backed properties use the design-token scale, for example `padding: 'large'`. Enum-like
properties use CSS-native values, for example `display: 'flex'`. Numeric flex properties use string
primitives, for example `flexGrow: '1'`.

### Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints, so
only overrides need to be specified.

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { xsmall: 'column', medium: 'row' },
	gap: { xsmall: 'small', medium: 'large' },
});
```

### Pseudo-state conditions

Use condition objects for `hover` and `focus-visible` states.

```tsx
const interactive = createSprinkles({
	padding: 'medium',
	backgroundColor: {
		default: 'neutral',
		hover: 'neutralHover',
		focusVisible: 'input',
	},
});
```

### React Aria Components `render` prop

When you need to style the underlying DOM element directly, combine `createSprinkles` with React
Aria Components' `render` prop. Use `mergeProps` from `@luke-ui/react/utils` so `className` and
`style` are merged correctly.

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
- **Pseudo-state**: `backgroundColor` with `hover` and `focus-visible`

Margin utilities are excluded from the initial surface.

Use CSS-native values throughout, for example `flex-start` instead of `start`. Keep
`@luke-ui/react/styles` separate from `@luke-ui/react/recipes`. Recipes are component-specific
styles. Styles are general layout utilities.

## Implementation

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`. Do not
  use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.

## Limitations

Styling utilities do not yet have runtime theme context.
