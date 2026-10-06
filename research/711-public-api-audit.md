# #711 public API audit

Branch evidence for [#711](https://github.com/lukebennett88/luke-ui/issues/711) and
[PR #757](https://github.com/lukebennett88/luke-ui/pull/757). This file is non-normative.
[docs/PUBLIC_API.md](../docs/PUBLIC_API.md) contains the durable rules.

**Retain** keeps an independently useful public contract. **Change** keeps the export but changes
its contract in this PR. **Private** removes an export from package entrypoints. A later issue owns
only the explicitly deferred redesign, not an undecided visibility decision.

Evidence comes from the current package `exports` map, every module in `src/exports/`, and the
implementation, public types, recipes and theme contract those modules reference. Paths in the
inventory are relative to `packages/@luke-ui/react/`. Every listed entrypoint is retained. Each
symbol has its own decision and consumer use below. There is no root entrypoint or primitives
barrel. Inherited DOM props remain supported through the declared upstream/native prop type, rather
than being duplicated here. The component tables record Luke UI additions, constraints, state
ownership and defaults that affect behaviour or presentation.

## Settled boundaries

[#712](https://github.com/lukebennett88/luke-ui/issues/712) settled application `Provider`, external
spritesheet setup and custom icons. Retain that architecture.
[#714](https://github.com/lukebennett88/luke-ui/issues/714#issuecomment-5925988115) settled form
names, parts, validation and root/control ownership. Retain that architecture. Its recipe-visibility
and generic Text/VisuallyHidden slot placeholders are decided here.

`ComboboxField.onOpenChange` stays public. RAC offers the notification without `isOpen` or
`defaultOpen`, so it is an event rather than an incomplete controlled pair. `SelectField` omits all
three open-state props. Both decisions preserve #714.

`Text.slot` stays public for styled named text in app-composed RAC fields, dialogs and collection
items. Text-derived components retain that inherited context seam. `VisuallyHidden.slot` is retained
on this branch for accessible-only named text. Its implementation migration is tracked in
[#756](https://github.com/lukebennett88/luke-ui/issues/756). That follow-up does not leave the
current export or slot decision open.

## Entrypoints and exported symbols

A component props type earns its export by typing consumer wrappers and configuration. Primitive
parts earn theirs through custom anatomy rather than internal reuse. Public recipe selection types
travel with their independently usable recipe only when that recipe has selectable variants. Type
names in this inventory are exports, not new runtime values.

### `@luke-ui/react/aspect-ratio`

Source: [src/exports/aspect-ratio.ts](../packages/@luke-ui/react/src/exports/aspect-ratio.ts).
Entrypoint: **retain**.

| Symbol             | Decision | Independent consumer use                                                                    |
| ------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `AspectRatio`      | change   | Frame app media at a chosen ratio and object fit.                                           |
| `AspectRatioProps` | change   | Type an app wrapper around `AspectRatio`. Frame app media at a chosen ratio and object fit. |

### `@luke-ui/react/bleed`

Source: [src/exports/bleed.ts](../packages/@luke-ui/react/src/exports/bleed.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                                 |
| ------------ | -------- | ---------------------------------------------------------------------------------------- |
| `Bleed`      | change   | Extend content into parent padding by logical edges.                                     |
| `BleedProps` | change   | Type an app wrapper around `Bleed`. Extend content into parent padding by logical edges. |

### `@luke-ui/react/blockquote`

Source: [src/exports/blockquote.ts](../packages/@luke-ui/react/src/exports/blockquote.ts).
Entrypoint: **retain**.

| Symbol             | Decision | Independent consumer use                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------- |
| `Blockquote`       | retain   | Render a styled block quotation.                                          |
| `BlockquoteProps`  | retain   | Type an app wrapper around `Blockquote`. Render a styled block quotation. |
| `blockquoteRecipe` | retain   | Apply the border and inset to an app-owned blockquote.                    |

### `@luke-ui/react/box`

Source: [src/exports/box.ts](../packages/@luke-ui/react/src/exports/box.ts). Entrypoint: **retain**.

| Symbol     | Decision | Independent consumer use                                                                                 |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `Box`      | change   | Apply supported responsive layout and appearance to structural markup.                                   |
| `BoxProps` | change   | Type an app wrapper around `Box`. Apply supported responsive layout and appearance to structural markup. |

### `@luke-ui/react/button`

Source: [src/exports/button.ts](../packages/@luke-ui/react/src/exports/button.ts). Entrypoint:
**retain**.

| Symbol                 | Decision | Independent consumer use                                                                                                |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `Button`               | retain   | Trigger an accessible action with the standard presentation and pending treatment.                                      |
| `ButtonProps`          | change   | Type an app wrapper around `Button`. Trigger an accessible action with the standard presentation and pending treatment. |
| `ButtonRecipeVariants` | retain   | Type the supported selection passed to `buttonRecipe` in an app-owned styling wrapper.                                  |
| `buttonRecipe`         | retain   | Style an app-owned button with the supported action presentation.                                                       |

### `@luke-ui/react/checkbox`

Source: [src/exports/checkbox.ts](../packages/@luke-ui/react/src/exports/checkbox.ts). Entrypoint:
**retain**.

| Symbol          | Decision | Independent consumer use                                                                           |
| --------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `Checkbox`      | retain   | Render a labelled checkbox with description and validation.                                        |
| `CheckboxProps` | change   | Type an app wrapper around `Checkbox`. Render a labelled checkbox with description and validation. |

### `@luke-ui/react/cluster`

Source: [src/exports/cluster.ts](../packages/@luke-ui/react/src/exports/cluster.ts). Entrypoint:
**retain**.

| Symbol         | Decision | Independent consumer use                                              |
| -------------- | -------- | --------------------------------------------------------------------- |
| `Cluster`      | change   | Lay out wrapping inline groups.                                       |
| `ClusterProps` | change   | Type an app wrapper around `Cluster`. Lay out wrapping inline groups. |

### `@luke-ui/react/code`

Source: [src/exports/code.ts](../packages/@luke-ui/react/src/exports/code.ts). Entrypoint:
**retain**.

| Symbol               | Decision | Independent consumer use                                                             |
| -------------------- | -------- | ------------------------------------------------------------------------------------ |
| `Code`               | retain   | Render an inline code fragment.                                                      |
| `CodeProps`          | retain   | Type an app wrapper around `Code`. Render an inline code fragment.                   |
| `CodeRecipeVariants` | retain   | Type the supported selection passed to `codeRecipe` in an app-owned styling wrapper. |
| `codeRecipe`         | retain   | Style app-owned code markup with independently chosen wrapping.                      |

### `@luke-ui/react/combobox-field`

Source: [src/exports/combobox-field.ts](../packages/@luke-ui/react/src/exports/combobox-field.ts).
Entrypoint: **retain**.

| Symbol                 | Decision | Independent consumer use                                                                                                         |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `ComboboxField`        | retain   | Render a labelled searchable single-select, including async and mobile presentation.                                             |
| `ComboboxFieldProps`   | change   | Type an app wrapper around `ComboboxField`. Render a labelled searchable single-select, including async and mobile presentation. |
| `ComboboxItem`         | retain   | Provide an option for a combobox field or custom combobox.                                                                       |
| `ComboboxItemProps`    | retain   | Type an app wrapper around `ComboboxItem`. Provide an option for a combobox field or custom combobox.                            |
| `ComboboxSection`      | retain   | Group combobox options with an optional static heading.                                                                          |
| `ComboboxSectionProps` | retain   | Type an app wrapper around `ComboboxSection`. Group combobox options with an optional static heading.                            |

### `@luke-ui/react/container`

Source: [src/exports/container.ts](../packages/@luke-ui/react/src/exports/container.ts). Entrypoint:
**retain**.

| Symbol           | Decision | Independent consumer use                                                                        |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `Container`      | change   | Constrain content and establish a size-query container.                                         |
| `ContainerProps` | change   | Type an app wrapper around `Container`. Constrain content and establish a size-query container. |

### `@luke-ui/react/em`

Source: [src/exports/em.ts](../packages/@luke-ui/react/src/exports/em.ts). Entrypoint: **retain**.

| Symbol    | Decision | Independent consumer use                                                                    |
| --------- | -------- | ------------------------------------------------------------------------------------------- |
| `Em`      | retain   | Render semantic stress emphasis with inherited typography.                                  |
| `EmProps` | retain   | Type an app wrapper around `Em`. Render semantic stress emphasis with inherited typography. |

### `@luke-ui/react/emoji`

Source: [src/exports/emoji.ts](../packages/@luke-ui/react/src/exports/emoji.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                               |
| ------------ | -------- | -------------------------------------------------------------------------------------- |
| `Emoji`      | retain   | Render an emoji with an explicit accessible label.                                     |
| `EmojiProps` | retain   | Type an app wrapper around `Emoji`. Render an emoji with an explicit accessible label. |

### `@luke-ui/react/grid`

Source: [src/exports/grid.ts](../packages/@luke-ui/react/src/exports/grid.ts). Entrypoint:
**retain**.

| Symbol      | Decision | Independent consumer use                                                                                 |
| ----------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `Grid`      | change   | Lay out tracks and named areas using responsive container thresholds.                                    |
| `GridProps` | change   | Type an app wrapper around `Grid`. Lay out tracks and named areas using responsive container thresholds. |

### `@luke-ui/react/heading`

Source: [src/exports/heading.ts](../packages/@luke-ui/react/src/exports/heading.ts). Entrypoint:
**retain**.

| Symbol               | Decision | Independent consumer use                                                                                        |
| -------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `Heading`            | retain   | Render a heading with the current semantic level and matching typography.                                       |
| `HeadingLevel`       | retain   | Type a semantic heading level (1–6) in an app component.                                                        |
| `HeadingLevels`      | retain   | Make a reusable section advance its heading outline in a containing page.                                       |
| `HeadingProps`       | retain   | Type an app wrapper around `Heading`. Render a heading with the current semantic level and matching typography. |
| `useHeadingLevel`    | retain   | Build an app-owned heading using the current outline level without advancing it.                                |
| `HeadingLevelsProps` | retain   | Type a section wrapper accepting a base level and heading-aware children.                                       |

### `@luke-ui/react/icon-button`

Source: [src/exports/icon-button.ts](../packages/@luke-ui/react/src/exports/icon-button.ts).
Entrypoint: **retain**.

| Symbol                     | Decision | Independent consumer use                                                                                         |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `IconButton`               | retain   | Trigger an icon-only action with an explicit accessible name.                                                    |
| `IconButtonProps`          | change   | Type an app wrapper around `IconButton`. Trigger an icon-only action with an explicit accessible name.           |
| `IconButtonRecipeVariants` | retain   | Type the supported selection passed to `iconButtonRecipe` in an app-owned styling wrapper.                       |
| `iconButtonRecipe`         | retain   | Set small/medium square inline sizing on an app-owned control, composed with buttonRecipe and app-owned padding. |

### `@luke-ui/react/icon-link`

Source: [src/exports/icon-link.ts](../packages/@luke-ui/react/src/exports/icon-link.ts). Entrypoint:
**retain**.

| Symbol          | Decision | Independent consumer use                                                                                    |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `IconLink`      | retain   | Navigate through an icon-only link with an explicit accessible name.                                        |
| `IconLinkProps` | change   | Type an app wrapper around `IconLink`. Navigate through an icon-only link with an explicit accessible name. |

### `@luke-ui/react/icon`

Source: [src/exports/icon.ts](../packages/@luke-ui/react/src/exports/icon.ts). Entrypoint:
**retain**.

| Symbol               | Decision | Independent consumer use                                                                         |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `CreateIconOptions`  | retain   | Type reusable custom-icon construction configuration.                                            |
| `CustomIconProps`    | retain   | Type additional props on an icon made by createIcon.                                             |
| `createIcon`         | retain   | Build a custom brand or domain icon with the shared size and accessibility treatment.            |
| `Icon`               | retain   | Render a named bundled icon using the configured spritesheet.                                    |
| `IconName`           | retain   | Type an app icon selector using the generated bundled names.                                     |
| `IconProps`          | retain   | Type an app wrapper around `Icon`. Render a named bundled icon using the configured spritesheet. |
| `IconSizeProvider`   | retain   | Set the default size of custom icon compositions and descendant spinners.                        |
| `iconNames`          | retain   | Build a picker or gallery over the bundled icon names.                                           |
| `IconRecipeVariants` | retain   | Type the supported selection passed to `iconRecipe` in an app-owned styling wrapper.             |
| `iconRecipe`         | retain   | Size an app-owned SVG without using the bundled Icon component.                                  |

### `@luke-ui/react/kbd`

Source: [src/exports/kbd.ts](../packages/@luke-ui/react/src/exports/kbd.ts). Entrypoint: **retain**.

| Symbol      | Decision | Independent consumer use                                        |
| ----------- | -------- | --------------------------------------------------------------- |
| `Kbd`       | retain   | Render styled keyboard input.                                   |
| `KbdProps`  | retain   | Type an app wrapper around `Kbd`. Render styled keyboard input. |
| `kbdRecipe` | retain   | Style app-owned keyboard markup.                                |

### `@luke-ui/react/link`

Source: [src/exports/link.ts](../packages/@luke-ui/react/src/exports/link.ts). Entrypoint:
**retain**.

| Symbol               | Decision | Independent consumer use                                                                         |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `Link`               | retain   | Navigate with a required URL and text or button presentation.                                    |
| `LinkProps`          | change   | Type an app wrapper around `Link`. Navigate with a required URL and text or button presentation. |
| `LinkRecipeVariants` | retain   | Type the supported selection passed to `linkRecipe` in an app-owned styling wrapper.             |
| `linkRecipe`         | retain   | Style an app-owned anchor or router component.                                                   |

### `@luke-ui/react/loading-skeleton`

Source:
[src/exports/loading-skeleton.ts](../packages/@luke-ui/react/src/exports/loading-skeleton.ts).
Entrypoint: **retain**.

| Symbol                         | Decision | Independent consumer use                                                                           |
| ------------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| `LoadingSkeleton`              | retain   | Mask loading content while preserving its footprint.                                               |
| `LoadingSkeletonProps`         | change   | Type an app wrapper around `LoadingSkeleton`. Mask loading content while preserving its footprint. |
| `LoadingSkeletonProvider`      | retain   | Set one loading condition for a section containing several skeletons.                              |
| `LoadingSkeletonProviderProps` | retain   | Type a section wrapper passing shared loading state.                                               |

### `@luke-ui/react/loading-spinner`

Source: [src/exports/loading-spinner.ts](../packages/@luke-ui/react/src/exports/loading-spinner.ts).
Entrypoint: **retain**.

| Symbol                | Decision | Independent consumer use                                                                                    |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `LoadingSpinner`      | retain   | Announce loading and optionally reserve the content footprint.                                              |
| `LoadingSpinnerProps` | retain   | Type an app wrapper around `LoadingSpinner`. Announce loading and optionally reserve the content footprint. |

### `@luke-ui/react/numeral`

Source: [src/exports/numeral.ts](../packages/@luke-ui/react/src/exports/numeral.ts). Entrypoint:
**retain**.

| Symbol                | Decision | Independent consumer use                                                            |
| --------------------- | -------- | ----------------------------------------------------------------------------------- |
| `Numeral`             | retain   | Render a locale-aware number with typography.                                       |
| `NumeralAbbreviation` | retain   | Type a number-format preference for compact short or long notation.                 |
| `NumeralFormat`       | retain   | Type a decimal, percent, currency or unit preference.                               |
| `NumeralPrecision`    | retain   | Type fixed or minimum/maximum fraction-digit preferences.                           |
| `NumeralProps`        | retain   | Type an app wrapper around `Numeral`. Render a locale-aware number with typography. |

### `@luke-ui/react/primitives/button`

Source:
[src/exports/primitives/button.ts](../packages/@luke-ui/react/src/exports/primitives/button.ts).
Entrypoint: **retain**.

| Symbol        | Decision | Independent consumer use                                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `Button`      | retain   | Compose an app-owned button label and interaction content with RAC rendering.                                      |
| `ButtonProps` | retain   | Type an app wrapper around `Button`. Compose an app-owned button label and interaction content with RAC rendering. |

### `@luke-ui/react/primitives/checkbox`

Source:
[src/exports/primitives/checkbox.ts](../packages/@luke-ui/react/src/exports/primitives/checkbox.ts).
Entrypoint: **retain**.

| Symbol                   | Decision | Independent consumer use                                                                                                     |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `CheckboxContent`        | retain   | Compose the native checkbox label around the visual control and label text.                                                  |
| `CheckboxContentProps`   | retain   | Type an app wrapper around `CheckboxContent`. Compose the native checkbox label around the visual control and label text.    |
| `CheckboxControl`        | retain   | Position the fixed visual checkbox control independently of label line height.                                               |
| `CheckboxControlProps`   | retain   | Type an app wrapper around `CheckboxControl`. Position the fixed visual checkbox control independently of label line height. |
| `CheckboxIndicator`      | retain   | Render the selected, mixed, disabled and invalid visual affordance.                                                          |
| `CheckboxIndicatorProps` | retain   | Type an app wrapper around `CheckboxIndicator`. Render the selected, mixed, disabled and invalid visual affordance.          |
| `CheckboxLabel`          | retain   | Compose visible checkbox text with the required marker.                                                                      |
| `CheckboxLabelProps`     | retain   | Type an app wrapper around `CheckboxLabel`. Compose visible checkbox text with the required marker.                          |
| `CheckboxRoot`           | retain   | Own checkbox selection, validation and size in a custom checkbox composition.                                                |
| `CheckboxRootProps`      | retain   | Type an app wrapper around `CheckboxRoot`. Own checkbox selection, validation and size in a custom checkbox composition.     |

### `@luke-ui/react/primitives/combobox`

Source:
[src/exports/primitives/combobox.ts](../packages/@luke-ui/react/src/exports/primitives/combobox.ts).
Entrypoint: **retain**.

| Symbol                      | Decision | Independent consumer use                                                                                                                |
| --------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ComboboxClearButtonProps`  | retain   | Type an app wrapper around `ComboboxClearButton`. Compose the action that clears selected key and input text.                           |
| `ComboboxClearButton`       | retain   | Compose the action that clears selected key and input text.                                                                             |
| `ComboboxControlProps`      | retain   | Type an app wrapper around `ComboboxControl`. Compose visual chrome around input/actions or a mobile trigger.                           |
| `ComboboxControl`           | retain   | Compose visual chrome around input/actions or a mobile trigger.                                                                         |
| `ComboboxEmptyStateProps`   | retain   | Type an app wrapper around `ComboboxEmptyState`. Style app-supplied no-results or loading content.                                      |
| `ComboboxEmptyState`        | retain   | Style app-supplied no-results or loading content.                                                                                       |
| `ComboboxInputProps`        | retain   | Type an app wrapper around `ComboboxInput`. Compose the desktop combobox input or mobile tray search input.                             |
| `ComboboxInput`             | retain   | Compose the desktop combobox input or mobile tray search input.                                                                         |
| `ComboboxItemProps`         | retain   | Type an app wrapper around `ComboboxItem`. Provide an option for a combobox field or custom combobox.                                   |
| `ComboboxLoadMoreItemProps` | retain   | Type an app wrapper around `ComboboxLoadMoreItem`. Compose a collection sentinel with async loading and load-more handling.             |
| `ComboboxItem`              | retain   | Provide an option for a combobox field or custom combobox.                                                                              |
| `ComboboxLoadMoreItem`      | retain   | Compose a collection sentinel with async loading and load-more handling.                                                                |
| `ComboboxListBoxProps`      | retain   | Type an app wrapper around `ComboboxListBox`. Compose dynamic/static options, empty state and an appended load-more sentinel.           |
| `ComboboxListBox`           | retain   | Compose dynamic/static options, empty state and an appended load-more sentinel.                                                         |
| `ComboboxPopoverProps`      | retain   | Type an app wrapper around `ComboboxPopover`. Compose the desktop portalled options surface.                                            |
| `ComboboxPopover`           | retain   | Compose the desktop portalled options surface.                                                                                          |
| `ComboboxRootProps`         | retain   | Type an app wrapper around `ComboboxRoot`. Own selected key, input text, filtering, validation and size for a custom searchable select. |
| `ComboboxSize`              | retain   | Type consistent size across a custom combobox composition.                                                                              |
| `ComboboxRoot`              | retain   | Own selected key, input text, filtering, validation and size for a custom searchable select.                                            |
| `ComboboxSectionProps`      | retain   | Type an app wrapper around `ComboboxSection`. Group combobox options with an optional static heading.                                   |
| `ComboboxSection`           | retain   | Group combobox options with an optional static heading.                                                                                 |
| `ComboboxTrayProps`         | retain   | Type an app wrapper around `ComboboxTray`. Compose a full-screen mobile options surface from search and listbox parts.                  |
| `ComboboxTray`              | retain   | Compose a full-screen mobile options surface from search and listbox parts.                                                             |
| `ComboboxTrayTriggerProps`  | retain   | Type an app wrapper around `ComboboxTrayTrigger`. Compose a mobile trigger that shows selection and preserves validation/submission.    |
| `ComboboxTrayTrigger`       | retain   | Compose a mobile trigger that shows selection and preserves validation/submission.                                                      |
| `ComboboxTriggerProps`      | retain   | Type an app wrapper around `ComboboxTrigger`. Compose a desktop button that opens combobox options.                                     |
| `ComboboxTrigger`           | retain   | Compose a desktop button that opens combobox options.                                                                                   |

### `@luke-ui/react/primitives/field`

Source:
[src/exports/primitives/field.ts](../packages/@luke-ui/react/src/exports/primitives/field.ts).
Entrypoint: **retain**.

| Symbol                    | Decision | Independent consumer use                                                                                                             |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `Field`                   | retain   | Compose stacked label, control, description and error presentation inside a semantic field root.                                     |
| `FieldDescription`        | retain   | Connect styled helper content through the RAC description slot.                                                                      |
| `FieldDescriptionProps`   | retain   | Type an app wrapper around `FieldDescription`. Connect styled helper content through the RAC description slot.                       |
| `FieldError`              | retain   | Render native or controlled validation content and the leading error cue.                                                            |
| `FieldErrorProps`         | retain   | Type an app wrapper around `FieldError`. Render native or controlled validation content and the leading error cue.                   |
| `FieldLabel`              | retain   | Compose a custom field label with its required marker.                                                                               |
| `FieldLabelProps`         | retain   | Type an app wrapper around `FieldLabel`. Compose a custom field label with its required marker.                                      |
| `FieldNecessityIndicator` | retain   | Type a shared required-label presentation preference (icon or label).                                                                |
| `FieldProps`              | retain   | Type an app wrapper around `Field`. Compose stacked label, control, description and error presentation inside a semantic field root. |
| `InlineField`             | retain   | Place checkbox description and error beneath its label text.                                                                         |
| `InlineFieldProps`        | retain   | Type an app wrapper around `InlineField`. Place checkbox description and error beneath its label text.                               |

### `@luke-ui/react/primitives/select`

Source:
[src/exports/primitives/select.ts](../packages/@luke-ui/react/src/exports/primitives/select.ts).
Entrypoint: **retain**.

| Symbol                 | Decision | Independent consumer use                                                                                                |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `SelectIndicator`      | retain   | Replace the chevron while retaining the documented open-state affordance.                                               |
| `SelectIndicatorProps` | retain   | Type an app wrapper around `SelectIndicator`. Replace the chevron while retaining the documented open-state affordance. |
| `SelectItem`           | retain   | Provide a selectable option for a select field or custom select.                                                        |
| `SelectItemProps`      | retain   | Type an app wrapper around `SelectItem`. Provide a selectable option for a select field or custom select.               |
| `SelectListBox`        | retain   | Compose static or dynamic selectable options.                                                                           |
| `SelectListBoxProps`   | retain   | Type an app wrapper around `SelectListBox`. Compose static or dynamic selectable options.                               |
| `SelectPopover`        | retain   | Compose a positioned, portalled select menu.                                                                            |
| `SelectPopoverProps`   | retain   | Type an app wrapper around `SelectPopover`. Compose a positioned, portalled select menu.                                |
| `SelectRoot`           | retain   | Own value, open state, validation and size for custom select chrome.                                                    |
| `SelectRootProps`      | retain   | Type an app wrapper around `SelectRoot`. Own value, open state, validation and size for custom select chrome.           |
| `SelectTrigger`        | retain   | Compose the button that opens a custom select.                                                                          |
| `SelectTriggerProps`   | retain   | Type an app wrapper around `SelectTrigger`. Compose the button that opens a custom select.                              |
| `SelectValue`          | retain   | Compose the selected option or placeholder inside the trigger.                                                          |
| `SelectValueProps`     | retain   | Type an app wrapper around `SelectValue`. Compose the selected option or placeholder inside the trigger.                |
| `SelectSize`           | retain   | Type size on a custom select wrapper.                                                                                   |

### `@luke-ui/react/primitives/text-input`

Source:
[src/exports/primitives/text-input.ts](../packages/@luke-ui/react/src/exports/primitives/text-input.ts).
Entrypoint: **retain**.

| Symbol                    | Decision | Independent consumer use                                                                                          |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `TextInputRecipeVariants` | retain   | Type the supported selection passed to `textInputRecipe` in an app-owned styling wrapper.                         |
| `TextInputSize`           | retain   | Type size across a custom input and its adornments.                                                               |
| `textInputRecipe`         | retain   | Style an app-owned standalone input using native input states.                                                    |
| `TextInput`               | retain   | Use a styled standalone native input or the input part of a custom field.                                         |
| `TextInputControl`        | retain   | Compose input chrome around prefixes, input and suffixes.                                                         |
| `TextInputControlProps`   | retain   | Type an app wrapper around `TextInputControl`. Compose input chrome around prefixes, input and suffixes.          |
| `TextInputPrefix`         | retain   | Place a non-interactive prefix before the input.                                                                  |
| `TextInputPrefixProps`    | retain   | Type an app wrapper around `TextInputPrefix`. Place a non-interactive prefix before the input.                    |
| `TextInputProps`          | retain   | Type an app wrapper around `TextInput`. Use a styled standalone native input or the input part of a custom field. |
| `TextInputRoot`           | retain   | Own value, validation and input IDs for a custom text field.                                                      |
| `TextInputRootProps`      | retain   | Type an app wrapper around `TextInputRoot`. Own value, validation and input IDs for a custom text field.          |
| `TextInputSuffix`         | retain   | Place a non-interactive suffix after the input.                                                                   |
| `TextInputSuffixProps`    | retain   | Type an app wrapper around `TextInputSuffix`. Place a non-interactive suffix after the input.                     |

### `@luke-ui/react/prose`

Source: [src/exports/prose.ts](../packages/@luke-ui/react/src/exports/prose.ts). Entrypoint:
**retain**.

| Symbol        | Decision | Independent consumer use                                                                              |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `Prose`       | retain   | Apply long-form rhythm to app-owned Markdown, MDX or CMS content.                                     |
| `ProseProps`  | retain   | Type an app wrapper around `Prose`. Apply long-form rhythm to app-owned Markdown, MDX or CMS content. |
| `proseRecipe` | retain   | Apply long-form rhythm to an app-owned content root.                                                  |

### `@luke-ui/react/provider`

Source: [src/exports/provider.ts](../packages/@luke-ui/react/src/exports/provider.ts). Entrypoint:
**retain**.

| Symbol          | Decision | Independent consumer use                                                                                  |
| --------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `Provider`      | retain   | Configure the application icon spritesheet URL as settled by #712.                                        |
| `ProviderProps` | retain   | Type an app wrapper around `Provider`. Configure the application icon spritesheet URL as settled by #712. |

### `@luke-ui/react/quote`

Source: [src/exports/quote.ts](../packages/@luke-ui/react/src/exports/quote.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                |
| ------------ | -------- | ----------------------------------------------------------------------- |
| `Quote`      | retain   | Render a semantic inline quotation.                                     |
| `QuoteProps` | retain   | Type an app wrapper around `Quote`. Render a semantic inline quotation. |

### `@luke-ui/react/scroll-fade`

Source: [src/exports/scroll-fade.ts](../packages/@luke-ui/react/src/exports/scroll-fade.ts).
Entrypoint: **retain**.

| Symbol            | Decision | Independent consumer use                                                                                          |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `ScrollFade`      | retain   | Provide a named, keyboard-accessible scrollport with logical edge fades.                                          |
| `ScrollFadeAxis`  | retain   | Type the logical scrolling axis of an app wrapper.                                                                |
| `ScrollFadeProps` | retain   | Type an app wrapper around `ScrollFade`. Provide a named, keyboard-accessible scrollport with logical edge fades. |

### `@luke-ui/react/select-field`

Source: [src/exports/select-field.ts](../packages/@luke-ui/react/src/exports/select-field.ts).
Entrypoint: **retain**.

| Symbol             | Decision | Independent consumer use                                                                                  |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| `SelectItem`       | retain   | Provide a selectable option for a select field or custom select.                                          |
| `SelectItemProps`  | retain   | Type an app wrapper around `SelectItem`. Provide a selectable option for a select field or custom select. |
| `SelectField`      | retain   | Render a labelled single-select with owned menu presentation.                                             |
| `SelectFieldProps` | change   | Type an app wrapper around `SelectField`. Render a labelled single-select with owned menu presentation.   |

### `@luke-ui/react/stack`

Source: [src/exports/stack.ts](../packages/@luke-ui/react/src/exports/stack.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                        |
| ------------ | -------- | ------------------------------------------------------------------------------- |
| `Stack`      | change   | Lay out children on the logical block axis.                                     |
| `StackProps` | change   | Type an app wrapper around `Stack`. Lay out children on the logical block axis. |

### `@luke-ui/react/strong`

Source: [src/exports/strong.ts](../packages/@luke-ui/react/src/exports/strong.ts). Entrypoint:
**retain**.

| Symbol        | Decision | Independent consumer use                                                                   |
| ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `Strong`      | retain   | Render semantic importance with inherited typography.                                      |
| `StrongProps` | retain   | Type an app wrapper around `Strong`. Render semantic importance with inherited typography. |

### `@luke-ui/react/styles`

Entrypoint: **private/absent**. There is no styles subpath. `createSprinkles` and `SprinklesProps`
stay package-internal for `Box` and the other layout components. `breakpoints` moves to
`@luke-ui/react/theme`.

### `@luke-ui/react/text-input-field`

Source:
[src/exports/text-input-field.ts](../packages/@luke-ui/react/src/exports/text-input-field.ts).
Entrypoint: **retain**.

| Symbol                | Decision | Independent consumer use                                                                                   |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `TextInputField`      | retain   | Render a labelled single-line input with optional adornments.                                              |
| `TextInputFieldProps` | change   | Type an app wrapper around `TextInputField`. Render a labelled single-line input with optional adornments. |

### `@luke-ui/react/text`

Source: [src/exports/text.ts](../packages/@luke-ui/react/src/exports/text.ts). Entrypoint:
**retain**.

| Symbol               | Decision | Independent consumer use                                                                                          |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `TextRecipeVariants` | retain   | Type the supported selection passed to `textRecipe` in an app-owned styling wrapper.                              |
| `textRecipe`         | retain   | Apply semantic typography to an app-owned text element.                                                           |
| `Text`               | retain   | Apply semantic typography and colours to text, including RAC named text slots.                                    |
| `TextProps`          | retain   | Type an app wrapper around `Text`. Apply semantic typography and colours to text, including RAC named text slots. |

### `@luke-ui/react/theme`

Source: [src/exports/theme.ts](../packages/@luke-ui/react/src/exports/theme.ts). Entrypoint:
**retain**.

1.0 allowlist only. Useful helpers can return in a minor when they have a concrete consumer use.

| Symbol                 | Decision | Independent consumer use                                                        |
| ---------------------- | -------- | ------------------------------------------------------------------------------- |
| `ThemeInput`           | retain   | Type a curated theme definition before compiling it.                            |
| `breakpoints`          | retain   | Author container queries with the same 640/768/1024/1280/1536 px thresholds.    |
| `defineTheme`          | retain   | Compile an app-authored theme to static CSS with contrast validation.           |
| `rootClassName`        | retain   | Apply scoped reset and base typography to the application root.                 |
| `ThemeContrastError`   | retain   | Catch and report failed contrast pairs from theme compilation.                  |
| `ThemeGenerationError` | retain   | Catch an unachievable semantic colour family and inspect role/mode diagnostics. |
| `vars`                 | retain   | Style app-owned content using typed semantic CSS custom properties.             |

### `@luke-ui/react/themes/paper`

Source: [src/exports/themes/paper.ts](../packages/@luke-ui/react/src/exports/themes/paper.ts).
Entrypoint: **retain**.

| Symbol           | Decision | Independent consumer use                                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `theme`          | retain   | Extend the bundled Paper authoring input in an authored theme (#715 owns the future location).         |
| `themeClassName` | retain   | Apply bundled Paper to a subtree without importing the theme compiler (#715 owns the future location). |

### `@luke-ui/react/themes/tactile`

Source: [src/exports/themes/tactile.ts](../packages/@luke-ui/react/src/exports/themes/tactile.ts).
Entrypoint: **retain**.

| Symbol           | Decision | Independent consumer use                                                                                 |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `theme`          | retain   | Extend the bundled Tactile authoring input in an authored theme (#715 owns the future location).         |
| `themeClassName` | retain   | Apply bundled Tactile to a subtree without importing the theme compiler (#715 owns the future location). |

### `@luke-ui/react/track`

Source: [src/exports/track.ts](../packages/@luke-ui/react/src/exports/track.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                                |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| `Track`      | retain   | Align intrinsic rails with flexible inline content.                                     |
| `TrackProps` | retain   | Type an app wrapper around `Track`. Align intrinsic rails with flexible inline content. |

### `@luke-ui/react/utils`

Source: [src/exports/utils.ts](../packages/@luke-ui/react/src/exports/utils.ts). Entrypoint:
**retain**.

| Symbol       | Decision | Independent consumer use                                                 |
| ------------ | -------- | ------------------------------------------------------------------------ |
| `mergeProps` | retain   | Combine consumer and Luke UI presentation, event handlers, refs and IDs. |
| `cx`         | retain   | Combine conditional consumer classes and recipe or utility output.       |
| `pxToRem`    | retain   | Convert measured pixel dimensions to the same 16 px rem scale.           |

### `@luke-ui/react/visually-hidden`

Source: [src/exports/visually-hidden.ts](../packages/@luke-ui/react/src/exports/visually-hidden.ts).
Entrypoint: **retain**.

| Symbol                | Decision | Independent consumer use                                                                 |
| --------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `VisuallyHidden`      | retain   | Provide visually hidden accessible content.                                              |
| `VisuallyHiddenProps` | retain   | Type an app wrapper around `VisuallyHidden`. Provide visually hidden accessible content. |

## Static entrypoints and package boundary

These are the five non-JavaScript entries in `package.json`. Together with the 43 JavaScript entries
above, they account for the whole exports map. The JavaScript inventory contains 195 symbol
occurrences, including intentional field/primitive re-exports.

| Public path                                    | Decision | Independent consumer use and contract                                                                                                                          |
| ---------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@luke-ui/react/package.json`                  | retain   | Inspect package metadata, version and declared entrypoints in tooling.                                                                                         |
| `@luke-ui/react/stylesheet.css`                | retain   | Load the reset, theme root, component recipes and utilities once. CSS remains static and marked as a side effect. Global reset/layer redesign belongs to #717. |
| `@luke-ui/react/spritesheet.svg`               | retain   | Obtain the URL supplied to `Provider.spritesheetHref`. Symbol IDs follow the exported `iconNames` set. Preserve the external-asset architecture from #712.     |
| `@luke-ui/react/themes/paper/stylesheet.css`   | retain   | Load Paper's complete light/dark token values without theme-authoring JS. Future theme packaging belongs to #715.                                              |
| `@luke-ui/react/themes/tactile/stylesheet.css` | retain   | Load Tactile's complete light/dark token values without theme-authoring JS. Future theme packaging belongs to #715.                                            |

There are no wildcard exports, root barrel, engine-authoring entrypoints or deep `core/*` imports.
Only declared map paths are imports. `dist`, `skills`, `README.md` and `LICENSE` are published
files. The README, licence and packaged skill material are documentation assets, not additional
JavaScript entrypoints. Generated filenames, source recipes, masks, build scripts and icon
construction data do not become public imports because they are present in the tarball. The
packed-consumer harness owns proof that each declared module, declaration and static asset survives
packing and external install.

## Component contracts and meaningful defaults

### Box-like layout

Sources: `core/types/box-like-props.ts`, `core/styles/layout-props.ts` and each named component's
implementation. Every row below retains its useful layout props and changes the inherited root
callback to the two-argument convention.

The ordinary path accepts native `HTMLAttributes<HTMLElement>`, `ref` and `elementType`, defaulting
to `div`. Supported structural tags are `article`, `aside`, `dd`, `div`, `dl`, `dt`, `figcaption`,
`figure`, `footer`, `header`, `li`, `main`, `nav`, `ol`, `section`, `span` and `ul`. Changing the
tag does not change the accepted DOM attributes. `elementType` and `renderRoot` are mutually
exclusive.

`renderRoot(domProps, state)` returns a `ReactElement`. Its first argument, `domProps`, contains
resolved DOM presentation props: `children`, `className`, `style` and a callback `ref`. Its second
argument is `{}` because these components expose no public render state. No fake state fields are
added. The callback owns the root and all its DOM attributes. It does not receive `id`, ARIA props
or unrelated DOM attributes from the component. The callback ref remains spreadable onto a concrete
element, forwards an object or callback ref, and preserves React callback-ref cleanup. All seven
components use Box's callback path, so their layout resolution and recipe presentation arrive in the
same first argument.

Layout utilities shared by the specialised components are `alignSelf`, `blockSize`, `flex`,
`flexBasis`, `flexGrow`, `flexShrink`, `gridArea`, `gridColumn`, `gridColumnStart`, `gridColumnEnd`,
`gridRow`, `gridRowStart`, `gridRowEnd`, `inlineSize`, `inset`, `insetBlock`, `insetBlockStart`,
`insetBlockEnd`, `insetInline`, `insetInlineStart`, `insetInlineEnd`, `justifySelf`, `margin`,
`marginBlock`, `marginBlockStart`, `marginBlockEnd`, `marginInline`, `marginInlineStart`,
`marginInlineEnd`, `maxBlockSize`, `maxInlineSize`, `minBlockSize`, `minInlineSize`, `order`,
`overflow`, `overflowX`, `overflowY`, `padding`, `paddingBlock`, `paddingBlockStart`,
`paddingBlockEnd`, `paddingInline`, `paddingInlineStart`, `paddingInlineEnd`, `placeSelf` and
`position`, except for ownership exclusions recorded below. No component in this group has
controlled/uncontrolled state, RAC slots or separately replaceable parts.

| Component     | Specific contract, presentation and defaults                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Root/anatomy decision                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Box`         | All `SprinklesProps`, detailed under styles below. No layout algorithm or spacing default. Consumer classes append after utility classes and consumer styles win collisions.                                                                                                                                                                                                                                                                                                                                                                                                                                       | One structural or caller-owned root. Retain the generic escape hatch.                                                                                       |
| `AspectRatio` | `ratio`: `1 / 1` (default), `4 / 3`, `3 / 2`, `16 / 9`, `21 / 9`. `objectFit`: `cover` (default), `contain`, `fill`, `none`, `scale-down`. Shared layout props.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | One media frame with a direct media child that fills it. Root replacement keeps that treatment. Recipe stays private because it depends on frame/child CSS. |
| `Bleed`       | `all`, `block`, `inline`, `blockStart`, `blockEnd`, `inlineStart`, `inlineEnd`: `0` or spacing token, optionally responsive. No bleed when omitted. At each breakpoint, edge overrides axis, which overrides `all`. Ordinary margin utility props are excluded because Bleed owns them.                                                                                                                                                                                                                                                                                                                            | One root. Retain logical negative-margin ownership rather than publishing generated edge variables.                                                         |
| `Cluster`     | `alignItems=center`, `flexWrap=wrap`, `justifyContent=flex-start`. `gap` has no default. Alignment and wrapping accept the corresponding responsive utility choices. Responsive gap objects require `initial`. Fixed `display:flex`, `flexDirection:row`. Shared layout props.                                                                                                                                                                                                                                                                                                                                     | One root containing inline-flow items. Retain the wrapping group without exporting layout internals.                                                        |
| `Container`   | Required `maxInlineSize`: `ct448`, `ct672`, `ct896`, `ct1152`, `ct1280` or arbitrary CSS string. `marginInline=auto`. `paddingInline` has no default. Owns `inlineSize:100%` and `container-type:inline-size`. Excludes ordinary `inlineSize`, `maxInlineSize`, `marginInline`, `paddingInline` utility forwarding in favour of its declared props.                                                                                                                                                                                                                                                                | One size-query root. Recipe and sizing variable remain private.                                                                                             |
| `Grid`        | `columns`: positive integer for equal shrinkable tracks or a non-empty CSS track list. `rows`: non-empty CSS track list. `areas`: equal-length rows forming rectangular named areas. Responsive track/area objects require `initial`. `gap`, `columnGap`, `rowGap` accept spacing tokens, with axis gap overriding `gap`; responsive gap objects require `initial`. `alignContent`, `alignItems`, `justifyContent`, `justifyItems` use utility choices, excluding flex-only start/end spellings where declared. No track/gap defaults. Fixed `display:grid`. Invalid track/area inputs throw. Shared layout props. | One grid root with caller-owned children. No AutoGrid alias or public display-only recipe.                                                                  |
| `Stack`       | `alignItems=stretch`, optional `gap` with required `initial` in responsive objects. Fixed `display:flex`, `flexDirection:column`. Shared layout props.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | One block-flow root. No state or multipart recipe.                                                                                                          |

### Other layout and content roots

| Component    | Specific contract, presentation and defaults                                                                                                                                                                                                                                                       | State, slot, element and ref ownership                                                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Track`      | `railStart` and `railEnd` are optional intrinsic-width ReactNode content. `children` uses remaining space. `gap` is optional spacing/responsive value requiring `initial`. `railAlignment`: `start` (default), `center`, `firstLine`. First-line alignment uses the Track's inherited line height. | Native root attributes and `ref:HTMLElement`; `elementType=div`, choices `div`, `li`, `span`. `span` uses span wrappers, other roots use div wrappers. No `renderRoot`, state or RAC slot. Rails and centre wrappers remain component-owned; the anatomy-coupled recipe stays private.                      |
| `ScrollFade` | Required accessible name via exactly one of `aria-label`/`aria-labelledby`. `axis`: `inline` (default) or `block`. Accepts shared layout props except `overflow`, `overflowX`, `overflowY`.                                                                                                        | Always a `div`; `ref` reaches the scrollport. Luke UI owns scrolling, `role`, `tabIndex` and measured fade direction. Region semantics and `tabIndex=0` appear only during overflow. No public control pair, `elementType`, `renderRoot` or RAC slot. Measurement state/attributes and recipe stay private. |
| `Prose`      | Native div props, children, className, style and div ref. Long-form spacing, list treatment, rules and table treatment follow the recipe. No variant defaults.                                                                                                                                     | Always a div, no state, `slot`, `elementType` or render callback. Consumer owns the content markup; retain its standalone scope recipe.                                                                                                                                                                     |

### Actions and links

Sources: `core/action-presentation.ts`, the four action components, button primitive and
`core/use-press-action/use-press-action.ts`. Retain supported RAC interaction, focus, form and
router props through the declared types. Native button type remains the upstream choice. Luke UI
does not introduce a controlled/uncontrolled press-state API.

| Component    | Specific contract and meaningful defaults                                                                                                                                                                                                                                                                                                                                                                                                             | State, slots, render and root/ref ownership                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | `appearance=button`, `tone=neutral`, `prominence=standard`, `size=medium`, `isBlock=false`, `isDisabled=false`, `isPending=false`. Button appearance permits `tone:neutral/critical`, `prominence:low/standard/high`, `size:small/medium`, block and `startContent`/`endContent`. Text appearance inherits surrounding text, excludes size/block/adornments, permits neutral at all prominences and critical at low/standard. Children are ReactNode. | Owns content/spinner anatomy. `onPress` runs before optional `pressAction:()=>void/Promise<void>`. Externally set `isPending` shows a spinner immediately; Action-owned pending prevents duplicate actions and shows the spinner after 300 ms. Keep RAC `slot` (e.g. dialog `close`). Omit RAC `render` and function children. No `elementType`/`renderRoot`. Root attributes and ref reach the button. |
| `IconButton` | Required `icon` is an `IconName` or custom ReactElement. Required accessible name via exactly one of `aria-label`/`aria-labelledby`. `tone=neutral` (`critical` available), `prominence=standard` (`low/high` available), `size=medium` (`small` available), `isDisabled=false`, `isPending=false`.                                                                                                                                                   | Same `onPress`/`pressAction`/pending behaviour as Button. Keeps RAC `slot`; omits children, RAC `render`, `isBlock` and appearance choice. No root replacement. Ref reaches the button, internal icon is decorative.                                                                                                                                                                                    |
| `Link`       | Required non-null `href`. `appearance=text`, `prominence=standard`, `isDisabled=false`. Text permits `low/standard/high` and excludes size/block/adornments. Button appearance permits `size:small/medium` (medium default), `isBlock=false`, `startContent`/`endContent`. No tone prop.                                                                                                                                                              | Retain RAC navigation/press and children rendering behaviour. No Luke UI pending/action API. Omit `slot`; use upstream RAC Link for a named parent slot. No `elementType`/`renderRoot`. Attributes and anchor ref reach the navigation root.                                                                                                                                                            |
| `IconLink`   | Required `href`, icon name/custom element and accessible-name XOR. `prominence=standard` (`low/high` available), `size=medium` (`small` available), `isDisabled=false`. Fixed button appearance and neutral tone.                                                                                                                                                                                                                                     | Retain RAC navigation/press behaviour; no children, tone/block/appearance, pending/action API or `slot`. No `elementType`/`renderRoot`. Attributes and anchor ref reach the root, internal icon is decorative.                                                                                                                                                                                          |

Nested action icons use the shared 16 px (`xsmall`) icon size. Field-control icons use 16 px for
small controls and 20 px for medium controls. These observable inherited sizes are retained;
implementation sizing constants and contexts remain private.

### Form field contracts

Retain #714's accessible-name union: provide a visible non-empty, non-interactive `label`, or omit
it and provide exactly one of `aria-label`/`aria-labelledby`. `description` is optional.
`necessityIndicator` is `icon` (default) or `label`. High-level `errorMessage` is ReactNode. A
non-empty message marks the field invalid; callers do not set `isInvalid` directly. Native
validation and `validate` remain upstream behaviour, with `validationBehavior=native` unless set to
`aria`. `name`, `form`, required/disabled flags and the field-specific input constraints keep their
declared RAC meanings. Luke UI does not require a handler whenever a controlled prop is set.

| Component        | Component-specific public contract and defaults                                                                                                                                                                                                                                                                                                                                                            | Controlled/uncontrolled and open-state decision                                                                                                                                                                                                                                                                                  | Anatomy, slots, root/control ownership                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Checkbox`       | `size:small/medium`, medium default. `isDisabled`, `isReadOnly`, `isRequired`, `isIndeterminate`, form `value`, `validate`, `validationBehavior`, label, description and error. `inputId` and callback/object `inputRef`.                                                                                                                                                                                  | `isSelected`, `defaultSelected`, `onChange(boolean)` retain RAC selection semantics. Indeterminate is an explicit visual state, not another value.                                                                                                                                                                               | Root is CheckboxRoot div; `id`, className, style and ref target it. `inputId`/`inputRef` target the native checkbox input. Owns InlineField, content, control, indicator and label. Keep `slot=selection` for GridList/Table contexts. No root replacement/elementType.                                                                                                                                                                                                                                                                                                                                                        |
| `TextInputField` | `size:small/medium`, medium default; `placeholder`, `prefix`, `suffix`, `inputClassName`, `inputId`, callback/object `inputRef`. Retain input type, length/pattern, autocomplete and input-mode constraints from TextInputRoot.                                                                                                                                                                            | `value`, `defaultValue`, `onChange(string)`. Retain read-only, disabled and native/ARIA validation.                                                                                                                                                                                                                              | Root div attributes/ref are distinct from inner input attributes/ref. Root generates input ID if omitted. Owns stacked Field and control/input/adornment anatomy. Omit `slot`, root replacement and elementType.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `SelectField`    | `size:small/medium`, medium default; root `placeholder`, required static option children or `items` plus item renderer, optional `isPending`, `triggerId` and callback/object `triggerRef`.                                                                                                                                                                                                                | `value`, `defaultValue`, `onChange(Key/null)` use keys inferred from item `key`, then `id`, falling back to Key. `validate` follows that key type. Omit `isOpen`, `defaultOpen`, `onOpenChange`, `allowsEmptyCollection` and root `disabledKeys`. Selection is single; aliases `selectedKey`/`onSelectionChange` are not public. | Root div attributes/ref, trigger button ID/ref. Generates trigger ID when omitted. Owns Field, trigger/value/indicator, popover/listbox. Popover offset defaults to 4 px. Omit `slot`, root replacement and elementType. Re-export `SelectItem` and its props for options.                                                                                                                                                                                                                                                                                                                                                     |
| `ComboboxField`  | `size:small/medium`, medium default; `placeholder`, `inputId`, callback/object `inputRef`, `menuWidth`, `listBoxProps`, `popoverProps`, `loadMoreItem`, `onLoadMore`, `loadingState:error/filtering/idle/loading/loadingMore/sorting`. Retain items/defaultItems, filtering, custom values and disabledKeys from ComboboxRoot. `menuTrigger=focus` (input/manual available), `allowsEmptyCollection=true`. | `value`, `defaultValue`, `onChange(Key/null)` select one key. `inputValue`, `defaultInputValue`, `onInputChange(string)` separately own search text. Keep notification-only `onOpenChange(boolean)`. No `isOpen`/`defaultOpen` pair. `allowsCustomValue=false` through RAC.                                                      | Root div attributes/ref; desktop persistent input uses `inputId`/`inputRef`. Mobile inputRef reaches tray search only while open, null when closed. Owns Field and desktop input/clear/toggle/popover or mobile trigger/tray/search/listbox. Desktop popover offset is 4 px unless overridden. Menu width affects desktop only. Default async empty content is loading spinner for loading/filtering, otherwise “No results”; onLoadMore supplies a sentinel unless an explicit loadMoreItem wins. Omit `slot`, root replacement and elementType. Re-export `ComboboxItem`, `ComboboxSection` and each props type for options. |

`listBoxProps` omits children/items/loadMoreItem because the high-level props own them.
`popoverProps` omits children. `listBoxProps.renderEmptyState` remains RAC's callback and takes
priority over the built-in async empty state. Do not rename or re-signature it.

### Typography contracts

Source: `core/text/text.tsx`, `core/text/recipe.css.ts`, `core/heading/heading-context.tsx` and each
text component's implementation. Text-derived `Blockquote`, `Heading` and `Numeral` retain Text's
RAC slot and declared element/ref attributes. Native inline wrappers (`Code`, `Em`, `Kbd`, `Quote`,
`Strong`, `Emoji`) keep native props; they do not gain a RAC slot from internally rendering Text.
There are no controlled/uncontrolled value pairs or root-replacement callbacks in this group.

| Text prop / recipe variant | Choices                                                                     | Meaningful default                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `color`                    | primary, secondary, accent, danger, info, success, warning                  | primary                                                                                                                                   |
| `typography`               | caption, label, body, lead, heading4, heading3, heading2, heading1, display | body                                                                                                                                      |
| `fontWeight`               | body, label, heading, emphasis                                              | Selected typography's weight role, unless inheriting the font.                                                                            |
| `fontStyle`                | default, inherit, italic, normal                                            | default (does not add a font-style override)                                                                                              |
| `fontVariantNumeric`       | default, normal, diagonal-fractions, ordinal, slashed-zero, tabular-nums    | default; plain Text resets to normal numeric glyphs.                                                                                      |
| `isVisuallyHidden`         | boolean                                                                     | false                                                                                                                                     |
| `lineClamp`                | false, true, 1, 2, 3, 4, 5                                                  | false; true is one line; 2–5 allow wrapping.                                                                                              |
| `shouldDisableTrim`        | boolean                                                                     | Text infers true for inline/unknown tags, false for known block tags. Any line clamp disables trim. The standalone recipe defaults false. |
| `shouldInheritFont`        | boolean                                                                     | false; true inherits font/colour, with explicit subsequent overrides taking precedence.                                                   |
| `textAlign`                | start, center, end                                                          | start                                                                                                                                     |
| `textDecoration`           | none, underline, line-through, inherit                                      | none                                                                                                                                      |
| `textTransform`            | default, none, capitalize, lowercase, uppercase, inherit                    | Recipe default is default; plain Text base renders none.                                                                                  |
| `textWrap`                 | default, balance, pretty                                                    | default; one-line clamp wins over wrapping.                                                                                               |

| Component        | Specific public contract and meaningful defaults                                                                                                                                                                                                                                                                                                                                                                                                                                        | Root, refs, slots and anatomy                                                                                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Text`           | All variants above. Native/RAC Text content, styling and attributes. `elementType=span`; upstream element choice does not make DOM props polymorphic.                                                                                                                                                                                                                                                                                                                                   | Ref reaches the text root. Retain `slot` for named RAC label/description composition, demonstrated by `core/text/text.browser.test.tsx` with a RAC MenuItem. No Luke UI render seam.                                                                                           |
| `Heading`        | Text props plus `level:1–6`. Level defaults to nearest HeadingLevels or 2. `fontWeight=heading`. Typography maps 1→heading1, 2→heading2, 3→heading3, 4→heading4, 5→lead, 6→body, unless overridden.                                                                                                                                                                                                                                                                                     | Defaults to hN for the resolved level; explicit Text elementType still supported. Ref/attributes target root. Retain inherited Text slot without creating a new heading-specific slot.                                                                                         |
| `HeadingLevels`  | `base:1–6` optional, required children ReactNode or heading-state renderer. Root defaults to 2; nested provider advances parent + 1, capped at 6; explicit base overrides. `useHeadingLevel(fallback=2)` returns `{level, element}` without advancing.                                                                                                                                                                                                                                  | DOM-free context provider. Its pre-existing children renderer receives heading state `{level,element}` as one argument. This is a state-only children API, not `renderRoot` or a replaceable part introduced by this PR. Keep it separately from the root callback convention. |
| `Blockquote`     | Text typography props except colour and element choice; fixed block quotation treatment with 3 px leading border and sp16 inset.                                                                                                                                                                                                                                                                                                                                                        | Fixed blockquote root, inherited Text slot and root ref/attributes. No replaceable part.                                                                                                                                                                                       |
| `Code`           | Native code props except legacy colour; Text `lineClamp`/`textWrap`. Code font, 0.875 em optical size and surrounding colour. Default nowrap; balance/pretty or clamp ≥2 removes nowrap.                                                                                                                                                                                                                                                                                                | Fixed code root/ref. No slot/elementType/renderRoot. Standalone recipe accepts `shouldWrap:boolean`, false default.                                                                                                                                                            |
| `Em`             | Native em props except legacy colour; `lineClamp`, `textWrap=default`; inherits surrounding font and colour with italic override.                                                                                                                                                                                                                                                                                                                                                       | Fixed em root/ref, no slot or root replacement.                                                                                                                                                                                                                                |
| `Strong`         | Native strong props except legacy colour; `lineClamp`, `textWrap=default`; inherits font/colour with emphasis weight.                                                                                                                                                                                                                                                                                                                                                                   | Fixed strong root/ref, no slot or root replacement.                                                                                                                                                                                                                            |
| `Quote`          | Native q props except legacy colour; `cite`, `lineClamp`, `textWrap=default`; inherits typography.                                                                                                                                                                                                                                                                                                                                                                                      | Fixed q root/ref, no slot or root replacement.                                                                                                                                                                                                                                 |
| `Kbd`            | Native kbd props except legacy colour. Body font, 0.75 em, body weight, 1.4 line height and chip treatment.                                                                                                                                                                                                                                                                                                                                                                             | Fixed kbd root/ref, no slot or root replacement. No recipe variants.                                                                                                                                                                                                           |
| `Emoji`          | Required `emoji:string`, `label:string`; native span props excluding children/role/aria-label/legacy colour. Inherits surrounding font.                                                                                                                                                                                                                                                                                                                                                 | Fixed span with owned role=img and aria-label=label. Native span ref. No slot or root replacement.                                                                                                                                                                             |
| `Numeral`        | Required `value:number`. `format:decimal/percent/currency/unit` inferred in that order from explicit format, currency, unit, then decimal. `currency`, `unit`, `formatOptions`, `locale` (locale context by default), `precision:number/[min,max]`, `abbreviate:boolean/long` (off when omitted). Unit display defaults narrow. Missing currency/unit for explicit format throws. `textAlign=end`, `fontVariantNumeric=tabular-nums`, `elementType=span`. Other Text variants retained. | Root ref/attributes and Text slot retained. Inside Heading it inherits font and disables trim unless trim is explicitly set. Value is content to format, not a controlled input.                                                                                               |
| `VisuallyHidden` | RAC Text props plus `elementType=span`. Always visually hidden; no presentation variants or focusability option on this branch.                                                                                                                                                                                                                                                                                                                                                         | Root ref/attributes and current RAC slot retained for accessible-only text. Recipe is private. #756 owns migration to the dedicated React Aria primitive.                                                                                                                      |

### Icons, provider and loading

| Surface                   | Specific contract and meaningful defaults                                                                                                                                                                                                                                                               | State, root/ref, slots and callbacks                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Icon`                    | Required generated `name`, optional `title`, `size:xsmall/small/medium/large`, aria-hidden, className, id, style, viewBox. Size resolves explicit → IconSizeProvider → medium (16/20/24/32 px). Fill=currentColor, focusable=false.                                                                     | SVG with no public ref or generic SVG prop forwarding. Title names an image unless explicitly hidden; no title means aria-hidden. Provider spritesheet URL is required, otherwise render throws. No slot, elementType or renderRoot. SVG symbol construction data stays private.             |
| `createIcon`              | `CreateIconOptions<TProps>` requires path ReactNode or `(props:TProps)=>ReactNode`. Optional viewBox string or `(props:TProps)=>string/undefined`, default `0 0 24 24`. Returns an icon accepting CustomIconProps plus custom props. Same size/title/aria-hidden treatment as Icon, no Provider needed. | `path` and `viewBox` are construction callbacks, not root/part render replacements. Keep their props-only signatures. Caller viewBox takes priority.                                                                                                                                         |
| `IconSizeProvider`        | Required children and `size:xsmall/small/medium/large`.                                                                                                                                                                                                                                                 | DOM-free context provider. Explicit Icon/spinner size overrides it. No additional public context/hook required.                                                                                                                                                                              |
| `Provider`                | Required children and `spritesheetHref:string` for the package SVG URL. Do not use a data URL.                                                                                                                                                                                                          | DOM-free application context, no ref/state/elementType/slot/render seam. Preserve #712; private IconSpritesheetProvider is not a second application API.                                                                                                                                     |
| `LoadingSkeleton`         | `isLoading` resolves explicit → LoadingSkeletonProvider → true. `elementType=span`, choices div/li/span. Optional `radius:detail/control/surface/overlay/full`, native root attributes/style/className/ref and children.                                                                                | Loading root is aria-hidden, inert and tabIndex=-1; unloaded returns children directly with no wrapper/ref target. Text/non-element content uses inline treatment, a ReactElement uses its footprint. No slot, renderRoot or uncontrolled state.                                             |
| `LoadingSkeletonProvider` | Required children and `isLoading:boolean`; no default.                                                                                                                                                                                                                                                  | DOM-free shared loading state. Local skeleton prop overrides context.                                                                                                                                                                                                                        |
| `LoadingSpinner`          | `isLoading=true`, aria-label='loading', optional `color:primary/secondary/accent/danger/info/success/warning` (omitted inherits surrounding colour), size explicit → IconSizeProvider → medium. Native span attributes/ref and children.                                                                | Status span/ref with hidden status label and decorative SVG/circle. With children, owned hidden-content/overlay wrappers reserve footprint while loading. Unloaded returns children directly. No slot, elementType, renderRoot or uncontrolled state. Animation/geometry/recipe are private. |

## Primitive contracts and anatomy

Sources are the implementation modules referenced by each primitive entrypoint. Retain the #714
parts and their props types for independent composition. The tables distinguish actual public ref
props from underlying RAC components that might support a ref internally. A part does not acquire a
public ref, `elementType` or render prop merely because its implementation renders another part.

RAC props keep their declared slot and render contracts where the wrapper does not omit or own them.
RAC styling/children callbacks receive RAC state, and collection renderers receive an item. Luke UI
does not rename either API. The explicit render matrix below records root replacement separately.

### `primitives/button`

`Button` retains the same presentation union and defaults as high-level Button, plus RAC function
children, state-driven className/style and `render(props, state)`. Default disabled/pending/block
flags are false. Size is medium, tone neutral, prominence standard and appearance button. Ref
targets the button. Retain RAC press/focus/form props and slot. The consumer owns label/content
anatomy; there is no high-level `pressAction` or built-in pending spinner. No `elementType` or
Luke-owned `renderRoot`. Import button chrome from `@luke-ui/react/button`, rather than re-exporting
its recipe here for symmetry.

### `primitives/checkbox`

| Part                | Props, defaults and state                                                                                                                                                                                                                         | Anatomy, root/ref and slot decision                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CheckboxRoot`      | Owns `isSelected`, `defaultSelected`, `onChange`, indeterminate, disabled/read-only/required/invalid flags, `value`, `name`, `form`, `validate`, `validationBehavior=native`, size small/medium (medium default), children and RAC state styling. | Div semantic root with explicit div ref. `id` targets root, `inputId` targets native input; `inputRef` retains RAC's ref-object type. Retain RAC slot; omit root RAC render.                                                |
| `CheckboxContent`   | RAC CheckboxButton press/hover/focus/render/children and state styling props.                                                                                                                                                                     | Native label containing control and textual non-interactive label content. Links/buttons belong outside. Retain RAC slot and render. No separate public ref prop is declared. Clears slotted Text context in label content. |
| `CheckboxControl`   | Native span props.                                                                                                                                                                                                                                | Span wrapper for the affordance, native span ref retained. No RAC slot/render seam.                                                                                                                                         |
| `CheckboxIndicator` | Native span props.                                                                                                                                                                                                                                | Decorative span reflecting root-selected/indeterminate/invalid/disabled state. Owns aria-hidden; native span ref retained. No replacement seam.                                                                             |
| `CheckboxLabel`     | Native span props plus necessityIndicator icon/label (icon default).                                                                                                                                                                              | Visible span with required marker from root. Native span ref retained; no RAC slot/render seam.                                                                                                                             |

### `primitives/field`

| Part               | Props and meaningful defaults                                                                                                                                                                                       | Anatomy, refs, slots and semantics                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Field`            | Required ReactNode children; optional label, description, errorMessage, necessityIndicator icon/label (icon default); native div props. errorMessage accepts the RAC validation-children function as well as nodes. | Presentation div/ref containing optional label, children, optional description and always-present error part. Render inside a semantic field root. Manual label/description/error parts are alternatives to this composition. No control state or root replacement. |
| `InlineField`      | Required ReactNode children; optional description/errorMessage and native div props.                                                                                                                                | Presentation div/ref places description and always-present error under a checkbox label. No control state or root replacement.                                                                                                                                      |
| `FieldLabel`       | RAC Label props including htmlFor, elementType and RAC render; necessityIndicator icon/label, icon default.                                                                                                         | Default label tied to the surrounding semantic control root. No explicit public ref prop is declared. Native label slot attribute follows RAC Label context.                                                                                                        |
| `FieldDescription` | RAC Text props with explicit id. Omit caller slot. Retain elementType and RAC render.                                                                                                                               | Defaults to span, forces slot='description' to join the field's aria-describedby wiring. No explicit public ref prop is declared.                                                                                                                                   |
| `FieldError`       | RAC FieldError props, children node or validation-state function, state styling; absent content falls back to native validation message.                                                                            | Default div with a leading decorative icon and message wrapper. RAC root render retained. No explicit public ref prop is declared. Error/description colours and marker mechanics are owned; no public tone or field recipe.                                        |

`FieldNecessityIndicator` remains the shared public `icon | label` annotation. Accessible-name
union, normalisation helpers, field recipe, slot functions and size/state context are private.

### `primitives/text-input`

| Part               | Specific props, state and defaults                                                                                                                                                                                                                                                                 | Root/ref, slot and anatomy ownership                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TextInputRoot`    | `value`, `defaultValue`, `onChange(string)`, form/name, input constraints, disabled/read-only/required/invalid, validate, validationBehavior=native, size small/medium (medium default), RAC children/state styling.                                                                               | Div root/ref; id targets root, inputId targets generated/explicit input ID. Retain RAC slot, omit RAC root render. Owns input semantics and passes defaults to parts.                                                                                                                                                                                                                                                                  |
| `TextInput`        | Standalone native input value/defaultValue and event onChange; disabled/readOnly/required, form/name/id/type/pattern/minLength/maxLength, aria-invalid/name, inputMode, placeholder. size small/medium; outside a control resolves explicit → root → medium, while an enclosing control owns size. | Explicit callback/object input ref. Inside root, ignore own id/name/form/value/defaultValue/disabled/readOnly/required/aria-invalid/type/pattern/minLength/maxLength. Root owns those props. Own aria-labelledby/describedby append to root wiring; other local defaults win. Root onChange receives value while local onChange receives event. Inside control, control owns chrome and size. Retain RAC input render and native slot. |
| `TextInputControl` | RAC Group children and state styling; size small/medium resolves explicit → root → medium. Caller isDisabled/isInvalid and RAC render omitted.                                                                                                                                                     | Div chrome around prefix/input/suffix in document order. No explicit public ref prop. Retain RAC slot/context.                                                                                                                                                                                                                                                                                                                         |
| `TextInputPrefix`  | Native span props and content.                                                                                                                                                                                                                                                                     | Span before input, native span ref. No RAC replacement or named slot API.                                                                                                                                                                                                                                                                                                                                                              |
| `TextInputSuffix`  | Native span props and content.                                                                                                                                                                                                                                                                     | Span after input, native span ref. No RAC replacement or named slot API.                                                                                                                                                                                                                                                                                                                                                               |
| `textInputRecipe`  | size small/medium, medium default, plus className composition.                                                                                                                                                                                                                                     | Standalone input chrome works from native disabled/read-only/invalid/focus states without private field anatomy. Retain recipe and its selection type; root/control/adornment recipes stay private.                                                                                                                                                                                                                                    |

### `primitives/select`

| Part               | Specific props, state and defaults                                                                                                                                                                                                                                 | Root/ref, slots and anatomy                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SelectRoot`       | `value`, `defaultValue`, `onChange(Key/null)`, `isOpen`, `defaultOpen`, `onOpenChange`, placeholder, form/name/autocomplete/focus, disabled/required/invalid, validate, validationBehavior=native, size small/medium (medium default), RAC children/state styling. | Div root/ref. id targets root; triggerId targets generated/explicit trigger ID. Single selection only; legacy selectedKey/defaultSelectedKey/onSelectionChange and selectionMode/shouldCloseOnSelect are omitted. Retain RAC slot; omit root RAC render. |
| `SelectTrigger`    | Required children, RAC state styling and press/focus props, optional isPending. Caller id/isDisabled/type/render omitted because semantic root/button context owns them.                                                                                           | Button/ref; size inherited from root, medium fallback. Owns chrome, consumer composes value/indicator. Retain RAC slot; clear slotted Text context inside content.                                                                                       |
| `SelectValue<T>`   | RAC SelectValue content/state/style/render props.                                                                                                                                                                                                                  | Span/ref showing selected option or root placeholder. Retain declared RAC slot attribute and render.                                                                                                                                                     |
| `SelectIndicator`  | Native span props with optional children replacing default chevronDown.                                                                                                                                                                                            | Decorative span/ref; owns aria-hidden and documented data-open while menu is open. Replacement uses children, not a new render callback.                                                                                                                 |
| `SelectPopover`    | RAC positioning, dismissal, animation and open-state props, offset=4 px. Omit deprecated UNSTABLE_portalContainer.                                                                                                                                                 | Portalled surface with explicit HTMLElement ref and rootClassName. Retain RAC slot/render; root theme inheritance still requires document-level colour-mode scope for body portals.                                                                      |
| `SelectListBox<T>` | RAC items plus item renderer or static children, selection/interaction and empty-state rendering.                                                                                                                                                                  | Default listbox div; retain declared RAC slot/render. No explicit public ref prop.                                                                                                                                                                       |
| `SelectItem<T>`    | ComboboxItem's RAC item identity/textValue/value, interaction and render props, excluding local size.                                                                                                                                                              | Option defaults to div or RAC link path; check shown for selected item. Takes root size, medium fallback. No explicit public ref prop. Retain native/RAC item slot attribute and render where declared.                                                  |

`SelectSize` is `small | medium`. No public select multipart recipe or context export. The guide's
`SelectIndicator[data-open]` is a public styling seam; other undocumented generated attributes stay
private.

### `primitives/combobox`

`ComboboxSize` is `small | medium`. Every size-owning part resolves explicit size → root context →
medium. The root owns single selection, search and validation. Its public
`value/defaultValue/ onChange(Key|null)` trio replaces upstream selected-key aliases. Retain
`inputValue`, `defaultInputValue`, `onInputChange`, items/defaultItems, disabledKeys, custom filter,
allowsCustomValue=false and `formValue:key` (text is available; custom values submit text). Default
filtering is RAC's locale-sensitive contains filter. `onOpenChange(boolean)` is a notification; the
root has no isOpen/defaultOpen props. `validationBehavior` defaults native.
Disabled/read-only/required flags default false through RAC. Luke UI defaults `menuTrigger=focus`,
`allowsEmptyCollection=true`, size=medium.

| Part                   | Specific contract and meaningful defaults                                                                                                                                      | Anatomy, root/ref and slots                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ComboboxRoot<T>`      | State/collection/validation contract above; root styling and children accept RAC state forms.                                                                                  | Div/root ref. id targets root; inputId is generated/explicit input ID. Retain RAC slot where declared for parent context; high-level field omits it. Omit root RAC render.                                                                                                      |
| `ComboboxInput`        | RAC Input props, className and size; explicit callback/object input ref.                                                                                                       | Desktop input is the persistent combobox. Inside tray, it becomes a focused searchbox with listbox virtual focus and no submitted name. Clicking a closed desktop input reopens the menu. Retain RAC render and native slot.                                                    |
| `ComboboxControl`      | RAC Group props, className, optional size.                                                                                                                                     | Div chrome around desktop input/buttons or mobile tray trigger. In tray it uses inset search-bar presentation. Retain RAC group slot/render. No explicit public ref.                                                                                                            |
| `ComboboxTrigger`      | RAC Button props, className, optional size.                                                                                                                                    | Desktop options button with context semantics, inherited icon size. Retain RAC slot/render. No explicit public ref.                                                                                                                                                             |
| `ComboboxClearButton`  | RAC Button props except slot; optional size.                                                                                                                                   | Hidden without selection on desktop, or without search text in tray. Press clears both key and text, then consumer onPress runs. Forces slot=null so it does not toggle options. RAC render retained; no explicit public ref.                                                   |
| `ComboboxItem<T>`      | RAC option props, optional size and className. String children infer textValue unless overridden.                                                                              | Default option div or RAC link path. Consumer children accept RAC option state; selected item adds a decorative check. RAC item render/declared native slot retained. No explicit public ref.                                                                                   |
| `ComboboxLoadMoreItem` | RAC sentinel props including onLoadMore/isLoading, optional size/className.                                                                                                    | Load-more row, native/RAC render and declared slot retained. No explicit public ref.                                                                                                                                                                                            |
| `ComboboxListBox<T>`   | Static children or iterable items with item renderer; dependencies invalidates dynamic cache; optional loadMoreItem appended after main collection; RAC renderEmptyState.      | Listbox div; tray fills remaining space, owns scrolling and defaults shouldSelectOnPressUp=false, which caller may override. Other presentation follows RAC. Retain slot/render; no explicit public ref.                                                                        |
| `ComboboxSection<T>`   | RAC collection section props plus optional title.                                                                                                                              | Section with styled header for static children. Function children follow collection rendering and do not insert title automatically. Retain RAC render/native slot. No explicit public ref.                                                                                     |
| `ComboboxEmptyState`   | Required children and optional string className only.                                                                                                                          | Div for empty/loading content. No ref, state, slot, elementType or root replacement.                                                                                                                                                                                            |
| `ComboboxPopover`      | RAC overlay positioning, dismissal, animation and open-state props. Primitive offset remains RAC's 8 px; high-level field sets 4 px. Omit deprecated UNSTABLE_portalContainer. | Portalled root with explicit HTMLElement ref and rootClassName. Retain RAC slot/render.                                                                                                                                                                                         |
| `ComboboxTrayTrigger`  | RAC Button props minus owned aria-expanded/aria-haspopup/slot and function children. Optional trailing ReactNode children, placeholder, size, explicit button ref.             | Button names selected value and opens sibling tray; aria-haspopup=dialog, aria-expanded from root, slot=null. Closed tray trigger owns hidden submission/validation inputs. Root read-only/disabled cannot be overridden by local false. RAC render retained.                   |
| `ComboboxTray`         | Required ReactNode children only.                                                                                                                                              | Full-screen overlay with consumer-composed control/search/listbox. Takes open state/name/ref from context, not extra public props. Search keeps DOM focus; collection uses virtual focus. Close clears focused state before closing. No public ref/slot/elementType/renderRoot. |

Tray submission/validation adapters, mobile detection, size/presentation/state contexts and the
multipart combobox recipe stay private. They support public parts rather than independent consumer
imports.

### Render callback inventory

| Public seam                                                                                                                                                                                                                                                                                                                                     | Decision and actual owner                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `renderRoot` on Box, AspectRatio, Bleed, Cluster, Container, Grid, Stack                                                                                                                                                                                                                                                                        | **Change** to `(domProps, state) => ReactElement`, passing `{}` as state; one shared Box implementation and mutual exclusion with elementType.                                                                                                   |
| Luke UI `render<Name>`                                                                                                                                                                                                                                                                                                                          | No additional owned public callback is introduced or exported by this branch. Do not invent replaceable parts.                                                                                                                                   |
| RAC `render` on high-level Text, Heading, Blockquote, Numeral, VisuallyHidden, Link, IconLink                                                                                                                                                                                                                                                   | **Retain** the upstream root seam and its upstream `(props, state)` signature. These wrappers retain it in their actual declared types; do not rename it renderRoot.                                                                             |
| RAC `render` on primitive Button, CheckboxContent, FieldLabel, FieldDescription, FieldError, TextInput, SelectValue, SelectPopover, SelectListBox, SelectItem, ComboboxInput, ComboboxControl, ComboboxTrigger, ComboboxClearButton, ComboboxItem, ComboboxLoadMoreItem, ComboboxListBox, ComboboxSection, ComboboxPopover, ComboboxTrayTrigger | **Retain** the wrapped component's DOM-render props and state. RAC owns resolution and interaction/ref wiring. Label/Text/section/sentinel seams may expose undefined state according to RAC's type, rather than a Luke UI-created state object. |
| RAC `render` on CheckboxRoot, TextInputRoot, TextInputControl, SelectRoot, SelectTrigger, ComboboxRoot                                                                                                                                                                                                                                          | **Private/omitted** from these public wrappers because #714 fixes semantic root/control ownership.                                                                                                                                               |
| `renderEmptyState` on ComboboxListBox, SelectListBox and field listBoxProps                                                                                                                                                                                                                                                                     | **Retain** upstream RAC empty-state callback, not a Luke UI-named replacement.                                                                                                                                                                   |
| HeadingLevels function children                                                                                                                                                                                                                                                                                                                 | **Retain** pre-existing state-only `{level,element}` callback. No root DOM props are passed.                                                                                                                                                     |
| Collection function children and RAC state function children/className/style                                                                                                                                                                                                                                                                    | **Retain** upstream item/state signatures, not root-replacement callbacks. High-level Button intentionally omits function children.                                                                                                              |
| createIcon path/viewBox functions                                                                                                                                                                                                                                                                                                               | **Retain** props-driven icon construction functions, not root-replacement callbacks.                                                                                                                                                             |

Both `render` and `renderRoot` remain in docs' Advanced prop group because these are separate
supported public seams. The shared grouping also describes the Button primitive's RAC render prop.

## Styles, utility props and merge semantics

Sources: `core/styles/utilities.css.ts`, `core/styles/responsive-conditions.ts`,
`theme/breakpoints.ts` and `shared/utils/merge-props.ts`. `createSprinkles` and `SprinklesProps`
stay package-internal for `Box` and layout components. Public `breakpoints` live on
`@luke-ui/react/theme`. These are the actual utility keys, not a promise of arbitrary CSS props. All
entries support a direct value, null or a responsive object with `initial`, `bp640`, `bp768`,
`bp1024`, `bp1280`, `bp1536`. Null/omitted conditions add no value. Responsive values use the
nearest size container, with thresholds 640/768/1024/1280/1536 px. No utility property has an
implicit presentation default. Specialised layout components may require `initial`, as recorded
above.

| Utility properties                                                                                                                                                                                                                                                                                                                               | Accepted scale                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `alignContent`, `justifyContent`                                                                                                                                                                                                                                                                                                                 | center, end, flex-end, flex-start, normal, space-around, space-between, space-evenly, start, stretch                                                         |
| `alignItems`                                                                                                                                                                                                                                                                                                                                     | baseline, center, end, flex-end, flex-start, normal, start, stretch                                                                                          |
| `alignSelf`                                                                                                                                                                                                                                                                                                                                      | auto, baseline, center, flex-end, flex-start, normal, stretch                                                                                                |
| `justifyItems`                                                                                                                                                                                                                                                                                                                                   | baseline, center, end, flex-end, flex-start, normal, start, stretch                                                                                          |
| `justifySelf`, `placeSelf`                                                                                                                                                                                                                                                                                                                       | auto, center, end, normal, start, stretch                                                                                                                    |
| `backgroundColor`                                                                                                                                                                                                                                                                                                                                | surface.canvas/recessed/floating/overlay; each neutral/accent/info/success/warning/danger role's subtle/solid × rest/hover/pressed token. No backdrop token. |
| `borderColor`                                                                                                                                                                                                                                                                                                                                    | decorative, control, focus, neutral, accent, info, success, warning, danger                                                                                  |
| `borderRadius`                                                                                                                                                                                                                                                                                                                                   | detail, control, surface, overlay, full                                                                                                                      |
| `borderStyle`                                                                                                                                                                                                                                                                                                                                    | none, solid, dashed, dotted                                                                                                                                  |
| `borderWidth`                                                                                                                                                                                                                                                                                                                                    | none (0), thin (1 px), thick (2 px)                                                                                                                          |
| `boxShadow`                                                                                                                                                                                                                                                                                                                                      | recessed, resting, raised, floating, overlay                                                                                                                 |
| `display`                                                                                                                                                                                                                                                                                                                                        | block, contents, flex, grid, inline, inline-block, inline-flex, inline-grid, none                                                                            |
| `flexDirection`                                                                                                                                                                                                                                                                                                                                  | column, column-reverse, row, row-reverse                                                                                                                     |
| `flexGrow`, `flexShrink`                                                                                                                                                                                                                                                                                                                         | string keys 0 or 1                                                                                                                                           |
| `flexWrap`                                                                                                                                                                                                                                                                                                                                       | nowrap, wrap, wrap-reverse                                                                                                                                   |
| `gap`, `columnGap`, `rowGap`, `padding`, `paddingBlock`, `paddingBlockStart`, `paddingBlockEnd`, `paddingInline`, `paddingInlineStart`, `paddingInlineEnd`                                                                                                                                                                                       | 0, sp4, sp8, sp12, sp16, sp24, sp32, sp40, sp48, sp64, sp96                                                                                                  |
| `margin`, `marginBlock`, `marginBlockStart`, `marginBlockEnd`, `marginInline`, `marginInlineStart`, `marginInlineEnd`                                                                                                                                                                                                                            | Spacing scale above plus auto.                                                                                                                               |
| `overflow`, `overflowX`, `overflowY`                                                                                                                                                                                                                                                                                                             | auto, clip, hidden, scroll, visible                                                                                                                          |
| `position`                                                                                                                                                                                                                                                                                                                                       | absolute, fixed, relative, static, sticky                                                                                                                    |
| `blockSize`, `inlineSize`, `maxBlockSize`, `maxInlineSize`, `minBlockSize`, `minInlineSize`, `flex`, `flexBasis`, `gridArea`, `gridColumn`, `gridColumnStart`, `gridColumnEnd`, `gridRow`, `gridRowStart`, `gridRowEnd`, `inset`, `insetBlock`, `insetBlockStart`, `insetBlockEnd`, `insetInline`, `insetInlineStart`, `insetInlineEnd`, `order` | The corresponding CSS-native value type from csstype; no invented token scale.                                                                               |

Package-internal `createSprinkles` returns className/style and passes through own enumerable
string-keyed non-utility props. Generated presentation replaces input className/style. Symbols and
non-enumerable props are not preserved. Its `.properties` is a ReadonlySet in TypeScript, but the
runtime Set remains mutable. Engine functions/types are not consumer APIs. Typography, text colour
and pseudo-state utilities remain excluded; use Text/Heading or `vars`.

`cx` joins non-empty trimmed string tokens in order and skips false/null/undefined. It does not
promise deduplication. `pxToRem(px, base=16)` returns a rem string.

`mergeProps` accepts at least two prop objects and merges left to right. It joins string className
with cx, shallow-merges object style, chains `on[A-Z]` functions with void return, merges refs and
combines/deduplicates non-empty IDs through RAC. Non-string className and non-object style are
ignored. Absent presentation remains undefined rather than promising concrete strings/objects. Other
properties take the last defined value, so explicit undefined retains an earlier value. This is the
current runtime/type contract, not an alias for the removed mergeStyleProps name.

## Recipe visibility and selection contracts

The symbol inventory accounts individually for every public recipe and selection type. All recipes
return a class string and accept optional className composition. The following checks explain why
these recipes work on consumer-owned markup, including the limited IconButton sizing contract.

| Recipe             | Decision | Supported selection and defaults                                                                                                                                                                                      |
| ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buttonRecipe`     | retain   | Same constrained Button presentation union: appearance button, neutral tone, standard prominence, medium size, false block by default. Style a native or app-owned accessible action without private content anatomy. |
| `linkRecipe`       | retain   | Same constrained Link presentation union: text appearance and standard prominence; button appearance defaults medium/non-block. No tone variant. App owns navigation semantics.                                       |
| `iconButtonRecipe` | retain   | Optional size small/medium sets inline size to the corresponding control size. No base chrome, padding reset or default size. Compose with buttonRecipe and consumer-owned padding to make a square control.          |
| `iconRecipe`       | retain   | size xsmall/small/medium/large, medium default. Applies dimensions/flex behaviour to app SVGs; does not own title or spritesheet semantics.                                                                           |
| `textInputRecipe`  | retain   | size small/medium, medium default. Uses native input state rather than requiring multipart anatomy.                                                                                                                   |
| `textRecipe`       | retain   | Exact variant table above. Component trim inference is not part of the standalone recipe.                                                                                                                             |
| `blockquoteRecipe` | retain   | No variant keys. Independent leading border/inset on owned quotation markup.                                                                                                                                          |
| `codeRecipe`       | retain   | shouldWrap boolean, false default. Code font/optical size/chip styling on owned inline code.                                                                                                                          |
| `kbdRecipe`        | retain   | No variant keys. Keyboard chip presentation on owned kbd markup.                                                                                                                                                      |
| `proseRecipe`      | retain   | No variant keys. Long-form scope affects ordinary caller-owned descendant markup; requires no private React anatomy.                                                                                                  |

`ButtonRecipeVariants`, `CodeRecipeVariants`, `IconButtonRecipeVariants`, `IconRecipeVariants`,
`LinkRecipeVariants`, `TextInputRecipeVariants` and `TextRecipeVariants` each retain the matching
selection annotation. Recipes with no selectable variants (`blockquoteRecipe`, `kbdRecipe`,
`proseRecipe`) do not export empty `*RecipeVariants` types. Generators keep a new recipe private
until an independent use is recorded.

## Theme authoring and bundled-theme contracts

Retain only the theme 1.0 allowlist above. Spacing/type catalogues, radius helpers,
`getThemeClassName`, and theme-input helper types stay package-private until a concrete consumer use
lands in a minor. #715 owns redesign of authoring and bundled-theme locations. #716 owns token
taxonomy. Record the existing contracts here without expanding this PR into those projects.

`defineTheme` is pure/Node-compatible and returns complete static CSS. It still accepts extending
themes at runtime; `ExtendingThemeInput` is not a named public export. A fresh ThemeInput requires
name and color.accent. Extending inputs require name/extends and inherit omitted values. Names are
kebab-case and generate `luke-ui-theme-${name}`. Theme inheritance merges per-role/per-mode values,
never the identity name. Cycles fail. Colour inputs accept a string or partial light/dark pair.
Supported source formats are hex or non-alpha OKLCH, except backdrop is verbatim CSS and may have
alpha. A single accent is adapted for each mode; explicit authored mode colours remain distinct.

| Authoring section     | Meaningful defaults and retained choices                                                                                                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`               | Required accent for a fresh theme. Optional neutral or neutralStyle cool/neutral/warm (neutral default). Background defaults to the resolved neutral canvas. Info/success/warning/danger/focus use curated mode defaults when omitted. Backdrop defaults black OKLCH alpha 0.2 light/0.4 dark. |
| `depth`               | Optional per-mode partial DepthLadder (recessed, resting, raised, floating, overlay). Omitted rungs use curated subtle shadows. Defaults are private, not reusable authoring constants.                                                                                                        |
| `actionControlFinish` | Optional per-mode partial ControlFinish (recessed, resting, raised). Omitted rungs use none.                                                                                                                                                                                                   |
| `radius`              | base=4 px, multiplier=1. Generated detail/control/surface/overlay use base × 1/2/3/4, rounded, with explicit rung overrides. Full remains 9999 px and is not authored.                                                                                                                         |
| `typography`          | fontFamily inter (default), apple-system or dm-sans. Weight roles body=400, label=500, heading=600, emphasis=700 by default; each may be authored. Semantic styles/metric scale and code-family stack are fixed.                                                                               |
| `extends`             | Inherits omitted colour/material/radius/typography keys from the base; outer name stays required. Both bundled `theme` exports are usable bases.                                                                                                                                               |

`ThemeContrastError` exposes failures and optional inheritance on the class instance.
`ThemeContrastFailure` and `ThemeInheritance` are not named public exports. `ThemeGenerationError`
exposes role, mode, bestAttempt and partial diagnostics when a family cannot satisfy generation.

`rootClassName` applies `luke-ui-theme luke-ui-reset`, a scoped reset plus base typography with no
theme identity. Retain these concrete class names as the root contract. Bundled themes export
`themeClassName` for multi-theme documents. Authored multi-theme identity via `getThemeClassName` is
not part of the 1.0 public surface.

Bundled stylesheet scopes combine `:where(:root)` and `.luke-ui-theme-paper` or
`.luke-ui-theme-tactile`. Default mode follows prefers-color-scheme; data-color-mode=light/dark
forces a mode, including native color-scheme. Nested identity/mode scopes are supported. Body
portals need mode on html to inherit an explicit mode. Retain stylesheet/class/authoring exports
now; #715 owns any package move.

### Token paths and CSS variable names

Source: `theme/contract.ts` and `theme/contract.css.ts`. Each exact path below is **retain**, with
#716 owning later taxonomy decisions. The finite brace notation is an exhaustive Cartesian product,
not an unspecified wildcard. Replace each brace with every listed member to enumerate all leaves.
The six role names are neutral, accent, info, success, warning and danger. Each leaf maps to a
stable `--luke-` custom property by kebab-casing each dotted segment and joining with hyphens. For
example, `vars.color.foreground.danger.onSolid` is `var(--luke-color-foreground-danger-on-solid)`.

| Exact public `vars` leaf paths                                                                                                                                    | Independent consumer use                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `color.surface.{canvas,recessed,floating,overlay}`                                                                                                                | Style page/content/elevated surfaces.                                   |
| `color.overlay.backdrop`                                                                                                                                          | Style an app-owned modal backdrop.                                      |
| `color.loadingSkeleton`                                                                                                                                           | Style a consumer loading placeholder.                                   |
| `color.text.{primary,secondary,disabled}`                                                                                                                         | Style readable, supporting or disabled content.                         |
| `color.background.{neutral,accent,info,success,warning,danger}.{subtle,solid}.{rest,hover,pressed}`                                                               | Style semantic fills and their interaction states.                      |
| `color.foreground.{neutral,accent,info,success,warning,danger}.{rest,hover,pressed,onSolid}`                                                                      | Style semantic content and content paired with solid fills.             |
| `color.border.{decorative,control,focus,neutral,accent,info,success,warning,danger}`                                                                              | Style separators, control boundaries, focus rings and semantic borders. |
| `depth.{recessed,resting,raised,floating,overlay}`                                                                                                                | Apply shared shadow/material depth to owned surfaces.                   |
| `actionControlFinish.{recessed,resting,raised}`                                                                                                                   | Apply shared face finishes to owned action controls.                    |
| `font.{caption,label,body,lead,heading4,heading3,heading2,heading1,display}.{baselineTrim,capHeightTrim,fontFamily,fontSize,fontWeight,letterSpacing,lineHeight}` | Apply complete semantic type treatments and trims to owned text.        |
| `font.family.{body,code}`                                                                                                                                         | Style owned text/code without reproducing font stacks.                  |
| `font.weight.{body,label,heading,emphasis}`                                                                                                                       | Apply semantic weight overrides.                                        |
| `radius.{detail,control,surface,overlay,full}`                                                                                                                    | Apply semantic corners to owned surfaces.                               |
| `space.{sp4,sp8,sp12,sp16,sp24,sp32,sp40,sp48,sp64,sp96}`                                                                                                         | Apply the fixed rem spacing scale.                                      |
| `controlSize.{small,medium,minTarget,comboboxAction}`                                                                                                             | Align owned controls/actions with shared dimensions and minimum target. |
| `interaction.disabledOpacity`                                                                                                                                     | Apply consistent disabled/pending treatment.                            |
| `iconSize.{xsmall,small,medium,large}`                                                                                                                            | Align custom glyphs at 16/20/24/32 px emitted as rem.                   |
| `motion.duration.{feedback,enter,exit}`                                                                                                                           | Apply interaction/entry/exit timing (200/500/300 ms).                   |
| `motion.easing.{standard,exit}`                                                                                                                                   | Apply shared deceleration/acceleration curves.                          |

Only color, depth and actionControlFinish vary by colour mode. Other token families belong to theme
identity. All CSS variables are public through vars even though generation helpers and contract-tree
types stay private. The ten space leaves and rem values above remain on `vars.space`. The nine type
styles remain on `vars.font.*`. Package-private catalogues may mirror those keys for internals. No
raw palette step, private metric step, generated class hash or component-owned custom property
becomes public from its use in CSS.

### Cascade and stylesheet names

| CSS surface                                                   | Decision | Contract and independent consumer use                                                                                                   |
| ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `reset` layer                                                 | retain   | Lowest-priority scoped defaults. Consumers can reason about later layers. #717 owns reset changes.                                      |
| `base` layer                                                  | retain   | Declared empty between reset and recipes for consumer base styling.                                                                     |
| `recipes` layer                                               | retain   | Component/recipe presentation, including owned descendant rules.                                                                        |
| `utilities` layer                                             | retain   | Highest normal-priority utility escape hatch.                                                                                           |
| `@layer reset, base, recipes, utilities`                      | retain   | One combined initial order statement fixes normal cascade precedence. Important declarations reverse layer precedence according to CSS. |
| `luke-ui-theme`, `luke-ui-reset`                              | retain   | Concrete scoped root classes returned together by rootClassName.                                                                        |
| `luke-ui-theme-${name}`                                       | retain   | Theme identity scopes. Bundled themes export `themeClassName`; authored helpers stay private.                                           |
| `data-color-mode=light/dark`                                  | retain   | Explicit theme mode selection.                                                                                                          |
| `SelectIndicator[data-open]`                                  | retain   | Documented primitive indicator affordance for an app replacing the chevron.                                                             |
| Generated classes and other undocumented DOM/state attributes | private  | No independent stability promise. Use documented props, recipes, vars and primitive parts.                                              |

## Removed/private exports and rejected seams

These names do not appear in any current public entrypoint. The decisions explain the bounded
pre-1.0 removals and why package-internal reuse is insufficient. Implementation modules may still
export names internally; that does not publish them through the package map.

| Symbol or rejected public path                                         | Decision             | Reason / supported consumer path                                                                                                                          |
| ---------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkboxRecipe`                                                       | private              | Requires checkbox-owned selection/anatomy. Use Checkbox or its primitives.                                                                                |
| `CheckboxRecipeVariants`                                               | private              | Selection type follows the private recipe; public size is on CheckboxProps/CheckboxRootProps.                                                             |
| `fieldRecipe`                                                          | private              | Requires field label/message/icon anatomy and state. Use Field or its parts.                                                                              |
| `FieldRecipeVariants`                                                  | private              | Follows the private field recipe; use FieldProps or the named part Props.                                                                                 |
| `loadingSpinnerRecipe`                                                 | private              | Couples geometry, animation and child overlay anatomy. Use LoadingSpinner.                                                                                |
| `LoadingSpinnerRecipeVariants`                                         | private              | Follows private spinner recipe; use LoadingSpinnerProps to type consumer settings.                                                                        |
| `visuallyHiddenRecipe`                                                 | private              | Hidden content semantics are covered by VisuallyHidden and elementType.                                                                                   |
| `BlockquoteRecipeVariants`                                             | private              | No selectable variants; recipe alone is enough.                                                                                                           |
| `KbdRecipeVariants`                                                    | private              | No selectable variants; recipe alone is enough.                                                                                                           |
| `ProseRecipeVariants`                                                  | private              | No selectable variants; recipe alone is enough.                                                                                                           |
| `@luke-ui/react/styles`                                                | private/absent       | Layout via Box; createSprinkles/SprinklesProps stay package-internal.                                                                                     |
| `createSprinkles` / `SprinklesProps`                                   | private              | Package-internal utility runtime for Box and layout components.                                                                                           |
| `getThemeClassName`                                                    | private              | Bundled themes export themeClassName; authored multi-theme helper deferred.                                                                               |
| `spaceScale` / `SpaceStep` / `typeStyles` / `TypeStyle`                | private              | No concrete 1.0 consumer use beyond Box/Text internals.                                                                                                   |
| `fontWeightRoles` / `FontWeightRole`                                   | private              | No concrete 1.0 consumer use.                                                                                                                             |
| `deriveConcentricRadius` / `deriveNestedRadius`                        | private              | No public consumer surface; helpers stay package-internal.                                                                                                |
| `ThemeContrastFailure` / `ThemeInheritance`                            | private              | Readable on ThemeContrastError properties without named exports.                                                                                          |
| `ColorInput` / `ControlFinish` / `DepthLadder` / `ExtendingThemeInput` | private              | Nested under ThemeInput / defineTheme without named exports.                                                                                              |
| `gridRecipe`                                                           | private              | Only establishes Grid's own display treatment; app markup can use display:grid.                                                                           |
| `GridRecipeVariants`                                                   | private              | Follows the private display-only recipe; use GridProps.                                                                                                   |
| `aspectRatioRecipe`                                                    | private              | Depends on direct media-child rules. Use AspectRatio.                                                                                                     |
| `AspectRatioRecipeVariants`                                            | private              | Follows the private media-frame recipe; use AspectRatioProps.                                                                                             |
| `trackRecipe`                                                          | private              | Requires centre/rail/root anatomy. Use Track's rail content API.                                                                                          |
| `TrackRecipeVariants`                                                  | private              | Follows private Track recipe; use TrackProps.                                                                                                             |
| `containerRecipe`                                                      | private              | Coupled to Container's fixed/arbitrary size resolution. Use Container.                                                                                    |
| `ContainerRecipeVariants`                                              | private              | Follows the private container recipe; use ContainerProps.                                                                                                 |
| `scrollFadeRecipe`                                                     | private              | Requires owned scrollport/overflow measurement. Use ScrollFade.                                                                                           |
| `ScrollFadeRecipeVariants`                                             | private              | Follows private recipe; retain independently useful ScrollFadeAxis instead.                                                                               |
| `defaultBackdrop`                                                      | private              | Compiler fallback, not a second theme-authoring input. Omit backdrop or author one.                                                                       |
| `defaultControlFinish`                                                 | private              | Compiler fallback. Omit material rungs or author them.                                                                                                    |
| `defaultDepth`                                                         | private              | Compiler fallback. Omit shadow rungs or author them.                                                                                                      |
| `BoxLikeResolvedRenderProps`                                           | private              | Inferred callback argument is sufficient; no independent import required.                                                                                 |
| `BoxLikeElementProps`                                                  | private              | Shared implementation union, not a consumer extension contract. Use component Props.                                                                      |
| `BoxLikeRenderProps`                                                   | private              | Shared implementation union, not a consumer extension contract. Use component Props.                                                                      |
| `BoxLikeRef`                                                           | private              | Normalised callback-ref implementation typing. Callback props already infer it.                                                                           |
| `iconViewBoxes`                                                        | private              | Generated construction data. Icon/createIcon own viewBox resolution.                                                                                      |
| `IconSpritesheetProvider`                                              | private              | Settled application setup is Provider (#712).                                                                                                             |
| `IconSpritesheetProviderProps`                                         | private              | Follows private provider.                                                                                                                                 |
| `useIconSizeContext`                                                   | private              | Internal hook; IconSizeProvider is the consumer composition seam.                                                                                         |
| `HeadingTag`                                                           | private              | Derivable from HeadingLevel or hook result; no independent annotation need.                                                                               |
| `HeadingLevelsRenderProps`                                             | private              | Inferred HeadingLevels children/hook result is sufficient.                                                                                                |
| `ObjectEntry`                                                          | private              | General typed-object iteration helper, unrelated to consuming Luke UI output.                                                                             |
| `typedEntries`                                                         | private              | Internal typed iteration, not a Luke UI consumer requirement.                                                                                             |
| `typedFromEntries`                                                     | private              | Internal typed object construction, not a Luke UI consumer requirement.                                                                                   |
| `mergeStyleProps`                                                      | private/removed name | Use the current mergeProps contract. No compatibility alias.                                                                                              |
| `@luke-ui/react/primitives`                                            | private/absent       | Import the actual primitive entrypoint; no umbrella barrel.                                                                                               |
| `@luke-ui/react`                                                       | private/absent       | Import named component/support subpaths.                                                                                                                  |
| Theme compiler/engine authoring and raw palette/diagnostic entrypoints | private/absent       | defineTheme and exported error properties cover authoring/diagnostics. No raw ThemeFoundation/buildTheme/compileTheme or styling-engine API is published. |

The existing `@luke-ui/rainbow-sprinkles` support package is a runtime dependency, not an additional
`@luke-ui/react` entrypoint or promised stable Luke UI 1.x authoring API.

## Completion evidence and deferred owners

The current map has explicit per-symbol decisions for all 43 JavaScript entrypoints and all 195
exported symbol occurrences, plus each of the five static/map entrypoints. Component/primitive
tables cover their own props, meaningful defaults, selection/text/open/loading state, variants,
slots, anatomy, refs/root ownership, element choice and rendering seams. Theme exports, every finite
token leaf family, concrete CSS-variable naming, cascade/root names and asset paths have decisions.
No additional speculative export is required to complete the inventory.

#712 and #714 remain settled input. #715 owns future theme authoring/package design, #716 owns token
taxonomy, #717 owns global stylesheet/reset/layers and #756 owns VisuallyHidden's primitive
migration. Their current exported surfaces are explicitly retained here. Those follow-ups do not
leave an untracked #711 decision open.

The source/map comparison is the exhaustiveness check. Runtime/type callback tests, the focused Text
slot composition test, docs/generator tests, root check and packed-consumer validation provide
executable evidence for the changes. Record their exact command results in the PR verification
report rather than treating this non-normative inventory as a test pass.
