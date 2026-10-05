# Public API

Contributor guidance for the `@luke-ui/react` public surface before 1.0. Prefer clean breaking
changes over compatibility aliases. Issue
[#711](https://github.com/lukebennett88/luke-ui/issues/711) owns this settlement.

The exhaustive symbol-by-symbol audit lives in
[research/711-public-api-audit.md](../research/711-public-api-audit.md). That file is temporary
research, not normative guidance.

## What counts as public

- Every package-exported subpath and every symbol exported from it is public, documented or not.
- There is no root `@luke-ui/react` export. Consumers import subpaths only.
- Public entrypoints use explicit named exports. Do not use `export *` in `src/exports/`.
- Prefer one canonical import path per concept.
- High-level components are the primary product surface. Primitives, recipes, helpers, utilities,
  metadata, providers, and hooks need a credible independent consumer use case to stay public.
- Internal reuse, implementation decomposition, and naming symmetry are not justifications.
- Generated recipe and utility class identifiers, incidental DOM nesting, Vanilla Extract details,
  and undocumented anatomy are private.

## Subpaths

| Subpath                                | Purpose                                            |
| -------------------------------------- | -------------------------------------------------- |
| `@luke-ui/react/<component>`           | High-level component, props type, colocated recipe |
| `@luke-ui/react/primitives/<name>`     | Documented composition anatomy                     |
| `@luke-ui/react/styles`                | `createSprinkles`, `SprinklesProps`, `breakpoints` |
| `@luke-ui/react/theme`                 | Theme authoring helpers, `vars`, `rootClassName`   |
| `@luke-ui/react/themes/*`              | Temporary bundled theme JS/CSS until #715          |
| `@luke-ui/react/utils`                 | `cx`, `mergeProps`, `pxToRem`                      |
| `@luke-ui/react/provider`              | Application `Provider` (#712)                      |
| Assets (`stylesheet.css`, spritesheet) | Shared CSS and icon spritesheet                    |

## Composition seams

### Root ownership and refs

`className`, `style`, `id`, and `ref` target the documented component-owned root. Named part refs
such as `inputRef` or `triggerRef` exist only when a stable integration need exists. Incidental
wrappers stay private.

### `elementType`

Narrow native semantic substitution on components that document supported tags. Not generic
polymorphism. Mutually exclusive with `renderRoot` in TypeScript.

### `renderRoot` / `render<Name>` / RAC `render`

- Luke UI-owned root replacement → `renderRoot`
- Deliberately replaceable named part → `render<Name>`
- React Aria's own `render` remains `render` on primitives and other RAC-owned seams
- Do not rename RAC `render` to `renderRoot`
- High-level `Button` and `IconButton` omit RAC `render` and Button function children

Callback shape is `(props, state) => ReactElement`. For Box-like components, `renderRoot` receives
the complete resolved root props Luke UI accepts for that root after sprinkles merge (`children`,
`className`, `style`, callback `ref`, `id`, supported `aria-*` / `data-*`, supported DOM/event
props). It does not receive props the component never accepted. Consumers may omit or replace
supplied props and then own the consequences.

Box-like components with `renderRoot` today: `Box`, `Stack`, `Cluster`, `Grid`, `Container`,
`Bleed`, `AspectRatio`. `ScrollFade` forbids `elementType` and `renderRoot`.

### Slot

RAC `slot` is a composition seam, not a free pass.

- Primitives may expose `slot` when RAC slot composition is an intentional consumer capability.
- High-level components omit `slot` unless a demonstrated product need exists. Form fields from #714
  omit it (`SelectField`, `ComboboxField`, `TextInputField`, `Checkbox`). High-level `Button`,
  `IconButton`, `Link`, and `IconLink` also omit it. Use the button/link primitives for RAC slot
  composition.

### Controlled and uncontrolled

Stateful and form components follow React Aria's controlled/uncontrolled pairs (`value` /
`defaultValue`, `isSelected` / `defaultSelected`, open-state pairs where documented). Controlled
value props and their change handlers are independent in the public types: TypeScript does not
require the matching handler when a controlled value is set. Prefer supplying both in product code.
High-level fields keep the pairs #714 settled. Do not invent parallel APIs.

### Meaningful defaults

Document defaults that change product behaviour (appearance, size, tone, prominence, pending). Do
not treat every optional prop's absence as a public default worth listing. Defaults that only mirror
the underlying RAC component stay undocumented unless Luke UI chooses a different value.

### Variants

Public appearance variants live on the high-level component and its colocated recipe. Recipe variant
types are `*RecipeVariants`. Do not duplicate variant unions as standalone exports unless typing
custom primitive composition requires them (`SelectSize`, `TextInputSize`, `ComboboxSize`).

### State attributes

A state attribute is public only when a component deliberately documents it as part of its supported
DOM contract. Undocumented RAC or internal attributes remain private.

### Spread and precedence

Consumer spreads happen near the start. Luke UI then writes the props it owns. Consumer `className`
and `style` retain presentation precedence. Luke UI may override conflicting consumer values when
correctness requires it.

## Recipes

A public recipe is a stable visual treatment for app-owned elements. Export the recipe and matching
`*RecipeVariants` from the visual concept's entrypoint. Generated class strings are private.

Retain a recipe only when an app would credibly style an owned element without the component. Layout
recipes that only set `display` or that require the component's private anatomy are not public. See
the audit for per-recipe decisions.

## Primitives and utilities

Public primitives live under `@luke-ui/react/primitives/*` for independent composition. Form
primitives and companion item exports follow #714.

`@luke-ui/react/utils` exports `cx`, `mergeProps`, and `pxToRem` only.

`mergeProps` accepts prop objects only:

- Ordinary props: rightmost wins, including explicit `undefined`
- `className`: concatenate left to right with `cx`. Explicit `undefined` clears
- `style`: shallow merge. Explicit `undefined` clears
- Event handlers: chain in argument order with React Aria's `chain` when both are functions
- Refs: rightmost wins (no special merge)

## Theme and icons

Theme authoring (`defineTheme`, `ThemeInput`, `vars`, `rootClassName`, and related helpers) stays
public. Bundled Tactile/Paper paths are temporary until #715. Token taxonomy belongs to #715/#716.
Cascade layers belong to #717.

Icon and provider architecture from #712 is settled. `iconViewBoxes` stays package-private.

## Heading

Public: `Heading`, `HeadingProps`, `HeadingLevel`, `HeadingLevels`, `HeadingLevelsProps`,
`useHeadingLevel`. Not public: `HeadingTag`, `HeadingLevelsRenderProps`.

## Removals in this settlement

| Change                                                                | Reason                                                         |
| --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `mergeStyleProps` → `mergeProps`                                      | Composition merge with event chaining and explicit `undefined` |
| Drop public typed object helpers                                      | No independent consumer use                                    |
| Box-like `render` → `renderRoot`                                      | Luke-owned root vocabulary                                     |
| Drop duplicate recipes on primitives                                  | One canonical recipe path                                      |
| Drop public `HeadingTag`, `HeadingLevelsRenderProps`, `iconViewBoxes` | No independent annotation need                                 |
| Drop public theme defaults (`defaultBackdrop`, …)                     | Internal `defineTheme` only                                    |
| Drop layout recipes without independent use                           | See audit                                                      |
| High-level Button/IconButton omit RAC `render` and `slot`             | Composition on the button primitive                            |
| High-level Link/IconLink omit RAC `slot`                              | Composition on the link primitive / RAC Link                   |
| Drop public `visuallyHiddenRecipe`                                    | `VisuallyHidden` + `elementType` covers consumer use           |
| Constrain `LoadingSkeleton` `elementType`                             | Narrow demonstrated substitutions                              |

## Follow-ups

| Issue | Owns                                         |
| ----- | -------------------------------------------- |
| #712  | Icon/provider (settled)                      |
| #714  | Form architecture (settled input)            |
| #715  | Theme authoring and bundled-theme extraction |
| #716  | Control/token redesign                       |
| #717  | Global stylesheet and cascade                |
