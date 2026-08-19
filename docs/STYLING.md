# Styling

## Setup

Luke UI ships one static stylesheet for its reset, theme root, recipes, and utilities. Consumers
import `@luke-ui/react/stylesheet.css` and apply `rootClassName` from `@luke-ui/react/theme` to
`<body>`, `<main>`, or an app shell. Import one bundled theme stylesheet, for example
`@luke-ui/react/themes/tactile/stylesheet.css`. That alone themes the whole document from `:root`,
with no class and no JS required. Neither step injects styles at runtime.

## Structure

- `styles/index.css.ts`: stylesheet graph in cascade order — layers, reset, theme root, style
  modules, utilities.
- `styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `styles/theme-root.css.ts`: base typography and text colour scoped to `.luke-ui-theme`.
- `styles/modules.css.ts`: the committed stylesheet registry. It explicitly imports every colocated
  `recipe.css.ts` and `styles.css.ts` that participates in the shipped stylesheet, plus primitive
  and overlay style modules. Keep the list in code-point order by path for deterministic output.
  Named layers make cross-layer priority explicit. Specificity and source order still matter within
  a layer.
- `styles/recipe.ts`: the internal `recipe()` engine shared by every component recipe, plus the
  `RecipeSelection<typeof recipeFn>` helper that derives a recipe's variant type.
- `styles/input-states.ts`: the shared field control-state selectors (`composeInputStateSelectors`,
  `descendantDisabledSelector`) that field recipes compose. It is named `.ts`, not `.css.ts`,
  because it emits no CSS. Each field recipe's `.css.ts` module composes its plain data and
  functions.
- `styles/invalid-indicator.ts`: the shared invalid-state `exclamationTriangle` icon, rendered as a
  CSS mask in two sizes. `invalidIndicatorIcon` (plus `invalidIndicatorIconForcedColors`) is the
  in-control icon `primitives/combobox/styles.css.ts` applies under its own invalid selector's
  `::after` — the border stays at its resting 1px there, since the icon is already the non-colour
  cue. It renders as the pseudo-element's own last DOM child, so the style gives its trailing
  affordances (the combobox clear button and trigger) a flex `order` ahead of the icon's default
  `order: 0`, so it lands right after the field's text content and before them, matching the
  Spectrum reference this ordering is drawn from. `invalidMessageIcon` is the smaller,
  message-leading variant `primitives/field/recipe.css.ts` draws on its `message` slot, switched on
  by `primitives/checkbox/recipe.css.ts` alone: `Checkbox`'s own box has no room for an in-control
  icon without floating past the label, so its icon moves to the message and its box keeps a `2px`
  border as its own non-colour cue instead. Named `.ts` for the same reason as `input-states.ts`: it
  emits no CSS of its own, only plain style-rule data each recipe composes.
- `primitives/input-group/recipe.css.ts` draws the same glyph, but as a real `Icon` element on its
  own `invalidIndicator` slot rather than a mask: `InputGroup` (`primitives/input-group/`) reads
  React Aria's `Group` `isInvalid` render prop and renders the icon itself, so an invalid control
  cannot be composed without a non-colour cue. The recipe owns only the icon's colour and margins —
  `Icon` owns its box, and `IconSizeProvider` (`FIELD_CONTROL_ICON_SIZE`) owns its per-size step —
  and gives the `suffix` slot the same `order: 1` for the same Spectrum ordering. Combobox's control
  is not a plain `Group` with that state to hand, so it stays CSS-driven.
- `overlays/mobile-overlay.css.ts`: the backdrop, tray, and dialog styles `MobileOverlay` renders
  for the mobile combobox tray, based on Apache-2.0 React Spectrum's `Tray.tsx` and
  `tray/index.css`.
- `overlays/`: the private mobile tray plumbing. `mobile-overlay.tsx` wraps React Aria's
  `ModalOverlay`, `Modal`, and `Dialog` for the combobox tray. `use-is-mobile-device.ts` reads the
  device screen width, not the viewport width, to decide when a combobox switches to it.
- `styles/`: layout utilities, most exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the semantic token tree, the mode-family declaration, `--luke-*` variable
  naming, and the source-owned `typeStyles` typography keys.
- `theme/path-record.ts`: the typed `[path, value]` record constructor value producers use so
  `Object.fromEntries` cannot hide a missing contract path.
- `theme/contract.css.ts`: the typed `vars` contract, built by walking the semantic token tree
  directly so it stays source-owned and free of styling-engine types.
- `theme/define-theme.ts`: the public `defineTheme(input)` authoring util, its typed `ThemeInput`,
  and the one resolution of curated defaults (source colours, materials, radius, backdrop) into the
  internal foundation.
- `theme/foundation.ts`: the internal typed theme-foundation shape `defineTheme` normalises into,
  with generator source colours as OKLCH and CSS-text values such as backdrop as strings, plus the
  curated colour, radius, and typography defaults.
- `theme/color.ts`: OKLCH colour math, sRGB gamut mapping, and WCAG contrast.
- `theme/contrast-policy.ts`: the WCAG ratios, solver headroom and search step, and the canonical
  semantic role list the generator, the compiler's validation matrix, and the semantic map all read.
- `theme/lightness-candidates.ts`: the shared lightness grid the accent pre-conditioner,
  solid-anchor search, and control-border solver walk.
- `theme/scale.ts`: the private 12-step family generator (`generateFamily`), including the
  constrained step-9 solid-anchor search and `passesOnSolidGate`. Semantic consumers read named
  rungs via `FAMILY_RUNG`. See [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for
  interaction-state generation.
- `theme/motion.ts`: the private ordinal duration scale (`MOTION_DURATION_SCALE`) behind the public
  `motion.duration` roles in `token-values.ts`. It is resolved in TypeScript and never emitted, so
  no `--luke-motion-duration-*` custom property exists.
- `theme/breakpoints.ts`: the private responsive breakpoint widths, in pixels. Like `motion.ts`, it
  is a plain module with no Vanilla Extract import, resolved in TypeScript and never emitted as a
  custom property, because a media query cannot read one. The styling utilities turn the widths into
  media queries, and `useIsMobileDevice` reads the same values for its mobile threshold.
- `theme/elevation.ts`: the mode-aware elevation surface generator (`generateSurfaces`), where
  `surfaces.canvas` is always exactly the resolved `background`.
- `theme/semantic-map.ts`: the one default mapping (`mapSemanticColors`) from generated families and
  surfaces onto the colour contract's leaves, including generated hover and pressed states.
- `theme/diagnostics.ts`: the `compileTheme` diagnostics data model (family, surface, solid-anchor,
  and contrast-check detail) consumed by the "Theme/Diagnostics" Storybook story.
- `theme/token-board.tsx`: the contract-driven "Theme/Token board" Storybook story, which renders
  every contract leaf for the active theme and colour mode.
- `theme/build-theme.ts`: the internal `compileTheme(foundation) → { css, diagnostics }` value
  pipeline, `buildTheme`, and contrast validation.
- `theme/theme-class-name.ts`: `getThemeClassName(name)`, the one home for the identity class and
  its kebab-case rule, exported from `@luke-ui/react/theme`. It imports nothing, so importing a
  class never drags in the compiler or a foundation.
- `theme/foundations/tactile.ts` and `theme/foundations/paper.ts`: each bundled theme's
  `defineTheme(...)` input, kept as separate leaf modules so importing one never pulls in the other.
- `themes/tactile/` and `themes/paper/`: each theme's public entrypoint, exported from
  `@luke-ui/react/themes/tactile` and `@luke-ui/react/themes/paper`. Each exports its own
  `themeClassName` identity class and its `theme` (the public `ThemeInput` a consumer can read,
  copy, or spread). The class comes from a per-theme `theme-class-name.ts` leaf holding the name as
  a literal, so importing the class alone leaves the foundation out of a consumer's bundle.
  `themes/theme-bundle.test.ts` proves that with a real bundler run.
- `scripts/build-themes.ts`: writes the bundled theme stylesheets to
  `dist/themes/<name>/stylesheet.css`, alongside the entrypoint `vp pack` emits there.

## Themes

`defineTheme(input)` from `@luke-ui/react/theme` is the sole public theme-authoring surface. It
normalises a small, curated `ThemeInput` — a required `color.accent`, an optional neutral character,
and optional materials — into static stylesheet text. It is pure and Node-compatible. It generates
the full semantic contract in OKLCH and throws a `ThemeContrastError` naming each failing mode and
token pair when a generated pair misses WCAG 2.2 AA contrast. A single-value accent or neutral is
adapted per mode through a lightness search. It throws when no lightness in the vibrant band is
accessible. The raw `ThemeFoundation` object and `buildTheme` are internal only.

Every colour token is generated from a private 12-step scale per role (neutral, accent, info,
success, warning, danger) plus a mode-aware elevation surface set, then mapped onto the public
colour contract. Every role gets the same background, foreground, on-solid, and border slots. See
[THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for the pipeline, the border and accent
contrast policies, and what changed when this generator replaced the original per-token solver.

The semantic contract includes `font.caption` through `font.display` type styles. Each style groups
its font family, size, weight, line height, letter spacing, and per-font Capsize trims so components
cannot combine unrelated values. `font.family.body` is selected from the curated Inter, Apple
System, or DM Sans metrics and `buildTheme` computes the matching trims. `font.family.code` is a
fixed neutral monospace stack for code and keyboard input. It is not a brand-family or Capsize
choice. Icon sizes carry forward the `xsmall`, `small`, `medium`, and `large` scale at 16px, 20px,
24px, and 32px.

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

The bundled themes ship precompiled. Import `@luke-ui/react/themes/tactile/stylesheet.css` or
`@luke-ui/react/themes/paper/stylesheet.css` alone to theme the whole document from `:root`, with no
class applied anywhere. Each stylesheet pairs a `:where(:root)` fallback with its own
`.luke-ui-theme-<name>` identity class, so importing one theme never pulls in the other.

Apply the theme's `themeClassName`, from `@luke-ui/react/themes/tactile` or
`@luke-ui/react/themes/paper`, only when a document needs more than one theme active at once, for
example a marketing page next to an app shell. Scope it to `<html>` or a subtree root alongside the
matching stylesheet. An authored theme reaches the same class through `getThemeClassName(name)` from
`@luke-ui/react/theme`, so a `defineTheme` theme is applied by exactly the mechanism a bundled one
is.

Without `data-color-mode`, a themed subtree follows `prefers-color-scheme`. Setting
`data-color-mode="light"` or `data-color-mode="dark"` on the theme root, an ancestor, or any element
inside the subtree forces that mode, and nested scopes can override it. Every scope also sets native
`color-scheme` so form controls and scrollbars agree.

Components move to the semantic contract in the component-family migration slices.

Luke UI's portalled Combobox popover inherits the document's theme. It carries no theme identity or
colour mode propagation logic of its own, because a loaded theme stylesheet already themes the whole
document from `:root`. A colour mode scoped to a nested element below `<html>` does not reach a
body-level portal. Set `data-color-mode` on `<html>` itself when a portalled surface must follow an
explicit mode.

## Cascade layers

All styles live in named CSS cascade layers. Layer order makes cross-layer priority explicit.
Specificity and source order still decide conflicts within a layer.

| Layer       | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `reset`     | Browser defaults, box sizing, and margins.          |
| `theme`     | Design token custom properties and base typography. |
| `recipes`   | Component styles, variants, and compound variants.  |
| `utilities` | One-off layout and override escape hatches.         |

Use `styleInLayer` and `globalStyleInLayer` from `styles/layered-style.css.ts` to place a plain
Vanilla Extract style for a recipe with no variants in a named layer (see
`loading-skeleton/styles.css.ts`). A variant-driven recipe instead calls `recipe()` from
`styles/recipe.ts`, which wraps every base, variant, and compound-variant style it is given in the
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
`loading-skeleton/styles.css.ts` for an example.

## Recipes

Public recipes export from the component or primitive entrypoint that owns the styling contract, for
example `buttonRecipe` from `@luke-ui/react/button` or `inputGroupRecipe` from
`@luke-ui/react/primitives/input-group`. The hosted Styling page documents when a developer imports
one, the `buttonRecipe` / `ButtonRecipeVariants` names, and single-part versus slotted calls.

Recipes are component-specific. Keep them separate from general layout utilities.

Colocate recipe files beside their owner:

- `recipe.css.ts` — public recipe contract
- `styles.css.ts` — private implementation styling

Every recipe is built with the internal `recipe()` engine from `styles/recipe.ts`. It is not part of
the public package entry. Component authors inside `@luke-ui/react` use it to define a new recipe.
Consumers call the built recipe functions it returns (`buttonRecipe`, `textRecipe`, and so on).
`recipe()` wraps every base, variant, and compound-variant style it is given in the `recipes`
cascade layer itself, so a recipe author does not add layering by hand.

### Single-part recipes

A single-part recipe takes `base`, `variants`, `defaultVariants`, and `compoundVariants`, and
returns a function that takes a variant selection and returns one class string:

```ts
export const buttonRecipe = recipe({
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

See `primitives/button/recipe.css.ts` for the full recipe this abbreviates.

### Slotted recipes

A recipe whose component has multiple styled parts takes `slots` instead of `base`. Each variant
value maps to per-slot styles, and the built recipe takes a variant selection and returns one
function per slot, each accepting an optional extra class to merge:

```tsx
export const fieldRecipe = recipe({
	slots: { label: {}, message: {}, root: {} },
	variants: { tone: { description: { message: {} } } },
} as const satisfies SlottedConfigInput);

const { label, message, root } = fieldRecipe({ tone: 'description' });
<div className={root()}>
	<label className={label()}>Email</label>
	<p className={message(extraClassName)}>We will send your receipt here.</p>
</div>;
```

See `primitives/field/recipe.css.ts` for a complete public slotted recipe. Apply
`as const satisfies SlottedConfigInput` at the definition site: `as const` preserves the literal
slot names and variant values `recipe()` infers, and `satisfies` type-checks every slot and variant
style against `StyleRule` where it is written.

Compound variants are single-part only: `buttonRecipe` and `textRecipe` both use `compoundVariants`
on their single-part config. A slotted config has no `compoundVariants` field.

### Deriving variant types

Never hand-maintain a recipe's variant type. Derive it from the built recipe with
`RecipeSelection<typeof recipeFn>`:

```ts
export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;
```

Do not cast a hand-written variant interface onto a recipe's selection parameter. If the exported
type and the recipe definition can drift, something is wrong with how the type was produced, not
with the recipe.

### Shared input-state selectors

`InputGroup` and Combobox styling (`primitives/input-group/recipe.css.ts`,
`primitives/combobox/styles.css.ts`) share one definition of what "hovered", "focused", "disabled",
"invalid", and "read-only" mean for a control, from `styles/input-states.ts`:

```ts
import { composeInputStateSelectors, descendantDisabledSelector } from './input-states.js';

const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors();
```

`composeInputStateSelectors` owns the shared attribute and pseudo-class matrix, then returns the
mutually exclusive selectors a recipe applies to its styles (for example, `hover` deliberately
excludes an element that is also focused or read-only). Both field recipes use these definitions
unchanged. Control-specific selectors stay in the TextField and Combobox recipes.

Resist widening a state to probe descendants with `:has()`. React Aria publishes `isDisabled` and
`isInvalid` through `GroupContext`, so a control group already carries `data-disabled` and
`data-invalid`. Probing cannot distinguish a control that is disabled from one that merely contains
a disabled button. `descendantDisabledSelector` styles a part (a prefix, suffix, or trigger) when an
ancestor control is disabled.

## Styling utilities

Styling utilities are public and exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

Luke UI uses Rainbow Sprinkles for this API. Rainbow Sprinkles emits dynamic CSS custom properties
at runtime instead of generating a static class for every token and value pair. That keeps the CSS
bundle smaller as the token scale grows.

The tradeoff is that some values are applied through inline `style`, which raises specificity. That
is acceptable because styling utilities are already the highest-priority escape hatch.

`Box` from `@luke-ui/react/box` applies these utilities. See the
[Box documentation](/components/layout/box) for its element and render contracts.

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
	flexDirection: { initial: 'column', medium: 'row' },
	gap: { initial: '300', medium: '600' },
});
```

The retained breakpoints are `initial` (base), `small` (640px), `medium` (768px), `large` (1024px),
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
