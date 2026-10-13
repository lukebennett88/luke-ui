# #717 global stylesheet contract

Decision record for [#717](https://github.com/lukebennett88/luke-ui/issues/717): the global
stylesheet, its reset, and its cascade contract for 1.0. It supersedes contradictory wording in
#686, #709, the [#715 decision record](./715-theme-authoring-contract.md), and the
[#716 decision record](./716-token-contract.md). The #715 contracts for theme identity on `<html>`,
nested colour modes, unlayered static theme CSS, and overlay mode propagation are unchanged.

The guiding rule: `@luke-ui/react/stylesheet.css` gives native and Luke UI markup a coherent
baseline without erasing useful native presentation. A global rule must earn its place in every
application that imports the stylesheet. Anything only a component needs belongs in that component's
recipe.

## Decisions

### D1. Balanced global reset

A global rule is justified when it corrects a cross-browser inconsistency, or replaces a default
that almost every application overrides, without removing semantic visual structure.
Component-specific resets live in component recipes.

- **Rationale.** Once `rootClassName` goes, every rule applies to the whole document. The old reset
  stripped heading sizes, paragraph and list spacing, list markers, table spacing, and native button
  chrome, so plain application markup lost its structure as soon as the stylesheet was imported.
- **Rejected.** Globalising the old reset unchanged (breaks application markup). No reset at all
  (loses the document baseline, focus treatment, and form-control font inheritance). A reset opt-out
  or a second stylesheet (more contract, no demonstrated need).

### D2. Document baseline

`<body>` gets the theme's surface, text colour, accent colour, and body font, a unitless
`line-height: 1.5`, and no margin. Native headings keep their browser sizes. Luke UI's `Heading` and
`Text` own their own typography. Application CSS overrides any of it. Explicit nested colour-mode
scopes repaint with their own token values.

- **Rationale.** `<body>` is the one element every application has, and every portal renders below
  it, so overlays inherit the baseline without a class. Its background propagates to the canvas, so
  short pages and overscroll match the theme, including in dark mode. A unitless line height scales
  with the font size of whatever inherits it. The theme's fixed body line height belongs to the
  `body` type style's Capsize trims, which only `Text` applies.
- **Rejected.** Typography on `:root` (an application `font-size` on `<html>` is a rem lever, not a
  text style). Painting `<html>` (stops body propagation and breaks application body backgrounds).
  The fixed body line height (a 24px line under a 32px native heading). `font: unset` on headings
  (erases semantic structure).

### D3. Focus

The stylesheet provides the themed focus ring: a 2px solid `vars.color.border.focus` outline with a
2px offset, and a `Highlight` outline under `forced-colors: active`. Only the native
`:focus-visible` pseudo-class is global. Component recipes handle React Aria's
`[data-focus-visible='true']` where they need it.

- **Rationale.** React Aria sets `data-focus-visible` on wrappers as well as on focused elements:
  the Select root, the Combobox group, and the Checkbox and Switch labels. A global attribute rule
  drew a second ring on each wrapper, and three recipes carried `outline: none` workarounds to
  cancel it. The native pseudo-class only matches the focused element.
- **Rejected.** Keeping the attribute selector globally (double rings, workarounds). Exporting
  `focusRing()` (it stays internal, as #686 decided).

### D4. Reduced motion

Reduced motion is component-owned. The global `animation: none; transition: none` rule is removed:
it sat in the lowest layer, so it never beat a recipe, and its only effect was to disable
application-authored animation. Short non-spatial feedback transitions (colour, border, shadow, and
opacity) stay. Components remove spatial movement, scaling, pulsing, and looping themselves, and
loading states stay understandable.

- **Rationale.** Reduced motion asks for less movement, not less feedback. A colour change that
  confirms a hover or press is not motion.
- **Rejected.** A global suppression rule in any layer (it would either do nothing or override
  application CSS). Removing all transitions under reduced motion (loses feedback).

### D5. Nested cascade layers

The stylesheet reserves a top-level consumer `base` layer, followed by Luke UI's namespaced layer:

```css
@layer base, luke-ui;
@layer luke-ui {
	@layer reset, recipes, utilities;
}
```

Luke UI never writes declarations into `base`. Tailwind v4 applications declare one combined order
before any framework import:

```css
@layer theme, base, luke-ui, components, utilities;
```

- **Rationale.** Flat names (`reset`, `recipes`, `utilities`) collide with framework layers. A
  Tailwind `utilities` declared before Luke UI's merged with Luke UI's own utilities, and the import
  that came first decided whether Tailwind or Luke UI won. One namespace keeps Luke UI's internal
  order intact wherever an application places it.
- **Rejected.** A styling configuration API, a separate reset package, an unlayered stylesheet, or
  another layer architecture. Each adds public contract without solving a problem the namespace
  leaves.

## Global rule inventory

The stylesheet has six global rules, plus the layer order statement, all in `luke-ui.reset`. See
[STYLING.md](../docs/STYLING.md#global-styles) for how `:where()` keeps them at zero specificity.

| #   | Selector                                                                | Declarations                                                                                                                 |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| G1  | `:where(*), :where(*)::before, :where(*)::after`                        | `box-sizing: border-box`                                                                                                     |
| G2  | `:where(:root)`                                                         | `container-type: inline-size`                                                                                                |
| G3  | `:where(body)`                                                          | `margin: 0`, `background-color`, `color`, `accent-color`, body font family, size, weight, letter spacing, `line-height: 1.5` |
| G4  | `:where(body [data-color-mode='light'], body [data-color-mode='dark'])` | `background-color`, `color`, `accent-color`                                                                                  |
| G5  | `:where(button, input, select, textarea)`                               | `font: inherit`, `margin: 0`                                                                                                 |
| G6  | `:where(:focus-visible)`                                                | 2px solid `border.focus` outline, 2px offset; `outline-color: Highlight` under `forced-colors: active`                       |

G4 does not match `<body>` itself: G3 paints `<body>` from the custom properties computed on it, so
an explicit mode on `<body>` repaints through G3. The module is `core/styles/global-styles.css.ts`.

## Rule-by-rule disposition

Old rules came from `reset.css.ts` (scoped to `.luke-ui-reset`) and `theme-root.css.ts`.

| Old rule                                                           | Decision                        | New owner                                                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root and descendant `box-sizing: border-box`                       | Retained, globalised            | G1                                                                                                                                                                                                                                   |
| `blockquote, dl, dd, figure, p { margin: 0 }`                      | Removed                         | `Text` zeroes its own margin. `Prose` zeroes block margins inside its scope.                                                                                                                                                         |
| `h1`–`h6 { font: unset; margin: 0 }`                               | Removed                         | `Text` zeroes margins and always sets a weight from its type style, or inherits one. `Heading` sets its type style and weight.                                                                                                       |
| `ol, ul { margin: 0; padding: 0 }`                                 | Removed                         | Combobox and Select list boxes already zero both. `Prose` sets list indentation.                                                                                                                                                     |
| `ul, ol:not([type]), ol[type]:not(.prose *) { list-style: none }`  | Removed                         | List boxes already remove markers. `Prose` restates its markers. See [Typed lists](#typed-lists).                                                                                                                                    |
| `table { border-collapse: collapse; border-spacing: 0 }`           | Removed                         | `Prose` owns its table treatment.                                                                                                                                                                                                    |
| `caption, th { text-align: inherit }`                              | Removed                         | `Prose` aligns `th` and `caption` to the start.                                                                                                                                                                                      |
| `th, td { padding: 0 }`                                            | Removed                         | `Prose` already pads cells.                                                                                                                                                                                                          |
| `button, select, label` touch action and transparent tap highlight | Removed                         | `pressFeedback` sets both on Button and button Link, the Select trigger, the Combobox actions and tray trigger, list box items, and the Checkbox and Switch labels. Field labels above a control keep the browser default. See #718. |
| Form controls `font: inherit`                                      | Retained                        | G5                                                                                                                                                                                                                                   |
| Button chrome reset (`background`, `border`, `color`, `padding`)   | Removed                         | Each Luke UI button recipe sets its own chrome and both paddings. The Combobox tray trigger and actions gained the declarations they relied on.                                                                                      |
| `input, textarea, select { color: inherit; margin: 0 }`            | Colour removed, margin retained | G5 keeps `margin: 0`. Native controls keep `FieldText`, which follows `color-scheme`. Luke UI inputs set their own colour.                                                                                                           |
| `:disabled, [data-disabled='true'] { cursor: not-allowed }`        | Removed                         | Button, Select, Combobox and its tray trigger, TextInput, and the field inline label set it themselves.                                                                                                                              |
| `:focus-visible, [data-focus-visible='true']` ring                 | Native pseudo-class retained    | G6. Attribute rings stay in the recipes that need them. The Field inline-label, Select root, and Combobox group `outline: none` workarounds are removed.                                                                             |
| Blanket `prefers-reduced-motion` suppression                       | Removed                         | Component recipes. See [Reduced motion](#reduced-motion).                                                                                                                                                                            |
| `.luke-ui-theme` colour, accent, and body font                     | Modified                        | G3                                                                                                                                                                                                                                   |
| Scoped colour-mode repaint                                         | Retained, selector narrowed     | G4                                                                                                                                                                                                                                   |
| `:where(:root) { container-type: inline-size }`                    | Retained                        | G2                                                                                                                                                                                                                                   |

### Component ownership

- **`Text`.** A zero-specificity rule in `luke-ui.recipes` zeroes the margin of every element `Text`
  renders, so `Prose` spacing and `Box` margins still win. `Text` always sets a font weight from its
  type style, or inherits one with `shouldInheritFont`, so a heading element never takes the user
  agent's bold. Raw `textRecipe()` on a heading without `fontWeight` keeps the native weight.
- **`Prose`.** Zeroes block margins on all sides (blockquotes, figures, and `dd` have inline user
  agent margins), restates list markers and indentation, collapses tables, aligns `th` and `caption`
  to the start, and pads cells.
- **Pressable controls.** Every Luke UI control that renders a `<button>` resets its own chrome,
  padding on both axes, cursor, touch action, and tap highlight. Button, IconButton, and a
  button-shaped Link share one box model.

### Typed lists

HTML maps `ol` `type` to a marker style with a presentational hint. Any author `list-style`,
including Tailwind Preflight's `list-style: none` in `base`, beats it. HTML also matches `type`
case-insensitively in selectors, so only the Selectors 4 `s` flag can tell `a` from `A`.

Prose restates the HTML rendering rules: `ol[type="1"]` is decimal, and `ol[type="a" s]`,
`[type="A" s]`, `[type="i" s]`, and `[type="I" s]` map to lower and upper alpha and roman. Without a
reset, every browser shows the native markers. With a reset, Firefox 66+ and Safari 27+ restore all
five. Chromium does not support `s` ([crbug 40667738](https://crbug.com/40667738)), so `type="1"`
returns there and the letter and roman lists keep the reset's `none`.

Nothing simpler works in Chromium. `list-style-type: revert` rolls back past the hint to `decimal`,
and `revert-layer` rolls back to the reset. A case-insensitive fallback collapses `a`/`A` and
`i`/`I` even without a reset. Typed `attr()` with `@counter-style` names `a`, `A`, `i`, and `I`
works in Chromium, but needs page-wide counter-style names, accepts collision risk, and adds a
second path beside the `s` rules. Safari already supports `s`, so that enhancement would not be for
Safari's benefit. Re-checked in Chrome 148 and Playwright Chromium 156 on 2026-10-13. The #776
recommendation is to keep the documented limitation for 1.0 and wait for the `s` flag: see
[776-typed-prose-list-markers.md](./776-typed-prose-list-markers.md).

### Focus indicators

One indicator per control:

| Control                  | Indicator                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button, Link, IconButton | G6 on the focused element. Text-appearance links also underline on `data-focus-visible`.                                                         |
| Select                   | The trigger draws the ring on `data-focus-visible`. Its `outline: none` stays, so G6 cannot draw a second ring when the two heuristics disagree. |
| Combobox                 | The control draws the ring while its input has focus. The input keeps `outline: none`. Inner actions take G6.                                    |
| TextInput                | The control or the standalone input draws the ring on focus within.                                                                              |
| Checkbox, Switch         | The indicator or track draws the ring on the label's `data-focus-visible`. The hidden input is clipped.                                          |
| List box items           | Background change. Items keep `outline: none`. Forced colours draws an inset `Highlight` ring, or `HighlightText` inside a selected item's fill. |
| ScrollFade               | G6 on the scrollport, inside its opaque mask gutter.                                                                                             |
| Overlay dialogs          | The tray dialog keeps `outline: none`.                                                                                                           |

### Reduced motion

| Component                                                                     | Under reduced motion                                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Button, Checkbox, Select, Combobox actions and items, TextInput, Switch track | Feedback transitions stay.                                                                    |
| Switch thumb                                                                  | The thumb stops sliding and stretching. Its colour transition stays.                          |
| Combobox and Select popovers                                                  | Opacity fades stay. Movement is removed, including on `[data-entering]` and `[data-exiting]`. |
| Mobile tray and scrim                                                         | Opacity fades stay. The tray no longer slides.                                                |
| Button and IconButton pending state                                           | The cross-fade between the spinner and the content it covers stays.                           |
| LoadingSpinner                                                                | Rotation and rubber-band animation stop. A fixed arc remains so the busy state stays visible. |
| LoadingSkeleton                                                               | The sheen stops and the placeholder surface stays.                                            |
| ScrollFade                                                                    | Exempt: scroll-linked, not time-based.                                                        |

## Public API and consumer behaviour

- **Removed:** `rootClassName` from `@luke-ui/react/theme`, and the `luke-ui-reset` and
  `luke-ui-theme` classes. There is no alias, replacement root class, opt-out, second stylesheet,
  runtime injection, provider configuration, or new styling hook. `getThemeClassName()` and the
  `luke-ui-theme-<name>` identities are unchanged.
- **Setup.** Before: import the stylesheets and apply `rootClassName` to an application root. After:
  import `@luke-ui/react/stylesheet.css` and a theme stylesheet, and put the theme identity class on
  `<html>`. Portals need nothing extra.
- **Native HTML.** Headings, paragraphs, blockquotes, lists, tables, and buttons keep their browser
  presentation, apart from `box-sizing` and form-control font inheritance. Native focus rings use
  the theme colour.
- **Layers.** Application CSS that wrote into Luke UI's flat `reset`, `recipes`, or `utilities`
  layers must move to its own layers or stay unlayered.
- **Release.** Breaking, pre-1.0. No changeset: before `1.0.0` no pull request needs one
  ([DEPENDENCIES.md](../docs/DEPENDENCIES.md#changesets)).

## Cascade and framework integration

- **One authoritative order.** The build prepends the D5 statement to `dist/stylesheet.css` from
  `core/styles/layer-names.ts`, and strips the single-name `@layer` statements Vanilla Extract
  writes per module. No layer block comes before it.
- **Vanilla Extract.** `recipe()` and `style()` write to `luke-ui.recipes`, Box and the other
  utilities to `luke-ui.utilities`, and `global-styles.css.ts` to `luke-ui.reset`.
  `globalStyleInLayer()` cannot target `base`.
- **Theme CSS stays unlayered**, so tokens beat every layered rule, as the #715 record requires.
- **`!important`.** Under `!important` the layer order reverses and unlayered CSS ranks below every
  layer. LoadingSkeleton's `!important` masks in `luke-ui.recipes` therefore beat `!important` in
  `luke-ui.utilities`, in any later application layer such as Tailwind `utilities`, and in unlayered
  CSS. Only `base` and inline `!important` outrank them.
- **Application CSS.** Unlayered CSS and any layer declared after `luke-ui` beat Luke UI. `base`
  stays below it, so a framework reset in `base` cannot override recipes. Preflight still changes
  native HTML on its own, for example list markers and heading sizes.
- **Docs app.** `apps/docs` declares the Tailwind order. Docs-owned shell styles use `components`,
  docs utilities use `utilities`, and the root layout stays in `base`. The Fumadocs colour bridge
  uses `:root, [data-color-mode]`, so it resolves per mode scope. Dark mode paints the page with
  `surface.base`, and docs styles that set `text-decoration: none` on Luke UI links, such as the
  sidebar navigation, win over the link's focus-visible underline. The focus ring is unchanged.
- **Reference app.** Its global styles stay unlayered and override the body baseline on purpose.

## Testing

- `stylesheet-contract.browser.test.tsx` parses the built `dist/stylesheet.css` with the browser's
  CSSOM and checks the leading order statement, layer order, no rules in `base` or outside a layer,
  recipe and utility ownership, and each global rule's selector, media condition, and declarations.
- `layer-order.browser.test.ts` checks precedence in Chromium with the built stylesheet, including
  important declarations and a consumer `base` write.
- `apps/docs/src/styles/tailwind-integration.browser.test.tsx` loads real Tailwind v4 output with
  the built stylesheet in both import orders, with and without the combined order statement. It
  checks Preflight, `Box` utility props, Tailwind utilities and components against recipes,
  unlayered CSS, important declarations, and typed lists. Without the statement and with Tailwind
  first, `luke-ui` lands above Tailwind `utilities`. The test pins that failure mode so the
  documented statement stays necessary.
- `global-styles.browser.test.tsx` renders mixed native and Luke UI markup. It checks native
  presentation, the Button, IconButton, and button Link box model at both sizes, body painting,
  overrides, and nested repaint, one focus ring per control, virtual focus, and reduced motion. A
  visual capture covers the mixed host.
- Select, Combobox, and the tray each get a regression test for a dark scope inside a light
  document.
- The packed-consumer harness checks the layer statement and server rendering without
  `rootClassName`.

## Deferred work and issue disposition

| Item                                                     | Disposition                                                                                                                                                                                        |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #686 Root styles page                                    | Closed as superseded by #717. Its useful requirements (behaviour by category, cascade placement, no `focusRing()` export, state attributes are not styling hooks) are in Styling and Installation. |
| WebKit, iOS tap highlight, and touch verification        | #718.                                                                                                                                                                                              |
| Component visual audit beyond the controls touched here  | #718.                                                                                                                                                                                              |
| Consumer documentation for routers and composition       | #720.                                                                                                                                                                                              |
| Dialog and Popover components                            | #767.                                                                                                                                                                                              |
| Publishing                                               | #721.                                                                                                                                                                                              |
| Chromium typed letter and roman lists under a list reset | #776.                                                                                                                                                                                              |
| Trigger-width popovers overflowing an edge-to-edge field | #771. Without a page margin, the popover is wider than the viewport allows, the page scrolls, and React Aria closes it.                                                                            |
