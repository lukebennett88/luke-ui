# Settings fixture friction log

Consumer notes from building this app against public `@luke-ui/react` APIs (#713).

## Required setup that is easy to miss

1. **`IconSpritesheetProvider`** — Any icon-using control (and several high-level components) throws
   without a provider and a resolvable spritesheet URL. The fixture imports
   `@luke-ui/react/spritesheet.svg?url`. This belongs in installation docs and likely a thin
   `LukeUIProvider` (#712).
2. **`rootClassName` + theme class + stylesheet imports** — The app needs
   `@luke-ui/react/stylesheet.css`, a theme stylesheet, `rootClassName` on a wrapper, and
   `.luke-ui-theme-<name>` (here via `themeClassName` from `@luke-ui/react/themes/tactile`). README
   still teaches `rootClassName`; epic #717 wants that removed in favour of the explicit stylesheet
   on `<html>` / `<body>`.

## Composition notes

| Need                | Approach used                                       | Friction                                                                                                                                                          |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings nav        | `Stack` + `Button` with `aria-current`              | No dedicated nav/sidebar primitive; fine for now                                                                                                                  |
| Profile fields      | `TextField`                                         | Works. No standalone multi-line bio control — reused `TextField`                                                                                                  |
| Inline Light/Dark   | `Cluster` + `Button` `aria-pressed`                 | No segmented control; ToggleButtonGroup is RAC-only and playground-unfriendly                                                                                     |
| Reduced motion      | `Checkbox`                                          | Works as an inline preference                                                                                                                                     |
| Danger confirm      | `TextField` validation + `Button` `tone="critical"` | App-owned validation is clear; danger border used `vars.color.border.danger` via `style` because sprinkles `borderColor` vocabulary needs confirmation for danger |
| Product-owned theme | Still using bundled Tactile                         | `defineTheme` exists; wiring a generated CSS artifact in Vite is the next fixture step (#715)                                                                     |

## Candidates exercised (not adopted)

- **Tooltip (#561), Card (#600), Bleed (#642)** — not required for these three flows.
- **ComboboxField** — not needed for profile/appearance/account yet.

## Follow-ups for Wave 1/2

- #712 — document or wrap icon spritesheet setup.
- #714 — multi-line field and shared validation patterns once more forms land.
- #715 — replace Tactile import with an app-owned `defineTheme` output.
- #717 — drop `rootClassName` once the global stylesheet contract is frozen.
