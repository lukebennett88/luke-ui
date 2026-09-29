# Reference app friction log

Consumer notes after rebuilding the Linear-inspired settings UI with the Luke UI → RAC → Vanilla
Extract hierarchy (#713 / #723). Findings are evidence for other workstreams — not product decisions
made in this PR.

For every finding: which layer solved it, and whether a public capability is still missing.

## Required setup

| Consumer need         | What solved it                                                   | Awkward / missing                                                                              | Workstream |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| Icon spritesheet URL  | High-level `Provider` + `spritesheet.svg?url&no-inline`          | Documented; fine after #725                                                                    | —          |
| Product-owned theme   | Public `defineTheme` → build script writes `generated/theme.css` | Not Vite-native packaging                                                                      | #715       |
| Theme on the document | `rootClassName` on the shell                                     | Still need a wrapper class; #717 wants this gone                                               | #717       |
| App VE + RAC peers    | Catalog `@vanilla-extract/*`, `react-aria-components`            | Must install RAC even when only using Luke UI high-level components (peer of `@luke-ui/react`) | —          |

## Composition (post Luke UI–first pass)

| Consumer need                  | What solved it                                                                                  | Awkward / missing                                                                                                                                                                                                                   | Workstream  |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| App shell / sidebar / main     | Luke UI `Box` (sidebar/main) / `Stack elementType="nav\|section"` + app VE for dimmed sidebar   | `Stack` hard-codes `display="flex"`, so hide-on-narrow must use `Box` responsive `display` (or VE alone). No sidebar/nav primitive; active/hover density is app VE                                                                  | #711        |
| Settings row (label + control) | Luke UI `Track` (growing copy + `railEnd` control) + `Stack` for label/hint + `Heading`/`Text`  | Works well. Mobile wrap still needs a small VE exception (`flexWrap` + full-width rail) because Track does not stack responsively                                                                                                   | #711        |
| Page / section typography      | Luke UI `Heading` + `Text` (`label` / `caption` / weight roles)                                 | Linear’s micro uppercase sidebar title still needs a VE class (`letter-spacing` / `text-transform`); do not invent custom type sizes                                                                                                | #711        |
| Select menus                   | **RAC fallback** (`Select` / `SelectValue` / `ListBox` / `Popover`) + app VE trigger/popover    | No public Luke UI Select. RAC covers behaviour; Linear chrome is entirely app-owned VE                                                                                                                                              | #711 / #714 |
| Boolean prefs                  | **RAC fallback** (`Switch`) + app VE track/thumb                                                | No public Luke UI Switch. Checkbox exists but is the wrong affordance for immediate prefs                                                                                                                                           | #711 / #714 |
| Profile text fields            | High-level `TextField` with `aria-label` (no visible label) + row label from `SettingsRow`      | **Tried and kept.** Visible `label` / `description` on `TextField` fight the left-label/right-control row. Unlabeled `TextField` + external row label works. Field/input-group primitives unnecessary once unlabeled TextField fits | #714        |
| Nav links                      | React Router `NavLink` + app VE; Luke UI `Stack elementType="nav"`                              | No nav item primitive. `render` on Box was unnecessary — `NavLink` owns the `<a>`                                                                                                                                                   | #711        |
| Explicit save vs autosave      | TanStack Form + RR fetcher (unchanged)                                                          | Field-level RR integration remains manual                                                                                                                                                                                           | #714        |
| Danger panel border            | App VE using `vars.color.border.danger` + subtle danger background mix                          | Box `borderColor="danger"` exists, but tinted danger surface still wants color-mix VE                                                                                                                                               | #716        |
| Destructive multi-step flow    | `Button tone="critical"` + app reducer                                                          | No dialog/alert-dialog; confirmation stays inline                                                                                                                                                                                   | #711        |
| Colour / font / pointer prefs  | `data-*` on `<html>` + VE `globalStyle`                                                         | Works                                                                                                                                                                                                                               | —           |
| Mobile settings nav            | App route `/settings/menu` + `Box` responsive `display` (`initial` / `bp768`) on sidebar/header | Still invent `/settings/menu` so `/settings` → profile redirect does not break back navigation. Container-query breakpoints apply while `:root` is the containment root                                                             | #711        |

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
