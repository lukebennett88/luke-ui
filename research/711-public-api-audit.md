# #711 public API export audit

Temporary research artefact for issue [#711](https://github.com/lukebennett88/luke-ui/issues/711).
Not normative contributor guidance. Durable rules live in
[docs/PUBLIC_API.md](../docs/PUBLIC_API.md).

Decision values: **retain**, **change**, **remove**, **defer**.

## Cross-cutting dimensions reviewed

These were audited across the public surface. Notable rules are recorded in `docs/PUBLIC_API.md`.
Component-specific notes appear only where they change the contract.

### Controlled / uncontrolled

| Area                                                                       | Finding                                                                                                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Form fields (`TextInputField`, `SelectField`, `ComboboxField`, `Checkbox`) | Keep RAC-style `value`/`defaultValue` or `isSelected`/`defaultSelected` pairs from #714. Controlled mode requires the change handler.    |
| Open state on select/combobox                                              | High-level fields omit open-state control where #714 chose label/value-focused APIs; primitives retain RAC open pairs for custom chrome. |
| `LoadingSkeleton`                                                          | `isLoading` may be controlled locally or inherited from `LoadingSkeletonProvider`.                                                       |

### Meaningful defaults

| Default                                                | Why it matters                                            |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Button/Link `appearance`, `tone`, `prominence`, `size` | Product look without props.                               |
| Field control `size` (`medium`)                        | Aligns control chrome and icons.                          |
| Box `elementType` (`div`)                              | Structural default; mutual exclusivity with `renderRoot`. |
| LoadingSkeleton `elementType` (`div`)                  | Narrowed to `div` \| `li` \| `span`.                      |

Absence of optional layout/DOM props is not treated as a catalogue of public defaults.

### Slot

| Surface                                                            | Decision                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Primitives (button, select, combobox, field, text-input, checkbox) | Retain RAC `slot` where the primitive forwards RAC composition. |
| High-level form fields                                             | Omit `slot` (explicit on `SelectField`; same policy for peers). |
| High-level Button/IconButton/Link                                  | Do not expose RAC `slot` for free.                              |

### Render contracts

| Surface                      | Decision                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Box-like layout              | `renderRoot` with full accepted root props; mutually exclusive with `elementType`. |
| ScrollFade                   | Forbids `elementType` and `renderRoot`.                                            |
| High-level Button/IconButton | Omit RAC `render` and Button function children.                                    |
| Button primitive             | Retain RAC `render`.                                                               |
| Named `render<Name>`         | Only when a replaceable part is demonstrated.                                      |

### Refs

Root `ref` on the documented root. Named refs (`inputRef`, `triggerRef`) only for stable
field/trigger integration from #714.

### Variants

Colocate appearance variants on the component and its recipe. Standalone size unions stay public
only for primitive composition typing (`SelectSize`, `TextInputSize`, `ComboboxSize`).

## Recipe decisions

| Recipe                 | Decision   | Independent consumer use                                                                         |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `buttonRecipe`         | retain     | Button chrome on an app-owned element (`apps/docs/src/examples/styling/button-recipe.tsx`)       |
| `checkboxRecipe`       | retain     | Checkbox chrome with custom anatomy                                                              |
| `fieldRecipe`          | retain     | Field chrome in custom field trees                                                               |
| `textInputRecipe`      | retain     | Input chrome in custom controls                                                                  |
| `visuallyHiddenRecipe` | retain     | Visually hidden text without the component (`apps/docs/src/examples/visually-hidden/recipe.tsx`) |
| `iconRecipe`           | retain     | Size/colour on custom SVG via `createIcon`                                                       |
| `iconButtonRecipe`     | retain     | Icon-button chrome on an owned control                                                           |
| `linkRecipe`           | retain     | Link appearance on router/anchors the app owns                                                   |
| `textRecipe`           | retain     | Typography treatment on owned text elements                                                      |
| `blockquoteRecipe`     | retain     | Blockquote treatment in app-owned markup / MDX                                                   |
| `codeRecipe`           | retain     | Inline code treatment in app-owned markup / MDX                                                  |
| `kbdRecipe`            | retain     | Keyboard chip treatment in app-owned markup                                                      |
| `proseRecipe`          | retain     | Long-form rhythm on an owned content root (e.g. MDX article)                                     |
| `loadingSpinnerRecipe` | retain     | Spinner chrome without `LoadingSpinner` behaviour                                                |
| `gridRecipe`           | **remove** | Only sets `display: grid`. Apps use Box/`createSprinkles` or `Grid`                              |
| `aspectRatioRecipe`    | **remove** | Coupled to AspectRatio's media-frame child CSS; no credible standalone use                       |
| `trackRecipe`          | **remove** | Requires Track's centre/rail/root anatomy; use `Track` (FieldError imports privately)            |
| `containerRecipe`      | **remove** | Coupled to Container token/container-type behaviour; use `Container`                             |
| `scrollFadeRecipe`     | **remove** | Fade depends on ScrollFade-owned overflow measurement; use `ScrollFade`                          |

Matching `*RecipeVariants` follow the recipe decision.

## Other lower-level exports

| Export                                                          | Decision   | Consumer use                                                 |
| --------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `LoadingSkeletonProvider`                                       | retain     | Shared `isLoading` for a section of skeletons                |
| `SelectSize` / `TextInputSize` / `ComboboxSize`                 | retain     | Type `size` when composing custom field primitives           |
| `ComboboxItem` / `SelectItem` (field re-exports)                | retain     | Options for high-level fields (#714)                         |
| `cx` / `mergeProps` / `pxToRem`                                 | retain     | Class joining; composition/render prop merge; rem conversion |
| `createSprinkles` / `SprinklesProps` / `breakpoints`            | retain     | Layout utilities and typing                                  |
| `defineTheme` / `ThemeInput` / …                                | retain     | Author themes                                                |
| `vars` / `rootClassName` / `getThemeClassName`                  | retain     | Semantic tokens and theme identity classes                   |
| `typeStyles` / `spaceScale` / radius helpers                    | retain     | Custom typography/spacing/radius in app styles               |
| `ThemeContrastError` / `ThemeGenerationError` (+ failure types) | retain     | Catch/inspect theme build failures in tooling                |
| `defaultBackdrop` / `defaultControlFinish` / `defaultDepth`     | **remove** | Internal `defineTheme` defaults                              |
| `BoxLikeResolvedRenderProps`                                    | **remove** | Implementation typing; annotate via `BoxProps` / inference   |
| `iconViewBoxes`                                                 | **remove** | Internal icon construction data                              |
| `HeadingTag` / `HeadingLevelsRenderProps`                       | **remove** | No annotation need beyond inferred types                     |
| Typed utils (`typedEntries`, …)                                 | **remove** | Package-private                                              |

## Export inventory (post-settlement target)

Assets: `package.json`, `stylesheet.css`, `spritesheet.svg`, `themes/*/stylesheet.css` — **retain**.

### High-level components

For each component entrypoint, retain `Component` + `ComponentProps` as the product surface unless
noted.

| Subpath                             | Symbols (decision)                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `aspect-ratio`                      | `AspectRatio`, `AspectRatioProps` retain; recipe exports **remove**                 |
| `bleed`                             | `Bleed`, `BleedProps` retain                                                        |
| `blockquote`                        | component + `blockquoteRecipe` / variants retain                                    |
| `box`                               | `Box`, `BoxProps` retain; `BoxLikeResolvedRenderProps` **remove**                   |
| `button`                            | component + `buttonRecipe` / variants retain                                        |
| `checkbox`                          | component + `checkboxRecipe` / variants retain                                      |
| `cluster`                           | `Cluster`, `ClusterProps` retain                                                    |
| `code`                              | component + `codeRecipe` / variants retain                                          |
| `combobox-field`                    | field + item/section exports retain (#714)                                          |
| `container`                         | `Container`, `ContainerProps` retain; recipe exports **remove**                     |
| `em` / `emoji` / `strong` / `quote` | component + props retain                                                            |
| `grid`                              | `Grid`, `GridProps` retain; recipe exports **remove**                               |
| `heading`                           | Heading surface retain (see PUBLIC_API.md)                                          |
| `icon`                              | Icon surface + `iconRecipe` retain; `iconViewBoxes` already private                 |
| `icon-button`                       | component + recipe retain                                                           |
| `icon-link`                         | component + props retain                                                            |
| `kbd`                               | component + recipe retain                                                           |
| `link`                              | component + recipe retain                                                           |
| `loading-skeleton`                  | component + provider retain                                                         |
| `loading-spinner`                   | component + recipe retain                                                           |
| `numeral`                           | component + format helper types retain                                              |
| `prose`                             | component + recipe retain                                                           |
| `provider`                          | `Provider`, `ProviderProps` retain                                                  |
| `scroll-fade`                       | `ScrollFade`, `ScrollFadeAxis`, `ScrollFadeProps` retain; recipe exports **remove** |
| `select-field`                      | field + `SelectItem` retain (#714)                                                  |
| `stack`                             | `Stack`, `StackProps` retain                                                        |
| `text`                              | component + recipe retain                                                           |
| `text-input-field`                  | field + props retain (#714)                                                         |
| `track`                             | `Track`, `TrackProps` retain; recipe exports **remove**                             |
| `visually-hidden`                   | component + recipe retain                                                           |

### Primitives

Retain all current primitive anatomy exports under `primitives/*` for independent composition (#714
for form primitives). Recipes: `fieldRecipe`, `textInputRecipe` only (button/checkbox recipes live
on high-level entrypoints).

### Theme / themes / styles / utils

Retain current `@luke-ui/react/theme` exports after removal of the three defaults. Retain temporary
`themes/tactile` and `themes/paper` until #715. Retain styles and utils as above.

## Evidence of dimension review

- Controlled/uncontrolled: inspected field and checkbox prop types and #714 omit lists.
- Defaults: inspected Button, field controls, Box, LoadingSkeleton.
- Slot: confirmed high-level `SelectField` omits `slot`; primitives retain RAC forwarding.
- Render: Box-like `renderRoot` contract tests; Button omits `render`; primitive Button keeps RAC
  `render`.
- Refs: field `ref` / `inputRef` / `triggerRef` split reviewed against #714.
- Variants: recipe colocations and size helper types reviewed for independent typing need.
