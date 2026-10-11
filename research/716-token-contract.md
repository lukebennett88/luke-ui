# #716 token contract and representative controls

Decision record for [#716](https://github.com/lukebennett88/luke-ui/issues/716). It is
non-normative: it records why the 1.0 token contract looks the way it does. The rules themselves
live in [docs/STYLING.md](../docs/STYLING.md),
[docs/THEME_COLOUR_GENERATION.md](../docs/THEME_COLOUR_GENERATION.md), and the docs app's theming
pages, and the full token list is in the token reference.

[#707](https://github.com/lukebennett88/luke-ui/issues/707) and the settings reference application
(`apps/reference-app`) are the design inputs. Paper, Tactile, the reference-app theme, and a flat
fixture (every `depth` and `controlFinish` value `none`) are the evidence themes, in both modes.

## Principle

A token is public when it carries a theme-dependent semantic decision, or when it is a shared fixed
measurement that an application demonstrably needs to align with Luke UI. Component-specific
geometry is a private TypeScript constant. Nothing is added for hypothetical flexibility: no surface
repair, hierarchy solver, perceptual threshold, or visual-distinction diagnostic.

## Public and private values

Colour, depth, control finish, type family and weight, and radius are theme identity. Spacing,
control sizes, the disabled fade, motion, and type metrics are Luke UI-owned structure. Both kinds
are public when an application needs them, so a custom element can match Luke UI without copying
resolved values.

Each fixed public measurement has a consumer outside Luke UI's components:

| Token                         | Consumer evidence                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `space.*`                     | `Box` spacing props everywhere; reference app settings rows and dialog padding; docs shell layout.                                   |
| `controlSize.small`           | Docs code-block copy button centres itself on the first code line with `calc(… - controlSize.small / 2)` (`code-block.css.ts`).      |
| `controlSize.medium`          | Application elements laid out beside a medium `Button` or field. Pairs with `small`; removing one would leave the scale half public. |
| `interaction.disabledOpacity` | Reference app menu items and the email edit button fade like Luke UI controls.                                                       |
| `motion.*`                    | Reference app avatar overlay transition; docs search and theme controls.                                                             |
| `font.<style>.*`              | Docs shell, site navigation, search, and code block apply `label` and `caption` metrics to app-owned elements.                       |
| `radius.full`                 | Reference app avatar, avatar button, and email edit button.                                                                          |

The minimum target size, the Combobox action size, and the icon sizes had no consumer outside the
components that set them, so they became private constants in `core/sizing/`. The Capsize trims
depend on the theme's font, so they cannot be TypeScript constants; they are implementation metrics,
not design roles, so the stylesheet writes them as `--luke-internal-*` variables that `Text` reads.
There is no internal token registry or second value pipeline.

Radius is authored explicitly, as #716 settled: the `base` and `multiplier` inputs are gone, and
each radius role defaults to 4, 8, 12, or 16px and stays overridable.

## Surfaces

Surfaces are named by purpose: `base` for the application and primary content, `subdued` for
secondary regions, `field` for form controls, and `overlay` for detached content. The old `floating`
was used both for detached content and for static cards, so each consumer was mapped by purpose
rather than renamed. Static cards became `subdued` or `base`; menus, popovers, and dialogs became
`overlay`. The reference app's shell is `subdued` around `base` content.

`base` replaces the `color.background` input and still anchors the neutral and role ramps. This
coupling is deliberate: there is no independent neutral anchor to keep consistent.

A missing surface is a fixed per-mode lightness offset from `base`, never from a sibling, and
surfaces are never repaired. A solver would keep every generated theme valid but make surfaces hard
to predict. A theme whose generated surface fails a gate throws, and the author sets that surface.
The cost is an occasional explicit value.

Light `field` equals `base`. A field reads through its guaranteed border and inset depth, not a
brighter fill. Paper's light surfaces stay white; Tactile's fields visibly lose their white fill.

There is no `surface.strong`. Add one only when a real composition needs another static level.

## Contrast guarantees

Every surface gate covers all four surfaces. `subdued` was first treated as a static region and left
out of the role-foreground and boundary gates, but real compositions put forms and links on it: the
reference app's settings sidebar has a search field, and the docs home hero has a form on a
`subdued` card. The light control border measured about 2.9:1 against `subdued` in both bundled
themes. Including it moved that border one 0.015 lightness step darker.

Only `danger.solid.rest` is gated as a boundary, because it is the invalid control boundary. The
other roles' solid fills are solved for on-solid text, and `warning` lands well under 3:1 against
light surfaces. Role borders are decorative tints, used for application notices; components never
rely on one alone.

`border.controlHover` is the resting border moved a fixed step away from the surfaces. Its only
guarantee is 3:1. Whether hover looks distinct enough is a visual decision, so there is no
minimum-delta search and no perceptual threshold.

## Representative controls

### Field controls

`TextInput`, `TextInputControl`, `Combobox`, and `Select` share one model: hover uses the neutral
`border.controlHover`, focus adds the separate ring without changing the border, invalid wins over
every other state, and read-only keeps the field surface and guaranteed border.

The old hover border, `border.accent`, was lighter than the resting control border, so hover
weakened the boundary below 3:1. Read-only used `border.decorative` as its only boundary, which is
not gated, and `TextInputControl` let read-only override an invalid border.

A read-only field in a flat theme looks like an editable one at rest. That is deliberate: the
content stays fully legible, assistive technology announces the state, and the field gives no hover
feedback. Fading it would make it look disabled.

### Selection controls

Checkbox and Switch had two defects that only materials distinguished, so they disappeared in a flat
theme: Checkbox hover and pressed differed only by control finish, and Switch styled hover and
pressed with one selector. Their states now differ by colour or geometry. A pressed unchecked
Checkbox takes a neutral pressed fill; a pressed Switch thumb stretches.

The thumb stretches rather than recolouring because the off thumb on the off track is a gated pair.
A pressed fill on the thumb is not guaranteed against the track. Likewise, an invalid box or track
keeps `danger.solid.rest` through hover and press, because the hover and pressed danger fills are
not guaranteed boundaries.

### Buttons

`Button`, `IconButton`, button-shaped `Link`, and `IconLink` share one recipe. They no longer move
on hover or press.

Buttons draw no border outside forced colours. Inset shadows and background images paint inside the
border, so a transparent border left an unshaded rim around a pressed face. The size padding makes
up the 1px, so the outer size is unchanged.

### Tactile material

Tactile follows the material language of React Aria's Vanilla CSS starter: light from above,
restrained shadows, and an inset for wells. The previous values drew a bright lower rim and a
double-bordered look: a second radial gradient below the face, an upward inset highlight on
`depth.recessed`, and zero-blur ledges on `depth.resting` and `depth.raised`. Paper keeps its
values. No token changed.

### Minimum target size

The private minimum target and the medium Combobox action size are `max(<rem>, 24px)`. The reference
app sets root font sizes of 13, 14, and 16px. At 13px, a `rem`-only target made the small Combobox
clear and toggle buttons 19.5px. They sit side by side, so WCAG 2.5.8's spacing exception cannot
excuse them.

## Box

`Box` is the second way into the token contract, so its token-backed values derive from `vars`. A
removed token removes its `Box` value. Non-token CSS values such as `display="flex"` stay defined on
their own.

## Changes from the previous contract

| Change  | Path                                                                                          |
| ------- | --------------------------------------------------------------------------------------------- |
| Added   | `color.surface.base`, `.subdued`, `.field`; `color.border.controlHover`; `controlFinish.*`    |
| Renamed | `actionControlFinish.*` → `controlFinish.*` (theme input and token)                           |
| Removed | `color.surface.canvas`, `.recessed`, `.floating`                                              |
| Removed | `font.<style>.baselineTrim`, `.capHeightTrim` (now `--luke-internal-*`)                       |
| Removed | `controlSize.minTarget`, `controlSize.comboboxAction`, `iconSize.*` (now private constants)   |
| Removed | Theme input `color.background` (now `color.surface.base`), `radius.base`, `radius.multiplier` |

There are no compatibility aliases.

## Cross-issue dependencies

| Owner | Change required                                                                                     | Why #716 depends on it                                                                     |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| #715  | Public `getThemeClassName()` for custom themes and independent Tactile/Paper package proof          | Custom themes authored with the new surface inputs need an identity class to co-exist      |
| #717  | Remove `rootClassName` and the `:root` fallback; require an identity on `<html>`; rework reset/base | The reference app and docs still apply `rootClassName` to portals and shells (FRICTION.md) |
| #717  | Apply client-selected identity and colour mode before first paint                                   | Surface changes are mode-dependent and visible on first paint                              |
| #718  | Full component visual audit, broader forced-colours and device testing                              | #716 changed representative controls only; other components consume the new surfaces       |

## Addition in #715

[#715](https://github.com/lukebennett88/luke-ui/issues/715) adds one public token,
`font.family.display` (`--luke-font-family-display`), for the optional display font role that
`heading4` through `heading1` and `display` use. Without a display font it is a literal copy of the
body family. See [715-theme-authoring-contract.md](./715-theme-authoring-contract.md).
