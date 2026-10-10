# Styling

How styling works in `@luke-ui/react`, for contributors who maintain it. Public usage docs live in
the docs app MDX.

Luke UI uses Vanilla Extract for styling. Public component APIs, utility props, cascade layers, and
token custom properties are the stable contracts. Vanilla Extract types are not part of the
published TypeScript surface.

## Setup

Luke UI ships one static stylesheet for its global styles, colour-mode scopes, root containment,
recipes, and utilities. Themes ship separately.

1. Import `@luke-ui/react/stylesheet.css`.
2. Import one theme stylesheet, for example `@luke-ui/theme-tactile/stylesheet.css`, or a stylesheet
   compiled with `defineTheme`.
3. Set the theme's identity class on `<html>`.

There is no root class. None of these steps inject styles at runtime.

## Structure

Paths below are relative to `packages/@luke-ui/react/src/`.

| Area                                          | Role                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `core/styles/`                                | Stylesheet graph, layers, global styles, recipe engine, modules registry, utilities, and shared helpers that emit no CSS on their own |
| Component and primitive folders under `core/` | Colocate `recipe.css.ts` (public) and `styles.css.ts` (private) beside the owner                                                      |
| `theme/`                                      | Token contract, `defineTheme`, foundations, validation, and the build pipeline. `__fixtures__/` holds the visual suite's theme inputs |

Stable entry points:

- Stylesheet graph: `core/styles/index.css.ts`
- Modules registry: `core/styles/modules.css.ts`
- Recipe engine: `core/styles/recipe.ts` for authoring, `core/styles/recipe-engine.ts` for the
  runtime that components import
- Layer helpers: `core/styles/layered-style.css.ts`
- Token contract: `theme/contract.ts`, `theme/contract.css.ts`, and `theme/type-styles.ts`
- Theme authoring: `theme/define-theme.ts`, published from `exports/theme/compiler.ts`
- Theme runtime: `exports/theme.ts`, which must never reach a compiler module
- Colour pipeline: [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md)

`modules.css.ts` imports every shipped `recipe.css.ts` and `styles.css.ts`, plus primitive and
overlay modules. Named layers set cross-layer priority. Within a layer, later equal-specificity
rules win. Put overridden modules first — for example `text/recipe.css` before `code/recipe.css` and
`kbd/recipe.css`. Generators append imports and do not sort this list. Inherited custom properties
ignore source order.

## Themes

`@luke-ui/react/theme/compiler` is the only theme-authoring entry. `defineTheme(input)` is pure and
Node-compatible. It validates each input in an `extends` chain, throwing `ThemeValidationError` with
every issue, then normalises the merged `ThemeInput` into static CSS and throws `ThemeContrastError`
when a pair misses WCAG 2.2 AA contrast. The raw `ThemeFoundation` object and `buildTheme` are
internal. `@luke-ui/react/theme` is the runtime entry. Keep it free of theme generation, colour
solving, Capsize, and Node-only code. `package-exports.test.ts` and the packed-consumer harness
check its import graph.

Colour tokens come from private 12-step scales and elevation surfaces, then map onto the semantic
contract. See [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for that pipeline.

Type styles are grouped from `font.caption` through `font.display`. Each has five public leaves:
family, size, weight, line height, and letter spacing. `typeStyleFontRole` in `theme/type-styles.ts`
maps each style to the body or display font. `font.family.display` is always a literal copy of a
family, never a `var()`: no generated value references another token. `font.family.code` is a fixed
monospace stack.

The Capsize trims are private `--luke-internal-font-<style>-*` variables. The theme stylesheet
writes them from each style's own font metrics, `Text` reads them, and `theme/capsize-trim-vars.ts`
names them for both.

Public tokens are theme-dependent semantic values and shared fixed measurements that applications
demonstrably align with. Component-specific geometry is a private TypeScript constant in
`core/sizing/`: the minimum target, the Combobox action size, and the icon sizes. `Box`'s
token-backed values derive from `vars`, so removing a token removes its `Box` value. The decision
record is [research/716-token-contract.md](../research/716-token-contract.md).

Author `depth.*` and `controlFinish.*` per mode as final CSS values. Components pick semantic
tokens. They do not branch on theme identity. A component must keep its essential state distinctions
when every depth and control finish is `none`. The `flat` test appearance checks that.

Tactile and Paper live in `packages/@luke-ui/theme-tactile` and `packages/@luke-ui/theme-paper`.
Each build compiles its built `./input` into `dist/stylesheet.css`. React's visual suite compiles
its own copies of their inputs from `theme/__fixtures__/`, so the two may diverge.

Generated CSS scopes every rule to `:where(html).luke-ui-theme-<name>`. There is no `:root`
fallback. The theme-wide and base light rules, and the `prefers-color-scheme: dark` rule, are
(0,1,0). The explicit rules, `…[data-color-mode='light']` on `<html>` and
`… [data-color-mode='light']` below it, are (0,2,0), so they beat the media rule and the nearest
explicit scope wins by inheritance. Every mode rule declares every mode token and sets native
`color-scheme`. The output is unlayered.

`core/styles/global-styles.css.ts` paints `<body>` and repaints each scope below `<body>` with the
scope's text colour, accent colour, and base surface, because inherited properties would otherwise
keep the parent's computed values. See [Global styles](#global-styles).

Overlays portal to `<body>`, outside the trigger's scope. `copyScopeColorMode` in
`core/overlays/scope-color-mode.ts` is a callback ref that copies the trigger's scoped mode onto the
Select popover, the Combobox popover, and the Combobox tray when the overlay element is created.
Popovers read the trigger from React Aria's `PopoverContext.triggerRef`. The tray reads the combobox
input group from `ComboboxInputGroupContext`, because the group inside an open tray sits in the
tray's own portal.

## Global styles

`core/styles/global-styles.css.ts` is the only module that styles the document. It holds six rules,
all at zero specificity in `luke-ui.reset`:

| Rule                              | Sets                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `*, *::before, *::after`          | `box-sizing: border-box`                                                                      |
| `:root`                           | `container-type: inline-size`                                                                 |
| `body`                            | `margin: 0`, base surface, text and accent colour, body font, and unitless `line-height: 1.5` |
| `body [data-color-mode]`          | Base surface, text and accent colour, so a scope repaints with its own mode                   |
| `button, input, select, textarea` | `font: inherit`, `margin: 0`                                                                  |
| `:focus-visible`                  | The themed focus ring, with `Highlight` under forced colours                                  |

A global rule must correct a cross-browser difference or replace a default almost every application
overrides, without erasing native structure such as heading sizes, list markers, table spacing, or
button chrome. Everything else belongs in the component that needs it. A component that renders a
native element with user agent styles, such as a `<button>`, `<p>`, or `<ul>`, sets the declarations
it depends on in its own recipe. `Text` zeroes the margins of the elements it renders at zero
specificity, so `Prose` spacing and utility props still apply. The test in
`stylesheet-contract.test.ts` pins the rule list. The decision record is
[research/717-global-stylesheet-contract.md](../research/717-global-stylesheet-contract.md).

Only the native `:focus-visible` pseudo-class draws the global ring. React Aria also sets
`data-focus-visible` on wrappers such as labels and groups, so a recipe that wants a ring from that
attribute draws it on the element that should show it. Keep exactly one focus indicator per control.
Remove an `outline: none` only when nothing else would draw a second ring.

## Cascade layers

All styles live in named CSS cascade layers. Layer order sets cross-layer priority. Specificity and
source order still decide conflicts within a layer.

| Layer               | Purpose                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `base`              | Reserved for the consuming app (for example Tailwind Preflight). Luke UI emits nothing here |
| `luke-ui.reset`     | The global styles                                                                           |
| `luke-ui.recipes`   | All Luke UI component styling, including descendant and combinator selectors                |
| `luke-ui.utilities` | `Box` and the other utility props                                                           |

The public stylesheet starts with one order statement, built from `core/styles/layer-names.ts`:

```css
@layer base, luke-ui;
@layer luke-ui {
	@layer reset, recipes, utilities;
}
```

The package declares `base` but never writes to it. That pins it below `luke-ui`. If a consumer's
first `@layer base` write created the layer instead, the browser would place it last and it would
beat every component recipe. The build prepends the statement and strips the single-name `@layer`
statements Vanilla Extract writes per module, so nothing creates a layer before it.
`stylesheet-contract.test.ts` checks the built `dist/stylesheet.css`, and
`layer-order.browser.test.ts` checks precedence in Chromium.

Applications that use Tailwind CSS v4 declare `@layer theme, base, luke-ui, components, utilities;`
before any import. Without it, import order decides whether Tailwind's `utilities` or `luke-ui`
comes later. `tailwind.browser.test.ts` checks both import orders against real Tailwind output.

The docs app uses `@vanilla-extract/css` for docs-owned `.css.ts` files. Its Vite and Vitest configs
run the Vanilla Extract plugin. Import a generated class from the component or route that applies
it. The docs app declares the Tailwind order in `apps/docs/src/styles/app.css`. The root route
applies a `base`-layer class from `src/styles/docs-root.css.ts` to `<body>` for the page's flex
layout. Docs-owned shell, navigation, search, and theme controls use `components`-layer classes,
which outrank Luke UI. Docs code never writes to Luke UI's layers.

Author component CSS with one of:

- `recipe()` — component visuals with selection and variants. Styles go in `luke-ui.recipes`.
- `style()` — one private `luke-ui.recipes` class with no selection (scopes, markers, implementation
  classes).
- `globalStyleInLayer()` — a global selector in a chosen Luke UI layer. Use it for the global styles
  and for component-owned descendant or combinator selectors that still belong in `recipes`.

Authors never name the `recipes` layer. Only `globalStyleInLayer()` takes a layer, and it cannot
target `base`.

Put overrides that must beat recipes in the `utilities` layer. Use `!important` only to beat
un-layered or inline styles. Under `!important` the layer order reverses: earlier layers win over
later ones, and unlayered CSS ranks below every layer. Loading skeleton masks that must stick on
wrapped children use `!important` in `recipes` for that reason.

## Motion

Each component owns its reduced-motion behaviour. The stylesheet has no global motion rule, so it
never disables an application's animations. Under `@media (prefers-reduced-motion: reduce)`:

- Keep short non-spatial feedback: colour, border, shadow, and opacity transitions. Do not add a
  reduced-motion query that only removes them.
- Remove spatial movement, scaling, pulsing, and looping, or replace it with a non-spatial change.
  An overlay keeps its fade and loses its movement. See `core/styles/overlay-motion.ts`.
- Keep loading states understandable. `LoadingSpinner` keeps turning a fixed arc. `LoadingSkeleton`
  keeps its static placeholder.
- `ScrollFade`'s scroll-linked animation is exempt, because it tracks scroll position rather than
  time.

A `[data-entering]` or `[data-exiting]` selector that sets `transition` outranks the plain class
rule, so restate its reduced-motion value on that selector too.

## Recipes

Public recipes export from the owning component or primitive entrypoint. Keep them separate from
layout utilities.

Colocate recipe files beside their owner:

- `recipe.css.ts` — public recipe contract
- `styles.css.ts` — private implementation styling

Build every recipe with the internal `recipe()` engine from `core/styles/recipe.ts`. It is not a
public package entry. `recipe()` wraps every base, variant, and compound-variant style in the
`recipes` layer.

Pass optional `className` into the recipe. It appends after the recipe's own classes:

```tsx
<blockquote className={blockquoteRecipe({ className })} />
<button className={buttonRecipe({ appearance, className, size, tone })} />
```

Do not wrap recipe output in `cx(recipe(…), className)`. Use `cx()` only to mix a recipe result with
another non-consumer class, such as a `style()` class.

### Single-part recipes

A single-part recipe takes `base`, `variants`, `defaultVariants`, and `compoundVariants`. It returns
a function that takes a variant selection plus optional `className` and returns one class string:

```ts
export const buttonRecipe = recipe({
	base: {/* … */},
	defaultVariants: { appearance: 'solid', size: 'medium', tone: 'neutral' },
	variants: {
		appearance: { ghost: {}, solid: {}, subtle: {} },
		size: {/* … */},
		tone: { accent: {}, danger: {}, neutral: {} },
	},
	compoundVariants: [/* … */],
});
```

### Slotted recipes

A multi-part recipe takes `slots` instead of `base`. Each variant value maps to per-slot styles. The
built recipe returns one function per slot. Choose variants once at the outer call. Each slot call
accepts only `{ className }`:

```tsx
export const fieldRecipe = recipe({
	slots: { label: {}, message: {}, root: {} },
	variants: { tone: { description: { message: {} } } },
} as const satisfies SlottedConfigInput);

const { label, message, root } = fieldRecipe({ tone: 'description' });
<div className={root()}>
	<label className={label()}>Email</label>
	<p className={message({ className })}>We will send your receipt here.</p>
</div>;
```

Apply `as const satisfies SlottedConfigInput` at the definition site. `as const` preserves literal
slot names and variant values. `satisfies` type-checks every style against `StyleRule`.

`compoundVariants` is single-part only. Slotted recipes use `compoundSlots` to share a style across
named slots. A `compoundSlots` entry may include a variant condition.

For overlapping properties, precedence runs from the slot base to unconditional `compoundSlots`,
then slot variants, then conditional `compoundSlots`. Within each compound category, a later array
entry wins. This order holds only for style objects `recipe()` emits. A pre-built class string keeps
the source position where it was first emitted. Single-part recipes reorder nothing and still accept
a pre-built class or an array.

### Deriving variant types

Derive the variant type from the built recipe. Never hand-maintain it or cast a hand-written
interface onto the selection parameter:

```ts
export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;
```

`RecipeSelection` contains only variant keys. `className` is composition input, not a variant.

The variant groups in `variants` are the only groups a recipe accepts. A group name that `variants`
does not declare is a type error in `defaultVariants`, `compoundVariants`, `compoundSlots`, and
`withDefaultVariants` defaults, including in a config declared before the `recipe()` call and in a
compound entry a helper function returns.

### Shared input-state selectors

Field-control recipes share hover, focus, disabled, invalid, and read-only selectors from
`core/styles/input-states.ts`:

```ts
import { composeInputStateSelectors, descendantDisabledSelector } from './input-states.js';

const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors();
```

`composeInputStateSelectors` owns the shared attribute and pseudo-class matrix. Control-specific
selectors stay in the owning recipe. The field model is the same in every field control: hover uses
`border.controlHover` and never applies while read-only or disabled. Focus adds the ring and leaves
the border alone. Invalid comes last, so its danger border survives hover, focus, and read-only.
Read-only keeps the field surface and `border.control` and drops the inset depth. Pass `extraStates`
when an element carries a state in a form the defaults do not cover, such as a bare `<input>` that
is itself `:read-only`.

Do not widen a state with `:has()` when the group already exposes data attributes such as
`data-disabled` and `data-invalid`. Probing descendants cannot tell a disabled control from one that
only contains a disabled button. Use `descendantDisabledSelector` to style a part when an ancestor
control is disabled.

## Styling utilities

Layout and appearance utilities live in `core/styles/utilities.css.ts`. They are package-internal.
`Box` and the other layout components apply them. There is no `@luke-ui/react/styles` subpath and no
public `createSprinkles` / `SprinklesProps` export.

They use Rainbow Sprinkles over Vanilla Extract. Values can land on inline `style`, which raises
specificity. That tradeoff is acceptable because utilities are already the highest-priority escape
hatch inside the package.

`Box` from `@luke-ui/react/box` is the public escape hatch for layout and appearance. It excludes
typography and text colour. Use `Text` or `Heading` for those.

Do not add style props to every component. Keep component props on variants and behaviour.

### Package-internal `createSprinkles`

`createSprinkles(props)` returns `{ className, style }` plus any own enumerable string-keyed props
that are not utility keys. Generated `className` and `style` replace input keys of those names. It
does not preserve symbol keys or non-enumerable properties.

`createSprinkles.properties` is a `ReadonlySet` of utility keys for TypeScript inside the package.
The runtime value is still a mutable `Set`.

Spacing and gap properties use `0` or value-based keys such as `sp16` and `sp24`. Keys are emitted
as `rem`. Margin also accepts `auto`. Enum-like properties use CSS-native values.

### Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints.
Breakpoints: `initial` (base), `bp640`, `bp768`, `bp1024`, `bp1280`, and `bp1536`. Import
`breakpoints` from `@luke-ui/react/theme` when authoring matching `@container` queries outside Box.

Write size queries as `@container`, not `@media`. The shared stylesheet sets
`container-type: inline-size` on `:where(:root)` in `luke-ui.reset`, so an unnamed query measures
the root's inline size with or without a theme. Keep `@media` for environmental conditions such as
`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `forced-colors`, and `hover`.
A container query with no container never matches, so the style silently stays at its base value. Do
not set `container-type` on an element below the root without naming the container: unnamed queries
on its descendants would start measuring it.

### React Aria `render` prop (button primitive)

High-level `Button` does not expose RAC `render`. Import the button primitive when you need React
Aria's `render` composition seam. Combine `Box` or package-internal sprinkles with `mergeProps` so
`className` and `style` merge correctly.

### Utility surface

The supported properties live in `core/styles/utilities.css.ts`. Use CSS-native values throughout,
for example `space-between` instead of `between`.

Semantic colour, typography, and pseudo-state properties are excluded. For sanctioned custom
styling, use typed `vars` from `@luke-ui/react/theme`:

```tsx
import { vars } from '@luke-ui/react/theme';

return (
	<div
		style={{
			backgroundColor: vars.color.surface.subdued,
			color: vars.color.text.primary,
		}}
	>
		Custom content
	</div>
);
```

### Styling engine boundary

`@luke-ui/rainbow-sprinkles` is a publishable 0.x support package derived from
[Wayfair Rainbow Sprinkles](https://github.com/wayfair/rainbow-sprinkles). `@luke-ui/react` depends
on it at runtime. It is not part of the stable Luke UI 1.x consumer API.

Keep engine authoring and compilation private. If the engine changes, preserve the package-internal
contracts: `createSprinkles` passes through own enumerable string-keyed non-utility props, generated
`className` and `style` replace input values, and `.properties` remains typed as read-only. Theme
`vars` keep their semantic paths and CSS custom property names. Recipes return class strings.
Generated CSS keeps its cascade layers and source order.

### Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Do not use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
