# Styling

## Setup

Luke UI ships one static stylesheet for its reset, theme root, component styles, and utilities.
Consumers import `@luke-ui/react/stylesheet.css` and apply `rootClassName` from
`@luke-ui/react/theme` to `<body>`, `<main>`, or an app shell. Import one bundled theme stylesheet,
for example `@luke-ui/react/themes/tactile/stylesheet.css`. That alone themes the whole document
from `:root`, with no class and no JS required. Neither step injects styles at runtime.

The package build also extracts StyleX and appends those rules to `dist/stylesheet.css`. StyleX
rules live in generated `recipes.priorityN` cascade layers, nested inside `recipes`, between `base`
and `utilities`. Public visual components author StyleX recipes. `LoadingSkeleton`'s forced surface
and descendant masks, Prose descendant rhythm, and Combobox adjacent-section borders are retained
Vanilla Extract rules written DIRECTLY into `recipes` (not a numbered sublayer) — a direct
parent-layer rule beats a nested sublayer for normal declarations, which is what lets this retained
CSS reliably override generated recipe output. `Box` and Rainbow Sprinkles utilities stay on Vanilla
Extract.

## Structure

Paths below are rooted in `packages/@luke-ui/react/src/`. Core style, primitive, overlay, and
utility modules live under `core/`. Theme modules live under `theme/`.

- `core/styles/index.css.ts`: stylesheet graph in cascade order — layers, reset, theme root, style
  modules, utilities.
- `core/styles/reset.css.ts`: reset scoped to `.luke-ui-reset`.
- `core/styles/theme-root.css.ts`: base typography and text colour scoped to `.luke-ui-theme`.
- `core/styles/modules.css.ts`: the committed stylesheet registry. It explicitly imports every
  colocated Vanilla Extract `styles.css.ts` that participates in the shipped stylesheet (Prose and
  LoadingSkeleton component rules). Keep the list in code-point order by path for deterministic
  output. Named layers make cross-layer priority explicit. Specificity and source order still matter
  within a layer. StyleX component styles are extracted by the StyleX Vite plugin, not this
  registry.
- `core/styles/stylex-recipe.ts`: the internal StyleX recipe engine, in two stages.
  `createRecipeStyles` / `createSlottedRecipeStyles` build the canonical resolver (selection in,
  ordered compiled styles out). `createRecipe` / `createSlottedRecipe` adapt a resolver into the
  public recipe, which returns full `stylex.props(...)` output rather than a class string.
  `RecipeSelection<typeof resolveFn>` and `SlotRecipeSelection<typeof resolveSlotFn>` derive a
  recipe's variant type from its resolver.
- `core/primitives/input-group/recipe.ts` draws the invalid glyph as a real `Icon` element on its
  own `invalidIndicator` slot rather than a mask: `InputGroup` (`core/primitives/input-group/`)
  reads React Aria's `Group` `isInvalid` render prop and renders the icon itself, so an invalid
  control cannot be composed without a non-colour cue. The recipe owns only the icon's colour and
  margins — `Icon` owns its box, and `IconSizeProvider` (`FIELD_CONTROL_ICON_SIZE`) owns its
  per-size step — and gives the `suffix` slot the same `order: 1` for the same Spectrum ordering.
  Combobox's control is not a plain `Group` with that state to hand, so its invalid icon stays
  CSS-driven on `inputGroup`'s `::after`.
- `core/overlays/mobile-overlay.tsx`: the backdrop, tray, and dialog styles `MobileOverlay` renders
  for the mobile combobox tray, based on Apache-2.0 React Spectrum's `Tray.tsx` and
  `tray/index.css`. The tray keeps a documented physical `top`/`bottom` pair so StyleX does not
  break an intended over-constraint.
- `core/overlays/`: the private mobile tray plumbing. `mobile-overlay.tsx` wraps React Aria's
  `ModalOverlay`, `Modal`, and `Dialog` for the combobox tray. `use-is-mobile-device.ts` reads the
  device screen width, not the viewport width, to decide when a combobox switches to it.
- `core/styles/`: layout utilities, most exported from `@luke-ui/react/styles`.
- `theme/contract.ts`: the theme token tree, the mode-family declaration, `--luke-*` variable
  naming, and the source-owned `typeStyles` typography keys.
- `theme/path-record.ts`: the typed `[path, value]` record constructor value producers use so
  `Object.fromEntries` cannot hide a missing contract path.
- `theme/tokens.stylex.ts`: the generated, typed `vars` contract.
  `scripts/generate-stylex-tokens.ts` walks the theme token tree to build a nested
  `stylex.unstable_defineConstsNested` object literal, so it stays source-owned and matches
  `themeContractTree`'s shape exactly. StyleX recipes, the remaining Vanilla Extract styles, and the
  public `@luke-ui/react/theme` export all read this one `vars`.
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
- `theme/breakpoints.ts`: the private responsive breakpoint inline sizes, in pixels. Like
  `motion.ts`, it is a plain module with no Vanilla Extract import, resolved in TypeScript and never
  emitted as a custom property, because a container query cannot read one. The styling utilities
  turn the inline sizes into container queries, and `useIsMobileDevice` reads the same values for
  its mobile threshold.
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
- `theme/bundles/tactile/` and `theme/bundles/paper/`: each theme's public entrypoint, exported from
  `@luke-ui/react/themes/tactile` and `@luke-ui/react/themes/paper`. Each exports its own
  `themeClassName` identity class and its `theme` (the public `ThemeInput` a consumer can read,
  copy, or spread). The class comes from a per-theme `theme-class-name.ts` leaf holding the name as
  a literal, so importing the class alone leaves the foundation out of a consumer's bundle.
  `theme/bundles/theme-bundle.test.ts` proves that with a real bundler run.
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

Luke UI's portalled Combobox popover inherits the document's theme. It carries no theme identity or
colour mode propagation logic of its own, because a loaded theme stylesheet already themes the whole
document from `:root`. A colour mode scoped to a nested element below `<html>` does not reach a
body-level portal. Set `data-color-mode` on `<html>` itself when a portalled surface must follow an
explicit mode.

## Cascade layers

All styles live in named CSS cascade layers. Layer order makes cross-layer priority explicit.
Specificity and source order still decide conflicts within a layer.

| Layer       | Purpose                                                                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reset`     | Browser defaults, box sizing, and margins.                                                                                                                                                                           |
| `theme`     | Design token custom properties and base typography.                                                                                                                                                                  |
| `base`      | Application element defaults, below the recipe layers.                                                                                                                                                               |
| `recipes`   | Component styles: StyleX atoms nested in `recipes.priorityN` sublayers, plus retained descendant rhythm, forced-surface masking, and combinator selectors written DIRECTLY into `recipes` (not a numbered sublayer). |
| `overrides` | Consumer `xstyle` values, compiled by `@luke-ui/vite`. Absent for a consumer that does not author `xstyle`.                                                                                                          |
| `utilities` | One-off layout and override escape hatches.                                                                                                                                                                          |

Layer names describe purpose, not package ownership, so a consumer declares the same set. The public
`dist/stylesheet.css` starts with one combined `@layer` order statement that lists every layer
before any rules create them. StyleX priority layers use dotted nested names such as
`recipes.priority1`, nested inside the `recipes` parent layer. A consumer declares only the stable
`recipes` parent layer, never the priority count.

A direct `@layer recipes { ... }` rule beats a nested `recipes.priorityN` sublayer rule for a normal
declaration — that is what lets the retained CSS described above reliably override generated StyleX
recipe output without needing a layer of its own above `recipes`. That relationship REVERSES for
`!important`: a nested sublayer's `!important` declaration beats its direct parent layer's
`!important` declaration. Consequently a `recipes.priorityN` sublayer must never emit `!important` —
`stylesheet-contract.test.ts` guards this by parsing the compiled stylesheet — because such a
declaration would rank above both the direct-`recipes` retained CSS and a consumer's
`overrides`-layer `!important` override, silently inverting the whole cascade contract.
`LoadingSkeleton`'s forced surface is the component that needed a `!important` override strong
enough to beat arbitrary wrapped content, which is why it lives in retained CSS rather than
`stylex.create` — see `core/loading-skeleton/styles.css.ts`.

### The `xstyle` layer contract

The public `xstyle` prop only overrides a same-property recipe/variant atom reliably. Whether it
also loses to a consumer `className` is a cascade-layer question, not a resolution-order question,
and it depends entirely on how consumer StyleX is compiled.

`@luke-ui/vite` owns that compilation for Vite applications. Consumers install `@luke-ui/vite`, add
`lukeUi()` to their Vite config, and import `@luke-ui/vite/stylesheet.css` before the Luke UI
stylesheet. The hosted Installation and Styling guides document only that public API. They do not
contain a copy-paste plugin, Babel configuration, or virtual-module details.

Internally `@luke-ui/vite`:

- Declares the combined layer order `@layer reset, theme, base, recipes, overrides, utilities;` in
  the public stylesheet subpath, so `overrides` — the layer compiled `xstyle` values land in — is
  positioned before Luke UI's shipped stylesheet mentions `utilities`.
- Compiles application StyleX with `useLayers: { before, after, prefix: 'overrides' }`, which is the
  only StyleX layer form that emits a dedicated sibling `overrides` layer. Boolean `useLayers` /
  `useCSSLayers` emits bare `priorityN` layers and cannot satisfy this contract — that is why the
  package exists instead of pointing consumers at `@stylexjs/unplugin` or
  `@stylexjs/postcss-plugin`.
- In development, scans application source before the first stylesheet load so the CSS is complete
  without waiting for Vite to transform every StyleX module, and invalidates the stylesheet on
  StyleX-eligible HMR updates.
- In production, uses a placeholder during `load` and substitutes the collected CSS in
  `generateBundle`, because Rollup loads the stylesheet before the rest of the module graph is
  traversed.

Measured ground truth that motivates this design (verified with `@stylexjs/babel-plugin`'s
`processStylexRules` and Chromium in `packed-consumer.test.ts`):

- StyleX's default output is unlayered. An unlayered rule beats every layered rule, so unlayered
  `xstyle` would beat a layered consumer `className`.
- Nesting consumer StyleX under the `recipes` parent layer is import-order dependent against Luke
  UI's own `recipes.priorityN` atoms. Do not rely on it.
- A dedicated sibling `overrides` layer between `recipes` and `utilities` is the order-independent
  configuration that matches the published precedence.

`@stylexjs/stylex` is a `dependency` of `@luke-ui/react` because `stylex.props` runs at runtime.
Consumers who author `xstyle` must still declare `@stylexjs/stylex` themselves: pnpm isolates
dependencies, so an application cannot resolve Luke UI's transitive copy. `@luke-ui/vite` owns
`@babel/core` and `@stylexjs/babel-plugin` so consumers do not install those.
`packed-consumer.test.ts` covers the isolation regression. Real Vite build/dev coverage for the
public plugin lives in `@luke-ui/vite`. `xstyle.browser.test.tsx` covers only the
in-repo/dev-compiled path (compiled by this package's `createStylexDevPlugin` into `recipes.*`) and
does not by itself prove the public consumer contract.

`src/theme/tokens.stylex.ts` exports the one `vars` token interface, generated from
`themeContractTree` with `stylex.unstable_defineConstsNested`. Its nested shape mirrors the contract
tree exactly, for example `vars.color.background.danger.solid.hover`, and each leaf is a live
`var(--luke-*)` reference. StyleX recipes import it directly. `src/theme/index.ts` re-exports the
same `vars` as the public `@luke-ui/react/theme` token surface.

This is one surface, not two: the StyleX const surface produces `vars` directly rather than a second
object mirroring it.

Use `globalStyleInLayer` from `core/styles/layered-style.css.ts` to place a plain Vanilla Extract
global rule directly in the `recipes` layer (never a numbered sublayer — see "Cascade layers"
above). Structural combinators such as Combobox's adjacent-section border live here, not in StyleX:
StyleX cannot express a `+` sibling rule, so `components.css.ts` interpolates the private
`data-luke-combobox-section` attribute from `primitives/combobox/section-scope.ts`. That marker is
an implementation detail, not a public styling hook.

`Text` authors camelCase `marginBlockStart` and `marginBlockEnd` for its Capsize pseudo-element
margins. StyleX canonicalises these to `margin-top` and `margin-bottom`, which is equivalent under
the horizontal writing modes Luke UI supports.

Overrides that should beat component styles belong in the `utilities` layer. Use `!important` only
when a style must also beat consumer un-layered styles or inline styles. Layers cannot beat those.

`LoadingSkeleton` uses `!important` in retained CSS written directly into the `recipes` layer (never
inside a `recipes.priorityN` sublayer — see "Cascade layers" above) because it must force
placeholder styles onto arbitrary wrapped children. Moving `!important` to a lower layer does not
weaken the mask — in the `!important` cascade, lower layers win over higher layers. Direct `recipes`
sits below `utilities`, so a `utilities`-layer `!important` override from a consumer cannot beat the
skeleton. But it must stay OUT of a `recipes.priorityN` sublayer, because a nested sublayer's
`!important` would rank above direct `recipes` — the opposite of what normal declarations do.

Reduced-motion handling belongs near the animation. The global `prefers-reduced-motion` rule lives
in the `reset` layer, so it cannot disable animations declared in StyleX or `utilities`. Animated
components should add their own `@media (prefers-reduced-motion: reduce)` override. See
`loading-skeleton/styles.css.ts` for an example.

## Recipes

Public recipes export from the component or primitive entrypoint that owns the styling contract, for
example `buttonRecipe` from `@luke-ui/react/button` or `inputGroupRecipe` from
`@luke-ui/react/primitives/input-group`. The hosted Styling page documents when a developer imports
one, the `buttonRecipe` / `ButtonRecipeVariants` names, and single-part versus slotted calls.

Recipes are component-specific. Keep them separate from general layout utilities.

Colocate recipe files beside their owner:

- `recipe.ts` — StyleX public recipe contract
- `styles.css.ts` — private Vanilla Extract structural styling when a combinator or descendant
  selector cannot live in StyleX

Every public recipe is built with `createRecipeStyles` + `createRecipe` (single-part) or
`createSlottedRecipeStyles` + `createSlottedRecipe` (slotted), all from
`core/styles/stylex-recipe.ts`. It is not part of the public package entry. Component authors inside
`@luke-ui/react` use it to define a new recipe. Consumers call the built recipe functions it returns
(`buttonRecipe`, `textRecipe`, and so on). `comboboxRecipe` is private: it is not exported from
`@luke-ui/react/primitives/combobox`.

### Single-part recipes

A single-part recipe takes `base`, `variants`, `defaultVariants`, and `compoundVariants`. The built
recipe takes a variant selection and returns the full `stylex.props(...)` output — spreadable
element props, not a class string. See `core/primitives/button/recipe.ts` for the StyleX expansion.

### Slotted recipes

A recipe whose component has multiple styled parts takes `slots` instead of `base`. Each variant
value maps to per-slot styles, and the built recipe takes a variant selection and returns one
`stylex.props(...)` result per slot — spreadable element props, not a function that returns a class:

```tsx
const { group, control } = inputGroupRecipe({ size: 'medium' });
<div {...group}>
	<input {...control} />
</div>;
```

See `core/primitives/checkbox/recipe.ts`, `core/primitives/field/recipe.ts`, or the private
`core/primitives/combobox/recipe.ts` for StyleX slotted recipes.

Compound variants are single-part only: `buttonRecipe` and `textRecipe` use `compoundVariants` on
their single-part config. A slotted config has no `compoundVariants` field.

### Deriving variant types

Never hand-maintain a recipe's variant type. Derive it from the resolver, not the public recipe
function: `RecipeSelection<typeof resolveFn>` for single-part,
`SlotRecipeSelection<typeof resolveSlotFn>` for slotted. A single structural helper cannot cover
both shapes — a slotted resolver's selection is its second parameter, after the slot name, so it
needs its own helper:

```ts
export type ButtonRecipeVariants = RecipeSelection<typeof resolveButtonRecipeStyles>;
export type InputGroupRecipeVariants = SlotRecipeSelection<
	typeof resolveInputGroupRecipeSlotStyles
>;
```

Do not cast a hand-written variant interface onto a recipe's selection parameter. If the exported
type and the recipe definition can drift, something is wrong with how the type was produced, not
with the recipe.

### StyleX recipes

A migrated component uses `createRecipeStyles` + `createRecipe` (single-part) or
`createSlottedRecipeStyles` + `createSlottedRecipe` (slotted) from `core/styles/stylex-recipe.ts`.
Its public contract is a full `stylex.props(...)` result — single-part
`(selection?) => ReturnType<typeof stylex.props>`, slotted
`(selection?) => Record<Slot, ReturnType<typeof stylex.props>>` — spreadable element props in both
cases, never a class string or a function that returns one. Variant types derive from the resolver,
not the public recipe function (see "Deriving variant types" above). The caller performs its own
`stylex.create(...)` call, because `stylex.create` requires every key and value to be statically
extractable. Write out each variant and compound-variant style as a literal `stylex.create` key
instead. See `core/text/recipe.ts` for the full expansion this produces. A recipe file is named
`recipe.ts`, not `recipe.css.ts` (Vanilla Extract's `.css.ts` naming is wrong for a StyleX module
and would be picked up by the VE plugin).

### `xstyle`

Every StyleX-migrated component accepts an `xstyle` prop: an escape hatch for styling a CSS property
the component's own props do not expose, typed `XStyleProp` and resolved with `resolveXStyleProps`
(both from `core/styles/xstyle.ts`). Pass one or more compiled `stylex.create(...)` style objects,
the same way `stylex.props` itself accepts them:

```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({ emphasis: { outlineStyle: 'dashed' } });

<Text xstyle={styles.emphasis}>Custom outline</Text>;
```

A component resolves styles in this order: internal defaults, then its own variant props, then
`xstyle`, then a consumer `className`, then inline `style`. Internal styles and `xstyle` are folded
through one `stylex.props` call, so `xstyle` reliably replaces a same-property component atom. That
part of the contract is guaranteed by resolution order alone.

The `xstyle < className` step is not — it is a cascade-layer guarantee, and only holds when `xstyle`
is compiled into the dedicated `overrides` layer. `@luke-ui/vite` does that for Vite consumers. See
"The `xstyle` layer contract" under [Cascade layers](#cascade-layers). For normal declarations,
inline `style` wins over class-based styling because it sits outside the layered cascade. An author
`!important` declaration can override a normal inline style.

### Shared input-state selectors

Field control recipes expand competing ancestor and state conditions into mutually exclusive nested
selector literals inside `stylex.create`. `InputGroup` and `Combobox` share that matrix (hovered,
focused, disabled, invalid, read-only). Combobox additionally gates the well ring on
`:has(input:focus)` so inner actions do not paint a second ring. `Checkbox`'s indicator recipe does
the same for ancestor `data-*` conditions on its clickable content (`:is([data-disabled="true"] *)`
and mutually exclusive selected / hover / pressed / invalid combinations). Control-specific
selectors stay in each recipe.

Resist widening a state to probe descendants with `:has()`. React Aria publishes `isDisabled` and
`isInvalid` through `GroupContext`, so a control group already carries `data-disabled` and
`data-invalid`. Probing cannot distinguish a control that is disabled from one that merely contains
a disabled button. Prefix, suffix, and trigger parts style themselves as descendants of a disabled
ancestor with `:is([data-disabled="true"] *, [aria-disabled="true"] *)`.

## Styling utilities

Styling utilities are public and exported from `@luke-ui/react/styles`. They provide token-aware,
type-safe layout helpers for cases where component props are too narrow.

Luke UI uses Rainbow Sprinkles for this API. Rainbow Sprinkles emits dynamic CSS custom properties
at runtime instead of generating a static class for every token and value pair. That keeps the CSS
bundle smaller as the token scale grows.

The tradeoff is that some values are applied through inline `style`, which raises specificity. That
is acceptable because styling utilities are already the highest-priority escape hatch.

`Box` from `@luke-ui/react/box` applies these utilities. See the
[Box documentation](/components/layout/box) for its element and render contracts. Its utilities
cover layout (flex, grid, spacing, sizing, position) and appearance (`backgroundColor`,
`borderColor`, `borderWidth`, `borderStyle`, `borderRadius`, `boxShadow`). Use `Box` as the escape
hatch for both. It deliberately excludes typography and text colour. Use `Text`/`Heading` for those.

Do not add style props to every other component. Component props should stay focused on
component-specific variants and behaviour. Reach for `Box` when a component's own props are too
narrow instead of growing an ad-hoc style prop on that component.

## `createSprinkles()`

`createSprinkles(props)` returns `{ className, style }`. Spread both onto the element.

```tsx
import { createSprinkles } from '@luke-ui/react/styles';

const layout = createSprinkles({
	display: 'flex',
	gap: 'sp16',
	padding: 'sp24',
});

return (
	<div className={layout.className} style={layout.style}>
		...
	</div>
);
```

Spacing and gap properties use `0` or value-based keys such as `sp16` and `sp24`. Each key matches
its pixel value, so `sp16` is 16px. Margin also accepts `auto`. Enum-like properties use CSS-native
values, for example `display: 'flex'`. Sizing, inset, flex-basis, order, and grid-placement values
accept their CSS property values.

## Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints, so
only overrides need to be specified.

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { initial: 'column', bp768: 'row' },
	gap: { initial: 'sp12', bp768: 'sp24' },
});
```

The retained breakpoints are `initial` (base), `bp640` (640px), `bp768` (768px), `bp1024` (1024px),
`bp1280` (1280px), and `bp1536` (1536px).

## React Aria `render` prop

When you need to style the underlying DOM element directly, combine `createSprinkles` with React
Aria Components' `render` prop. Use `mergeProps` from `@luke-ui/react/utils` so `className` and
`style` are merged correctly.

```tsx
import { mergeProps } from '@luke-ui/react/utils';

const buttonBox = createSprinkles({ padding: 'sp16' });

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

## Writing mode support

Luke UI supports `direction: ltr` and `direction: rtl` under `writing-mode: horizontal-tb`. It does
not support vertical or sideways writing modes.

## Implementation rules

- Author CSS logical properties with camelCase StyleX keys, such as `marginInlineStart`,
  `blockSize`, and `insetInline`, whenever the intended meaning is flow-relative.
- Use a physical property only when the meaning is genuinely physical, such as the `top` and
  `bottom` pinning in `MobileOverlay`, and comment the exception at the call site.
- Do not author quoted kebab-case property keys in `stylex.create`. StyleX treats them as unknown
  keys. They bypass unsupported-shorthand checks and do not compose with the equivalent camelCase
  key as one property. Quoted keys remain correct for selectors, at-rules, keyframe selectors and
  custom properties.
- StyleX canonicalises some bidi-insensitive logical properties to physical CSS, such as
  `inlineSize` to `width` and `marginBlockStart` to `margin-top`. This is expected: Luke UI supports
  horizontal writing modes. Direction-sensitive declarations must stay logical in the emitted CSS.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
