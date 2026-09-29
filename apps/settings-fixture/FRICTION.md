# Settings fixture friction log

Consumer notes from building this app against public `@luke-ui/react` APIs (#713). Findings are
evidence for other workstreams. They are not product decisions made in this PR.

## Required setup that is easy to miss

1. **`Provider`** — Icon-using controls need a spritesheet URL at the application root. The fixture
   wraps with `Provider` from `@luke-ui/react/provider` and imports
   `@luke-ui/react/spritesheet.svg?url&no-inline` (Vite). Setup landed in #725; this app consumes
   it.
2. **`rootClassName` + theme class + stylesheet imports** — The app needs
   `@luke-ui/react/stylesheet.css`, a theme stylesheet, `rootClassName` on a wrapper, and
   `.luke-ui-theme-<name>` (here via `themeClassName` from `@luke-ui/react/themes/tactile`). README
   still teaches `rootClassName`; #717 wants that removed in favour of the explicit stylesheet on
   `<html>` / `<body>`.

## Composition notes

| Need                | Approach used                                       | Friction                                                                                                                                                          | Workstream |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Settings nav        | `Stack` + `Button` with `aria-current`              | No dedicated nav/sidebar primitive; fine for now                                                                                                                  | —          |
| Profile fields      | `TextField`                                         | Works. No standalone multi-line bio control — reused `TextField`                                                                                                  | #714       |
| Inline Light/Dark   | `Cluster` + `Button` `aria-pressed`                 | No segmented control; ToggleButtonGroup is RAC-only and playground-unfriendly                                                                                     | #711       |
| Reduced motion      | `Checkbox`                                          | Works as an inline preference                                                                                                                                     | —          |
| Danger confirm      | `TextField` validation + `Button` `tone="critical"` | App-owned validation is clear; danger border used `vars.color.border.danger` via `style` because sprinkles `borderColor` vocabulary needs confirmation for danger | #714/#716  |
| Product-owned theme | Still using bundled Tactile                         | `defineTheme` exists; wiring a generated CSS artifact in Vite is the next fixture step                                                                            | #715       |

## Candidates exercised (not adopted)

- **Tooltip (#561), Card (#600), Bleed (#642)** — not required for these three flows.
- **ComboboxField** — not needed for profile/appearance/account yet.

## Follow-ups (do not implement here)

- #714 — multi-line field and shared validation patterns once more forms land.
- #715 — replace Tactile import with an app-owned `defineTheme` output.
- #716 — token / sprinkle vocabulary for danger borders without raw `vars` style escape hatches.
- #717 — drop `rootClassName` once the global stylesheet contract is frozen.
- #711 — whether a public segmented / toggle-group pattern belongs in 1.0 (open question from
  Light/Dark).
