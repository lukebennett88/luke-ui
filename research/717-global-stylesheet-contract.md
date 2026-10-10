# #717 global stylesheet contract

Decision record for [#717](https://github.com/lukebennett88/luke-ui/issues/717): the global
stylesheet, its reset, and its cascade contract for 1.0. It supersedes contradictory wording in
#686, #709, #717, the [#715 decision record](./715-theme-authoring-contract.md), and the
[#716 decision record](./716-token-contract.md). The #715 contracts for theme identity on `<html>`,
nested colour modes, unlayered static theme CSS, and overlay mode propagation are unchanged.

The guiding rule: `@luke-ui/react/stylesheet.css` gives native and Luke UI markup a coherent
baseline without erasing useful native presentation. A global rule must earn its place in every
application that imports the stylesheet. Anything only a component needs belongs in that component's
recipe.

## Decisions

### D1. Balanced global reset

Luke UI is opinionated, and the stylesheet paints a coherent visual foundation. It does not
indiscriminately erase native HTML presentation. A global rule is justified when it corrects a
cross-browser inconsistency, or replaces a default that almost every application overrides, without
removing semantic visual structure. Component-specific resets live in component recipes.

- **Rationale.** Once `rootClassName` goes, every rule applies to the whole document. The old reset
  stripped heading sizes, paragraph and list spacing, list markers, table spacing, and native button
  chrome, so plain application markup lost its structure as soon as the stylesheet was imported.
  Luke UI components already style themselves, so they never needed those rules globally.
- **Rejected.** Globalising the old reset unchanged (breaks application markup). No reset at all
  (loses the document baseline, focus treatment, and form-control font inheritance). A reset opt-out
  or a second stylesheet (more contract, no demonstrated need).

### D2. Body typography

`<body>` owns the inherited body font, text colour, and accent colour. Its line height is unitless
`1.5`, not the fixed `rem` body line height the theme generates for `Text`. Native headings keep
their browser sizes. Luke UI's `Heading` and `Text` own their own typography.

- **Rationale.** `<body>` is the one element every application has, and every portal renders below
  it, so overlays inherit the baseline without a class. A unitless line height scales with the font
  size of whatever inherits it. The fixed body line height belongs to the `body` type style's
  Capsize trims, which only `Text` applies.
- **Rejected.** Typography on `:root` (an application `font-size` on `<html>` is a rem lever, not a
  text style). Keeping the fixed body line height (a 24px line under a 32px native heading). Keeping
  `font: unset` on headings (erases semantic structure).

### D3. Focus

The stylesheet provides the existing themed focus ring: a 2px solid `vars.color.border.focus`
outline with a 2px offset, and a `Highlight` outline under `forced-colors: active`. Only the native
`:focus-visible` pseudo-class is global. React Aria's `[data-focus-visible='true']` is handled by
the component recipes that use it.

- **Rationale.** React Aria sets `data-focus-visible` on wrappers as well as on focused elements:
  the Select root, the Combobox group, and the Checkbox and Switch labels. A global attribute rule
  drew a second ring on each wrapper, and three recipes carried `outline: none` workarounds to
  cancel it. The native pseudo-class only matches the focused element.
- **Rejected.** Keeping the attribute selector globally (double rings, workarounds). Exporting
  `focusRing()` (it stays internal, as #686 decided).

### D4. Reduced motion

Reduced motion is component-owned. The global `animation: none; transition: none` rule is removed:
it sat in the lowest layer, so it never beat a recipe, and its only effect was to disable
application-authored animation inside the old root. Short non-spatial feedback transitions (colour,
border, shadow, and opacity) stay under reduced motion. Components adapt spatial movement, scaling,
pulsing, and looping animation themselves. Loading states stay understandable. ScrollFade's
scroll-linked animation is an intentional exemption: it maps scroll position to a mask and has no
duration.

- **Rationale.** Reduced motion asks for less movement, not less feedback. A colour change that
  confirms a hover or press is not motion.
- **Rejected.** A global suppression rule in any layer (it would either do nothing or override
  application CSS). Removing all transitions under reduced motion (loses feedback).

### D5. Document background

The reset paints `<body>` with `vars.color.surface.base`, sets its text and accent colours and
typography, and zeroes its margin. The body background propagates to the canvas, so short pages and
overscroll match the theme. Application CSS overrides any of these. Explicit nested colour-mode
scopes still repaint with their own token values.

- **Rationale.** Without a painted body the canvas stays the user agent's colour, which is wrong in
  dark mode, and every application had to restate it.
- **Rejected.** Painting `<html>` (the #715 record already keeps `<html>` out of the repaint rule;
  painting it stops body propagation and breaks application body backgrounds).

### D6. Nested cascade layers

The stylesheet reserves a top-level consumer `base` layer, followed by Luke UI's namespaced layer:

```css
@layer base, luke-ui;
@layer luke-ui {
	@layer reset, recipes, utilities;
}
```

Internal precedence is `luke-ui.reset` → `luke-ui.recipes` → `luke-ui.utilities`. Luke UI never
writes declarations into `base`. Tailwind v4 applications declare one combined order before any
framework import:

```css
@layer theme, base, luke-ui, components, utilities;
```

Tailwind is supported as an application styling convenience, not an architectural dependency.

- **Rationale.** Flat names (`reset`, `recipes`, `utilities`) collide with framework layers. A
  Tailwind `utilities` declared before Luke UI's merged with Luke UI's own utilities, and the import
  that came first decided whether Tailwind or Luke UI won. One namespace keeps Luke UI's internal
  order intact wherever an application places it.
- **Rejected.** A styling configuration API, a separate reset package, an unlayered stylesheet, or
  another layer architecture. Each adds public contract without solving a problem the namespace
  leaves.

## Global rule inventory

The stylesheet has exactly six global rules, plus the layer order statement. Every rule is in
`luke-ui.reset` and uses `:where()`, so its specificity is zero.

| #   | Selector                                                                | Declarations                                                                                                                 |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| G1  | `:where(*, *::before, *::after)`                                        | `box-sizing: border-box`                                                                                                     |
| G2  | `:where(:root)`                                                         | `container-type: inline-size`                                                                                                |
| G3  | `:where(body)`                                                          | `margin: 0`, `background-color`, `color`, `accent-color`, body font family, size, weight, letter spacing, `line-height: 1.5` |
| G4  | `:where(body [data-color-mode='light'], body [data-color-mode='dark'])` | `background-color`, `color`, `accent-color`                                                                                  |
| G5  | `:where(button, input, select, textarea)`                               | `font: inherit`, `margin: 0`                                                                                                 |
| G6  | `:where(:focus-visible)`                                                | 2px solid `border.focus` outline, 2px offset; `outline-color: Highlight` under `forced-colors: active`                       |

G4 no longer matches `<body>` itself. G3 already paints `<body>` from the custom properties computed
on it, so an explicit mode on `<body>` repaints through G3. G6 is one rule with a forced-colours
media variant, not a seventh rule.

The module is `core/styles/global-styles.css.ts`. It replaces `reset.css.ts` and
`theme-root.css.ts`.

## Rule-by-rule disposition

Old rules came from `reset.css.ts` (scoped to `.luke-ui-reset`) and `theme-root.css.ts`.

| Old rule                                                             | Decision                        | New owner                                                                                                                                                                                         |
| -------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root and descendant `box-sizing: border-box`                         | Retained, globalised            | G1                                                                                                                                                                                                |
| `blockquote, dl, dd, figure, p { margin: 0 }`                        | Removed                         | `Text` zeroes its own margin. `Prose` zeroes block margins inside its scope.                                                                                                                      |
| `h1`–`h6 { font: unset; margin: 0 }`                                 | Removed                         | `Text` zeroes margins and keeps the inherited weight on heading elements. `Heading` sets its type style and weight. Native headings keep browser sizes.                                           |
| `ol, ul { margin: 0; padding: 0 }`                                   | Removed                         | Combobox and Select list boxes already zero both. `Prose` sets list indentation.                                                                                                                  |
| `ul, ol:not([type]), ol[type]:not(.prose *) { list-style: none }`    | Removed                         | List boxes already remove markers. `Prose` keeps its markers. Typed `ol` elements keep their HTML presentational hints everywhere.                                                                |
| `table { border-collapse: collapse; border-spacing: 0 }`             | Removed                         | `Prose` owns its table treatment.                                                                                                                                                                 |
| `caption, th { text-align: inherit }`                                | Removed                         | `Prose` aligns `th` and `caption` to the start.                                                                                                                                                   |
| `th, td { padding: 0 }`                                              | Removed                         | `Prose` already pads cells.                                                                                                                                                                       |
| `button, select, label { touch-action: manipulation }`               | Removed                         | Button and list box items already own it. Combobox actions, Checkbox, and Switch add it, because they are tapped repeatedly.                                                                      |
| `button, select, label { -webkit-tap-highlight-color: transparent }` | Removed                         | Components with their own pressed state suppress it: Button, Combobox actions, list box items, Checkbox, and Switch. Select and the Combobox tray trigger have no pressed state, so they keep it. |
| Form controls `font: inherit`                                        | Retained                        | G5                                                                                                                                                                                                |
| Button chrome reset (`background`, `border`, `color`, `padding`)     | Removed                         | Each Luke UI button recipe sets its own chrome. The Combobox tray trigger and actions gained the declarations they had relied on.                                                                 |
| `input, textarea, select { color: inherit; margin: 0 }`              | Colour removed, margin retained | G5 keeps `margin: 0`. Native controls keep `FieldText`, which follows `color-scheme`. Luke UI inputs set their own colour.                                                                        |
| `:disabled, [data-disabled='true'] { cursor: not-allowed }`          | Removed                         | Already owned by Button, Select, Combobox, TextInput, and the field inline label. No other component relied on it.                                                                                |
| `:focus-visible, [data-focus-visible='true']` ring                   | Native pseudo-class retained    | G6. Attribute rings stay in the recipes that need them. The Field inline-label, Select root, and Combobox group `outline: none` workarounds are removed.                                          |
| Blanket `prefers-reduced-motion` suppression                         | Removed                         | Component recipes (see [Reduced motion](#reduced-motion)).                                                                                                                                        |
| `.luke-ui-theme` colour, accent, and body font                       | Modified                        | G3, on `<body>`, with `line-height: 1.5`, `margin: 0`, and `background-color`.                                                                                                                    |
| Scoped colour-mode repaint                                           | Retained, selector narrowed     | G4. The `body[data-color-mode]` self-match moves to G3.                                                                                                                                           |
| `:where(:root) { container-type: inline-size }`                      | Retained                        | G2                                                                                                                                                                                                |

### Component ownership

- **`Text`.** A zero-specificity rule in `luke-ui.recipes` zeroes the margin of every element `Text`
  renders, so `Prose` spacing and `Box` margins still win. Heading elements keep the inherited font
  weight unless `fontWeight` is set, as `font: unset` did before.
- **`Prose`.** Zeroes block margins on all sides (blockquotes, figures, and `dd` had inline margins
  from the user agent), keeps disc markers for `ul` and decimal markers for untyped `ol`, indents
  every list, collapses tables, aligns `th` and `caption` to the start, and pads cells. Typed `ol`
  elements keep their presentational hints without an exemption, so `prose/scope.css.ts` and the
  `ol[type]` workaround are gone.
- **Buttons.** The Button primitive owns its chrome, cursor, touch action, and tap highlight. The
  Combobox trigger and clear button, and the Combobox tray trigger, set their own padding,
  background, border, and appearance.
- **Field controls.** Select, Combobox, Checkbox, Switch, and TextInput already own their states.

### Focus indicators

One indicator per control:

| Control                  | Indicator                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Button, Link, IconButton | G6 on the focused element. Text-appearance links also underline on `data-focus-visible`.                                                         |
| Select                   | The trigger draws the ring on `data-focus-visible`. Its `outline: none` stays, so G6 cannot draw a second ring when the two heuristics disagree. |
| Combobox                 | The control draws the ring while its input has focus. The input keeps `outline: none`. Inner actions take G6.                                    |
| TextInput                | The control or the standalone input draws the ring on focus within.                                                                              |
| Checkbox, Switch         | The indicator or track draws the ring on the label's `data-focus-visible`. The hidden input is clipped.                                          |
| List box items           | Background change. Items keep `outline: none`. Forced colours draws an inset `Highlight` ring.                                                   |
| ScrollFade               | G6 on the scrollport, inside its opaque mask gutter.                                                                                             |
| Overlay dialogs          | The tray dialog keeps `outline: none`.                                                                                                           |

### Reduced motion

| Component                                                                     | Under reduced motion                                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Button, Checkbox, Select, Combobox actions and items, TextInput, Switch track | Feedback transitions stay. The media queries that removed them are gone.                        |
| Switch thumb                                                                  | The thumb stops sliding and stretching. Its colour transition stays.                            |
| Combobox and Select popovers                                                  | Opacity fades stay. Movement is removed, including on `[data-entering]` and `[data-exiting]`.   |
| Mobile tray and scrim                                                         | Opacity fades stay. The tray no longer slides.                                                  |
| LoadingSpinner                                                                | The arc keeps rotating so the busy state stays visible. The rubber-band stroke animation stops. |
| LoadingSkeleton                                                               | The sheen stops and the placeholder surface stays.                                              |
| ScrollFade                                                                    | Exempt: scroll-linked, not time-based.                                                          |

## Public API and consumer behaviour

- **Removed:** `rootClassName` from `@luke-ui/react/theme`, and the `luke-ui-reset` and
  `luke-ui-theme` classes. There is no alias, replacement root class, opt-out, second stylesheet,
  runtime injection, provider configuration, or new styling hook. `getThemeClassName()` and the
  `luke-ui-theme-<name>` identities are unchanged.
- **Setup.** Before: import the stylesheets and apply `rootClassName` to an application root. After:
  import `@luke-ui/react/stylesheet.css` and a theme stylesheet, and put the theme identity class on
  `<html>`. No root styling class is needed. Portals need nothing extra.
- **Document.** `<body>` gets the theme's surface, text colour, accent colour, body font, unitless
  `1.5` line height, and no margin. Application CSS overrides any of it.
- **Native HTML.** Headings, paragraphs, blockquotes, lists, tables, and buttons keep their browser
  presentation, apart from `box-sizing` and form-control font inheritance. Native focus rings use
  the theme colour.
- **Layers.** The flat `reset`, `base`, `recipes`, and `utilities` layers become `base` and
  `luke-ui` with `luke-ui.reset`, `luke-ui.recipes`, and `luke-ui.utilities` inside it. Application
  CSS that wrote into Luke UI's flat layer names must move to its own layers or stay unlayered.
- **Animation.** Importing the stylesheet no longer disables application animation under reduced
  motion.
- **Release.** Breaking, pre-1.0. No changeset: before `1.0.0` no pull request needs one
  ([DEPENDENCIES.md](../docs/DEPENDENCIES.md#changesets)).

## Cascade and framework integration

- **One authoritative order.** The build prepends the D6 statement to `dist/stylesheet.css` from
  `core/styles/layer-names.ts`, and strips the single-name `@layer` statements Vanilla Extract
  writes per module. No layer block comes before it.
- **Vanilla Extract.** `layers.css.ts` declares `luke-ui` and its sublayers with
  `globalLayer({ parent })`. `recipe()` and `style()` write to `luke-ui.recipes`; Box and the other
  utilities to `luke-ui.utilities`; `global-styles.css.ts` to `luke-ui.reset`.
  `globalStyleInLayer()` cannot target `base`.
- **Theme CSS stays unlayered**, so tokens beat every layered rule, as the #715 record requires.
- **`!important`.** Under `!important` the layer order reverses and unlayered CSS ranks below every
  layer. LoadingSkeleton's `!important` masks in `luke-ui.recipes` therefore beat `!important` in
  `luke-ui.utilities`, in any later application layer such as Tailwind `utilities`, and in unlayered
  CSS. Only `base` and inline `!important` outrank them. An important Tailwind utility still beats
  every normal Luke UI declaration.
- **Application CSS.** Unlayered CSS beats every Luke UI layer. A layer declared after `luke-ui`
  beats it. `base` stays below it, so a framework reset in `base` cannot override recipes.
- **Tailwind v4.** Declare `@layer theme, base, luke-ui, components, utilities;` before importing
  Tailwind or Luke UI. Tailwind Preflight then sits in `base`, below every Luke UI rule. Tailwind
  utilities beat Luke UI recipes and Tailwind components. Preflight still changes native HTML on its
  own, for example list markers and heading sizes, independently of Luke UI.
- **Docs app.** `apps/docs` declares the Tailwind order. Docs-owned shell styles move from Luke UI's
  old `recipes` name to `components`, docs utilities to `utilities`, and the root layout stays in
  `base`. The Fumadocs colour bridge uses `:root, [data-color-mode]`, so it resolves per mode scope.
- **Reference app.** Its global styles stay unlayered and override the body baseline on purpose.

## Testing and documentation requirements

- `stylesheet-contract.test.ts` checks the built `dist/stylesheet.css`: one leading order statement,
  nested layer order, no early layer, no declarations in `base`, recipes in `luke-ui.recipes`,
  utilities in `luke-ui.utilities`, the six global rules, and no `luke-ui-` class selectors.
- `layer-order.browser.test.ts` checks precedence in Chromium with the built stylesheet, including
  important declarations and a consumer `base` write.
- `apps/docs/src/styles/tailwind-integration.browser.test.tsx` loads real Tailwind v4 output,
  compiled by the docs app's Tailwind Vite plugin, with the built stylesheet in both import orders,
  with and without the combined order statement. It checks Preflight against Luke UI recipes, `Box`
  utility props against recipes, Tailwind utilities against recipes and components, unlayered CSS,
  and important declarations. Without the statement and with Tailwind first, `luke-ui` lands above
  Tailwind `utilities`; the test pins that failure mode so the documented statement stays necessary.
- `global-styles.browser.test.tsx` renders mixed native and Luke UI markup and checks native
  headings, paragraphs, blockquotes, lists, tables, buttons, links, and form controls; body
  painting, overrides, and nested repaint; focus rings by keyboard, programmatic focus, React Aria
  attributes, and virtual focus; and that application animations survive reduced motion. A visual
  capture covers the mixed host.
- Select, Combobox, and the tray each get a regression test for a dark scope inside a light
  document.
- The packed-consumer harness checks the layer statement and server rendering without
  `rootClassName`.
- Docs: `docs/STYLING.md`, the Installation, Styling, Applying a theme, and Theming pages, the React
  package README, the Paper and Tactile READMEs, docs samples, and the reference app.

## Replaced inputs

| Input                                                                                 | Replacement                                                            |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/STYLING.md` flat four-layer table and `@layer reset, base, recipes, utilities;` | Nested order, D6.                                                      |
| `docs/STYLING.md` claim that the reset owns reduced motion                            | D4: component-owned.                                                   |
| `docs/STYLING.md` setup step 4 and the `theme-root.css.ts` paragraph                  | `<html>` identity only; `global-styles.css.ts`.                        |
| `layers.css.ts` and `layer-names.ts` JSDoc                                            | Nested layers.                                                         |
| `prose/recipe.css.ts` `ol[type]` comment and `prose/scope.css.ts`                     | Removed; typed lists keep hints because nothing global strips markers. |
| LoadingSkeleton "global reduced-motion reset" comment                                 | Removed.                                                               |
| Field inline-label, Select root, and Combobox group "reset ring" comments             | Removed with their `outline: none` workarounds.                        |
| "Table cells need padding after the reset removes it" (Prose)                         | Prose owns its table treatment.                                        |
| `overlay-motion.ts` reduced-motion note                                               | Fade stays; movement is removed.                                       |
| `rootClassName` in overlays, test utilities, docs, samples, reference app             | Removed.                                                               |
| `FRICTION.md` "Root styles in portals"                                                | Resolved by D2 and D5.                                                 |
| Stylesheet contract test sentinels for `.luke-ui-reset` and `.luke-ui-theme`          | Global-rule sentinels.                                                 |
| `cascade.browser.test.ts` `rootClassName` variants of the body-scope test             | Body painted by G3.                                                    |
| `#715` record: `rootClassName` "until #717" and repaint selector                      | This record.                                                           |
| `PUBLIC_API.md` `/theme` exports                                                      | `breakpoints`, `getThemeClassName`, `vars`.                            |
| `DOCUMENTATION.md` `rootClassName` wording example                                    | A current example.                                                     |
| Assumption that body typography uses the fixed body line height                       | D2.                                                                    |
| Assumption that `[data-focus-visible]` draws a ring everywhere                        | D3.                                                                    |

## Deferred work and issue disposition

| Item                                                    | Disposition                                                                                                                                                                                        |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #686 Root styles page                                   | Closed as superseded by #717. Its useful requirements (behaviour by category, cascade placement, no `focusRing()` export, state attributes are not styling hooks) are in Styling and Installation. |
| WebKit, iOS tap highlight, and touch verification       | #718.                                                                                                                                                                                              |
| Component visual audit beyond the controls touched here | #718.                                                                                                                                                                                              |
| Consumer documentation for routers and composition      | #720.                                                                                                                                                                                              |
| Dialog and Popover components                           | #767.                                                                                                                                                                                              |
| Publishing                                              | #721.                                                                                                                                                                                              |
