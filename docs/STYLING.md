# Styling

## Setup

Luke UI ships static CSS. Consumers import `@luke-ui/react/stylesheet.css` and apply
`themeRootClassName` from `@luke-ui/react/theme` near the app root. Import one bundled theme
stylesheet and apply its identity class to the same element. Neither step injects styles at runtime.

## Structure

- `styles/global-styles.ts`: Panda global reset and base typography scoped to `.luke-ui-reset` and
  `.luke-ui-theme`.
- `recipes/`: component recipes exported from `@luke-ui/react/recipes`.
- `styles/`: public layout utilities exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the semantic token tree and its `--luke-*` variable naming.
- `theme/panda-tokens.ts`: the typed runtime `vars` contract and Panda token aliases.
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

| Layer       | Purpose                                                       |
| ----------- | ------------------------------------------------------------- |
| `reset`     | Scoped browser defaults, box sizing, margins, and focus ring. |
| `base`      | Scoped base typography, text colour, and accent colour.       |
| `tokens`    | Panda aliases that resolve to the active `--luke-*` contract. |
| `recipes`   | Component styles, variants, compound variants, and globals.   |
| `box`       | Curated layout classes used by Box and styles.                |
| `utilities` | Consumer-owned one-off layout and override escape hatches.    |

Panda config recipes emit into the `recipes` layer, and Panda global rules use `globalCss` with an
inline `@layer` key. The assembled `stylesheet.css` begins with the canonical layer-order
declaration.

Overrides that should beat component recipes belong in the `utilities` layer. Use `!important` only
when a style must also beat consumer un-layered styles or inline styles. Layers cannot beat those.

`LoadingSkeleton` uses `!important` inside the `recipes` layer because it must force placeholder
styles onto arbitrary wrapped children.

Reduced-motion handling belongs near the animation. The global `prefers-reduced-motion` rule lives
in the `reset` layer, so it cannot disable animations declared in `recipes` or `utilities`. Animated
recipes should add their own `@media (prefers-reduced-motion: reduce)` override. See
`recipes/loading-skeleton.recipe.ts` for an example.

## Recipes

Recipes are public and can be imported from `@luke-ui/react/recipes`.

```ts
import { button, link } from '@luke-ui/react/recipes';
```

Recipes are component-specific. Keep them separate from general layout utilities.

## Panda config recipes

Each recipe is a pair of files: `src/recipes/<name>.recipe.ts` holds the `defineRecipe` (or
`defineSlotRecipe`) definition and is registered in `panda.config.ts`. This is the only file that
may import `@pandacss/dev`.

`src/recipes/<name>.ts` is the runtime module. It re-exports the generated class-name function from
the per-recipe module `styled-system/recipes/<name>.mjs`, never the generated
`styled-system/recipes/index.mjs` barrel, and derives its public variant types from the generated
types so a variant added to the recipe definition needs no matching edit here. Both files together
are what `@luke-ui/react/recipes` exports.

### Type-safety rules for recipe definitions

Recipe definitions are plain TypeScript evaluated at config load, so nothing validates them unless
they are tied to the generated types. Every migrated recipe follows these rules:

- No type assertions. Use `as const` and `satisfies` only; write explicit entries instead of
  `Object.fromEntries(...) as Record<...>`.
- Tie every standalone style object or helper with `as const satisfies SystemStyleObject` (from
  `styled-system/types/system-types.d.mts`). This checks structure, not token spellings, because the
  generated property types carry an `AnyString` escape hatch.
- Tie token values to the generated per-category unions from `styled-system/tokens/index.mjs`
  (`ColorToken`, `SizeToken`, `FontSizeToken`, `FontWeightToken`, ...) at the authoring site: helper
  parameters, `Record` value types, or inline (`focusRing('border.focus' satisfies ColorToken)`).
- Derive variant key unions from the token unions with a template-literal extractor defined in
  `src/types/token-unions.ts`, for example
  ``type IntentToneOf<Token> = Token extends `intent.${infer Tone}.${string}` ? Tone : never``. When
  a component exposes a deliberate subset, wrap it in `Extract<Derived, 'a' | 'b'>` so a renamed or
  removed token surfaces as a missing or excess key on the variants table.
- Where each key has exactly one valid token, pin the correspondence with a mapped `satisfies`; see
  `iconSizeVariants` in `icon.recipe.ts` and `buttonSurfaces` in `button.recipe.ts`.
- Token-derived unions live in `src/types/token-unions.ts`; a recipe file declares only its
  deliberate subset (`type ButtonTone = Extract<IntentTone, 'accent' | 'danger' | 'neutral'>`).
- Public runtime types always derive from codegen (`PlainVariants` from
  `src/types/plain-variants.ts` for recipes without compound variants); never restate a variant
  union by hand.

## Styling utilities

Styling utilities are public and exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

Luke UI generates the curated layout classes in the `box` layer. Direct token and enum values
resolve to curated classes. Responsive values set a scoped CSS custom property at each breakpoint,
avoiding a class for every property, value, and breakpoint combination. The open sizing, inset,
flex, and grid values retain a non-responsive CSS-custom-property escape for values that cannot be
enumerated.

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
accept their CSS property values, but are intentionally non-responsive.

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
`@luke-ui/react/theme`, which resolve to stable `--luke-*` variables. Use `vars` for runtime inline
styles or values that Panda does not extract; use Panda token keys in build-time `css()` calls.

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

A Panda consumer imports `lukePreset` alongside its base utilities. The preset contains alias
metadata for extraction and generated types, with no Luke UI reset, global, or recipe definitions.
Panda can still emit its alias token declarations. Import the prebuilt stylesheet and a theme
stylesheet separately.

```ts
import { lukePreset } from '@luke-ui/react/preset';
import { defineConfig } from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';

export default defineConfig({
	eject: true,
	presets: [lukePreset],
	utilities: { ...presetBase.utilities },
});
```

Use semantic token-key strings in extracted styles, not `vars` member expressions:

```ts
css({ backgroundColor: 'surface.resting', fontSize: '700', padding: '100' });
```

## Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Do not use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
