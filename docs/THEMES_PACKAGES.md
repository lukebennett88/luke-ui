# Custom theme authoring and Tactile/Paper packages (#715)

Decision record for proving `defineTheme` as a build-time consumer API and moving bundled themes to
independent 0.x packages. Parent: epic [#709](https://github.com/lukebennett88/luke-ui/issues/709) /
issue [#715](https://github.com/lukebennett88/luke-ui/issues/715).

## Target contract (1.0)

1. **Authoring:** `defineTheme(ThemeInput) -> CSS` stays a **build-time, Node 24+** workflow. No
   runtime theme generation in the application provider.
2. **Identity:** Generated CSS uses explicit `.luke-ui-theme-<name>` only — **no `:root` fallback**.
   One identity class and one `data-color-mode` on `<html>` for 1.0 (#717).
3. **Packages:**
   - `@luke-ui/theme-tactile` (0.x) — exports theme input + precompiled CSS
   - `@luke-ui/theme-paper` (0.x) — same
   - Application-owned themes — consumer runs `defineTheme` in their build and ships CSS
4. **React 1.x** depends on public theme CSS / class names only; theme packages must not import
   private React internals.
5. **Fonts:** Arbitrary body stacks require Capsize-compatible metrics; missing metrics must **fail
   loudly**, not silently drop trimming.
6. **Contrast:** Promised contrast-safe pairings stay hard failures (existing contrast policy).

## What stays in `@luke-ui/react`

| Concern                                               | Location                                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `defineTheme`, `ThemeInput`, contrast/font validation | `@luke-ui/react/theme` (or a future thin `@luke-ui/theme` 0.x if extraction is needed) |
| Token contract / `vars`                               | React (until #716 freezes taxonomy)                                                    |
| Component recipes consuming `vars`                    | React                                                                                  |

Bundled `themes/tactile` and `themes/paper` subpaths become **deprecated re-exports or removed**
once the external packages ship and docs move.

## Inheritance and modes

- Theme inheritance (`extendTheme` / inheritance APIs) must work for the three real themes without
  nested simultaneous identities.
- Light/dark remain document modes via `data-color-mode`, not nested providers.

## Compiler complexity

Inspect `build-theme.ts` / `defineTheme` for options the three real themes never use. Prefer
deletion or internalisation over expanding the public `ThemeInput` surface.

## Settings fixture (#713)

Next fixture step: replace `@luke-ui/react/themes/tactile` with either the external package or a
local `defineTheme` build artifact.

## Next actions

1. Extract Tactile/Paper sources into workspace packages that compile CSS via public `defineTheme`.
2. Drop `:root` theming in favour of `.luke-ui-theme-<name>` (coordinate with #717).
3. Prove clean pack install of React + a theme package in the #710 harness.
4. Wire settings fixture to an app-owned or package theme.
