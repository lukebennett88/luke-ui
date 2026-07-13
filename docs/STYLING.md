# Styling

## Setup

Luke UI ships static CSS. Consumers import `@luke-ui/react/stylesheet.css` and apply
`themeRootClassName` from `@luke-ui/react/theme` near the app root.

## Structure

- `tokens.ts`: design token source.
- `styles/vars.css.ts`: theme variables.
- `styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `recipes/`: component recipes exported from `@luke-ui/react/recipes`.
- `styles/`: public layout utilities exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the semantic token tree and its `--luke-*` variable naming.
- `theme/contract.css.ts`: the typed `vars` contract built with `createGlobalThemeContract`.
- `theme/foundation.ts`: the typed theme-foundation input and curated defaults.
- `theme/color.ts`: OKLCH colour math, sRGB gamut mapping, and WCAG contrast.
- `theme/build-theme.ts`: `buildTheme(foundation)`, `themeClassName`, and contrast validation.
- `theme/foundations.ts`: foundations for the bundled Machined edge and ELMO themes.
- `themes/`: bundled theme class-name constants exported from `@luke-ui/react/themes`.
- `scripts/build-themes.ts`: writes the bundled theme stylesheets to `dist/themes/`.

## Themes

`buildTheme(foundation)` from `@luke-ui/react/theme` compiles a typed theme foundation into static
stylesheet text. It is pure and Node-compatible. It generates the full semantic contract in OKLCH
and throws a `ThemeContrastError` naming each failing mode and token pair when a generated pair
misses WCAG 2.2 AA contrast.

The semantic contract includes composite `font.100` through `font.900` steps. Each step groups its
font size, line height, and letter spacing so components cannot combine unrelated values. Icon sizes
carry forward the `xsmall`, `small`, `medium`, and `large` scale at 16px, 20px, 24px, and 32px.

Use `deriveConcentricRadius(innerRadius, gap)` for rounded elements nested inside another rounded
surface. It returns a CSS `calc()` value for the outer radius, so both inputs can be semantic theme
variables instead of theme-specific numbers.

The bundled themes ship precompiled. Import `@luke-ui/react/themes/machined-edge.css` or
`@luke-ui/react/themes/elmo.css` and apply the matching `machinedEdgeThemeClassName` or
`elmoThemeClassName` constant from `@luke-ui/react/themes` to `<html>` or a subtree root. Importing
one theme never pulls in the other.

Without `data-color-mode`, a themed subtree follows `prefers-color-scheme`. Setting
`data-color-mode="light"` or `data-color-mode="dark"` on the theme root, an ancestor, or any element
inside the subtree forces that mode, and nested scopes can override it. Every scope also sets native
`color-scheme` so form controls and scrollbars agree.

Components still consume the legacy tokens until #96 migrates them to the new contract.

## Cascade layers

All styles live in CSS cascade layers so override order does not depend on source order or
specificity.

| Layer       | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `reset`     | Browser defaults, box sizing, and margins.          |
| `theme`     | Design token custom properties and base typography. |
| `recipes`   | Component styles, variants, and compound variants.  |
| `utilities` | One-off layout and override escape hatches.         |

Use `styleInLayer`, `recipeInLayer`, and `globalStyleInLayer` from `styles/layered-style.css.ts`.
These helpers keep styles inside a named layer.

Overrides that should beat component recipes belong in the `utilities` layer. Use `!important` only
when a style must also beat consumer un-layered styles or inline styles. Layers cannot beat those.

`LoadingSkeleton` uses `!important` inside the `utilities` layer because it must force placeholder
styles onto arbitrary wrapped children.

Reduced-motion handling belongs near the animation. The global `prefers-reduced-motion` rule lives
in the `reset` layer, so it cannot disable animations declared in `recipes` or `utilities`. Animated
recipes should add their own `@media (prefers-reduced-motion: reduce)` override. See
`recipes/loading-skeleton.css.ts` for an example.

## Recipes

Recipes are public and can be imported from `@luke-ui/react/recipes`.

```ts
import { button, link } from '@luke-ui/react/recipes';
```

Recipes are component-specific. Keep them separate from general layout utilities.

## Styling utilities

Styling utilities are public and exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

Luke UI uses Rainbow Sprinkles for this API. Rainbow Sprinkles emits dynamic CSS custom properties
at runtime instead of generating a static class for every token and value pair. That keeps the CSS
bundle smaller as the token scale grows.

The tradeoff is that some values are applied through inline `style`, which raises specificity. That
is acceptable because styling utilities are already the highest-priority escape hatch.

Do not add a polymorphic `Box` component. React Aria Components' `render` prop covers the same need
without adding another component API.

Do not add style props to every component. Component props should stay focused on component-specific
variants and behaviour.

## `createSprinkles()`

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
values, for example `flexGrow: '1'`.

## Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints, so
only overrides need to be specified.

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { xsmall: 'column', medium: 'row' },
	gap: { xsmall: 'small', medium: 'large' },
});
```

## Pseudo-state conditions

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

## React Aria `render` prop

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

## Utility surface

The v1 surface covers:

- Layout: `display`, `flexDirection`, `justifyContent`, `alignItems`.
- Flex item: `flexGrow`, `flexShrink`, `flexBasis`.
- Sizing: `inlineSize`, `blockSize`, `minInlineSize`, `minBlockSize`, `maxInlineSize`,
  `maxBlockSize`.
- Gaps: `gap`, `rowGap`, `columnGap`.
- Padding: `padding`, `paddingInline`, `paddingBlock`, `paddingInlineStart`, `paddingInlineEnd`,
  `paddingBlockStart`, `paddingBlockEnd`.
- Overflow: `overflow`, `overflowX`, `overflowY`, `textOverflow`.
- Pseudo-state colour: `backgroundColor` with `hover` and `focus-visible`.

Margin utilities are not part of the initial surface.

Use CSS-native values throughout, for example `flex-start` instead of `start`.

Styling utilities do not yet read runtime theme context.

## Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Do not use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
