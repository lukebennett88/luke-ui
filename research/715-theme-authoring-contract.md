# #715 theme authoring contract

Decision record for [#715](https://github.com/lukebennett88/luke-ui/issues/715): custom theme
authoring and independent theme packages. It supersedes contradictory wording in #709, #715, #716,
#717, and #721. Decision numbers refer to the design review that produced this record. Gaps in the
numbering are questions that were merged into other decisions.

The guiding rule: ship the smallest public contract that makes custom themes reliable, and leave
room for additive extension after 1.0. Prefer extensibility over configurability.

## Packages and entry points

| Package or entry                   | Contents                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@luke-ui/react/theme`             | Runtime only: `vars`, `breakpoints`, `getThemeClassName`, and `rootClassName` until #717.                                                                                        |
| `@luke-ui/react/theme/compiler`    | Build time only, Node 24+: `defineTheme`, `ThemeInput`, `ExtendingThemeInput`, `ThemeFont`, `FontMetrics`, `ThemeValidationError`, `ThemeContrastError`, `ThemeGenerationError`. |
| `@luke-ui/theme-paper`, `-tactile` | `.` exports `themeClassName`; `./input` exports `theme`; `./stylesheet.css`; `./fonts.css`.                                                                                      |

- **D1. Compiler and identity stay separate.** `defineTheme(input)` returns a CSS string.
  `getThemeClassName(name)` becomes public on the runtime entry. Returning both from `defineTheme`
  would only help at build time; the runtime still needs the class name.
- **D16. One home for authoring APIs.** Everything for authoring lives on `/theme/compiler`. There
  are no compatibility re-exports from `/theme`. `@luke-ui/react/themes/*` is removed.
- **D3. Font metrics follow Capsize's `FontMetrics` type.** `ThemeFont.metrics` requires
  `familyName` and the five fields Luke UI trims with: `ascent`, `capHeight`, `descent`, `lineGap`,
  and `unitsPerEm`. Every other `FontMetrics` field is optional, so a complete object from
  `@capsizecss/metrics` or `@capsizecss/unpack` fits. `FontMetrics` is re-exported from
  `/theme/compiler`, so authors don't need to install `@capsizecss/core`.
- **D5. Runtime and authoring entries are separate in theme packages too.** The root entry imports
  only `getThemeClassName` and a name constant shared with `./input`, so runtime imports can never
  load the input. This replaces today's reliance on tree shaking and the rule against `.join()` in
  CSS values.
- **D61 (revised). `./input` has a named `theme` export only.** The default export existed only for
  the withdrawn CLI.
- **D17. `@luke-ui/react` is a peer dependency** of each theme package, with a workspace dev
  dependency. #721 owns the final version ranges.
- **D21. Paper and Tactile live in this monorepo** as independently publishable packages.
- **D23. #715 produces publishable, verified packages.** #721 owns publishing and release
  automation. `release.yml` publishing stays disabled.

## Compilation

- **D22 (revised). No CLI for 1.0.** `defineTheme` returns CSS, and a four-line Node 24 script
  writes it to a file. A CLI can be added later in a minor release without breaking anything.
  Decisions 26, 27, 33, 50, and the CLI parts of 23 and 28 are withdrawn.
- **D28. The reference app keeps its Vite virtual-module integration,** documented as an optional
  recipe. No Vite or PostCSS plugin is published.
- **D29. Generated theme CSS is built into `dist`,** not committed.
- **D60. An extending theme compiles to a standalone stylesheet** with every token. The parent's
  `stylesheet.css` isn't needed, but the parent's `fonts.css` (or the app's own font loading) still
  is, because tokens name fonts without loading them.
- **D30. Compiler cleanup removes only demonstrably obsolete code:** the curated font enum and
  stacks, the copied-in `@capsizecss/metrics`, `:root` fallbacks, nested-identity selectors, bundled
  theme modules and exports, and their tests. Colour adaptation, materials, inheritance, and
  contrast checks stay. Anything uncertain becomes a focused issue rather than a deletion.

## Typography

- **D19, D20 (revised). Two font roles, each an atomic `ThemeFont` of `{ family, metrics }`.**
  `typography.fonts.body` is required in a fresh theme. `typography.fonts.display` is optional and
  applies to `heading4`–`heading1` and `display`; omitted, those styles use the body font. There is
  no `code` role: `Code` isn't trimmed, and an optional `fonts.code` can be added later without
  breaking anything. `vars.font.family.code` keeps the system monospace stack and can be overridden
  in CSS.
- **D25. Inheritance replaces each role as a whole.** Omitting a role inherits it. `display: null`
  removes an inherited display font. `body` is never nullable. `null` survives multi-level merges
  and is resolved after the chain is merged.
- **D59. `vars.font.family.display` is always emitted.** Without a display font it is a literal copy
  of the body family, never `var(--luke-font-family-body)`. No token value references another token.
- **D13. The four semantic weights stay optional,** defaulting to 400/500/600/700.
- **D14. Metrics describe the primary font.** Accept the temporary mismatch while a fallback font
  shows during `font-display: swap`, and the permanent mismatch of system stacks on other platforms.
  Both are documented. No runtime font detection.
- **D4, D12, D24. Theme packages bundle their own fonts.** Paper and Tactile each ship an
  OFL-licensed, Latin-subset variable Inter WOFF2 with its licence, declared in an optional
  `fonts.css`. Each build copies both files from a pinned `@fontsource-variable/inter`, so the
  repository holds no font binaries and the build downloads nothing. The two packages share one
  private build module, `@luke-ui/theme-build`, a dev dependency that consumers never install. It
  packs both entries, copies the font, and compiles `stylesheet.css` from the built `./input`. Both
  keep today's typography: Inter body, no display font. Custom themes load their own fonts.
- **D15. Bundled metrics live in each package's `./input`,** with the font release recorded.
- **D49. Paper and Tactile may each bundle and declare the same Inter font.** Duplicate declarations
  are acceptable. There is no shared font package and no requirement to rename the families. How
  browsers pick between duplicate faces, load them, and cache them is not part of Luke UI's
  contract. An application that loads both themes, such as the docs site, imports one `fonts.css`.

## Validation and errors

- **D32 (revised). Strict validation, every failure reported at once.** Reject family strings
  containing `;`, `{`, `}`, `<`, control characters, or unbalanced quotes. Metrics must be finite,
  with `unitsPerEm > 0`, `capHeight > 0`, `ascent > 0`, `descent ≤ 0` (Capsize's convention), and
  `lineGap ≥ 0`. `familyName` must be a non-empty string. Optional numeric fields must be finite if
  present. Weights must be finite numbers from 1 to 1000. Don't compare `metrics.familyName` with
  the stack. The earlier `capHeight ≤ unitsPerEm` rule is withdrawn because fonts don't guarantee
  it.
- **D43, D54 (revised in final review). Validate each input in an `extends` chain on its own,**
  against the fields it authors, then check completeness (the required `body` font) after merging.
  `ThemeValidationError.issues` is `ReadonlyArray<{ theme; path; message }>`, where `theme` is the
  input being validated and `path` is a dot path within it. Per-input validation makes `theme` free
  to report, so there's no merge tracking and no `inheritance` field. A parent with invalid font
  data fails even if a child replaces it; #721 accounts for that in version ranges.
- **Existing `ThemeContrastError` and `ThemeGenerationError` diagnostics are unchanged.**

## Generated CSS and colour modes

- **D7. One theme identity, on `<html>`,** selected by `:where(html).luke-ui-theme-<name>`. There's
  no `:root` fallback and no nested identities. A class elsewhere does nothing, so mistakes are
  obvious.
- **D6, D8, D41, D40. Colour mode.** Without an attribute, the document follows
  `prefers-color-scheme`, live. `data-color-mode="light"` or `"dark"` on `<html>` overrides it. The
  same attribute on any element below sets the mode for that subtree, nested to any depth, and the
  nearest explicit mode wins. System mode exists only at the document level. Only lowercase `light`
  and `dark` are valid.
- **Selectors and specificity.** The theme-wide and base-light rule
  `:where(html).luke-ui-theme-<name>` and the `prefers-color-scheme: dark` rule are (0,1,0). The
  explicit rules `…[data-color-mode='dark']` and `… [data-color-mode='dark']` are (0,2,0). Explicit
  rules set `color-scheme`.
- **D35. Theme CSS stays unlayered.** Overriding a token on an element that itself carries
  `data-color-mode` needs a child element or a more specific selector; this is documented.
- **D10, D11, D40. Scoped repaint lives in the shared stylesheet,** in the `reset` layer:
  `:where(body[data-color-mode='light'], body[data-color-mode='dark'], body [data-color-mode='light'], body [data-color-mode='dark'])`
  sets `color`, `accent-color` (shared with the `rootClassName` rule) and
  `background-color: surface.base`. Without it, scopes would inherit the parent's computed text
  colour. App CSS and Luke UI recipes outrank it. `<html>` is excluded; `<body>`'s background paints
  the page canvas, and page scrollbars follow `<html>`'s colour scheme.
- **D58. Root `container-type: inline-size` moves to the shared stylesheet** (`reset` layer,
  `:where(:root)`). This amends the earlier note that left the move to #717.
- **D37. Multiple identity classes on `<html>` are invalid.** This is documented, with no runtime
  detection and no test of the resulting order-dependent behaviour.
- **D38. Apps own first paint.** Render the identity class and any explicit mode on `<html>` on the
  server. An early script sets `data-color-mode` only for an explicit choice; React apps add
  `suppressHydrationWarning` on `<html>`.

## Overlays

- **D9. Luke UI propagates scoped modes only for its own overlays:** the Select popover, the
  Combobox popover, and the Combobox tray. Apps using React Aria overlays directly follow a
  documented recipe; there's no provider.
- **D36. An explicit `data-color-mode` from the app wins,** including a value equal to the document
  mode.
- **D44, D46. A callback ref on the overlay element** reads the trigger's nearest
  `[data-color-mode]` and copies `light` or `dark` when the scope is below `<html>`, unless the
  element already has the attribute. It runs at commit, before paint, on every mount, including
  programmatic opens. Popovers find the trigger through React Aria's `PopoverContext.triggerRef`.
  The tray receives the Combobox input group as a prop. Render-time ref reads and
  `setState`-in-effect are ruled out by the repo's React Compiler lint rules.
- **D53, D63. Lifecycle.** The mode is copied when the overlay element is created and doesn't update
  while it stays mounted. No special promise is made about reopening during an exit animation.

## Verification

- **D34. Token compatibility is checked rule by rule** with Lightning CSS against the in-repo
  contract, including private Capsize trims. No public token-list API is published.
- **D31, D48, D64. Fonts.** Render real text, observe the successful WOFF2 request, and confirm the
  rendered face with Chromium's `CSS.getPlatformFontsForNode`. Compare bundled metrics with the
  binary using `@capsizecss/unpack`. Assert the 400–700 weight axis only if that library exposes it.
  No second parser and no checksum record.
- **D55. A display-font fixture** uses a genuinely different OFL font (preferably 1000 units per em)
  and asserts exact Capsize-computed trims. The packed-consumer test loads Lora from a pinned
  `@fontsource/lora`.
- **D42, D47 (revised), D62. Fixtures and parity.** React's visual suite uses React-owned copies of
  today's Paper and Tactile inputs, keeping their names and screenshot IDs. A one-time migration
  comparison of declarations by semantic rule role, plus a zero-change visual run, proves the
  extraction. Only intentional contract changes are excluded, and each is listed. Any other
  difference, including Capsize trims from new font metrics, is investigated; existing values are
  kept where they correctly describe the font. After that, the fixtures and the published themes may
  diverge. No permanent parity test and no integration package.
- **Packed consumer.** The existing packed-consumer harness adds the theme packages. It was later
  split into a global setup, one fixture module per scenario, and React, theme, and font scenario
  files, so one install per peer set still serves every scenario. A React-specific Turbo entry
  depends on the theme package builds, which keeps the graph acyclic.
- **D56.** `LUKE_UI_REACT_SPEC` keeps its React-only checks and skips cross-package checks with a
  printed reason. #721 adds published combinations.
- **D39.** #715 automates Chromium. #718 owns WebKit and iOS sign-off.

## Process

- **D45.** One draft PR with logical commits and a green final state. Changesets are included.
- **D52, D57.** #709, #715, #717, and #721 are updated to match this record. Closed #716 gets a
  follow-up comment, and `research/716-token-contract.md` notes the display family as a #715
  addition.

## Withdrawn or deferred

| Item                                                                 | Status                                            |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| CLI (`luke-ui theme build`, `--check`, exit codes)                   | Withdrawn; possible additive minor release.       |
| `typography.fonts.code`                                              | Deferred until `Code` gains trimming.             |
| Field-level provenance through inheritance merges                    | Withdrawn; per-input validation replaces it.      |
| Private integration workspace package                                | Withdrawn.                                        |
| Permanent fixture and package parity test                            | Withdrawn; one-time migration comparison instead. |
| Tests for multiple identities, reopening during exit, font checksums | Withdrawn.                                        |
| Vite or PostCSS plugin                                               | Deferred.                                         |
| Fallback `@font-face` metric overrides                               | Possible follow-up.                               |
| Dialog and Popover components                                        | Assessed in #767.                                 |
| WebKit and iOS verification                                          | #718.                                             |
| Publishing and version ranges                                        | #721.                                             |
