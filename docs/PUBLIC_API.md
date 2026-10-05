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
related list/figure/landmark tags). `LoadingSkeleton` supports `div` | `li` | `span`. Text-family
components keep RAC's documented `elementType` surface for semantic text tags.

### `renderRoot` / `render<Name>`

Luke UI-owned element replacement uses:

- `renderRoot` for the root
- `render<Name>` only for demonstrated replaceable parts

Callback shape is always `(props, state) => ReactElement`. For Box-like components, `renderRoot`
receives the **complete resolved root props Luke UI accepts for that root** after sprinkles merge:
`children`, `className`, `style`, callback `ref`, `id`, supported `aria-*`, supported `data-*`, and
supported ordinary DOM/event props. It does not receive props the component never accepted (for
example `href` on `Box`). Interactive components pass curated state as the second argument when
documented.

`renderRoot` is a sharp knife. Consumers may omit or replace supplied props and then own the
consequences.

React Aria's own `render` prop remains on primitives and other RAC-backed seams where RAC owns the
replacement API. Do not rename RAC `render` to `renderRoot`. High-level `Button` and `IconButton`
omit RAC `render` and function children. Use `@luke-ui/react/primitives/button` for that
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

A state attribute is public only when a component deliberately documents it as part of its supported
DOM contract. Undocumented React Aria or internal implementation attributes (for example
`data-hovered` or `data-pressed` where not listed on the component) are private and may change
without a migration path. Do not treat every RAC-emitted `data-*` attribute as automatically public.
Render-callback `state` objects are public render API only for the curated fields a component
documents.

## Recipes

A public recipe is a stable visual treatment for app-owned elements. Export the recipe and its
`*RecipeVariants` type from the entrypoint for the visual concept it styles.

| Recipe                 | Canonical import                       | Decision | Consumer use                                    | Example                                               |
| ---------------------- | -------------------------------------- | -------- | ----------------------------------------------- | ----------------------------------------------------- |
| `buttonRecipe`         | `@luke-ui/react/button`                | retain   | Button chrome on an app-owned element           | `apps/docs/src/examples/styling/button-recipe.tsx`    |
| `checkboxRecipe`       | `@luke-ui/react/checkbox`              | retain   | Checkbox chrome on custom markup                | `apps/docs/src/examples/checkbox-primitive/basic.tsx` |
| `fieldRecipe`          | `@luke-ui/react/primitives/field`      | retain   | Field chrome in custom fields                   | `apps/docs/src/examples/field-primitive/basic.tsx`    |
| `textInputRecipe`      | `@luke-ui/react/primitives/text-input` | retain   | Input chrome in custom controls                 | text-input primitive docs                             |
| `visuallyHiddenRecipe` | `@luke-ui/react/visually-hidden`       | retain   | Visually hidden treatment without the component | `apps/docs/src/examples/visually-hidden/recipe.tsx`   |
| `iconRecipe`           | `@luke-ui/react/icon`                  | retain   | Icon sizing and colour on custom SVG            | `apps/docs/src/examples/icon/custom.tsx`              |
| `iconButtonRecipe`     | `@luke-ui/react/icon-button`           | retain   | Icon button chrome on owned control             | `apps/docs/src/examples/icon-button/basic.tsx`        |
| `linkRecipe`           | `@luke-ui/react/link`                  | retain   | Link appearance on an anchor the app owns       | Link docs + styling guide recipe section              |
| `textRecipe`           | `@luke-ui/react/text`                  | retain   | Typography on app-owned elements                | `apps/docs/src/examples/text/typography.tsx`          |
| `blockquoteRecipe`     | `@luke-ui/react/blockquote`            | retain   | Blockquote treatment                            | `apps/docs/src/examples/blockquote/basic.tsx`         |
| `codeRecipe`           | `@luke-ui/react/code`                  | retain   | Inline code treatment                           | `apps/docs/src/examples/code/basic.tsx`               |
| `kbdRecipe`            | `@luke-ui/react/kbd`                   | retain   | Keyboard hint treatment                         | `apps/docs/src/examples/kbd/basic.tsx`                |
| `proseRecipe`          | `@luke-ui/react/prose`                 | retain   | Prose block treatment                           | prose component docs                                  |
| `containerRecipe`      | `@luke-ui/react/container`             | retain   | Max-width container chrome                      | `apps/docs/src/examples/container/basic.tsx`          |
| `gridRecipe`           | `@luke-ui/react/grid`                  | retain   | Grid container chrome on owned element          | `apps/docs/src/examples/grid/basic.tsx`               |
| `trackRecipe`          | `@luke-ui/react/track`                 | retain   | Track row layout on owned elements              | `apps/docs/src/examples/track/basic.tsx`              |
| `loadingSpinnerRecipe` | `@luke-ui/react/loading-spinner`       | retain   | Spinner chrome without the component            | `apps/docs/src/examples/loading-spinner/basic.tsx`    |
| `scrollFadeRecipe`     | `@luke-ui/react/scroll-fade`           | retain   | Scroll fade mask on owned scrollport            | scroll-fade component docs                            |
| `aspectRatioRecipe`    | `@luke-ui/react/aspect-ratio`          | retain   | Ratio box chrome                                | `apps/docs/src/examples/aspect-ratio/basic.tsx`       |

Generated class strings from recipes are private. Consumers call the recipe function. They must not
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

`mergeProps` accepts prop objects only. Ordinary props: rightmost wins, **including explicit
`undefined`**. `className`: concatenate left to right with `cx`. Explicit `undefined` clears the
merged value. `style`: shallow merge, rightmost wins per key. Explicit `undefined` clears the merged
value. Event handlers: chain in argument order with React Aria's `chain` when both sides are
functions. Explicit `undefined` replaces a prior handler. Refs are not specially merged. Rightmost
wins like ordinary props.

The current event model is intentionally the simple RAC-style chained model. Base UI's
consumer-first cancellable handler model may be reconsidered later if a real use case appears. That
is rationale only, not an open follow-up.

Internal typed object helpers (`typedEntries`, `typedFromEntries`, `ObjectEntry`) stay
package-private.

## Styles (`@luke-ui/react/styles`)

Retain `createSprinkles`, `SprinklesProps`, and `breakpoints`. `SprinklesProps` is a composition
typing tool, not a signal that every component inherits the full utility-prop surface. Generated
utility class identifiers remain private.

## Theme surface (`@luke-ui/react/theme`)

Final token taxonomy and bundled-theme packaging belong to #715 and #716. This audit keeps only
exports with independent consumer value today.

| Symbol                                                                                                                        | Decision | Consumer use                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `defineTheme`                                                                                                                 | retain   | Author and compile custom themes                                 |
| `ThemeInput`, `ExtendingThemeInput`, `ColorInput`, `ControlFinish`, `DepthLadder`, `FontWeightRole`, `SpaceStep`, `TypeStyle` | retain   | Type theme authoring input                                       |
| `ThemeContrastFailure`, `ThemeInheritance`                                                                                    | retain   | Inspect contrast failures from `ThemeContrastError`              |
| `ThemeContrastError`, `ThemeGenerationError`                                                                                  | retain   | Catch theme build failures in tooling                            |
| `vars`                                                                                                                        | retain   | Semantic CSS variables in app-owned styles                       |
| `rootClassName`                                                                                                               | retain   | Apply active theme identity on a root element                    |
| `getThemeClassName`                                                                                                           | retain   | Derive identity class for multi-theme apps                       |
| `typeStyles`                                                                                                                  | retain   | Capsize type style objects for custom typography                 |
| `spaceScale`                                                                                                                  | retain   | Document or debug spacing scale in tooling                       |
| `deriveConcentricRadius`, `deriveNestedRadius`                                                                                | retain   | Match nested radii to parent surfaces                            |
| `defaultBackdrop`, `defaultControlFinish`, `defaultDepth`                                                                     | remove   | Internal `defineTheme` defaults with no documented consumer need |

Temporary `@luke-ui/react/themes/tactile` and `themes/paper` (`theme`, `themeClassName`) and their
`stylesheet.css` assets defer relocation to #715.

Cascade layer names exposed by the shared stylesheet today are `reset`, `base`, `recipes`, and
`utilities`. Final layer naming and order belong to #717.

## Icons and provider

Architecture from #712 / PR #725 is settled. Retain `Provider`, `Icon`, `createIcon`, size context,
`iconNames`, `iconRecipe`, and `spritesheet.svg`. `iconViewBoxes` is package-internal runtime data
for icon construction, not a public export.

## Heading composition

Public heading surface: `Heading`, `HeadingProps`, `HeadingLevel`, `HeadingLevels`,
`HeadingLevelsProps`, `useHeadingLevel`. `HeadingTag` and `HeadingLevelsRenderProps` are not public
exports. Annotate heading-level values through `ReturnType<typeof useHeadingLevel>` when needed.

## Explicitly private

- Generated recipe and utility class identifiers
- Incidental DOM nesting and undocumented anatomy
- Vanilla Extract implementation modules and `#recipe-engine`
- Internal render helpers (none exported). A private `useRender` may appear later if it removes
  duplication.
- Typed object helpers in `shared/utils`
- `iconViewBoxes`
- `omitUnsupportedSprinklesProps` and other Box internals
- `IconSpritesheetProvider` (apps use `Provider`)
- Undocumented state attributes and other RAC implementation `data-*` hooks

## Export inventory

Decision values: **retain**, **change**, **remove**, **defer**. Every symbol below was reviewed for
#711. High-level `Component` + `ComponentProps` pairs share the primary product use case unless
noted.

### `@luke-ui/react/aspect-ratio`

| Symbol                      | Decision | Consumer use                   | Example                      |
| --------------------------- | -------- | ------------------------------ | ---------------------------- |
| `AspectRatio`               | retain   | Primary component surface      | apps/docs component examples |
| `AspectRatioProps`          | retain   | Public props typing            | component docs               |
| `AspectRatioRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `aspectRatioRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/bleed`

| Symbol       | Decision | Consumer use              | Example                      |
| ------------ | -------- | ------------------------- | ---------------------------- |
| `Bleed`      | retain   | Primary component surface | apps/docs component examples |
| `BleedProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/blockquote`

| Symbol                     | Decision | Consumer use                   | Example                      |
| -------------------------- | -------- | ------------------------------ | ---------------------------- |
| `Blockquote`               | retain   | Primary component surface      | apps/docs component examples |
| `BlockquoteProps`          | retain   | Public props typing            | component docs               |
| `BlockquoteRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `blockquoteRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/box`

| Symbol     | Decision | Consumer use              | Example                      |
| ---------- | -------- | ------------------------- | ---------------------------- |
| `Box`      | retain   | Primary component surface | apps/docs component examples |
| `BoxProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/button`

| Symbol                 | Decision | Consumer use                   | Example                      |
| ---------------------- | -------- | ------------------------------ | ---------------------------- |
| `Button`               | retain   | Primary component surface      | apps/docs component examples |
| `ButtonProps`          | retain   | Public props typing            | component docs               |
| `ButtonRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `buttonRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/checkbox`

| Symbol                   | Decision | Consumer use                   | Example                   |
| ------------------------ | -------- | ------------------------------ | ------------------------- |
| `Checkbox`               | retain   | Primitive anatomy part         | matching primitive docs   |
| `CheckboxProps`          | retain   | Public props typing            | component docs            |
| `CheckboxRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above |
| `checkboxRecipe`         | retain   | Recipe on canonical entrypoint | recipes table             |

### `@luke-ui/react/cluster`

| Symbol         | Decision | Consumer use              | Example                      |
| -------------- | -------- | ------------------------- | ---------------------------- |
| `Cluster`      | retain   | Primary component surface | apps/docs component examples |
| `ClusterProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/code`

| Symbol               | Decision | Consumer use                   | Example                      |
| -------------------- | -------- | ------------------------------ | ---------------------------- |
| `Code`               | retain   | Primary component surface      | apps/docs component examples |
| `CodeProps`          | retain   | Public props typing            | component docs               |
| `CodeRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `codeRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/combobox-field`

| Symbol                 | Decision | Consumer use                                    | Example                         |
| ---------------------- | -------- | ----------------------------------------------- | ------------------------------- |
| `ComboboxField`        | retain   | Primitive anatomy part                          | matching primitive docs         |
| `ComboboxFieldProps`   | retain   | Public props typing                             | component docs                  |
| `ComboboxItem`         | retain   | List item in custom combobox or field re-export | combobox-field / primitive docs |
| `ComboboxItemProps`    | retain   | Public props typing                             | component docs                  |
| `ComboboxSection`      | retain   | Grouped list sections in custom combobox        | combobox-field docs             |
| `ComboboxSectionProps` | retain   | Public props typing                             | component docs                  |

### `@luke-ui/react/container`

| Symbol                    | Decision | Consumer use                   | Example                      |
| ------------------------- | -------- | ------------------------------ | ---------------------------- |
| `Container`               | retain   | Primary component surface      | apps/docs component examples |
| `ContainerProps`          | retain   | Public props typing            | component docs               |
| `ContainerRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `containerRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/em`

| Symbol    | Decision | Consumer use              | Example                      |
| --------- | -------- | ------------------------- | ---------------------------- |
| `Em`      | retain   | Primary component surface | apps/docs component examples |
| `EmProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/emoji`

| Symbol       | Decision | Consumer use              | Example                      |
| ------------ | -------- | ------------------------- | ---------------------------- |
| `Emoji`      | retain   | Primary component surface | apps/docs component examples |
| `EmojiProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/grid`

| Symbol               | Decision | Consumer use                   | Example                      |
| -------------------- | -------- | ------------------------------ | ---------------------------- |
| `Grid`               | retain   | Primary component surface      | apps/docs component examples |
| `GridProps`          | retain   | Public props typing            | component docs               |
| `GridRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `gridRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/heading`

| Symbol               | Decision | Consumer use              | Example                      |
| -------------------- | -------- | ------------------------- | ---------------------------- |
| `Heading`            | retain   | Primary component surface | apps/docs component examples |
| `HeadingLevel`       | retain   | Primary component surface | apps/docs component examples |
| `HeadingLevels`      | retain   | Primary component surface | apps/docs component examples |
| `HeadingLevelsProps` | retain   | Public props typing       | component docs               |
| `HeadingProps`       | retain   | Public props typing       | component docs               |
| `useHeadingLevel`    | retain   | Primary component surface | apps/docs component examples |

### `@luke-ui/react/icon-button`

| Symbol                     | Decision | Consumer use                   | Example                      |
| -------------------------- | -------- | ------------------------------ | ---------------------------- |
| `IconButton`               | retain   | Primary component surface      | apps/docs component examples |
| `IconButtonProps`          | retain   | Public props typing            | component docs               |
| `IconButtonRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `iconButtonRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/icon-link`

| Symbol          | Decision | Consumer use              | Example                      |
| --------------- | -------- | ------------------------- | ---------------------------- |
| `IconLink`      | retain   | Primary component surface | apps/docs component examples |
| `IconLinkProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/icon`

| Symbol               | Decision | Consumer use                       | Example                                      |
| -------------------- | -------- | ---------------------------------- | -------------------------------------------- |
| `CreateIconOptions`  | retain   | Type custom icon registration      | —                                            |
| `CustomIconProps`    | retain   | Type custom icon component props   | —                                            |
| `Icon`               | retain   | Primary component surface          | apps/docs component examples                 |
| `IconName`           | retain   | Type known icon names              | —                                            |
| `IconProps`          | retain   | Public props typing                | component docs                               |
| `IconRecipeVariants` | retain   | Typed recipe variants              | matching recipe row above                    |
| `IconSizeProvider`   | retain   | Icon size context for custom trees | apps/docs/src/examples/icon/size-context.tsx |
| `createIcon`         | retain   | Register custom icons              | apps/docs/src/examples/icon/custom.tsx       |
| `iconNames`          | retain   | Runtime icon name list for tooling | icon docs                                    |
| `iconRecipe`         | retain   | Recipe on canonical entrypoint     | recipes table                                |

### `@luke-ui/react/kbd`

| Symbol              | Decision | Consumer use                   | Example                      |
| ------------------- | -------- | ------------------------------ | ---------------------------- |
| `Kbd`               | retain   | Primary component surface      | apps/docs component examples |
| `KbdProps`          | retain   | Public props typing            | component docs               |
| `KbdRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `kbdRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/link`

| Symbol               | Decision | Consumer use                   | Example                      |
| -------------------- | -------- | ------------------------------ | ---------------------------- |
| `Link`               | retain   | Primary component surface      | apps/docs component examples |
| `LinkProps`          | retain   | Public props typing            | component docs               |
| `LinkRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `linkRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/loading-skeleton`

| Symbol                         | Decision | Consumer use                                      | Example                      |
| ------------------------------ | -------- | ------------------------------------------------- | ---------------------------- |
| `LoadingSkeleton`              | retain   | Primary component surface                         | apps/docs component examples |
| `LoadingSkeletonProps`         | retain   | Public props typing                               | component docs               |
| `LoadingSkeletonProvider`      | retain   | Subtree loading context for skeleton placeholders | loading-skeleton docs        |
| `LoadingSkeletonProviderProps` | retain   | Type provider props                               | —                            |

### `@luke-ui/react/loading-spinner`

| Symbol                         | Decision | Consumer use                   | Example                      |
| ------------------------------ | -------- | ------------------------------ | ---------------------------- |
| `LoadingSpinner`               | retain   | Primary component surface      | apps/docs component examples |
| `LoadingSpinnerProps`          | retain   | Public props typing            | component docs               |
| `LoadingSpinnerRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `loadingSpinnerRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/numeral`

| Symbol                | Decision | Consumer use                    | Example                      |
| --------------------- | -------- | ------------------------------- | ---------------------------- |
| `Numeral`             | retain   | Primary component surface       | apps/docs component examples |
| `NumeralAbbreviation` | retain   | Type numeral formatting options | numeral examples             |
| `NumeralFormat`       | retain   | Type numeral formatting options | numeral examples             |
| `NumeralPrecision`    | retain   | Type numeral formatting options | numeral examples             |
| `NumeralProps`        | retain   | Public props typing             | component docs               |

### `@luke-ui/react/primitives/button`

| Symbol        | Decision | Consumer use              | Example                      |
| ------------- | -------- | ------------------------- | ---------------------------- |
| `Button`      | retain   | Primary component surface | apps/docs component examples |
| `ButtonProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/primitives/checkbox`

| Symbol                   | Decision | Consumer use           | Example                 |
| ------------------------ | -------- | ---------------------- | ----------------------- |
| `CheckboxContent`        | retain   | Primitive anatomy part | matching primitive docs |
| `CheckboxContentProps`   | retain   | Public props typing    | component docs          |
| `CheckboxControl`        | retain   | Primitive anatomy part | matching primitive docs |
| `CheckboxControlProps`   | retain   | Public props typing    | component docs          |
| `CheckboxIndicator`      | retain   | Primitive anatomy part | matching primitive docs |
| `CheckboxIndicatorProps` | retain   | Public props typing    | component docs          |
| `CheckboxLabel`          | retain   | Primitive anatomy part | matching primitive docs |
| `CheckboxLabelProps`     | retain   | Public props typing    | component docs          |
| `CheckboxRoot`           | retain   | Primitive anatomy part | matching primitive docs |
| `CheckboxRootProps`      | retain   | Public props typing    | component docs          |

### `@luke-ui/react/primitives/combobox`

| Symbol                      | Decision | Consumer use                                     | Example                         |
| --------------------------- | -------- | ------------------------------------------------ | ------------------------------- |
| `ComboboxClearButton`       | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxClearButtonProps`  | retain   | Public props typing                              | component docs                  |
| `ComboboxControl`           | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxControlProps`      | retain   | Public props typing                              | component docs                  |
| `ComboboxEmptyState`        | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxEmptyStateProps`   | retain   | Public props typing                              | component docs                  |
| `ComboboxInput`             | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxInputProps`        | retain   | Public props typing                              | component docs                  |
| `ComboboxItem`              | retain   | List item in custom combobox or field re-export  | combobox-field / primitive docs |
| `ComboboxItemProps`         | retain   | Public props typing                              | component docs                  |
| `ComboboxListBox`           | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxListBoxProps`      | retain   | Public props typing                              | component docs                  |
| `ComboboxLoadMoreItem`      | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxLoadMoreItemProps` | retain   | Public props typing                              | component docs                  |
| `ComboboxPopover`           | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxPopoverProps`      | retain   | Public props typing                              | component docs                  |
| `ComboboxRoot`              | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxRootProps`         | retain   | Public props typing                              | component docs                  |
| `ComboboxSection`           | retain   | Grouped list sections in custom combobox         | combobox-field docs             |
| `ComboboxSectionProps`      | retain   | Public props typing                              | component docs                  |
| `ComboboxSize`              | retain   | Align custom combobox primitive size with fields | combobox primitive docs         |
| `ComboboxTray`              | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxTrayProps`         | retain   | Public props typing                              | component docs                  |
| `ComboboxTrayTrigger`       | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxTrayTriggerProps`  | retain   | Public props typing                              | component docs                  |
| `ComboboxTrigger`           | retain   | Primitive anatomy part                           | matching primitive docs         |
| `ComboboxTriggerProps`      | retain   | Public props typing                              | component docs                  |

### `@luke-ui/react/primitives/field`

| Symbol                    | Decision | Consumer use                   | Example                      |
| ------------------------- | -------- | ------------------------------ | ---------------------------- |
| `Field`                   | retain   | Primitive anatomy part         | matching primitive docs      |
| `FieldDescription`        | retain   | Primitive anatomy part         | matching primitive docs      |
| `FieldDescriptionProps`   | retain   | Public props typing            | component docs               |
| `FieldError`              | retain   | Primitive anatomy part         | matching primitive docs      |
| `FieldErrorProps`         | retain   | Public props typing            | component docs               |
| `FieldLabel`              | retain   | Primitive anatomy part         | matching primitive docs      |
| `FieldLabelProps`         | retain   | Public props typing            | component docs               |
| `FieldNecessityIndicator` | retain   | Primitive anatomy part         | matching primitive docs      |
| `FieldProps`              | retain   | Public props typing            | component docs               |
| `FieldRecipeVariants`     | retain   | Typed recipe variants          | matching recipe row above    |
| `InlineField`             | retain   | Primary component surface      | apps/docs component examples |
| `InlineFieldProps`        | retain   | Public props typing            | component docs               |
| `fieldRecipe`             | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/primitives/select`

| Symbol                 | Decision | Consumer use                                           | Example                       |
| ---------------------- | -------- | ------------------------------------------------------ | ----------------------------- |
| `SelectIndicator`      | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectIndicatorProps` | retain   | Public props typing                                    | component docs                |
| `SelectItem`           | retain   | List item in custom select or field re-export          | select-field / primitive docs |
| `SelectItemProps`      | retain   | Public props typing                                    | component docs                |
| `SelectListBox`        | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectListBoxProps`   | retain   | Public props typing                                    | component docs                |
| `SelectPopover`        | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectPopoverProps`   | retain   | Public props typing                                    | component docs                |
| `SelectRoot`           | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectRootProps`      | retain   | Public props typing                                    | component docs                |
| `SelectSize`           | retain   | Align custom select primitive size with field controls | select primitive docs         |
| `SelectTrigger`        | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectTriggerProps`   | retain   | Public props typing                                    | component docs                |
| `SelectValue`          | retain   | Primitive anatomy part                                 | matching primitive docs       |
| `SelectValueProps`     | retain   | Public props typing                                    | component docs                |

### `@luke-ui/react/primitives/text-input`

| Symbol                    | Decision | Consumer use                                       | Example                   |
| ------------------------- | -------- | -------------------------------------------------- | ------------------------- |
| `TextInput`               | retain   | Primitive anatomy part                             | matching primitive docs   |
| `TextInputControl`        | retain   | Primitive anatomy part                             | matching primitive docs   |
| `TextInputControlProps`   | retain   | Public props typing                                | component docs            |
| `TextInputPrefix`         | retain   | Primitive anatomy part                             | matching primitive docs   |
| `TextInputPrefixProps`    | retain   | Public props typing                                | component docs            |
| `TextInputProps`          | retain   | Public props typing                                | component docs            |
| `TextInputRecipeVariants` | retain   | Typed recipe variants                              | matching recipe row above |
| `TextInputRoot`           | retain   | Primitive anatomy part                             | matching primitive docs   |
| `TextInputRootProps`      | retain   | Public props typing                                | component docs            |
| `TextInputSize`           | retain   | Align custom text-input primitive size with fields | text-input primitive docs |
| `TextInputSuffix`         | retain   | Primitive anatomy part                             | matching primitive docs   |
| `TextInputSuffixProps`    | retain   | Public props typing                                | component docs            |
| `textInputRecipe`         | retain   | Recipe on canonical entrypoint                     | recipes table             |

### `@luke-ui/react/prose`

| Symbol                | Decision | Consumer use                   | Example                      |
| --------------------- | -------- | ------------------------------ | ---------------------------- |
| `Prose`               | retain   | Primary component surface      | apps/docs component examples |
| `ProseProps`          | retain   | Public props typing            | component docs               |
| `ProseRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `proseRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/provider`

| Symbol          | Decision | Consumer use        | Example         |
| --------------- | -------- | ------------------- | --------------- |
| `Provider`      | retain   | App setup from #712 | getting started |
| `ProviderProps` | retain   | Public props typing | component docs  |

### `@luke-ui/react/quote`

| Symbol       | Decision | Consumer use              | Example                      |
| ------------ | -------- | ------------------------- | ---------------------------- |
| `Quote`      | retain   | Primary component surface | apps/docs component examples |
| `QuoteProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/scroll-fade`

| Symbol                     | Decision | Consumer use                   | Example                      |
| -------------------------- | -------- | ------------------------------ | ---------------------------- |
| `ScrollFade`               | retain   | Primary component surface      | apps/docs component examples |
| `ScrollFadeAxis`           | retain   | Type scroll fade orientation   | scroll-fade docs             |
| `ScrollFadeProps`          | retain   | Public props typing            | component docs               |
| `ScrollFadeRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `scrollFadeRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/select-field`

| Symbol             | Decision | Consumer use                                  | Example                       |
| ------------------ | -------- | --------------------------------------------- | ----------------------------- |
| `SelectField`      | retain   | Primitive anatomy part                        | matching primitive docs       |
| `SelectFieldProps` | retain   | Public props typing                           | component docs                |
| `SelectItem`       | retain   | List item in custom select or field re-export | select-field / primitive docs |
| `SelectItemProps`  | retain   | Public props typing                           | component docs                |

### `@luke-ui/react/stack`

| Symbol       | Decision | Consumer use              | Example                      |
| ------------ | -------- | ------------------------- | ---------------------------- |
| `Stack`      | retain   | Primary component surface | apps/docs component examples |
| `StackProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/strong`

| Symbol        | Decision | Consumer use              | Example                      |
| ------------- | -------- | ------------------------- | ---------------------------- |
| `Strong`      | retain   | Primary component surface | apps/docs component examples |
| `StrongProps` | retain   | Public props typing       | component docs               |

### `@luke-ui/react/styles`

| Symbol            | Decision | Consumer use             | Example               |
| ----------------- | -------- | ------------------------ | --------------------- |
| `SprinklesProps`  | retain   | Public props typing      | component docs        |
| `breakpoints`     | retain   | Layout utility authoring | layout + styling docs |
| `createSprinkles` | retain   | Layout utility authoring | layout + styling docs |

### `@luke-ui/react/text-input-field`

| Symbol                | Decision | Consumer use           | Example                 |
| --------------------- | -------- | ---------------------- | ----------------------- |
| `TextInputField`      | retain   | Primitive anatomy part | matching primitive docs |
| `TextInputFieldProps` | retain   | Public props typing    | component docs          |

### `@luke-ui/react/text`

| Symbol               | Decision | Consumer use                   | Example                      |
| -------------------- | -------- | ------------------------------ | ---------------------------- |
| `Text`               | retain   | Primary component surface      | apps/docs component examples |
| `TextProps`          | retain   | Public props typing            | component docs               |
| `TextRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `textRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/theme`

| Symbol                   | Decision | Consumer use              | Example                      |
| ------------------------ | -------- | ------------------------- | ---------------------------- |
| `ColorInput`             | retain   | Primary component surface | apps/docs component examples |
| `ControlFinish`          | retain   | Primary component surface | apps/docs component examples |
| `DepthLadder`            | retain   | Primary component surface | apps/docs component examples |
| `ExtendingThemeInput`    | retain   | Primary component surface | apps/docs component examples |
| `FontWeightRole`         | retain   | Primary component surface | apps/docs component examples |
| `SpaceStep`              | retain   | Primary component surface | apps/docs component examples |
| `ThemeContrastError`     | retain   | Primary component surface | apps/docs component examples |
| `ThemeContrastFailure`   | retain   | Primary component surface | apps/docs component examples |
| `ThemeGenerationError`   | retain   | Primary component surface | apps/docs component examples |
| `ThemeInheritance`       | retain   | Primary component surface | apps/docs component examples |
| `ThemeInput`             | retain   | Primary component surface | apps/docs component examples |
| `TypeStyle`              | retain   | Primary component surface | apps/docs component examples |
| `defineTheme`            | retain   | Primary component surface | apps/docs component examples |
| `deriveConcentricRadius` | retain   | Primary component surface | apps/docs component examples |
| `deriveNestedRadius`     | retain   | Primary component surface | apps/docs component examples |
| `getThemeClassName`      | retain   | Primary component surface | apps/docs component examples |
| `rootClassName`          | retain   | Primary component surface | apps/docs component examples |
| `spaceScale`             | retain   | Primary component surface | apps/docs component examples |
| `typeStyles`             | retain   | Primary component surface | apps/docs component examples |
| `vars`                   | retain   | Primary component surface | apps/docs component examples |

### `@luke-ui/react/themes/paper`

| Symbol           | Decision | Consumer use                         | Example         |
| ---------------- | -------- | ------------------------------------ | --------------- |
| `theme`          | retain   | Bundled theme foundation until #715  | theming samples |
| `themeClassName` | retain   | Apply bundled theme class until #715 | theming samples |

### `@luke-ui/react/themes/tactile`

| Symbol           | Decision | Consumer use                         | Example         |
| ---------------- | -------- | ------------------------------------ | --------------- |
| `theme`          | retain   | Bundled theme foundation until #715  | theming samples |
| `themeClassName` | retain   | Apply bundled theme class until #715 | theming samples |

### `@luke-ui/react/track`

| Symbol                | Decision | Consumer use                   | Example                      |
| --------------------- | -------- | ------------------------------ | ---------------------------- |
| `Track`               | retain   | Primary component surface      | apps/docs component examples |
| `TrackProps`          | retain   | Public props typing            | component docs               |
| `TrackRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `trackRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/utils`

| Symbol       | Decision | Consumer use        | Example                    |
| ------------ | -------- | ------------------- | -------------------------- |
| `cx`         | retain   | Documented utility  | composition + styling docs |
| `mergeProps` | retain   | Public props typing | component docs             |
| `pxToRem`    | retain   | Documented utility  | composition + styling docs |

### `@luke-ui/react/visually-hidden`

| Symbol                         | Decision | Consumer use                   | Example                      |
| ------------------------------ | -------- | ------------------------------ | ---------------------------- |
| `VisuallyHidden`               | retain   | Primary component surface      | apps/docs component examples |
| `VisuallyHiddenProps`          | retain   | Public props typing            | component docs               |
| `VisuallyHiddenRecipeVariants` | retain   | Typed recipe variants          | matching recipe row above    |
| `visuallyHiddenRecipe`         | retain   | Recipe on canonical entrypoint | recipes table                |

### `@luke-ui/react/package.json`

| Symbol       | Decision | Consumer use                      | Example                  |
| ------------ | -------- | --------------------------------- | ------------------------ |
| `(metadata)` | retain   | Required static asset or metadata | provider / theming setup |

### `@luke-ui/react/stylesheet.css`

| Symbol                | Decision | Consumer use                      | Example                  |
| --------------------- | -------- | --------------------------------- | ------------------------ |
| `(shared stylesheet)` | retain   | Required static asset or metadata | provider / theming setup |

### `@luke-ui/react/spritesheet.svg`

| Symbol                | Decision | Consumer use                      | Example                  |
| --------------------- | -------- | --------------------------------- | ------------------------ |
| `(spritesheet asset)` | retain   | Required static asset or metadata | provider / theming setup |

### `@luke-ui/react/themes/tactile/stylesheet.css`

| Symbol          | Decision | Consumer use                      | Example                  |
| --------------- | -------- | --------------------------------- | ------------------------ |
| `(tactile CSS)` | retain   | Required static asset or metadata | provider / theming setup |

### `@luke-ui/react/themes/paper/stylesheet.css`

| Symbol        | Decision | Consumer use                      | Example                  |
| ------------- | -------- | --------------------------------- | ------------------------ |
| `(paper CSS)` | retain   | Required static asset or metadata | provider / theming setup |

## Meaningful removals and renames in this audit

| Change                                                                            | Reason                                                                  |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `mergeStyleProps` → `mergeProps`                                                  | Composition-oriented name. Event chaining and explicit `undefined` wins |
| Remove public `typedEntries` / `typedKeys` / `typedFromEntries` / `ObjectEntry`   | No independent consumer use                                             |
| Box-like `render` → `renderRoot`                                                  | Luke-owned root replacement vocabulary                                  |
| `renderRoot` receives full accepted root props                                    | Matches composition contract                                            |
| Remove duplicate `buttonRecipe` / `checkboxRecipe` from primitives entrypoints    | One canonical recipe path                                               |
| Remove public `HeadingTag`, `HeadingLevelsRenderProps`                            | No annotation need beyond inferred types                                |
| Remove public `iconViewBoxes`                                                     | Internal icon construction data                                         |
| Remove public `defaultBackdrop`, `defaultControlFinish`, `defaultDepth`           | Internal theme defaults only                                            |
| Constrain `LoadingSkeleton` `elementType` to `div` \| `li` \| `span`              | Narrow demonstrated substitutions                                       |
| Explicit exports for `theme`, `themes/*`, `utils`                                 | No public `export *`                                                    |
| High-level `Button` / `IconButton` omit RAC `render` and Button function children | Composition belongs on the button primitive                             |
| Add `VisuallyHiddenRecipeVariants`                                                | Public recipes export matching variants types                           |

## Delegated follow-ups

| Issue | Owns                                                          |
| ----- | ------------------------------------------------------------- |
| #714  | Form architecture (settled input for this audit)              |
| #712  | Icon/provider architecture (settled, visibility audited here) |
| #715  | Theme authoring and Tactile/Paper package extraction          |
| #716  | Control/token redesign                                        |
| #717  | Global stylesheet, reset, and cascade contract                |

No duplicate issue is opened for splitting bundled themes. #715 already covers it.
