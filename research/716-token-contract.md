# #716 token contract and representative controls

Decision record for [#716](https://github.com/lukebennett88/luke-ui/issues/716). This file is
non-normative. The durable rules live in [docs/STYLING.md](../docs/STYLING.md),
[docs/THEME_COLOUR_GENERATION.md](../docs/THEME_COLOUR_GENERATION.md), and the docs app's theming
pages. It records what the 1.0 token contract is and why, not every alternative that was considered.

[#707](https://github.com/lukebennett88/luke-ui/issues/707) and the settings reference application
(`apps/reference-app`) are the design inputs. Paper, Tactile, the reference-app theme, and a flat
fixture (every `depth` and `controlFinish` value `none`) are the evidence themes, in both modes.

## Principle

A token is public when it carries a theme-dependent semantic decision, or when it is a shared fixed
measurement that an application demonstrably needs to align with Luke UI. Component-specific
geometry is a private TypeScript constant. Nothing is added for hypothetical flexibility: no surface
repair, hierarchy solver, perceptual threshold, or visual-distinction diagnostic.

## Public contract

`vars` paths and their `--luke-*` properties. "Theme" values come from `defineTheme`; "fixed" values
are Luke UI-owned and the same in every theme.

| Family                   | Leaves                                                                                     | Varies by  | Purpose                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------- |
| `color.surface`          | `base`, `subdued`, `field`, `overlay`                                                      | theme+mode | The four places content sits. See [Surfaces](#surfaces).                                |
| `color.overlay.backdrop` | one leaf                                                                                   | theme+mode | Translucent dimming behind a modal. Not a surface.                                      |
| `color.text`             | `primary`, `secondary`, `disabled`                                                         | theme+mode | Content colour. `disabled` recolours field text, which opacity alone cannot do.         |
| `color.loadingSkeleton`  | one leaf                                                                                   | theme+mode | Placeholder fill for custom loading states.                                             |
| `color.background.<r>`   | `subtle` and `solid`, each `rest`, `hover`, `pressed`                                      | theme+mode | Complete role fill ramps for the six roles.                                             |
| `color.foreground.<r>`   | `rest`, `hover`, `pressed`, `onSolid`                                                      | theme+mode | Complete role content ramps.                                                            |
| `color.border`           | `decorative`, `control`, `controlHover`, `focus`, and one per role                         | theme+mode | Separators, the guaranteed control boundary and its hover, the focus ring, role tints.  |
| `depth`                  | `recessed`, `resting`, `raised`, `floating`, `overlay`                                     | theme+mode | The shared shadow ladder.                                                               |
| `controlFinish`          | `recessed`, `resting`, `raised`                                                            | theme+mode | Face lighting for solid control fills (renamed from `actionControlFinish`).             |
| `font.<style>`           | `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight` for nine type styles | theme      | Applying a type style to app-owned text. Family and weight follow the theme.            |
| `font.family`            | `body`, `code`                                                                             | theme      | Code surfaces and app text outside a type style.                                        |
| `font.weight`            | `body`, `label`, `heading`, `emphasis`                                                     | theme      | Weight overrides.                                                                       |
| `radius`                 | `detail`, `control`, `surface`, `overlay`, `full`                                          | theme      | Semantic corner roles. `full` is fixed at `9999px`.                                     |
| `space`                  | `sp4` … `sp96`                                                                             | fixed      | The one spacing scale for gaps, padding, and margin.                                    |
| `controlSize`            | `small`, `medium`                                                                          | fixed      | Block sizes of the two control sizes, for app-owned elements that align with a control. |
| `interaction`            | `disabledOpacity`                                                                          | fixed      | The disabled fade, for app-owned interactive elements.                                  |
| `motion`                 | `duration.feedback`, `duration.enter`, `duration.exit`, `easing.standard`, `easing.exit`   | fixed      | Role-named motion timing.                                                               |

`<r>` is each of `neutral`, `accent`, `info`, `success`, `warning`, and `danger`. The six roles stay
equal: every role has the same ramps. Hover and pressed values stay public and in one registry.

### Theme-dependent versus fixed

Colour, depth, control finish, type family and weight, and radius are theme identity. Spacing,
control sizes, the disabled fade, motion, and type metrics (size, line height, letter spacing) are
Luke UI-owned structure. Both kinds are public CSS variables when an application needs them, so a
custom element can match Luke UI without copying resolved values.

### Evidence for fixed public measurements

| Token                         | Consumer evidence                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `space.*`                     | `Box` spacing props everywhere; reference app settings rows and dialog padding; docs shell layout.                                   |
| `controlSize.small`           | Docs code-block copy button centres itself on the first code line with `calc(… - controlSize.small / 2)` (`code-block.css.ts`).      |
| `controlSize.medium`          | Application elements laid out beside a medium `Button` or field. Pairs with `small`; removing one would leave the scale half public. |
| `interaction.disabledOpacity` | Reference app menu items and the email edit button fade like Luke UI controls.                                                       |
| `motion.*`                    | Reference app avatar overlay transition; docs search and theme controls.                                                             |
| `font.<style>.*`              | Docs shell, site navigation, search, and code block apply `label` and `caption` metrics to app-owned elements.                       |
| `radius.full`                 | Reference app avatar, avatar button, and email edit button.                                                                          |

### Private

| Value                                                     | Contract                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Minimum target (24px)                                     | TypeScript constant in `core/sizing/control-size.ts`. Used by Button and Combobox. |
| Combobox action (28px)                                    | TypeScript constant in `core/sizing/combobox-sizing.ts`.                           |
| Icon sizes (16/20/24/32px)                                | TypeScript constants in `core/sizing/icon-sizing.ts`. `Icon`'s `size` prop stays.  |
| Capsize `baselineTrim` and `capHeightTrim` per type style | `--luke-internal-font-<style>-baseline-trim` and `-cap-height-trim`, see below.    |

The Capsize trims depend on the theme's font, so they cannot be TypeScript constants. They are
implementation metrics, not design roles, so they are not public. The stylesheet writes them as
`--luke-internal-*` variables in the theme identity rule, and `Text` reads them. One name helper is
shared by the two sides. There is no internal token registry or second value pipeline.

## Surfaces

| Role      | Purpose                                                  | Generated default (light) | Generated default (dark) |
| --------- | -------------------------------------------------------- | ------------------------- | ------------------------ |
| `base`    | The application background and primary content           | the resolved base anchor  | the resolved base anchor |
| `subdued` | Secondary static regions, such as a sidebar or code chip | base L − 0.02             | base L − 0.03            |
| `field`   | Form-control surfaces                                    | base L                    | base L − 0.025           |
| `overlay` | Detached content: menus, popovers, dialogs, drawers      | base L + 0.015            | base L + 0.07            |

- `color.surface.base` replaces the old `color.background` source input and is still the anchor the
  neutral and role families ramp from. This coupling is deliberate; there is no independent neutral
  anchor.
- An author may give any surface an explicit `{ light, dark }` colour. `base` also accepts one
  string, adapted per mode as `background` was. An authored value is used as written.
- A missing surface is a fixed, mode-specific lightness offset from the resolved `base`, never from
  a sibling surface.
- Surfaces are never repaired. If a generated default fails a contrast gate, `defineTheme` throws
  `ThemeContrastError`, and the author can supply that surface explicitly.
- `extends` merges each surface role independently. An authored role replaces the base role whole,
  like `accent`. `ThemeContrastError.inheritance` reports surface roles as own or inherited.
- There is no `surface.strong`. Add one only when a real composition needs another static level.

`floating` is not `overlay`. The old `floating` was used both for detached content and for static
cards. Each consumer was mapped by purpose; see [Surface migration](#surface-migration).

Paper's light surfaces stay white. Tactile's light field changes from absolute white to its base
(`oklch(0.985 0 0)`), so Tactile fields now read as part of the page and rely on the guaranteed
`border.control` and their inset depth rather than a brighter fill.

## Accessibility guarantees

Hard gates run on the final emitted colours and throw `ThemeContrastError`:

| Pair                                                          | Ratio | Against                                |
| ------------------------------------------------------------- | ----- | -------------------------------------- |
| `text.primary`, `text.secondary`                              | 4.5:1 | all four surfaces                      |
| `border.focus`                                                | 3:1   | all four surfaces                      |
| `border.control`, `border.controlHover`                       | 3:1   | `base`, `field`, `overlay`             |
| `background.danger.solid.rest` (the invalid control boundary) | 3:1   | `base`, `field`, `overlay`             |
| each role's `foreground.rest`, `.hover`, `.pressed`           | 4.5:1 | `base`, `field`, `overlay`, own subtle |
| each role's `foreground.onSolid`                              | 4.5:1 | own solid `rest`, `hover`, `pressed`   |

`subdued` is not a control surface, so the boundary gates do not cover it. Controls placed on a
subdued region still show their `field` fill, which is gated.

Role borders (`border.<role>`) are decorative tints. Their demonstrated use is application-owned
notices Luke UI does not provide. They are measured but never gated, and must never be the only cue
for a required state. In `Box`, `borderColor="control"` is the guaranteed boundary.

`border.controlHover` is the resting control border moved by a fixed per-mode lightness offset
(−0.12 light, +0.12 dark), toward more contrast. The contract is 3:1. Whether hover looks distinct
enough is a visual decision, so there is no rule that hover must exceed rest, no minimum-delta
search, and no perceptual threshold.

Existing forced-colours and reduced-motion behaviour is unchanged.

## Representative controls

### Field controls

`TextInput`, `TextInputControl`, `Combobox`, and `Select` share one model:

| State     | Treatment                                                                                  |
| --------- | ------------------------------------------------------------------------------------------ |
| Rest      | `surface.field`, `border.control`, `depth.recessed`                                        |
| Hover     | `border.controlHover`, focused or not. Replaces the weak accent border that #707 flagged.  |
| Open      | Select keeps `border.controlHover` while open, like hover. Never the accent border.        |
| Focus     | Border unchanged; the separate 2px focus ring shows. Focus no longer recolours the border. |
| Invalid   | `background.danger.solid.rest` border, kept through hover, focus, open, and read-only.     |
| Read-only | `surface.field` and `border.control`, no hover feedback, no inset depth.                   |
| Disabled  | The disabled fade; no hover feedback.                                                      |

Evidence: the old hover border (`border.accent`, about L 0.82 in light) is much lighter than the
resting control border (about L 0.65), so hover weakened the boundary below 3:1. Read-only used
`border.decorative` as its only boundary, which is not contrast-gated, and `TextInputControl` let
read-only override an invalid border.

At rest, a read-only field in a flat theme looks like an editable one. That is deliberate: read-only
content stays fully legible, assistive technology announces the state, and the field gives no hover
feedback. Fading or recolouring it would make read-only look disabled.

Combobox's trigger and clear buttons keep their own accent-subtle hover fill. They are separate
action targets inside the field, not its boundary.

### Selection controls

Checkbox and Switch use the same vocabulary, mapped to their anatomy:

| Part                    | Material                                                                        |
| ----------------------- | ------------------------------------------------------------------------------- |
| Checkbox box, unchecked | Field part: `surface.field`, `border.control`, `depth.recessed`.                |
| Checkbox box, checked   | Solid fill: `background.accent.solid.*` with `controlFinish.*`.                 |
| Switch track, unchecked | `border.control` fill (the guaranteed boundary), `depth.recessed`.              |
| Switch track, checked   | Solid fill: `background.accent.solid.*` with `controlFinish.*`.                 |
| Switch thumb            | `surface.field` when off, `foreground.accent.onSolid` when on, `depth.resting`. |

Interaction states come from colour, so the flat fixture keeps them distinct:

| State   | Unchecked                                                                | Checked         |
| ------- | ------------------------------------------------------------------------ | --------------- |
| Hover   | `border.controlHover` (Switch: track fill too)                           | `solid.hover`   |
| Pressed | Hover border, plus `background.neutral.subtle.pressed` on the field part | `solid.pressed` |

The two known defects were both material-only distinctions:

1. Checkbox hover and pressed differed only by `actionControlFinish.raised` versus `.recessed`, so
   they were identical in a flat theme.
2. Switch grouped hover and pressed into one `active()` selector, so pressed had no appearance of
   its own.

Contrast is preserved: the off thumb (`surface.field`) on the off track (`border.control`, or
`border.controlHover` while hovered) is a gated control-boundary pair, and each on-thumb is the
gated `onSolid` pair. The pressed fill on an unchecked part is momentary feedback during a press,
not a state to identify, so it is not a gated pair.

### Buttons

`Button`, `IconButton`, button-shaped `Link`, and `IconLink` share one recipe. Hover and pressed no
longer move the button: the `translateY` transforms are gone, and `transform` is no longer in the
transition list. Colour, border, depth, and finish transitions stay. Overlay animation is unchanged.

## Visual review

Captures were reviewed for Paper, Tactile, the reference-app theme, and the flat fixture, in both
modes, for rest, hover, focus, pressed, invalid, read-only, and disabled states of every
representative control, plus the reference app's settings pages and email dialog.

- The four surfaces read as intended in the reference app: a `subdued` shell around `base` content,
  `field` controls, and an `overlay` dialog.
- In the flat fixture every representative state stays distinct by colour. Buttons already change
  their fill on hover and press, so they never depended on materials.
- Paper's light `base`, `field`, and `overlay` stay white. `subdued` is the only new light tint.
- The repository's visual comparator threshold (0.1 per pixel) does not flag the small surface
  lightness changes in layout captures, so those were reviewed by eye.

## Box

`Box` is the second way into the token contract, so its token-backed values derive from it:

| Prop              | Values                                                                      | Source                                        |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `backgroundColor` | `surface.<base\|subdued\|field\|overlay>`, `<role>.<subtle\|solid>.<state>` | `vars.color.surface`, `vars.color.background` |
| `borderColor`     | `decorative`, `control`, `controlHover`, `focus`, the six roles             | `vars.color.border`                           |
| `borderRadius`    | `detail`, `control`, `surface`, `overlay`, `full`                           | `vars.radius`                                 |
| `boxShadow`       | `recessed`, `resting`, `raised`, `floating`, `overlay`                      | `vars.depth`                                  |
| spacing and gaps  | `0`, `sp4` … `sp96` (margins also `auto`)                                   | `spaceScale`                                  |

A removed token removes its `Box` value. Non-token CSS values such as `display="flex"` stay defined
on their own.

## Changes from the previous contract

| Change  | Path                                                                                          |
| ------- | --------------------------------------------------------------------------------------------- |
| Added   | `color.surface.base`, `.subdued`, `.field`; `color.border.controlHover`; `controlFinish.*`    |
| Renamed | `actionControlFinish.*` → `controlFinish.*` (theme input and token)                           |
| Removed | `color.surface.canvas`, `.recessed`, `.floating`                                              |
| Removed | `font.<style>.baselineTrim`, `.capHeightTrim` (now `--luke-internal-*`)                       |
| Removed | `controlSize.minTarget`, `controlSize.comboboxAction`, `iconSize.*` (now private constants)   |
| Removed | Theme input `color.background` (now `color.surface.base`), `radius.base`, `radius.multiplier` |

`color.surface.overlay` keeps its name but now covers every detached surface. Radius defaults stay
4, 8, 12, and 16px, written directly. Explicit radius overrides remain. There are no compatibility
aliases.

The spacing scale was reviewed against control geometry. No 2px step is needed: the 1px switch inset
and the 4px combobox action gap are component-private.

## Surface migration

| Consumer                                        | Old        | New       | Reason                                  |
| ----------------------------------------------- | ---------- | --------- | --------------------------------------- |
| TextInput, TextInputControl, Combobox, Select   | `recessed` | `field`   | Form-control surface                    |
| Same controls, read-only                        | `canvas`   | `field`   | Read-only stays a field                 |
| Checkbox box, Switch thumb                      | `canvas`   | `field`   | The field part of a selection control   |
| Combobox and Select popover, mobile tray        | `floating` | `overlay` | Detached content                        |
| `Code`, `Kbd`                                   | `recessed` | `subdued` | Static secondary tint                   |
| Test render container                           | `canvas`   | `base`    | Page background                         |
| Reference app body, settings and home shell     | `canvas`   | `subdued` | The secondary region around the content |
| Reference app main content, settings panels     | `floating` | `base`    | Primary content                         |
| Reference app menu, dialog, skip link           | `floating` | `overlay` | Detached content                        |
| Reference app email edit button                 | `canvas`   | `base`    | A control face on the content           |
| Docs header, sidebar, shell, previews, tables   | `canvas`   | `base`    | Page background and primary content     |
| Docs appearance popover, search panel and input | `floating` | `overlay` | Detached content                        |
| Docs mobile drawer                              | `canvas`   | `overlay` | Detached content                        |
| Docs search trigger                             | `recessed` | `field`   | A field-shaped control                  |
| Docs code block, Fumadocs muted and secondary   | `recessed` | `subdued` | Static secondary region                 |
| Docs Fumadocs popover                           | `floating` | `overlay` | Detached content                        |
| Docs examples showing a card or panel           | `floating` | `subdued` | Static region set apart from the page   |
| Docs examples showing an inset or bleed region  | `recessed` | `subdued` | Static region set apart from the page   |

## Simplifications and trade-offs

- Fixed offsets instead of a solver. A theme whose generated surface misses a gate fails loudly; the
  author supplies the surface. This keeps generation predictable at the cost of an occasional
  explicit value.
- One hover offset. `controlHover` is not searched for a minimum perceptible step. Its only
  guarantee is 3:1.
- Light `field` equals `base`. A field reads through its guaranteed border and inset depth, not a
  brighter fill. Paper is unchanged; Tactile's fields visibly lose their white fill.
- Role borders stay public and ungated. Applications build notices from them; controls never rely on
  them.
- Capsize trims are the one non-public CSS variable family, written by the theme and read by `Text`.

## Cross-issue dependencies

| Owner | Change required                                                                                     | Why #716 depends on it                                                                     | Independent? |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------ |
| #715  | Public `getThemeClassName()` for custom themes and independent Tactile/Paper package proof          | Custom themes authored with the new surface inputs need an identity class to co-exist      | Yes          |
| #717  | Remove `rootClassName` and the `:root` fallback; require an identity on `<html>`; rework reset/base | The reference app and docs still apply `rootClassName` to portals and shells (FRICTION.md) | Yes          |
| #717  | Apply client-selected identity and colour mode before first paint                                   | Surface changes are mode-dependent and visible on first paint                              | Yes          |
| #718  | Full component visual audit, broader forced-colours and device testing                              | #716 changed representative controls only; other components consume the new surfaces       | Yes          |
