# Styling

## Setup

Luke UI ships one static stylesheet for its reset, theme root, recipes, and utilities. Consumers
import `@luke-ui/react/stylesheet.css` and apply `themeRootClassName` from `@luke-ui/react/theme`
near the app root. Import one bundled theme stylesheet and apply its identity class to the same
element. Neither step injects styles at runtime.

## Structure

- `styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `styles/theme-root.css.ts`: base typography and text colour scoped to `.luke-ui-theme`.
- `recipes/`: component recipes exported from `@luke-ui/react/recipes`.
- `recipes/recipe.ts`: the internal `recipe()` engine shared by every component recipe, plus the
  `RecipeSelection<typeof recipeFn>` helper that derives a recipe's variant type.
- `recipes/input-states.ts`: the shared field control-state selectors (`inputStates`,
  `composeInputStateSelectors`, `descendantDisabledSelector`) field recipes compose and extend. It
  is named `.ts`, not `.css.ts`, because it emits no CSS. Each field recipe's `.css.ts` module
  composes its plain data and functions.
- `styles/`: public layout utilities exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the semantic token tree, its `--luke-*` variable naming, and the source-owned
  `fontSizeSteps` typography step keys.
- `theme/contract.css.ts`: the typed `vars` contract, built by walking the semantic token tree
  directly so it stays source-owned and free of styling-engine types.
- `theme/define-theme.ts`: the public `defineTheme(input)` authoring util, its typed `ThemeInput`,
  and the curated defaults it applies for omitted materials and scrim.
- `theme/foundation.ts`: the internal typed theme-foundation shape `defineTheme` normalises into and
  the curated colour, radius, and typography defaults.
- `theme/color.ts`: OKLCH colour math, sRGB gamut mapping, and WCAG contrast.
- `theme/contrast-policy.ts`: the WCAG ratios, solver headroom and search step, and intent role
  groups the generator, the compiler's validation matrix, and the semantic map all read.
- `theme/scale.ts`: the private 12-step family generator (`generateFamily`), including the
  constrained step-9 solid-anchor search, the per-role capability guarantees, and
  `passesOnSolidGate`, the on-solid accessibility gate.
- `theme/elevation.ts`: the mode-aware elevation surface generator (`generateSurfaces`), where
  `surfaces.canvas` is always exactly the resolved `background`.
- `theme/semantic-map.ts`: the one default mapping (`mapSemanticColors`) from generated families and
  surfaces onto the colour contract's leaves.
- `theme/diagnostics.ts`: the `compileTheme` diagnostics data model (family, surface, solid-anchor,
  and contrast-check detail) consumed by the "Theme/Diagnostics" Storybook story.
- `theme/token-board.tsx`: the contract-driven "Theme/Token board" Storybook story, which renders
  every contract leaf for the active theme and colour mode.
- `theme/build-theme.ts`: the internal `compileTheme(foundation) → { css, diagnostics }` value
  pipeline, `buildTheme`, `themeClassName`, and contrast validation.
- `theme/foundations.ts`: `defineTheme(...)` inputs for the bundled Tactile and Paper themes.
- `themes/`: bundled theme class-name constants exported from `@luke-ui/react/themes`.
- `scripts/build-themes.ts`: writes the bundled theme stylesheets to `dist/themes/`.

## Themes

`defineTheme(input)` from `@luke-ui/react/theme` is the sole public theme-authoring surface. It
normalises a small, curated `ThemeInput` — a required `color.accent`, an optional neutral character,
and optional materials — into static stylesheet text. It is pure and Node-compatible. It generates
the full semantic contract in OKLCH and throws a `ThemeContrastError` naming each failing mode and
token pair when a generated pair misses WCAG 2.2 AA contrast. A single-value accent or neutral is
adapted per mode through a lightness search; it throws when no lightness in the vibrant band is
accessible. The raw `ThemeFoundation` object and `buildTheme` are internal only.

Every colour token is generated from a private 12-step scale per role (neutral, accent, danger,
info, success, warning) plus a mode-aware elevation surface set, then mapped onto the public colour
contract. See [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for the pipeline, the border
and accent contrast policies, and what changed when this generator replaced the original per-token
solver.

The semantic contract includes `font.100` through `font.900` size steps. Each step groups its font
size, line height, letter spacing, and per-font Capsize trims so components cannot combine unrelated
values. `font.family.body` is selected from the curated Inter, Apple System, or DM Sans metrics and
`buildTheme` computes the matching trims. `font.family.code` is a fixed neutral monospace stack for
code and keyboard input; it is not a brand-family or Capsize choice. Icon sizes carry forward the
`xsmall`, `small`, `medium`, and `large` scale at 16px, 20px, 24px, and 32px.

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

Use `styleInLayer` and `globalStyleInLayer` from `styles/layered-style.css.ts` to place a plain
Vanilla Extract style for a recipe with no variants in a named layer (see
`recipes/loading-skeleton.css.ts`). A variant-driven recipe instead calls `recipe()` from
`recipes/recipe.ts`, which wraps every base, variant, and compound-variant style it is given in the
`recipes` layer. A recipe can still pre-build a static `base` with `styleInLayer('recipes', …)` and
hand the resulting class string to `recipe()`, which passes a string value through unchanged rather
than wrapping it again.

Text's Capsize trim declarations use logical properties for the pseudo-element margins and are
authored as one of the Text recipe's `recipe()` compound-variant styles, so they remain owned by
`recipes` through that same layering rather than a dedicated helper.

Overrides that should beat component recipes belong in the `utilities` layer. Use `!important` only
when a style must also beat consumer un-layered styles or inline styles. Layers cannot beat those.

`LoadingSkeleton` uses `!important` inside the `recipes` layer because it must force placeholder
styles onto arbitrary wrapped children. Moving `!important` to a lower layer does not weaken the
mask — in the `!important` cascade, lower layers win over higher layers. The `recipes` layer is
below `utilities`, so a `utilities`-layer `!important` override from a consumer cannot beat the
skeleton.

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

Every recipe is built with the internal `recipe()` engine from `recipes/recipe.ts`. It is not part
of the public package entry. Component authors inside `@luke-ui/react` use it to define a new
recipe. Consumers only ever call the built recipe functions it returns (`button`, `text`, and so
on). `recipe()` wraps every base, variant, and compound-variant style it is given in the `recipes`
cascade layer itself, so a recipe author does not add layering by hand.

### Single-part recipes

A single-part recipe takes `base`, `variants`, `defaultVariants`, and `compoundVariants`, and
returns a function that takes a variant selection and returns one class string:

```ts
export const button = recipe({
	base,
	defaultVariants: { appearance: 'solid', size: 'medium', tone: 'neutral' },
	variants: {
		appearance: { ghost: {}, solid: {}, subtle: {} },
		size: {/* … */},
		tone: { accent: {}, danger: {}, neutral: {} },
	},
	compoundVariants: [/* … */],
});
```

See `recipes/button.css.ts` for the full recipe this abbreviates.

### Slotted recipes

A recipe whose component has multiple styled parts takes `slots` instead of `base`. Each variant
value maps to per-slot styles, and the built recipe takes a variant selection and returns one
function per slot, each accepting an optional extra class to merge:

```tsx
export const combobox = recipe({
	slots: { control: '…', root: '…', textInput: '…' /* … */ },
	variants: {/* per-slot styles keyed by variant value */},
} as const satisfies SlottedConfigInput);

const { root, control } = combobox({ size: 'medium' });
<div className={root()}>
	<div className={control(extraClassName)}>…</div>
</div>;
```

See `recipes/combobox.css.ts` for a complete slotted recipe. Apply
`as const satisfies SlottedConfigInput` at the definition site: `as const` preserves the literal
slot names and variant values `recipe()` infers, and `satisfies` type-checks every slot and variant
style against `StyleRule` where it is written.

Compound variants are single-part only: `button` and `text` both use `compoundVariants` on their
single-part config. A slotted config has no `compoundVariants` field.

### Deriving variant types

Never hand-maintain a recipe's variant type. Derive it from the built recipe with
`RecipeSelection<typeof recipeFn>`:

```ts
export type ButtonVariants = RecipeSelection<typeof button>;
```

Do not cast a hand-written variant interface onto a recipe's selection parameter. If the exported
type and the recipe definition can drift, something is wrong with how the type was produced, not
with the recipe.

### Shared input-state selectors

Field-style recipes (`text-input.css.ts`, `combobox.css.ts`) share one definition of what "hovered",
"focused", "disabled", "invalid", and "read-only" mean for a control, from
`recipes/input-states.ts`:

```ts
import {
	composeInputStateSelectors,
	descendantDisabledSelector,
	inputStates,
} from './input-states.js';

const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors(inputStates);
```

`inputStates` is the base attribute/pseudo-class selector for each state.
`composeInputStateSelectors` combines them into the mutually exclusive selectors a recipe applies to
its styles (for example, `hover` deliberately excludes an element that is also focused or
read-only). A recipe with a more complex anatomy can widen a state before composing it, the way
`combobox.css.ts` extends `disabled` and `invalid` to also match its trigger button.
`descendantDisabledSelector` styles a part (an adornment or trigger) when an ancestor control is
disabled.

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
