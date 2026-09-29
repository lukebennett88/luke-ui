# Reference app friction log

Consumer notes from building a Linear-inspired settings product against public `@luke-ui/react` APIs
(#713). Findings are evidence for other workstreams. They are not product decisions made in this PR.

## Required setup

| Consumer need         | Public API used                              | App-owned workaround                                                    | Awkward / missing                                                                                                                                                                                  | Workstream |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Icon spritesheet URL  | `Provider` + `spritesheet.svg?url&no-inline` | App root wraps routes                                                   | Documented; fine after #725                                                                                                                                                                        | —          |
| Product-owned theme   | `defineTheme` from `@luke-ui/react/theme`    | Build script writes `src/generated/theme.css`; import beside stylesheet | Single-theme docs say no identity class is needed; generating CSS in a separate Node script is clear but not Vite-native. Extending Paper was tempting but brief forbids bundled product identity. | #715       |
| Theme on the document | `rootClassName` + generated stylesheet       | Applied on the settings shell                                           | Still need `rootClassName` on a wrapper; #717 wants this gone                                                                                                                                      | #717       |

## Composition

| Consumer need                  | Public API used                           | App-owned workaround                                  | Awkward / missing                                                                                         | Workstream  |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------- |
| Settings sidebar nav           | `NavLink` + CSS tokens                    | Dimmed recessed sidebar, quiet links                  | No nav/listbox/sidebar primitive; density and active styles are fully app CSS                             | #711        |
| Settings row (label + control) | Layout via app CSS; `Button` where needed | `SettingsRow` / `SettingsSection`                     | No settings-row or description-list pattern in Luke UI                                                    | #711        |
| Select menus                   | Native `<select>`                         | `SettingsSelect` styled with tokens                   | No public Select; styling native selects to match Button density takes care                               | #711 / #714 |
| Boolean prefs                  | Native switch button                      | `SettingsSwitch`                                      | No Switch; Checkbox exists but Linear-style immediate toggles want a switch affordance                    | #711 / #714 |
| Profile text fields            | Native `<input>` (not `TextField`)        | Styled inputs in rows                                 | `TextField` label/description layout fights the settings-row (label left, control right) pattern          | #714        |
| Explicit save vs autosave      | TanStack Form + RR fetcher                | Profile uses Form; prefs/interface use fetcher.submit | Pending ownership is clear with fetcher.state; field-level RR integration is manual                       | #714        |
| Danger border                  | CSS `border-danger` token                 | Panel class                                           | Sprinkles `borderColor` danger path still unclear for Box props                                           | #716        |
| Destructive multi-step flow    | `Button tone="critical"`                  | `deleteAccountReducer`                                | No dialog/alert-dialog primitive; confirmation stays inline                                               | #711        |
| Colour mode                    | `data-color-mode` on `<html>`             | Interface page writes dataset before/after save       | Works; system mode means deleting the attribute                                                           | —           |
| Mobile settings nav            | App routes `/settings/menu`               | Back link to menu; `/settings` redirects to profile   | Had to invent `/settings/menu` so redirecting `/settings` → profile does not break mobile back navigation | #711        |

## Candidates not adopted

- Tooltip, Card, Bleed — not required for these flows
- ComboboxField — selects stay native for density
- LoadingSkeleton / Spinner — pending copy is enough for this app

## Follow-ups (do not implement here)

- #711 — public Select, Switch, settings-row / nav patterns, dialog for destructive confirm
- #714 — form controls that compose into settings rows; shared pending/error patterns with routers
- #715 — smoother app packaging for `defineTheme` output (Vite plugin or first-class recipe)
- #716 — sprinkle-friendly danger borders
- #717 — drop `rootClassName` once global stylesheet contract lands
