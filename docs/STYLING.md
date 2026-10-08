# Styling

How styling works in `@luke-ui/react`, for contributors who maintain it. Public usage docs live in
the docs app MDX.

Luke UI uses Vanilla Extract for styling. Public component APIs, utility props, cascade layers, and
token custom properties are the stable contracts. Vanilla Extract types are not part of the
published TypeScript surface.

## Setup

Luke UI ships one static stylesheet for its reset, theme root, recipes, and utilities.

1. Import `@luke-ui/react/stylesheet.css`.
2. Apply `rootClassName` from `@luke-ui/react/theme` to `<body>`, `<main>`, or an app shell.
3. Import one bundled theme stylesheet, for example `@luke-ui/react/themes/tactile/stylesheet.css`.

The theme stylesheet themes the document from `:root`. It needs no class and no JS. None of these
steps inject styles at runtime.

## Structure

Paths below are relative to `packages/@luke-ui/react/src/`.

| Area                                          | Role                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `core/styles/`                                | Stylesheet graph, layers, reset, theme root, recipe engine, modules registry, utilities, and shared helpers that emit no CSS on their own |
| Component and primitive folders under `core/` | Colocate `recipe.css.ts` (public) and `styles.css.ts` (private) beside the owner                                                          |
| `theme/`                                      | Token contract, `defineTheme`, foundations, bundles, and the build pipeline                                                               |
| `scripts/build-themes.ts`                     | Writes `.generated/themes/<name>/stylesheet.css`, which `vp pack` copies into `dist/`                                                     |

Stable entry points:

- Stylesheet graph: `core/styles/index.css.ts`
- Modules registry: `core/styles/modules.css.ts`
- Recipe engine: `core/styles/recipe.ts` for authoring, `core/styles/recipe-engine.ts` for the
  runtime that components import
- Layer helpers: `core/styles/layered-style.css.ts`
- Token contract: `theme/contract.ts`, `theme/contract.css.ts`, and `theme/type-styles.ts`
- Theme authoring: `theme/define-theme.ts`
- Colour pipeline: [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md)

`modules.css.ts` imports every shipped `recipe.css.ts` and `styles.css.ts`, plus primitive and
overlay modules. Named layers set cross-layer priority. Within a layer, later equal-specificity
rules win. Put overridden modules first — for example `text/recipe.css` before `code/recipe.css` and
`kbd/recipe.css`. Generators append imports and do not sort this list. Inherited custom properties
ignore source order.

## Themes

`defineTheme(input)` from `@luke-ui/react/theme` is the sole public theme-authoring surface. It is
pure and Node-compatible. It normalises a curated `ThemeInput` into static CSS and throws
`ThemeContrastError` when a pair misses WCAG 2.2 AA contrast. The raw `ThemeFoundation` object and
`buildTheme` are internal.

Colour tokens come from private 12-step scales and elevation surfaces, then map onto the semantic
contract. See [THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for that pipeline.

Type styles are grouped from `font.caption` through `font.display`. Each has five public leaves:
family, size, weight, line height, and letter spacing. `font.family.code` is a fixed monospace
stack.

The Capsize trims depend on the theme's font, so the theme stylesheet writes them in its identity
rule as private `--luke-internal-font-<style>-baseline-trim` and `-cap-height-trim` variables.
`theme/capsize-trim-vars.ts` names them for both the stylesheet and the `Text` recipe. They are not
part of `vars`.

Public tokens are theme-dependent semantic values and shared fixed measurements that applications
demonstrably align with. Component-specific geometry is a private TypeScript constant in
`core/sizing/`: the minimum target, the Combobox action size, and the icon sizes. `Box`'s
token-backed values derive from `vars`, so removing a token removes its `Box` value. The decision
record is [research/716-token-contract.md](../research/716-token-contract.md).

Author `depth.*` and `controlFinish.*` per mode as final CSS values. Components pick semantic
tokens. They do not branch on theme identity. A component must keep its essential state distinctions
when every depth and control finish is `none`. The `flat` test appearance checks that.

Bundled themes (`tactile`, `paper`) ship precompiled. Each stylesheet pairs `:where(:root)` with a
`.luke-ui-theme-<name>` identity class. Apply the bundled `themeClassName` export only when a
document needs more than one theme at once.

Without `data-color-mode`, a themed subtree follows `prefers-color-scheme`. Set
`data-color-mode="light"` or `data-color-mode="dark"` to force a mode. Nested scopes can override
it. Every scope also sets native `color-scheme`.

A colour mode scoped below `<html>` does not reach a body-level portal. Set `data-color-mode` on
`<html>` when a portalled surface must follow an explicit mode.

## Cascade layers

All styles live in named CSS cascade layers. Layer order sets cross-layer priority. Specificity and
source order still decide conflicts within a layer.

| Layer       | Purpose                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| `reset`     | Browser defaults, box sizing, root base colour, body typography, focus, and reduced-motion  |
| `base`      | Reserved for the consuming app (for example Tailwind Preflight). Luke UI emits nothing here |
| `recipes`   | All Luke UI component styling, including descendant and combinator selectors                |
| `utilities` | One-off layout and override escape hatches                                                  |

The public stylesheet starts with one combined order statement:

```css
@layer reset, base, recipes, utilities;
```

The package declares `base` but never writes to it. That pins its rank between `reset` and
`recipes`. If a consumer's first `@layer base` write creates the layer instead, the browser places
it last and it beats every component recipe.

The docs app uses `@vanilla-extract/css` for docs-owned `.css.ts` files. Its Vite and Vitest configs
run the Vanilla Extract plugin. Import a generated class from the component or route that applies
it. The root route applies a `base`-layer class from `src/styles/docs-root.css.ts` to `<body>` for
the page's flex layout. Docs-owned shell, navigation, search, and theme controls use `recipes`-layer
classes. Keep docs-owned base styles in `base`, and put intentional component overrides in a higher
layer. The layer order is declared before imports in `apps/docs/src/styles/app.css`.

Author component CSS with one of:

- `recipe()` — component visuals with selection and variants. Styles go in the `recipes` layer.
- `style()` — one private `recipes` class with no selection (scopes, markers, implementation
  classes).
- `globalStyleInLayer()` — a global selector in a chosen layer. Use for reset/root rules and for
  component-owned descendant or combinator selectors that still belong in `recipes`.

Authors never name the `recipes` layer. Only `globalStyleInLayer()` takes a layer, and it rejects
`base`.

Put overrides that must beat recipes in the `utilities` layer. Use `!important` only to beat
un-layered or inline styles. Under `!important`, lower layers win over higher layers. Loading
skeleton masks that must stick on wrapped children use `!important` in `recipes` for that reason.

Reduced-motion handling belongs near the animation. The global `prefers-reduced-motion` rule lives
in `reset`, so it cannot disable animations in `recipes` or `utilities`. Add a local
`@media (prefers-reduced-motion: reduce)` override in any animated recipe.

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
