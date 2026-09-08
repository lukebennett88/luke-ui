# Styling

How styling works in `@luke-ui/react`, for contributors who maintain it. Public usage docs live in
the docs app MDX.

## Setup

Luke UI ships one static stylesheet for its reset, theme root, recipes, and utilities.

1. Import `@luke-ui/react/stylesheet.css`.
2. Apply `rootClassName` from `@luke-ui/react/theme` to `<body>`, `<main>`, or an app shell.
3. Import one bundled theme stylesheet, for example `@luke-ui/react/themes/tactile/stylesheet.css`.

The theme stylesheet themes the document from `:root`. It needs no class and no JS. None of these
steps inject styles at runtime.

## Structure

Paths below are rooted in `packages/@luke-ui/react/src/`.

| Area                                          | Role                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `core/styles/`                                | Stylesheet graph, layers, reset, theme root, recipe engine, modules registry, utilities, and shared helpers that emit no CSS on their own |
| Component and primitive folders under `core/` | Colocate `recipe.css.ts` (public) and `styles.css.ts` (private) beside the owner                                                          |
| `theme/`                                      | Token contract, `defineTheme`, foundations, bundles, and the build pipeline                                                               |
| `scripts/build-themes.ts`                     | Writes `dist/themes/<name>/stylesheet.css`                                                                                                |

Stable entry points:

- Stylesheet graph: `core/styles/index.css.ts`
- Modules registry: `core/styles/modules.css.ts`
- Recipe engine: `core/styles/recipe.ts`
- Layer helpers: `core/styles/layered-style.css.ts`
- Token contract: `theme/contract.ts` and `theme/contract.css.ts`
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

Type styles are grouped from `font.caption` through `font.display`. Keep family, size, weight, line
height, letter spacing, and Capsize trims together. `font.family.code` is a fixed monospace stack.
Icon sizes are `xsmall`–`large` at 16px, 20px, 24px, and 32px.

Author `depth.*` and `actionControlFinish.*` per mode as final CSS values. Components pick semantic
tokens. They do not branch on theme identity.

Use `deriveConcentricRadius(innerRadius, gap)` for nested radii. It returns a CSS `calc()` so both
inputs can be semantic theme variables.

Bundled themes (`tactile`, `paper`) ship precompiled. Each stylesheet pairs `:where(:root)` with a
`.luke-ui-theme-<name>` identity class. Apply `themeClassName` only when a document needs more than
one theme at once. Authored themes use the same class mechanism through `getThemeClassName(name)`.

Without `data-color-mode`, a themed subtree follows `prefers-color-scheme`. Set
`data-color-mode="light"` or `data-color-mode="dark"` to force a mode. Nested scopes can override
it. Every scope also sets native `color-scheme`.

A colour mode scoped below `<html>` does not reach a body-level portal. Set `data-color-mode` on
`<html>` when a portalled surface must follow an explicit mode.

## Cascade layers

All styles live in named CSS cascade layers. Layer order sets cross-layer priority. Specificity and
source order still decide conflicts within a layer.

| Layer        | Purpose                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `reset`      | Browser defaults, box sizing, and margins                                                   |
| `theme`      | Design token custom properties and base typography                                          |
| `base`       | Reserved for the consuming app (for example Tailwind Preflight). Luke UI emits nothing here |
| `recipes`    | Component styles, variants, compound variants, and shared compound-slot styles              |
| `structural` | Retained descendant rhythm, skeleton masking, and combinator selectors                      |
| `utilities`  | One-off layout and override escape hatches                                                  |

The public stylesheet starts with one combined order statement:

```css
@layer reset, theme, base, recipes, structural, utilities;
```

The package declares `base` but never writes to it. That pins its rank between `theme` and
`recipes`. If a consumer's first `@layer base` write creates the layer instead, the browser places
it last and it beats every component recipe.

Author component CSS with one of:

- `recipe()` — component visuals with selection and variants. Styles go in the `recipes` layer.
- `style()` — one private `recipes` class with no selection (scopes, markers, implementation
  classes).
- `globalStyleInLayer()` — a global selector in a chosen layer. Use for reset, theme root, and
  `structural` rules.

Authors never name the `recipes` layer. Only `globalStyleInLayer()` takes a layer, and it rejects
`base`.

Put overrides that must beat recipes in the `utilities` layer. Use `!important` only to beat
un-layered or inline styles. Under `!important`, lower layers win over higher layers. Structural
masks that must stick on wrapped children use `!important` in `structural` for that reason.

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

### Shared input-state selectors

Field-control recipes share hover, focus, disabled, invalid, and read-only selectors from
`core/styles/input-states.ts`:

```ts
import { composeInputStateSelectors, descendantDisabledSelector } from './input-states.js';

const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors();
```

`composeInputStateSelectors` owns the shared attribute and pseudo-class matrix. It returns mutually
exclusive selectors. Control-specific selectors stay in the owning recipe.

Do not widen a state with `:has()` when the group already exposes data attributes such as
`data-disabled` and `data-invalid`. Probing descendants cannot tell a disabled control from one that
only contains a disabled button. Use `descendantDisabledSelector` to style a part when an ancestor
control is disabled.

## Styling utilities

Styling utilities are public from `@luke-ui/react/styles`. Use them when component props are too
narrow for layout or appearance.

They use Rainbow Sprinkles. Values can land on inline `style`, which raises specificity. That
tradeoff is acceptable because utilities are already the highest-priority escape hatch.

`Box` from `@luke-ui/react/box` applies these utilities. Use it as the escape hatch for layout and
appearance. It excludes typography and text colour. Use `Text` or `Heading` for those.

Do not add style props to every component. Keep component props on variants and behaviour. Reach for
`Box` when a component's own props are too narrow.

### `createSprinkles()`

`createSprinkles(props)` returns `{ className, style }`. Spread both onto the element:

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

Spacing and gap properties use `0` or value-based keys such as `sp16` and `sp24`. Margin also
accepts `auto`. Enum-like properties use CSS-native values.

### Responsive values

Use object notation keyed by breakpoint names. Values cascade from smaller to larger breakpoints:

```tsx
const responsive = createSprinkles({
	display: 'flex',
	flexDirection: { initial: 'column', bp768: 'row' },
	gap: { initial: 'sp12', bp768: 'sp24' },
});
```

Breakpoints: `initial` (base), `bp640`, `bp768`, `bp1024`, `bp1280`, and `bp1536`.

### React Aria `render` prop

Combine `createSprinkles` with React Aria's `render` prop when you need to style the underlying DOM
element. Use `mergeStyleProps` from `@luke-ui/react/utils` so `className` and `style` merge
correctly:

```tsx
import { mergeStyleProps } from '@luke-ui/react/utils';

const buttonBox = createSprinkles({ padding: 'sp16' });

<Button
	render={(props) => (
		<button {...mergeStyleProps(props, buttonBox)} type="button">
			Save
		</button>
	)}
>
	Save
</Button>;
```

### Utility surface

The supported properties live in `core/styles/utilities.css.ts` and export from
`@luke-ui/react/styles`. Use CSS-native values throughout, for example `flex-start` instead of
`start`.

Semantic colour, typography, and pseudo-state properties are excluded. For sanctioned custom
styling, use typed `vars` from `@luke-ui/react/theme`:

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

### Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Do not use physical properties such as `margin-left`, `height`, `left`, or `right`.
- Align variant names with public props, such as `size` and `tone`.
- Boolean props use `is*` or `should*`.
