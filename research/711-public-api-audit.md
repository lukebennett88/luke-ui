# #711 public API export audit

Temporary research for [#711](https://github.com/lukebennett88/luke-ui/issues/711). Not normative.
Durable rules live in [docs/PUBLIC_API.md](../docs/PUBLIC_API.md).

Decision values: **retain**, **change**, **remove**, **defer**.

Evidence is from `src/exports/` and the TypeScript sources on this branch.

## Relation to #714

[#714](https://github.com/lukebennett88/luke-ui/issues/714#issuecomment-5925988115) settled form
field names, parts, and semantics. It said `ComboboxField` keeps its current API, and handed recipe
visibility plus the generic `Text` / `VisuallyHidden` slot policy to #711.

#711 does **not** supersede #714 on ComboboxField. An earlier draft of this audit omitted
`onOpenChange` for symmetry with `SelectField`; that was wrong. RAC ComboBox exposes `onOpenChange`
without `isOpen` / `defaultOpen`, so the handler is an observable event, not half of a controlled
trio. `ComboboxField` keeps `onOpenChange` and still omits `slot` (RAC defines no ComboBox child
slot).

#711 does supersede the #714 “retain” placeholder for `checkboxRecipe`, `fieldRecipe`, and (by the
same anatomy test) `loadingSpinnerRecipe`: those recipes stay package-private.

## Cross-cutting dimensions

### Controlled / uncontrolled

| Area                                                                       | Finding                                                                                                                                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form fields (`TextInputField`, `SelectField`, `ComboboxField`, `Checkbox`) | Keep RAC-style value / selection pairs from #714. Public types allow a controlled value prop and its handler independently; they do not require the matching handler. |
| Open state                                                                 | `SelectField` omits `defaultOpen`, `isOpen`, and `onOpenChange`. `ComboboxField` keeps `onOpenChange` only. Primitives retain what RAC exposes for custom chrome.     |
| `LoadingSkeleton`                                                          | `isLoading` may be local or inherited from `LoadingSkeletonProvider`.                                                                                                 |

### Meaningful defaults

| Default                                           | Why it matters                                            |
| ------------------------------------------------- | --------------------------------------------------------- |
| Button `appearance`, `tone`, `prominence`, `size` | Product look without props.                               |
| Link `appearance`, `prominence`, `size`           | Link has no `tone`.                                       |
| Field control `size` (`medium`)                   | Aligns control chrome and icons.                          |
| Box `elementType` (`div`)                         | Structural default; mutually exclusive with `renderRoot`. |
| LoadingSkeleton `elementType` (`span`)            | Narrowed to `div` \| `li` \| `span`.                      |

### Slot

| Surface                                       | Decision                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Primitives                                    | Retain RAC `slot` where the wrapped RAC component exposes it.                                         |
| High-level `Button`, `IconButton`, `Checkbox` | Keep `slot` for RAC parent slots (`close` in Dialog; `selection` in GridList / Table).                |
| High-level `Link`, `IconLink`, form fields    | Omit `slot`. There is no public link primitive; use React Aria `Link` when slot composition needs it. |
| `Text` / `VisuallyHidden`                     | Deferred: VisuallyHidden tracked in #756; Text still open.                                            |

### Render contracts

| Surface                      | Decision                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Box-like layout              | `renderRoot` receives `children`, `className`, `style`, and a callback `ref`. Put other DOM attributes on the element the callback returns. Mutually exclusive with `elementType`. |
| ScrollFade                   | Forbids `elementType` and `renderRoot`.                                                                                                                                            |
| High-level Button/IconButton | Omit RAC `render` and Button function children. Use `@luke-ui/react/primitives/button` for RAC `render`.                                                                           |
| Button primitive             | Retain RAC `render`.                                                                                                                                                               |
| Named `render<Name>`         | Only when a replaceable part is demonstrated.                                                                                                                                      |

### Refs

Root `ref` on the documented root. Named refs (`inputRef`, `triggerRef`) only for stable
field/trigger integration from #714.

### Variants

Colocate appearance variants on the component and its public recipe. Standalone size unions stay
public only for primitive composition typing (`SelectSize`, `TextInputSize`, `ComboboxSize`).

## Recipe decisions

| Recipe                 | Decision   | Independent consumer use                                                                   |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `buttonRecipe`         | retain     | Button chrome on an app-owned element (`apps/docs/src/examples/styling/button-recipe.tsx`) |
| `textInputRecipe`      | retain     | Input chrome on an owned control                                                           |
| `iconRecipe`           | retain     | Size/colour on custom SVG via `createIcon`                                                 |
| `iconButtonRecipe`     | retain     | Icon-button chrome on an owned control                                                     |
| `linkRecipe`           | retain     | Link appearance on router/anchors the app owns                                             |
| `textRecipe`           | retain     | Typography treatment on owned text elements                                                |
| `blockquoteRecipe`     | retain     | Blockquote treatment in app-owned markup / MDX                                             |
| `codeRecipe`           | retain     | Inline code treatment in app-owned markup / MDX                                            |
| `kbdRecipe`            | retain     | Keyboard chip treatment in app-owned markup                                                |
| `proseRecipe`          | retain     | Long-form rhythm on an owned content root                                                  |
| `checkboxRecipe`       | **remove** | Multi-part anatomy; use `Checkbox` or checkbox primitives                                  |
| `fieldRecipe`          | **remove** | Multi-part field chrome; use Field primitives                                              |
| `loadingSpinnerRecipe` | **remove** | Geometry and animation coupled to `LoadingSpinner`                                         |
| `visuallyHiddenRecipe` | **remove** | Use `VisuallyHidden` + `elementType`                                                       |
| `gridRecipe`           | **remove** | Only sets `display: grid`                                                                  |
| `aspectRatioRecipe`    | **remove** | Coupled to AspectRatio media-frame child CSS                                               |
| `trackRecipe`          | **remove** | Requires Track anatomy                                                                     |
| `containerRecipe`      | **remove** | Coupled to Container token behaviour                                                       |
| `scrollFadeRecipe`     | **remove** | Depends on ScrollFade-owned overflow measurement                                           |

Matching `*RecipeVariants` follow the recipe. Generators scaffold an internal recipe file but do not
export it until an independent consumer use exists.

## Other lower-level exports

| Export                                                      | Decision   | Consumer use                                                      |
| ----------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| `LoadingSkeletonProvider`                                   | retain     | Shared `isLoading` for a section of skeletons                     |
| `SelectSize` / `TextInputSize` / `ComboboxSize`             | retain     | Type `size` when composing custom field primitives                |
| `ComboboxItem` / `SelectItem` (field re-exports)            | retain     | Options for high-level fields (#714)                              |
| `cx` / `mergeProps` / `pxToRem`                             | retain     | Class joining; prop merge (style + handlers/refs); rem conversion |
| `createSprinkles` / `SprinklesProps` / `breakpoints`        | retain     | Layout utilities and typing                                       |
| Theme authoring (`defineTheme`, `vars`, …)                  | retain     | Author themes                                                     |
| `defaultBackdrop` / `defaultControlFinish` / `defaultDepth` | **remove** | Internal `defineTheme` defaults                                   |
| `BoxLikeResolvedRenderProps`                                | **remove** | Implementation typing                                             |
| `iconViewBoxes`                                             | **remove** | Internal icon construction data                                   |
| `HeadingTag` / `HeadingLevelsRenderProps`                   | **remove** | No annotation need beyond inferred types                          |
| Typed utils (`typedEntries`, …)                             | **remove** | Package-private                                                   |

`mergeProps` joins `className` with `cx`, shallow-merges `style`, chains `on*` handlers, merges
`ref`, and deduplicates `id`. It ignores a later non-string `className` or non-object `style`, so
absent presentation does not clear earlier values. Every other prop takes the last defined value.

## Export inventory (post-settlement)

Assets: `package.json`, `stylesheet.css`, `spritesheet.svg`, `themes/*/stylesheet.css` — **retain**.

### High-level components

| Subpath                             | Symbols (decision)                                                                                         |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `aspect-ratio`                      | `AspectRatio`, `AspectRatioProps` retain; recipe exports **remove**                                        |
| `bleed`                             | `Bleed`, `BleedProps` retain                                                                               |
| `blockquote`                        | component + `blockquoteRecipe` / variants retain                                                           |
| `box`                               | `Box`, `BoxProps` retain                                                                                   |
| `button`                            | component + `buttonRecipe` / variants retain; omit RAC `render`; keep `slot`                               |
| `checkbox`                          | component + props retain; recipe **remove**; keep `slot`                                                   |
| `cluster`                           | `Cluster`, `ClusterProps` retain                                                                           |
| `code`                              | component + `codeRecipe` / variants retain                                                                 |
| `combobox-field`                    | field + item/section exports retain (#714); keep `onOpenChange`; omit `slot`                               |
| `container`                         | `Container`, `ContainerProps` retain; recipe exports **remove**                                            |
| `em` / `emoji` / `strong` / `quote` | component + props retain                                                                                   |
| `grid`                              | `Grid`, `GridProps` retain; recipe exports **remove**                                                      |
| `heading`                           | `Heading`, `HeadingProps`, `HeadingLevel`, `HeadingLevels`, `HeadingLevelsProps`, `useHeadingLevel` retain |
| `icon`                              | Icon surface + `iconRecipe` retain                                                                         |
| `icon-button`                       | component + recipe retain; omit RAC `render`; keep `slot`                                                  |
| `icon-link`                         | component + props retain; omit `slot`                                                                      |
| `kbd`                               | component + recipe retain                                                                                  |
| `link`                              | component + recipe retain; omit `slot`                                                                     |
| `loading-skeleton`                  | component + provider retain                                                                                |
| `loading-spinner`                   | component retain; recipe **remove**                                                                        |
| `numeral`                           | component + format helper types retain                                                                     |
| `prose`                             | component + recipe retain                                                                                  |
| `provider`                          | `Provider`, `ProviderProps` retain                                                                         |
| `scroll-fade`                       | `ScrollFade`, `ScrollFadeAxis`, `ScrollFadeProps` retain; recipe exports **remove**                        |
| `select-field`                      | field + `SelectItem` retain (#714); omit open-state and `slot`                                             |
| `stack`                             | `Stack`, `StackProps` retain                                                                               |
| `text`                              | component + recipe retain                                                                                  |
| `text-input-field`                  | field + props retain (#714); omit `slot`                                                                   |
| `track`                             | `Track`, `TrackProps` retain; recipe exports **remove**                                                    |
| `visually-hidden`                   | `VisuallyHidden`, `VisuallyHiddenProps` retain; recipe exports **remove**                                  |

### Primitives

Retain current primitive anatomy under `primitives/*` for independent composition (#714 for form
primitives). Public recipes on primitives: `textInputRecipe` only. Button and checkbox recipes are
not re-exported from their primitive entrypoints; button chrome is on `@luke-ui/react/button`.

### Theme / themes / styles / utils

Retain `@luke-ui/react/theme` after removal of the three defaults. Retain temporary `themes/tactile`
and `themes/paper` until #715. Retain styles. Utils: `cx`, `mergeProps`, `pxToRem`.
