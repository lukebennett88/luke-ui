# Reference app friction log

Consumer evidence from rebuilding Linear-inspired settings with Luke UI → RAC → Vanilla Extract
(#713 / #723). Not product decisions for this PR.

For every finding: which layer solved it, and whether a public capability is still missing.

## Required setup

| Consumer need         | What solved it                                                   | Awkward / missing                                                                              | Workstream |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| Icon spritesheet URL  | High-level `Provider` + `spritesheet.svg?url&no-inline`          | Documented; fine after #725                                                                    | —          |
| Product-owned theme   | Public `defineTheme` → build script writes `generated/theme.css` | Not Vite-native packaging                                                                      | #715       |
| Theme on the document | `rootClassName` on the shell                                     | Still need a wrapper class; #717 wants this gone                                               | #717       |
| App VE + RAC peers    | Catalog `@vanilla-extract/*`, `react-aria-components`            | Must install RAC even when only using Luke UI high-level components (peer of `@luke-ui/react`) | —          |

## Composition (post Luke UI–first pass)

| Consumer need                           | What solved it                                                                                                               | Awkward / missing                                                                                                                                                                                                                          | Workstream  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| App shell / settings layout             | Luke UI `Box` (sidebar + main) / `Stack elementType="nav\|section"` + app VE                                                 | Recessed shell + transparent sidebar; desktop main is a raised floating card (`12px` radius, `depth.raised`) via app VE. `Stack` hard-codes `display="flex"`, so hide-on-narrow needs `Box` responsive `display`. No sidebar/nav primitive | #711        |
| Settings row (label + control)          | Luke UI `Track` (growing copy + `railEnd` control) + `Stack` for label/hint + `Heading`/`Text`                               | Mobile wrap still needs a small VE exception (`flexWrap` + full-width rail) because Track does not stack responsively                                                                                                                      | #711        |
| Icon + caption in Track (`Back to app`) | Match caption font metrics on the control so Track inherits the same line box; `railAlignment="firstLine"` for the icon rail | Track `center` / `firstLine` align to Track’s inherited line-height (centre strut / `1lh`), not nested `Text typography`. Caption `Text` inside a body-inherited Track leaves the icon high                                                | #711        |
| Page / section typography               | Luke UI `Heading` + `Text` (`label` / `caption` / weight roles)                                                              | Linear’s micro uppercase sidebar title still needs a VE class (`letter-spacing` / `text-transform`); do not invent custom type sizes                                                                                                       | #711        |
| Select menus                            | **RAC fallback** (`Select` / `SelectValue` / `ListBox` / `Popover`) + app VE trigger/popover                                 | No public Luke UI Select. RAC covers behaviour; Linear chrome is entirely app-owned VE                                                                                                                                                     | #711 / #714 |
| Boolean prefs                           | **RAC fallback** (`Switch`) + app VE track/thumb                                                                             | No public Luke UI Switch. Checkbox exists but is the wrong affordance for immediate prefs                                                                                                                                                  | #711 / #714 |
| Profile text fields                     | High-level `TextField` with `aria-label` (no visible label) + row label from `SettingsRow`                                   | **Tried and kept.** Visible `label` / `description` on `TextField` fight the left-label/right-control row. Unlabeled `TextField` + external row label works. Field/input-group primitives unnecessary once unlabeled TextField fits        | #714        |
| Nav links                               | React Router `NavLink` + app VE; Luke UI `Stack elementType="nav"`                                                           | No nav item primitive. `render` on Box was unnecessary — `NavLink` owns the `<a>`                                                                                                                                                          | #711        |
| Explicit save vs autosave               | RR Data Mode fetcher autosave (prefs) + dialog saves (profile)                                                               | Field-level RR integration remains manual                                                                                                                                                                                                  | #714        |
| Danger panel border                     | App VE using `vars.color.border.danger` only (no pink wash)                                                                  | Box `borderColor="danger"` exists; Linear-sparse danger rows still want a dedicated border token path without a custom panel class                                                                                                         | #716        |
| Destructive multi-step flow             | `Button tone="critical"` + app reducer                                                                                       | No dialog/alert-dialog; confirmation stays inline                                                                                                                                                                                          | #711        |
| Colour / font / pointer prefs           | `data-*` on `<html>` + VE `globalStyle`                                                                                      | Works                                                                                                                                                                                                                                      | —           |
| Mobile settings nav                     | App route `/settings/menu` + `Box` responsive `display` (`initial` / `bp768`) on sidebar/header                              | Menu mirrors Linear sidebar (Back to app, Search, Personal section, dense icon links) without nested panel card. Still invent `/settings/menu` so `/settings` → preferences redirect does not break back navigation                        | #711        |

## Tried and not adopted

| Candidate                                       | Result                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| Luke UI `TextField` with visible label in-row   | Rejected — doubles the label and stacks description under the control |
| Field + InputGroup primitives alone             | Unnecessary once unlabeled `TextField` worked                         |
| Native `<select>` / hand-rolled `role="switch"` | Replaced by RAC                                                       |
| Raw `<input>` for profile text                  | Replaced by `TextField`                                               |
| Large `app.css`                                 | Replaced by VE + Luke UI layout/typography props                      |
| ComboboxField                                   | Selects stay discrete RAC Select for density                          |
| Tooltip / Card / Bleed / LoadingSkeleton        | Not required                                                          |

## Follow-ups (do not implement here)

- #711 — public Select, Switch, settings-row / nav patterns, dialog for destructive confirm
- #714 — form controls that compose into settings rows; shared pending/error patterns with routers
- #715 — smoother app packaging for `defineTheme` output
- #716 — sprinkle-friendly danger surface tints (beyond border)
- #717 — drop `rootClassName` once global stylesheet contract lands
