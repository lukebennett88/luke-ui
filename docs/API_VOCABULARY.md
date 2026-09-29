# Public API vocabulary and visibility (#711)

Decision record for settling the pre-1.0 public surface of `@luke-ui/react`. Parent: epic
[#709](https://github.com/lukebennett88/luke-ui/issues/709) / issue
[#711](https://github.com/lukebennett88/luke-ui/issues/711).

This is an audit and vocabulary guide, not a rename dump. Prefer clean pre-1.0 replacements over
aliases when a change is justified. Symmetry and internal structure are not reasons to publish.

## Vocabulary rules

1. **Consumer-first names.** A lasting export needs a credible consumer example. Implementation
   folders do not get public barrels by default.
2. **One normal component path.** High-level components live at `@luke-ui/react/<name>`. Drop to
   `@luke-ui/react/primitives/<name>` only for documented composition that the high-level API cannot
   cover.
3. **Render callbacks.** Prefer `renderRoot` when a callback replaces the root element. Prefer
   `render<Name>` only for a demonstrated replaceable part. Leave React Aria / state render props
   that Luke UI does not own alone.
4. **Theme is build-time.** `defineTheme`, theme class names, and stylesheets are static CSS /
   authoring concerns. Runtime app setup that icons need belongs on a thin provider (see #712), not
   on theme identity.
5. **Support packages stay 0.x.** `@luke-ui/rainbow-sprinkles` is a published 0.x runtime dependency
   of React. It is not part of the stable Luke UI 1.x consumer API.
6. **Private by default.** Vanilla Extract recipes, generated class strings as identity, cascade
   layer authoring, and anatomy of internal DOM that is not documented stay private.

## Export inventory (retain / change / private)

Status keys: **retain** (1.x intent), **change** (pre-1.0 rename or reshape), **audit** (needs
consumer evidence), **private** (must not become a consumer contract).

### Components (`@luke-ui/react/<name>`)

| Export                                                                                               | Status | Notes                                                                             |
| ---------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `aspect-ratio`, `auto-grid`, `box`, `cluster`, `container`, `grid`, `stack`, `track`                 | retain | Layout.                                                                           |
| `blockquote`, `code`, `em`, `emoji`, `heading`, `kbd`, `numeral`, `prose`, `quote`, `strong`, `text` | retain | Typography.                                                                       |
| `button`, `checkbox`, `combobox-field`, `icon-button`, `icon-link`, `link`, `text-field`             | retain | Actions / inputs.                                                                 |
| `icon`                                                                                               | retain | Needs app-level spritesheet setup (`LukeUIProvider` / `IconSpritesheetProvider`). |
| `loading-skeleton`, `loading-spinner`, `scroll-fade`, `visually-hidden`                              | retain | Utilities / feedback.                                                             |

### Primitives (`@luke-ui/react/primitives/*`)

| Export                                                   | Status | Notes                                                                                             |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `button`, `checkbox`, `combobox`, `field`, `input-group` | audit  | Keep only where docs show composition the high-level API cannot cover. No root primitives barrel. |

### Styling and theme

| Export                                                        | Status               | Notes                                                                                          |
| ------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `styles` (`createSprinkles`, `breakpoints`, `SprinklesProps`) | retain               | Public escape hatch.                                                                           |
| `box`                                                         | retain               | Sprinkles-backed layout host.                                                                  |
| `theme` (`vars`, `defineTheme`, `rootClassName`, …)           | audit                | Aggressively review: which helpers are 1.x vs authoring-only. `#717` may drop `rootClassName`. |
| `themes/tactile`, `themes/paper` (+ stylesheets)              | retain               | Bundled themes.                                                                                |
| `stylesheet.css`, `spritesheet.svg`                           | retain               | Asset paths are public contracts.                                                              |
| Recipe / `#recipe-engine` / VE internals                      | private              | Bundled; not importable.                                                                       |
| `@luke-ui/rainbow-sprinkles`                                  | private-to-consumers | Published 0.x support package; React depends on it. Consumers should not import it.            |

### Utilities (`@luke-ui/react/utils`)

| Export                                           | Status | Notes                                                                                          |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------- |
| `cx`, `mergeStyleProps`                          | retain | Documented for combining sprinkles with component props.                                       |
| `pxToRem`, `typedEntries`, related typed helpers | audit  | Confirm each has a consumer use case; demote or keep internal if only build tooling uses them. |

### Provider (lands via #712 / #725)

| Export                        | Status                 | Notes                                                  |
| ----------------------------- | ---------------------- | ------------------------------------------------------ |
| `provider` (`LukeUIProvider`) | retain (pending merge) | Thin app root for runtime context starting with icons. |

## Controlled state and props

- Prefer React Aria-aligned controlled/uncontrolled pairs already documented on each component.
- Do not invent Luke-specific duplicates of RAC state props.
- Defaults should stay on the component docs page; changing a default is a breaking 1.x concern once
  published.

## Explicitly private

- Generated Vanilla Extract class names as identity.
- Cascade layer names and authoring order beyond the public stylesheet.
- Internal contexts used only by composition (`heading-context`, `icon-size-context` are already
  absent from package exports).
- Anatomy DOM that is not named in docs.

## Next actions

1. Walk `utils` and `theme` exports with settings-fixture evidence (#713) and mark demotions.
2. Apply any agreed renames before 1.0 (no aliases).
3. Keep candidate components (#561, #600, #642) as optional evidence, not automatic blockers.
