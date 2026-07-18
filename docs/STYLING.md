# Styling

## Setup

Luke UI ships static CSS. Consumers import `@luke-ui/react/stylesheet.css` and apply
`themeRootClassName` from `@luke-ui/react/theme` near the app root. Import one bundled theme
stylesheet and apply its identity class to the same element. Neither step injects styles at runtime.

## Structure

- `styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `styles/theme-root.css.ts`: base typography and text colour scoped to `.luke-ui-theme`.
- `recipes/`: component recipes exported from `@luke-ui/react/recipes`.
- `styles/`: public layout utilities exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the semantic token tree and its `--luke-*` variable naming.
- `theme/contract.css.ts`: the typed `vars` contract built with `createGlobalThemeContract`.
- `theme/foundation.ts`: the typed theme-foundation input and curated defaults.
- `theme/color.ts`: OKLCH colour math, sRGB gamut mapping, and WCAG contrast.
- `theme/build-theme.ts`: `buildTheme(foundation)`, `themeClassName`, and contrast validation.
- `theme/foundations.ts`: foundations for the bundled Tactile and Paper themes.
- `themes/`: bundled theme class-name constants exported from `@luke-ui/react/themes`.
- `scripts/build-themes.ts`: writes the bundled theme stylesheets to `dist/themes/`.

## Themes

`buildTheme(foundation)` from `@luke-ui/react/theme` compiles a typed theme foundation into static
stylesheet text. It is pure and Node-compatible. It generates the full semantic contract in OKLCH
and throws a `ThemeContrastError` naming each failing mode and token pair when a generated pair
misses WCAG 2.2 AA contrast.

The semantic contract includes `font.100` through `font.900` size steps. Each step groups its font
size, line height, letter spacing, and per-font Capsize trims so components cannot combine unrelated
values. `buildTheme` computes those trim values from the curated Inter, Apple System, or DM Sans
font metrics. Icon sizes carry forward the `xsmall`, `small`, `medium`, and `large` scale at 16px,
20px, 24px, and 32px.

Each colour mode authors the final composite `box-shadow` for `depth.recessed`, `depth.resting`,
`depth.raised`, `depth.floating`, and `depth.overlay`. Components select a semantic depth and do not
branch on the theme identity. This keeps lower edges and exterior shadows visible in the foundation
instead of deriving them from strength multipliers and hidden formulas.

Each mode also authors final `background-image` values for `actionControlFinish.resting`,
`actionControlFinish.raised`, and `actionControlFinish.recessed`. Button and IconButton layer this
face lighting over their semantic surface colour. Ghost controls and forced-colours rendering do not
use the authored finish.

Use `deriveConcentricRadius(innerRadius, gap)` for rounded elements nested inside another rounded
surface. It returns a CSS `calc()` value for the outer radius, so both inputs can be semantic theme
variables instead of theme-specific numbers.

The bundled themes ship precompiled. Import `@luke-ui/react/themes/tactile.css` or
`@luke-ui/react/themes/paper.css` and apply the matching `tactileThemeClassName` or
`paperThemeClassName` constant from `@luke-ui/react/themes` to `<html>` or a subtree root. Importing
one theme never pulls in the other.

Without `data-color-mode`, a themed subtree follows `prefers-color-scheme`. Setting
`data-color-mode="light"` or `data-color-mode="dark"` on the theme root, an ancestor, or any element
inside the subtree forces that mode, and nested scopes can override it. Every scope also sets native
`color-scheme` so form controls and scrollbars agree.

Components move to the semantic contract in the component-family migration slices.

Luke UI's portalled Combobox popover carries the nearest identity class and explicit colour mode
from its trigger. Portals created by an application must apply the same public class and attribute
contract to their portal root. When no explicit mode exists, omit `data-color-mode` so the portalled
surface continues to follow the system preference.

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

## Panda config recipes (migration in progress)

Components are moving from vanilla-extract recipes to Panda config recipes one at a time. A
migrated recipe is a pair of files: `src/recipes/<name>.recipe.ts` holds the `defineRecipe` (or
`defineSlotRecipe`) definition and is registered in `panda.config.ts`. This is the only file that may
import `@pandacss/dev`.

`src/recipes/<name>.ts` is the runtime module. It re-exports the generated class-name function from
the per-recipe module `styled-system/recipes/<name>.mjs`, never the generated `styled-system/recipes/index.mjs`
barrel, and derives its public variant types from the generated types so a variant added to the
recipe definition needs no matching edit here. Both files together are what `@luke-ui/react/recipes`
exports; the vanilla-extract `*.css.ts` recipes not yet migrated keep authoring their styles and
types directly.

## Styling utilities

Styling utilities are public and exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

Luke UI uses Rainbow Sprinkles for this API. Rainbow Sprinkles emits dynamic CSS custom properties
at runtime instead of generating a static class for every token and value pair. That keeps the CSS
bundle smaller as the token scale grows.

The tradeoff is that some values are applied through inline `style`, which raises specificity. That
is acceptable because styling utilities are already the highest-priority escape hatch.

`Box` from `@luke-ui/react/box` applies the same utilities to a `div`. Its `render` prop can use a
compatible custom `div` component while preserving the generated class, style, ref, and DOM props.
It does not provide `as` or `asChild` polymorphism.

Do not add style props to every component. Component props should stay focused on component-specific
variants and behaviour.

## `createSprinkles()`

`createSprinkles(props)` returns `{ className, style }`. Spread both onto the element.

```tsx
import { createSprinkles } from '@luke-ui/react/styles';

const layout = createSprinkles({
	display: 'flex',
	gap: '400',
	padding: '600',
});

return (
	<div className={layout.className} style={layout.style}>
		...
	</div>
);
```

Spacing and gap properties use `0` or the semantic space steps `100`, `200`, `300`, `400`, `600`,
`800`, `1000`, `1200`, and `1600`. Margin also accepts `auto`. Enum-like properties use CSS-native
values, for example `display: 'flex'`. Sizing, inset, flex-basis, order, and grid-placement values
accept their CSS property values.

## Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints, so
only overrides need to be specified.

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { xsmall: 'column', medium: 'row' },
	gap: { xsmall: '300', medium: '600' },
});
```

The retained breakpoints are `xsmall` (base), `small` (640px), `medium` (768px), `large` (1024px),
`xlarge` (1280px), and `xxlarge` (1536px).

## React Aria `render` prop

When you need to style the underlying DOM element directly, combine `createSprinkles` with React
Aria Components' `render` prop. Use `mergeProps` from `@luke-ui/react/utils` so `className` and
`style` are merged correctly.

```tsx
import { mergeProps } from '@luke-ui/react/utils';

const buttonBox = createSprinkles({ padding: '400' });

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

- Layout: `display`.
- Spacing: logical `margin*` and `padding*` properties.
- Sizing: `inlineSize`, `blockSize`, `minInlineSize`, `minBlockSize`, `maxInlineSize`,
  `maxBlockSize`.
- Positioning: `position` and logical `inset*` properties.
- Gaps: `gap`, `rowGap`, `columnGap`.
- Overflow: `overflow`, `overflowX`, `overflowY`.
- Flex: `flex`, `flexBasis`, `flexDirection`, `flexGrow`, `flexShrink`, `flexWrap`, `order`,
  `alignContent`, `alignItems`, `alignSelf`, and `justifyContent`.
- Grid children: `gridArea`, `gridColumn*`, `gridRow*`, `justifySelf`, and `placeSelf`.

Use CSS-native values throughout, for example `flex-start` instead of `start`.

Semantic colour, typography, and pseudo-state properties are deliberately excluded. Use component
APIs where possible. Sanctioned custom styling uses the public typed `vars` from
`@luke-ui/react/theme`, which resolve to stable `--luke-*` variables.

```tsx
import { vars } from '@luke-ui/react/theme';

return (
	<div
		style={{
			backgroundColor: vars.color.surface.recessed,
			color: vars.color.text.primary,
		}}
	>
		Custom content
	</div>
);
```

## Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Do not use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
