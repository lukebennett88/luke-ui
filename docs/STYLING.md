# Styling

`@luke-ui/react` styles with Vanilla Extract. Public component APIs, utility props, cascade layers,
and token custom properties are the stable contracts. Vanilla Extract types are not published.
Consumers import `@luke-ui/react/stylesheet.css` and one theme stylesheet, and set the theme's
identity class on `<html>`. Nothing injects styles at runtime.

## Structure

Paths are relative to `packages/@luke-ui/react/src/`.

- Colocate a public `recipe.css.ts` and a private `styles.css.ts` beside their component or
  primitive under `core/`. Shared styling helpers live in `core/styles/`.
- Author recipes with `core/styles/recipe.ts`. Components import the runtime from
  `core/styles/recipe-engine.ts`.
- The theme runtime, `exports/theme.ts`, never reaches a compiler module.

`core/styles/modules.css.ts` imports every shipped style module. Within a layer, later
equal-specificity rules win, so list overridden modules first — for example `text/recipe.css` before
`code/recipe.css` and `kbd/recipe.css`. Generators append imports without sorting. Inherited custom
properties ignore source order.

## Themes

`@luke-ui/react/theme/compiler` is the only theme-authoring entry. Its `defineTheme(input)` is pure
and Node-compatible, and throws on invalid input, missed WCAG 2.2 AA contrast, or unsolvable
interaction tints. `ThemeFoundation` and `buildTheme` are internal. Keep the runtime entry,
`@luke-ui/react/theme`, free of theme generation, colour solving, Capsize, and Node-only code.
`package-exports.test.ts` and the packed-consumer harness check its import graph. See
[THEME_COLOUR_GENERATION.md](THEME_COLOUR_GENERATION.md) for the colour pipeline.

No generated value references another token, so `font.family.display` is a literal copy of a family,
never a `var()`.

Capsize trims are private `--luke-internal-font-<style>-*` variables, named in
`theme/capsize-trim-vars.ts`. The theme stylesheet writes them from font metrics and `Text` reads
them. Trimmed text makes a gap the visible space between cap heights and baselines, so match an
untrimmed site by comparing rendered gaps, not CSS values. See
[Text trimming](../apps/docs/content/docs/components/typography/text.mdx#trimming).

Public tokens are theme-dependent semantic values and shared fixed measurements that applications
demonstrably align with. Component-specific geometry, such as the Combobox action size and Icon
sizes, is a private constant in its component family. Cross-control dimensions, including the
minimum target, live in `core/sizing/`. `Box` values derive from `vars`, so removing a token removes
its `Box` value. Decision record:
[research/716-token-contract.md](../research/716-token-contract.md).

Author `shadow.*` and `controlFinish.*` per mode as final CSS values. Components pick semantic
tokens and never branch on theme identity. A component keeps its essential state distinctions when
every shadow and finish is `none`, which the `flat` test appearance checks.

React's visual suite compiles its own copies of the Tactile and Paper inputs from
`theme/__fixtures__/`, so they may diverge from the theme packages.

Generated theme CSS is unlayered and scopes every rule to `:where(html).luke-ui-theme-<name>`, with
no `:root` fallback. Theme-wide, base light, and `prefers-color-scheme: dark` rules are (0,1,0).
Explicit `[data-color-mode]` rules, on `<html>` or below it, are (0,2,0), so they beat the media
rule and the nearest explicit scope wins by inheritance. Every mode rule declares every mode token
and sets `color-scheme`.

Overlays portal to `<body>`, outside the trigger's scope. `copyScopeColorMode` in
`core/overlays/scope-color-mode.ts` copies the trigger's mode onto the Select and Combobox popovers
and the Combobox tray. The tray reads its trigger from `ComboboxInputGroupContext`, because the
input group in an open tray sits in the tray's own portal.

## Global styles

`core/styles/global-styles.css.ts` is the only module that styles the document. Its rules sit in
`luke-ui.reset` and use `:where()` for zero specificity. Pseudo-elements are invalid inside
`:where()`, so `::before` and `::after` sit outside it and each adds (0,0,1). Each
`[data-color-mode]` scope below `<body>` repaints its surface, foreground context, and accent,
because inherited properties would otherwise keep the parent's computed values.

A global rule must correct a cross-browser difference or replace a default almost every application
overrides, without erasing native structure such as heading sizes, list markers, table spacing, or
button chrome. Everything else belongs in the component:

- A component that renders a native element with UA styles, such as `<button>`, `<p>`, or `<ul>`,
  sets the declarations it depends on in its own recipe.
- A pressable control spreads `pressFeedback` from `core/styles/press-feedback.ts`.
- `Text` zeroes its elements' margins at zero specificity, so `Prose` spacing and utility props
  still apply.

Decision record:
[research/717-global-stylesheet-contract.md](../research/717-global-stylesheet-contract.md).

Only native `:focus-visible` draws the global ring. React Aria also sets `data-focus-visible` on
wrappers such as labels and groups, so a recipe that rings from that attribute draws on the element
that should show it. Keep exactly one focus indicator per control. Remove an `outline: none` only
when nothing else would draw a second ring.

## Cascade layers

The public stylesheet starts with one order statement, built from `core/styles/layer-names.ts`:

```css
@layer base, luke-ui;
@layer luke-ui {
	@layer reset, recipes, utilities;
}
```

`base` belongs to the consuming app, such as Tailwind Preflight. Luke UI declares it but never
writes to it, which pins it below `luke-ui`. A consumer's first `@layer base` would otherwise create
it last, above every recipe. The build prepends the statement and strips Vanilla Extract's
per-module `@layer` statements, so nothing creates a layer first. Tailwind CSS v4 applications
declare `@layer theme, base, luke-ui, components, utilities;` before any stylesheet import, or
import order decides whether Tailwind's `utilities` beats `luke-ui`.

Author component CSS with one of:

- `recipe()` — component visuals with selection and variants.
- `style()` — one private class with no selection (scopes, markers, implementation classes).
- `globalStyleInLayer()` — a global selector, for the global styles and for component-owned
  descendant or combinator selectors. It is the only helper that takes a layer, and it cannot target
  `base`. The others write to `recipes`.

`utilities` holds `Box` and the other utility props. Put overrides that must beat recipes there. Use
`!important` only to beat unlayered or inline styles. Under `!important` the layer order reverses:
earlier layers win, and unlayered CSS ranks below every layer. Exceptions: `focusRing()`'s
ring-colour reset (see [Focus ring context](#focus-ring-context)), and loading skeleton masks that
must stick on wrapped children, which use `!important` in `recipes`.

## Motion

Each component owns its reduced-motion behaviour. The stylesheet has no global motion rule, so it
never disables an application's animations. Under `prefers-reduced-motion: reduce`:

- Keep short colour, border, shadow, and opacity transitions. Button states settle immediately so
  the registered state layer does not blend between hover and pressed.
- Remove or replace spatial movement, scaling, pulsing, and looping. Build overlay motion with
  `overlayMotion` from `core/styles/overlay-motion.ts`, which keeps the fade and drops the movement.
- Keep loading states understandable. `LoadingSpinner` shows a static arc and `LoadingSkeleton` a
  static placeholder.
- `ScrollFade`'s scroll-linked animation is exempt, because it tracks scroll position, not time.

A `[data-entering]` or `[data-exiting]` selector that sets `transition` outranks the plain class, so
restate the reduced-motion value there too.

## Forced colours

Under `forced-colors: active`, use system colours such as `Canvas`, `CanvasText`, `Highlight`, and
`GrayText`.

- Chromium paints a `Canvas` backplate behind text, so text on a `Highlight` fill disappears. An
  element that draws text on `Highlight`, such as a selected list box item, sets
  `forced-color-adjust: none` and both colours.
- `forced-color-adjust` inherits, so an element that holds arbitrary content also resets that
  content's colour, background, and border colour with `!important`, or a nested `Text` keeps its
  theme colour.
- A checked Checkbox's mark is an SVG stroked with `currentColor`, which has no backplate, so the
  box needs no opt-out. Its forced rule must match every state selector that sets an author colour,
  or that colour shows through.

### Icons

`Icon` renders a `<span data-icon>` that fills `currentColor` behind a `mask-image` from the
generated `iconMaskUrls`. A component that owns a decorative icon, such as the field error, spreads
`iconMaskStyle()` from `core/icon/mask-style.ts` into its own part and renders no `Icon`.

Masked icons paint with `background-color`, so a rule that clears descendant backgrounds must leave
`Icon` out. Icons set `forced-color-adjust: preserve-parent-color`, as the UA does for `<svg>`, so
`currentColor` resolves to the inherited forced colour. `none` would paint the author colour. Icons
also set `print-color-adjust: exact`, because print drops background colours.

## Recipes

Public recipes export from the owning component or primitive entrypoint, separate from layout
utilities. Build every recipe with the internal `recipe()` engine, which wraps every style in the
`recipes` layer. A public recipe that maps its value onto a different value of a shared recipe is a
plain function in `recipe.ts`, such as `linkRecipe`.

Pass optional `className` into the recipe, which appends it after its own classes:

```tsx
<blockquote className={blockquoteRecipe({ className })} />
<button className={buttonRecipe({ appearance, className, size, tone })} />
```

Use `cx()` only to mix a recipe result with another non-consumer class, such as a `style()` class.

### Single-part recipes

A single-part recipe takes `base`, `variants`, `defaultVariants`, and `compoundVariants`, and
returns one class string:

```ts
export const buttonRecipe = recipe({
	base: {/* … */},
	defaultVariants: { appearance: 'solid', size: 'medium', tone: 'neutral' },
	variants: {
		appearance: { solid: {}, subtle: {}, transparent: {} },
		size: {/* … */},
		tone: { accent: {}, danger: {}, neutral: {} },
	},
	compoundVariants: [/* … */],
});
```

### Slotted recipes

A multi-part recipe takes `slots` instead of `base`. Choose variants once at the outer call. Each
slot function accepts only `{ className }`:

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

Apply `as const satisfies SlottedConfigInput` at the definition site to keep literal names and
type-check every style.

Slotted recipes have no `compoundVariants`. Put a style two slots share in a plain object that each
slot spreads. Overlapping properties resolve from every slot's base to every slot's variants, but
only for style objects. A pre-built class string keeps the source position where it was first
emitted.

### Deriving variant types

Derive the variant type from the built recipe, never a hand-written interface:

```ts
export type ButtonRecipeVariants = RecipeSelection<typeof buttonRecipe>;
```

`RecipeSelection` contains only variant keys, not `className`.

### Shared input-state selectors

Field-control recipes take state selectors from `core/styles/input-states.ts`. Control-specific
selectors stay in the owning recipe.

```ts
import { composeInputStateSelectors, descendantDisabledSelector } from './input-states.js';

const { disabled, focusWithin, hover, invalid, readOnly } = composeInputStateSelectors();
```

Every field control follows one model:

- Hover paints `border.control.hover`, never while read-only or disabled.
- Focus adds the ring and leaves the border alone.
- Invalid comes last, so its danger border survives hover, focus, and read-only.
- Read-only keeps the base surface and `border.control.rest` and drops the inset shadow.

Pass `extraStates` for a state the defaults miss, such as a bare `<input>` that is itself
`:read-only`. Use the group's data attributes, such as `data-disabled` and `data-invalid`, rather
than `:has()`, which cannot tell a disabled control from one that contains a disabled button. Use
`descendantDisabledSelector` to style a part when an ancestor control is disabled.

### Dropdown option states

Select and Combobox options share one state model, from React Aria's Vanilla CSS dropdown. The
combobox recipe's `item` slot implements it and `SelectItem` reuses it. A standalone list box and
other collections need their own decision.

| State                   | Treatment                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| Active (`data-focused`) | `accent.solid.rest` with the on-solid foreground and a 2px inset outline |
| Active + pressed        | `accent.solid.pressed` with the same on-solid text and inset outline     |
| Selected                | The check icon only, with no fill or extra weight                        |
| Hovered but not active  | No style                                                                 |

The active option follows the keyboard, and the pointer only while focus is not visible. Its fill
and inset outline replace the global ring. Select moves DOM focus onto the option. Combobox keeps
focus and its ring in the input and uses `aria-activedescendant`. Forced colours use `Highlight` and
`HighlightText` for the active option. The compiler gates the outline at 3:1 against the solid
fills, but does not require the fill to contrast with `surface.raised`. See
[Border contrast policy](THEME_COLOUR_GENERATION.md#border-contrast-policy).

## Styling utilities

`core/styles/utilities.css.ts` defines the package-internal Rainbow Sprinkles utilities that `Box`
and the layout components apply. There is no `@luke-ui/react/styles` subpath or public
`createSprinkles` export. Values can land on inline `style`, which is acceptable for the
highest-priority escape hatch.

`Box` is the public layout and appearance escape hatch. It has no typography or text colour props,
so use `Text` or `Heading`. Its `backgroundColor` sets the paired text colour. See
[Surface pairing](#surface-pairing). Keep other component props to variants and behaviour, not style
props.

Use CSS-native values, such as `space-between`, not `between`. Semantic colour, typography, and
pseudo-state properties are excluded. Custom styling uses typed `vars`:

```tsx
import { vars } from '@luke-ui/react/theme';

return (
	<div
		style={{
			backgroundColor: vars.color.background.surface.subdued,
			color: vars.color.foreground.primary,
		}}
	>
		Custom content
	</div>
);
```

### Package-internal `createSprinkles`

`createSprinkles(props)` returns `{ className, style }` plus own enumerable string-keyed non-utility
props. Generated `className` and `style` replace input keys of those names. Symbol keys and
non-enumerable properties are dropped. `createSprinkles.properties` is typed `ReadonlySet` but is a
mutable `Set` at runtime.

`vars.space['16']` is a fixed 1rem reference measurement that scales with the root font size. Zero
stays outside `vars.space`, and themes cannot redefine the steps. Build literal scales such as
`vars.space` and `vars.controlSize` with `literalScale` from `theme/literal-scale.ts`, so numeric
keys (CSS pixels at a 16px root) and `rem` values cannot drift. Keep logical properties and `bp*`
conditions, with no `px`/`py` shorthands. This supersedes the spacing naming policy in
[#761](https://github.com/lukebennett88/luke-ui/issues/761).

`container.*` presets set a fixed `rem` maximum inline size and a local container-query boundary,
with no theme variable family.

### Sizing, inset, flex, and order values

Utility props accept a closed vocabulary with no length scale.

| Props                                                                                                          | Values                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `inlineSize`, `blockSize`, `minInlineSize`, `minBlockSize`                                                     | `"0"`, `auto`, `100%`, `min-content`, `max-content`, `fit-content`           |
| `maxInlineSize`, `maxBlockSize`                                                                                | `"0"`, `none`, `100%`, `min-content`, `max-content`, `fit-content`           |
| `maxInlineSize` only                                                                                           | The five `container.*` presets as well                                       |
| `inset`, `insetBlock`, `insetBlockStart`, `insetBlockEnd`, `insetInline`, `insetInlineStart`, `insetInlineEnd` | Space tokens, `"0"`, and `auto`. No lengths, percentages, or negative values |
| `flexBasis`                                                                                                    | The `inlineSize` values plus `content`                                       |
| `flexGrow`, `flexShrink`                                                                                       | `"0"` and `"1"`                                                              |
| `order`                                                                                                        | A number. It is the only numeric utility prop                                |

Keyword and zero values are strings: `minInlineSize="0"`, not `minInlineSize={0}`. Every value
accepts responsive objects. The scales are Rainbow Sprinkles `dynamicProperties`, so narrowing one
changes types, not emitted CSS.

`overscrollBehavior` accepts `auto` and `contain` on every shared layout component. `listStyle`
accepts only `none`, with no responsive conditions, on `Box` and `Stack` only. `Prose` keeps its own
list styles.

There is no `flex` shorthand prop, because it silently resets basis and shrink. `flexGrow="1"` is
usually enough. Add `flexBasis="0"` only when items must share space regardless of content, and
`flexShrink="0"` to stop an item shrinking. Do not reintroduce the shorthand through `style` without
a demonstrated need.

Put a one-off fixed dimension on `style`, such as `style={{ maxInlineSize: '42rem' }}` or
`vars.controlSize['40']`. Author a responsive one-off in CSS through `className`. See
[Responsive values](#responsive-values).

### Control recipe sizes

[PUBLIC_API.md](PUBLIC_API.md#control-sizing) owns the `size` and `Form.controlSize` contract. Each
size selects a complete recipe that owns its typography, icons, and alignment. At a 16px root,
Buttons and fields keep 32px and 40px geometry, and Checkbox and Switch keep 16px and 20px
indicators. Buttons use `xsmall` icons and spinners at both sizes. Field controls use `xsmall` icons
at `small` and `small` icons at `medium`.

A `small` TextInput or Combobox uses 16px type metrics under `@media (pointer: coarse)`, because iOS
Safari zooms into a focused input under 16px. Block size and padding stay. `touchInputTypography` in
`text-input/styles.css.ts` holds the rule.

`ControlSizeContext` carries inherited defaults. Composed components pass an omitted size through
until the owning primitive resolves it. Control-specific contexts preserve explicit part overrides
and carry resolved sizes through Select and Combobox portals. Independent Dialog surfaces, when
[#799](https://github.com/lukebennett88/luke-ui/issues/799) adds them, set their own default,
normally `medium`, rather than inheriting a trigger's.

Icon size context is CSS. A recipe spreads `iconSizeVars(size)` from `core/icon/icon-sizing.ts` to
set the inherited `--luke-icon-size`, which icons and the spinner read when they have no `size`
variant. An explicit `Icon.size` wins. Inheritance follows the DOM, so a portalled part such as a
list box item sets its own. `--luke-icon-size` and `iconSizeVars` are public.

### Surface pairing

`surfaceStyle(background)` in `core/styles/surface.ts` returns a recognised opaque background, its
contextual primary `color`, and the private `--luke-internal-foreground-*` overrides. Spread it into
the same rule, condition, or state selector that sets the background. Never set a recognised
background without it. Controls pair their fill in every interaction state.

- `contextualForeground(slot)` reads `primary`, `secondary`, or a role's colour from the nearest
  surface. `Text` `color` values use it. `Text` without `color`, and typography built on it,
  inherit.
- Standard surfaces and subtle fills reset the overrides, so reads fall back to the neutral
  hierarchy or the role's resting hue. The compiler gates those pairs against every subtle fill,
  including other roles'. A solid fill sets every override to its on-solid colour.
- An override resolves on the element that declares it, so the global styles reset the overrides in
  every colour-mode scope.

Text a component draws on whatever surrounds it, such as field labels and errors, text actions, and
Prose links, reads `contextualForeground`. Its `state` argument gives a role's hover or pressed hue.
`contextualDisabledForeground()` gives the disabled token, or on-solid on a solid fill, which has no
disabled leaf. `transparentSurfaceStyle()` hands an element that stops painting back to its parent's
context, as inline `Code` does inside `pre`. Fills that hold no text, such as the switch and the
loading skeleton, keep their own colours.

A role's colour collapses to on-solid on a solid fill, so a state cue cannot be hue alone. Text
Links toggle the underline on hover and press. A field error adds an icon hidden from assistive
technology.

`Box` pairs each resting standard surface and each role's resting `subtle` and `solid` fill, with
one utilities-layer class per condition. A background outside the pairing, such as raw `vars` in
custom CSS, an image, or a gradient, sets no foreground, low Button, or focus ring context. Anything
inside it reads the nearest managed surface.

Every pairing also sets private inherited fills, finishes, and a pressed shadow that a low Button
reads:

- A low Button paints the nearest managed surface's resting fill, opaque, with no finish or shadow
  at rest. Hover and pressed paint that fill in the adaptive state layer, a registered `<color>`
  property in `core/styles/state-layer.css.ts` painted as a `background-image`. It keeps the
  surrounding foreground context in every state.
- A low Button paints a finish only over a role solid, because a finish stacked with the translucent
  tint can break text contrast. The solid's pressed shadow repeats `shadow.inset` to strengthen the
  recess on a dark solid.
- Solid and standard Buttons paint the control finish above their fill layers and under the label. A
  standard Button paints the state layer over its subtle fill.
- Forced colours clear the state layer. See
  [Interaction states](THEME_COLOUR_GENERATION.md#interaction-states) for how the compiler gates
  state fills and tints.

A high Button keeps its own solid pairing, so a neutral high Button on `accent.solid`, or a danger
one on `danger.solid`, paints its parent's fill. This known limitation is deliberate. See
[research/1023-same-role-high-buttons.md](../research/1023-same-role-high-buttons.md).

#### Focus ring context

`focusRing()` in `core/styles/focus-ring.ts` paints every focus ring, including the global one. It
reads the private `--luke-internal-focus`, falling back to `color.focus`. A role solid's pairing
sets its on-solid colour, which the compiler gates at 4.5:1 against the solid's fills. A page
surface or subtle fill sets `initial`.

A ring sits outside its element, on the parent's fill, so `focusRing()` sets the property to
`inherit !important` on that element. A solid Button on a page surface keeps a `color.focus` ring. A
text field on a solid `Box` gets the on-solid ring, and a Combobox clear button inside that field
gets the field's `color.focus` ring.

### Responsive values

Use object notation keyed by `initial` and the `bp*` names from `theme/breakpoints.ts`. Values
cascade upward.

Write size queries as `@container`. The reset makes `:where(:root)` an inline-size container, so an
unnamed query measures the nearest ancestor size container, normally the root, never the viewport.
Keep `@media` for environmental conditions such as `prefers-reduced-motion`, `forced-colors`, and
`hover`. A container query with no container silently never matches. Name any container below the
root, or unnamed queries inside it measure it.

Build a responsive one-off's `@container` query from `breakpoints` so it switches with the utility
props:

```ts
// settings-layout.css.ts
import { breakpoints } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const sidebar = style({
	inlineSize: '100%',
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: {
			inlineSize: '15.25rem',
		},
	},
});
```

```tsx
<Box className={styles.sidebar} flexShrink="0">
	{navigation}
</Box>
```

### Styling engine boundary

[DEPENDENCIES.md](DEPENDENCIES.md#changesets) owns the publishing status of
`@luke-ui/rainbow-sprinkles`. Keep engine authoring and compilation private. If the engine changes,
preserve the `createSprinkles` contract, `vars` paths and custom property names, class-string
recipes, and generated cascade layers and source order.

## Implementation rules

- Use CSS logical properties such as `margin-inline-start`, `block-size`, and `inset-inline`.
- Use `cursor: pointer` only on links.
- Align variant names with public props, such as `size` and `tone`.
- Name boolean props `is*` or `should*`.

## Docs app styling

In repository apps, use Luke UI components and layout primitives (`Button`, `Text`, `Box`, `Stack`,
`Cluster`, `Grid`) for chrome, spacing, and alignment. Use an app-local `*.css.ts` file only for
what they cannot express, such as container queries, separators, specialised interaction states,
positioning, and motion. Never recreate Button, Text, or Box styling there.

In the docs app, import a generated class from the component or route that applies it.
`apps/docs/src/styles/app.css` adds a `components` layer above `luke-ui` and imports no Tailwind or
Fumadocs CSS. Docs-owned UI uses `components`-layer classes, except the root route's `base`-layer
body layout class. Docs code never writes to Luke UI's layers. The `@import 'tailwindcss'` line in
`apps/docs/content/docs/docs/styling.mdx` is a teaching example, not a docs-app dependency.
