# Public API

Architectural decision record for the `@luke-ui/react` public surface before 1.0. This is
contributor guidance, not an end-user API reference and not a permanent migration changelog.

Issue [#711](https://github.com/lukebennett88/luke-ui/issues/711) owns this inventory. Prefer clean
breaking changes over compatibility aliases.

## Vocabulary and rules

- Every package-exported subpath and every symbol exported from it is public, whether documented or
  not.
- There is no root `@luke-ui/react` export. Consumers import subpaths only.
- Public entrypoints use explicit named exports. Do not use `export *` in `src/exports/`.
- Prefer one canonical import path per concept. Do not duplicate exports for symmetry.
- High-level components are the primary product surface. Primitives, recipes, helpers, utilities,
  metadata, providers, and hooks need a credible independent consumer use case to stay public.
- Internal reuse, implementation decomposition, and naming symmetry are not justifications for a
  public export.
- Generated recipe class identifiers, incidental DOM nesting, Vanilla Extract details, and
  undocumented anatomy are private.

## Public subpaths

| Subpath                                  | Purpose                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `@luke-ui/react/<component>`             | High-level component, its `Props` type, and colocated public recipe when one exists |
| `@luke-ui/react/primitives/<name>`       | Documented composition anatomy for independent consumer builds                      |
| `@luke-ui/react/styles`                  | `createSprinkles`, `SprinklesProps`, `breakpoints`                                  |
| `@luke-ui/react/theme`                   | Theme authoring helpers, `vars`, `rootClassName`, type styles                       |
| `@luke-ui/react/themes/tactile`          | Temporary bundled theme JS (`theme`, `themeClassName`) until #715                   |
| `@luke-ui/react/themes/paper`            | Temporary bundled theme JS until #715                                               |
| `@luke-ui/react/utils`                   | `cx`, `mergeProps`, `pxToRem`                                                       |
| `@luke-ui/react/provider`                | Application `Provider` (icons spritesheet + related setup from #712)                |
| `@luke-ui/react/package.json`            | Package metadata                                                                    |
| `@luke-ui/react/stylesheet.css`          | Shared component stylesheet                                                         |
| `@luke-ui/react/spritesheet.svg`         | Icon spritesheet asset from #712                                                    |
| `@luke-ui/react/themes/*/stylesheet.css` | Temporary bundled theme CSS until #715                                              |

## Composition seams

### Root ownership

`className`, `style`, `id`, and `ref` target the documented component-owned root. Named part refs
such as `inputRef` exist only when a stable integration need exists. Incidental wrappers stay
private.

### `elementType`

Narrow native semantic substitution on components that document supported tags. Not generic
polymorphism. Mutually exclusive with `renderRoot` in TypeScript.

Box-like layout components support a fixed structural set (`article`, `aside`, `div`, `section`, and
related list/figure/landmark tags). `LoadingSkeleton` supports `div` | `span`. Text-family
components keep RAC's documented `elementType` surface for semantic text tags.

### `renderRoot` / `render<Name>`

Luke UI-owned element replacement uses:

- `renderRoot` for the root
- `render<Name>` only for demonstrated replaceable parts

Callback shape is always `(props, state) => ReactElement`. The callback receives resolved element
props (including `children` and `ref`) and the same curated state object used by state-aware
`className` / `style` when those exist. Empty state is `Record<string, never>`.

`renderRoot` is a sharp knife. Consumers may omit or replace supplied props and then own the
consequences.

React Aria's own `render` prop remains on primitives and other RAC-backed seams where RAC owns the
replacement API. Do not rename RAC `render` to `renderRoot`. High-level `Button` and `IconButton`
omit RAC `render` and function children; use `@luke-ui/react/primitives/button` for that
composition.

Box-like components that support `renderRoot` today: `Box`, `Stack`, `Cluster`, `Grid`, `Container`,
`Bleed`, `AspectRatio`. `ScrollFade` forbids `elementType` and `renderRoot`.

### Spread and precedence

Default implementation convention: consumer spreads happen near the start. Luke UI then writes the
props it owns. Precedence:

1. Internal/default behaviour
2. Variants/state presentation
3. Consumer props
4. Luke UI-owned required semantic/state props override conflicting consumer values when correctness
   requires it
5. Consumer `style` remains final for CSS declaration collisions

Consumer `className` and `style` retain presentation precedence.

### State attributes

Deliberately emitted RAC-style attributes such as `data-disabled` and `data-focus-visible` are
public DOM API when a component emits them. Boolean state uses presence/absence. Components provide
final state-attribute props explicitly. Private helpers may map common RAC state; those helpers are
not public. Render-callback state is public render API only for the curated object passed to the
callback.

## Recipes

A public recipe is a stable visual treatment for app-owned elements. Export the recipe and its
`*RecipeVariants` type from the entrypoint for the visual concept it styles.

| Recipe                  | Canonical import                       | Consumer use                                    |
| ----------------------- | -------------------------------------- | ----------------------------------------------- |
| `buttonRecipe`          | `@luke-ui/react/button`                | Button treatment on an app-owned element        |
| `checkboxRecipe`        | `@luke-ui/react/checkbox`              | Checkbox treatment on app-owned markup          |
| `fieldRecipe`           | `@luke-ui/react/primitives/field`      | Field chrome for custom field compositions      |
| `textInputRecipe`       | `@luke-ui/react/primitives/text-input` | Input treatment on an app-owned input           |
| `visuallyHiddenRecipe`  | `@luke-ui/react/visually-hidden`       | Visually hidden treatment without the component |
| Other component recipes | Matching high-level entrypoint         | Same visual treatment on owned elements         |

Generated class strings from recipes are private. Consumers call the recipe function; they must not
hard-code or target generated class identifiers.

## Primitives

Public primitives live under `@luke-ui/react/primitives/*` only. Retained for independent
composition:

| Primitive    | Consumer use                                                     |
| ------------ | ---------------------------------------------------------------- |
| `button`     | Custom button layout/loading while keeping Luke button behaviour |
| `checkbox`   | Custom checkbox anatomy beyond `Checkbox`                        |
| `combobox`   | Custom combobox control, popover, tray, or loading UI            |
| `field`      | Label, description, and error arrangement around any control     |
| `select`     | Custom select trigger/list composition                           |
| `text-input` | Prefix/suffix and custom control chrome around an input          |

Form primitives from #714 are settled input. Required companion exports such as `SelectItem` and
`ComboboxItem` may also appear on the matching high-level field entrypoint.

## Utilities (`@luke-ui/react/utils`)

Public exports:

- `cx` — join class-name or ID-list tokens
- `mergeProps` — composition/render prop merge
- `pxToRem` — px to rem conversion

`mergeProps` accepts prop objects only. Ordinary props: rightmost wins. `className`: concatenate
left to right. `style`: shallow merge, rightmost wins per key. Event handlers: chain in argument
order with React Aria's `chain`. Refs are not specially merged.

The current event model is intentionally the simple RAC-style chained model. Base UI's
consumer-first cancellable handler model may be reconsidered later if a real use case appears; that
is rationale only, not an open follow-up.

Internal typed object helpers (`typedEntries`, `typedKeys`, `typedFromEntries`, `ObjectEntry`) stay
package-private.

## Styles (`@luke-ui/react/styles`)

Retain `createSprinkles`, `SprinklesProps`, and `breakpoints`. `SprinklesProps` is a composition
typing tool, not a signal that every component inherits the full utility-prop surface. Generated
utility class identifiers remain private.

## Theme surface

`@luke-ui/react/theme` exports theme authoring and runtime helpers explicitly (`defineTheme`,
`ThemeInput`, `vars`, `rootClassName`, `getThemeClassName`, `typeStyles`, space scale helpers, and
related types/errors). Final token taxonomy, CSS-variable taxonomy, and Tactile/Paper package
extraction belong to #715 and #716. Current Tactile/Paper JS/CSS subpaths are temporary public paths
expected to move under #715.

Cascade layer names exposed by the shared stylesheet today are `reset`, `base`, `recipes`, and
`utilities`. Final layer naming and order belong to #717.

## Icons and provider

Architecture from #712 / PR #725 is settled. Retain `Provider`, `Icon`, `createIcon`, size context,
`iconNames`, `iconRecipe`, and `spritesheet.svg`. `iconViewBoxes` is package-internal runtime data
for icon construction, not a public export.

## Heading composition

Public heading surface: `Heading`, `HeadingProps`, `HeadingLevel`, `HeadingLevels`,
`HeadingLevelsProps`, `useHeadingLevel`. `HeadingTag` and `HeadingLevelsRenderProps` are not public
exports; annotate heading-level values through `ReturnType<typeof useHeadingLevel>` when needed.

## Explicitly private

- Generated recipe and utility class identifiers
- Incidental DOM nesting and undocumented anatomy
- Vanilla Extract implementation modules and `#recipe-engine`
- Internal render helpers (none exported; a private `useRender` may appear later if it removes
  duplication)
- Typed object helpers in `shared/utils`
- `iconViewBoxes`
- `omitUnsupportedSprinklesProps` and other Box internals
- `IconSpritesheetProvider` (apps use `Provider`)
- Internal state attributes that a component does not deliberately emit as contract

## Meaningful removals and renames in this audit

| Change                                                                            | Reason                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `mergeStyleProps` → `mergeProps`                                                  | Composition-oriented name; adds event chaining |
| Remove public `typedEntries` / `typedKeys` / `typedFromEntries` / `ObjectEntry`   | No independent consumer use                    |
| Box-like `render` → `renderRoot`                                                  | Luke-owned root replacement vocabulary         |
| Remove duplicate `buttonRecipe` / `checkboxRecipe` from primitives entrypoints    | One canonical recipe path                      |
| Remove public `HeadingTag`, `HeadingLevelsRenderProps`                            | No annotation need beyond inferred types       |
| Remove public `iconViewBoxes`                                                     | Internal icon construction data                |
| Constrain `LoadingSkeleton` `elementType` to `div` \| `span`                      | Narrow demonstrated substitutions              |
| Explicit exports for `theme`, `themes/*`, `utils`                                 | No public `export *`                           |
| High-level `Button` / `IconButton` omit RAC `render` and Button function children | Composition belongs on the button primitive    |
| Add `VisuallyHiddenRecipeVariants`                                                | Public recipes export matching variants types  |

## Delegated follow-ups

| Issue | Owns                                                          |
| ----- | ------------------------------------------------------------- |
| #714  | Form architecture (settled input for this audit)              |
| #712  | Icon/provider architecture (settled; visibility audited here) |
| #715  | Theme authoring and Tactile/Paper package extraction          |
| #716  | Control/token redesign                                        |
| #717  | Global stylesheet, reset, and cascade contract                |

No duplicate issue is opened for splitting bundled themes; #715 already covers it.
