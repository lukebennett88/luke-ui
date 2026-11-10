# #876 StyleX against optimised Vanilla Extract

Evidence for the pre-1.0 styling decision in
[#876](https://github.com/lukebennett88/luke-ui/issues/876). This workspace is a throwaway research
spike. It changes no production code, and its own pnpm workspace keeps its dependencies out of the
root lockfile.

## Recommendation

**Retain Vanilla Extract and optimise it. Do not adopt StyleX for 1.0.**

- StyleX ships no less CSS once gzipped. For the same Box, Button, Text, and Combobox scope, the
  StyleX stylesheet is 52.4 KiB raw and 8.8 KiB gzip, and the matching Vanilla Extract modules are
  127.5 KiB raw and 8.5 KiB gzip. Atomic CSS removes raw bytes, mostly the Box utility table, but
  gzip already removes that repetition.
- StyleX moves bytes into HTML. A server-rendered realistic page carries 19.1 KiB of class
  attributes instead of 5.7 KiB, so its HTML grows from 2.2 KiB to 4.5 KiB gzip on every request.
- The one large, real saving is dropping the CSS of components an app never imports. A bounded
  Vanilla Extract build change gets the same saving: the minimal app's library CSS falls from 15.3
  KiB to 4.0 KiB gzip, with computed styles identical to today in every check. StyleX's best result
  on the same app is 4.3 KiB.
- The previous StyleX failure modes recur. Selector sharing, state precedence, helper reuse, and
  token access all need workarounds. This spike reproduces 13 StyleX 0.19.1 limitations, three of
  which silently produced wrong responsive styles before they were worked around.
- The source distribution, which is the only one that merges Luke UI's atoms with an app's own
  StyleX, more than doubles a consumer's cold build (699 ms to 1,534 ms for the realistic app). It
  adds 26 build packages, needs an HTML hook for dev CSS, and fails at runtime, not build time, when
  the plugin is missing.

The overall result is not meaningfully better than optimised Vanilla Extract, so #876's own rule
applies: atomicity or compiler adoption by itself is not a benefit.

Adopt the per-module sublayer split described in
[Optimised Vanilla Extract](#optimised-vanilla-extract) as the follow-up, after its open items are
settled.

## What this spike contains

```
research/876-stylex-spike/
├── lib/                    StyleX prototype: tokens, recipe helper, Box, Text, Button, ComboboxField
│   ├── scripts/build.mjs   builds all three StyleX distributions
│   ├── scripts/generate-tokens.mjs   mirrors the public `vars` contract into `tokens.stylex.ts`
│   └── scripts/probes.mjs  reproduces each StyleX limitation the spike hit
├── consumers/
│   ├── shared/             one app source: `minimal`, `minimal-barrel`, `realistic`, `tailwind`, `concentric`
│   ├── ve/                 current Vanilla Extract, installed from packed tarballs
│   ├── ve-optimised/       Vanilla Extract with the per-module CSS split
│   ├── stylex-precompiled/ StyleX option 1: compiled JS and one stylesheet
│   ├── stylex-split/       StyleX option 1, split: compiled JS that imports per-module CSS
│   └── stylex-source/      StyleX option 2: source the consumer compiles with @stylexjs/unplugin
├── scripts/                packs the VE packages and builds the optimised VE tarball
├── bench/                  size, build-time, runtime, and attribution measurements
└── verify/                 Playwright checks, dev-server and misconfiguration checks
```

Every consumer builds the same app source through a `#ui/*` alias, prerenders it with a Vite SSR
build, and hydrates it. Each `ui/*.ts` adaptor re-exports one component, the way an app imports
`@luke-ui/react/button`.

### Scope of the prototype

The StyleX components implement the visual contract the apps use: every Button prominence, tone,
size, and appearance, Text's typography, weight, colour, clamp, wrap, transform, and Capsize trims,
and the Combobox popover with sections, invalid, disabled, read-only, and both sizes. Surface
pairing, focus-ring context, the adaptive state layer, forced colours, and reduced motion are
included.

They omit the mobile tray, pending spinners, icons from the spritesheet, Field's necessity
indicator, and load-more states. Vanilla Extract ships those, so JS totals favour StyleX for reasons
that have nothing to do with the engine. The CSS comparison below removes them.

## Measurements

From [bench/results.md](bench/results.md). Sizes are KiB, raw / gzip level 9. "Library CSS" removes
the theme stylesheets, which are the same generated CSS in every variant.

| Variant            | App       | Library CSS  | JS + CSS      | Unused Combobox CSS | Cold build |
| ------------------ | --------- | ------------ | ------------- | ------------------- | ---------- |
| VE                 | minimal   | 208.8 / 15.3 | 529.0 / 104.6 | shipped             | 521 ms     |
| VE optimised       | minimal   | 35.3 / 4.0   | 355.4 / 93.2  | dropped             | 424 ms     |
| StyleX precompiled | minimal   | 52.5 / 8.7   | 374.6 / 97.8  | shipped             | 426 ms     |
| StyleX split       | minimal   | 26.2 / 4.7   | 348.4 / 93.9  | dropped             | 502 ms     |
| StyleX source      | minimal   | 24.3 / 4.3   | 345.1 / 92.9  | dropped             | 999 ms     |
| VE                 | realistic | 208.8 / 15.3 | 760.8 / 169.6 | n/a                 | 699 ms     |
| VE optimised       | realistic | 146.2 / 11.0 | 698.1 / 165.3 | n/a                 | 539 ms     |
| StyleX precompiled | realistic | 52.5 / 8.7   | 563.6 / 152.2 | n/a                 | 496 ms     |
| StyleX split       | realistic | 54.2 / 8.9   | 565.3 / 152.7 | n/a                 | 511 ms     |
| StyleX source      | realistic | 62.7 / 9.3   | 571.4 / 152.0 | n/a                 | 1,534 ms   |

**Like-for-like CSS.** [bench/attribute-ve.mjs](bench/attribute-ve.mjs) attributes the optimised VE
realistic CSS to source modules. The modules the prototype also implements (utilities, Button,
Combobox, Text, and Field) are 127.5 KiB raw and 8.5 KiB gzip when minified together. The StyleX
stylesheet for the same scope is 52.4 KiB raw and 8.8 KiB gzip. Most of the raw difference is
Vanilla Extract's Box utility table: 80.1 KiB raw but 3.8 KiB gzip. The realistic VE app also
carries the mobile tray (1.9 KiB gzip) and spinners (1.0 KiB gzip), which the prototype lacks.

**Server-rendered HTML.** The realistic page is 15.3 KiB raw and 2.2 KiB gzip with Vanilla Extract,
and 31.4 KiB raw and 4.5 KiB gzip with StyleX. Class attributes grow from 5.7 KiB to 19.1 KiB,
because each element lists one class per property and condition. That cost repeats on every
server-rendered response, while CSS is cached.

**Styling runtime.** [bench/runtime-size.mjs](bench/runtime-size.mjs) bundles each runtime alone.
`stylex.props` plus the prototype's recipe and merge helpers are 3.2 KiB raw and 1.4 KiB gzip. The
Vanilla Extract recipe engine, Rainbow Sprinkles runtime, and `@vanilla-extract/dynamic` are 9.3 KiB
raw and 2.9 KiB gzip. Server render time for the realistic app is 7.7–9.0 ms with StyleX and 9.6–9.8
ms with Vanilla Extract, measured in Node and too close to matter.

**Barrel imports.** `minimal-barrel` imports Button and Text through a module that also re-exports
Box and ComboboxField. Bundlers tree-shake the unused re-exports, so the split builds still drop
their CSS. The source distribution does not: its plugin collects CSS when it transforms a module,
before tree-shaking, so the barrel ships every component's atoms (62.7 KiB raw, 9.3 KiB gzip).

**Consumer setup.** Option 1 needs no compiler. Option 2 adds `@stylexjs/unplugin`, a closure of 26
packages including Babel and the StyleX plugin. The consumer also needs a hand-written
`transformIndexHtml` hook to load `/virtual:stylex.css` in dev, and has no supported way to put
precompiled Luke UI rules and its own StyleX rules in one pass.

## Behaviour verification

[verify/run.mjs](verify/run.mjs) drives every prerendered realistic build in Chromium.
[verify/results.json](verify/results.json) holds the raw output.

| Check                                                            | VE  | VE optimised | StyleX (all three) |
| ---------------------------------------------------------------- | --- | ------------ | ------------------ |
| Hydration errors, console errors                                 | 0   | 0            | 0                  |
| First paint without JS matches the hydrated page                 | yes | yes          | yes                |
| Computed styles match VE at rest (24 elements, 22 properties)    | —   | all          | all but 3 ¹        |
| Real hover, hover + press, field focus and hover, active option  | —   | all          | all                |
| Forced colours, at rest and in every interaction                 | —   | all          | all                |
| Reduced motion drops only the state-layer transition             | yes | yes          | yes                |
| Tactile → Paper, light → dark → system dark                      | yes | same values  | same values        |
| Tailwind 4: utility beats recipe, Preflight leaves Button intact | yes | yes          | yes                |
| Listbox portals to `<body>`, keyboard selection works            | yes | yes          | yes                |
| axe-core violations beyond the fixture's missing landmarks       | 0   | 0            | 0                  |
| Dev server renders styled with no errors                         | yes | not run      | yes (source)       |

¹ Three elements with `border-style: none` report a different `border-color`, which never paints.
Vanilla Extract uses the `border: 0` shorthand and the prototype uses `border-style: none`.

The axe results report `landmark-one-main` and `region` in every variant, because the realistic app
has no `<main>`. The fixture causes them, not the components.

## Distribution options

| Option                                      | Works | Consumer compiler | Drops unused CSS | Merges with app StyleX |
| ------------------------------------------- | ----- | ----------------- | ---------------- | ---------------------- |
| 1. Precompiled JS and one stylesheet        | yes   | no                | no               | no                     |
| 1, split: precompiled JS imports module CSS | yes   | no                | yes              | no                     |
| 2. Source that the consumer compiles        | yes   | yes (Vite only)   | yes, not barrels | yes                    |

Option 1 "with StyleX-extractable metadata" has no supported form in StyleX 0.19.1. The plugin
cannot ingest a library's rule metadata, so a precompiled library ships CSS. The split variant
filters one full `processStylexRules` run per module, because StyleX names its priority layers by
index within each run. Rules compiled separately would land in different `priorityN` layers.

The split variant and optimised VE both import CSS from package JS. Node cannot load those imports,
so an SSR consumer must add the package to `ssr.noExternal`. Here the split StyleX workspace package
needs the same line once it is published.

Option 2 builds correctly in dev, production, and SSR, with matching class names between server and
client. Without the plugin, `vite build` succeeds and the page throws
`Unexpected 'stylex.unstable_defineConstsNested' call at runtime` on load
([verify/dev-and-misconfig.json](verify/dev-and-misconfig.json)).

If StyleX were chosen, the evidence favours option 1 split. It needs no compiler and drops unused
CSS. It gives up the only advantage option 2 has: merging Luke UI's atoms with an app's StyleX.

## Previous failure modes

| Failure mode           | Result    | Evidence                                                                                                                                                                                                                                                                                                             |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shorthand precedence   | Resolved  | `styleResolution: 'application-order'` resolves a property set by several styles at runtime, in the order `stylex.props` receives them. `shouldInheritFont` beats `typography` with no compound, unlike Vanilla Extract. Box resolves `padding` to four longhands in JS.                                             |
| Recipe complexity      | Trade-off | The recipe helper is 52 lines with no Babel transform. A later style replaces an earlier style's whole property, including its states and forced colours, so a compound must restate every condition. Conditions are keyed per property, so `surfaceStyle()` becomes a property-first helper written per file.       |
| Selector ergonomics    | Remains   | Same-priority states are ordered by declaration value, so competing states must be mutually exclusive. Selectors cannot be shared across files: imports are rejected and `defineConsts` selectors emit malformed CSS. `stylex.when.*` only compiles inline. Descendant selectors need structural CSS (`global.css`). |
| Token duplication      | Remains   | StyleX cannot read `theme/contract.ts`, so `tokens.stylex.ts` is a generated mirror. Helpers cannot index it by parameter and rebuild 53 `var(--luke-*)` strings instead. Theme values stay in the existing generated theme CSS, so values are not duplicated.                                                       |
| Consumer customisation | Resolved  | `className` and `style` compose through cascade layers, and Tailwind utilities win as today. There is no `xstyle`. StyleX's custom-property atoms sit outside every layer, so application CSS in a layer cannot override them.                                                                                       |

## StyleX 0.19.1 limitations

`node lib/scripts/probes.mjs` compiles a small snippet for each and prints whether it reproduces
([bench/probes.txt](bench/probes.txt)). All 13 reproduce.

1. Same-priority states are ordered by declaration value, not authoring order.
2. A selector shared through `defineConsts` emits malformed CSS (`:is(…){.x{…}}`).
3. A selector string imported from a plain module is rejected.
4. A style helper imported from another module is rejected.
5. A local helper with a block body is rejected. Only expression-bodied arrows evaluate.
6. Indexing an imported token group by a parameter is rejected.
7. A dynamic style built by a factory function is rejected.
8. `stylex.when.ancestor()` stored in a constant stays a runtime call and throws on load.
9. Logical block properties become physical: `margin-block-end` becomes `margin-bottom`, which is
   wrong in vertical writing modes.
10. Container queries are not ordered by width. Ties fall back to the declaration value, so
    mobile-first container conditions resolve to an arbitrary breakpoint.
11. A null dynamic condition concatenates `"null"` into the class string. For `paddingBlock*` the
    condition's class is applied anyway, so the property computes to its initial value.
12. Typed custom properties always register with `inherits: true`. Luke UI's state layer registers
    with `inherits: false` today.
13. In the built library, 104 custom-property atoms sit outside every cascade layer.

Limitations 10 and 11 broke Box's responsive padding and radius until Box switched to exclusive
container ranges, carried values forward in JS, and used a separate single-value style for plain
values.

## Radius and concentric rounding (#874)

The StyleX Box implements opt-in `borderRadius="concentric"` with CSS custom properties and `calc()`
only. A Box with padding, a border, or a radius publishes its inner corner radii. A concentric child
reads them. Publishing alternates between two property sets by nesting depth through React context,
so a child never redeclares a property it reads, which would be a cycle. A Box with no geometry
passes the parent's through.

Measured at 600 px and 1,000 px wide ([verify/results.json](verify/results.json), `concentric`):

| Case                                | Parent                     | Child corners                                 |
| ----------------------------------- | -------------------------- | --------------------------------------------- |
| Uniform, two levels                 | 16 px radius, 12 px inset  | 4 px, then 0 px (clamped)                     |
| Asymmetric insets and a 2 px border | 16 px, insets 6/26/6/10 px | Elliptical: `6px 10px` and `0px 10px` corners |
| RTL                                 | 16 px, inline 8 px / 24 px | Corners mirror the LTR result                 |
| Responsive radius and padding       | 8 px / 4 px, then 16 / 12  | 4 px at both widths                           |
| Radius smaller than the inset       | 8 px, 24 px inset          | 0 px                                          |
| Intermediate Box without geometry   | 16 px, 12 px inset         | 4 px                                          |

Nothing in the mechanism depends on StyleX. It is custom properties, `calc()`, and one React
context, so it ports to Vanilla Extract unchanged. Its limits apply to both engines. A non-Box
wrapper with padding, padding set through `className` or `style`, a `borderWidth` without a drawn
border, and a child that is not flush with the parent's content edge all produce misleading radii.
#874 owns that support boundary.

Box values are set inline through StyleX dynamic styles, which register `inherits: false`
properties. Nested Boxes therefore resolve responsive values independently, which settles #323's
inheritance risk for this design. The cost is inline style: the concentric fixture's Boxes carry up
to 50 custom properties each.

## Themes

The prototype keeps today's theme model. Themes stay static CSS from `defineTheme`, scoped to an
identity class on `<html>`, with `data-color-mode` and `prefers-color-scheme`. StyleX reads the
public `--luke-*` names through the generated `tokens.stylex.ts`, which emits no CSS.

StyleX's `defineVars` keeps a literal name when the key starts with `--`, so `createTheme` could
also override Luke UI tokens. Moving theme values into `createTheme` would need generated
`.stylex.ts` theme files, because StyleX only accepts static values and `defineTheme` computes
colours in Node. That is the compiler-specific mirror #876 asks to avoid, so the spike did not take
it further.

## Optimised Vanilla Extract

[scripts/optimise-ve.mjs](scripts/optimise-ve.mjs) changes only the packed build output:

1. It attributes every rule in `dist/stylesheet.css` to its source `.css.ts` module through the
   stylesheet's sourcemap.
2. Each JS chunk imports a CSS file with only its modules' rules. The global stylesheet keeps the
   layer order, the reset, and registered properties.
3. Each source module gets its own sublayer, `luke-ui.recipes.m0` to `m29`, declared up front in
   today's module order.

Step 3 is required. Without it (`--naive`), Vite orders the split files by import graph, and
Button's size compound landed before its base rule. Every Button then rendered at 16 px and weight
400, and reduced motion kept the state-layer transition. With per-module sublayers, every check in
[Behaviour verification](#behaviour-verification) matches today's build.

Open items before adopting it:

- Under `!important`, earlier sublayers win. The Combobox forced-colours reset passes, but
  LoadingSkeleton's forced surface, which relies on `!important` placement, was not exercised.
- It should become part of `vp pack`, not a post-processing script, and `stylesheet-contract` and
  `layer-order` tests need to cover the sublayers.
- SSR consumers need `ssr.noExternal: ['@luke-ui/react']`, which is a new setup step.
- Vite already minifies CSS, so shipping a minified stylesheet changes nothing for Vite consumers.

The #323 toggle approach for responsive utilities is not needed for bytes. The utility table
compresses to 3.8 KiB gzip and is dropped entirely when an app does not use Box.

## Maintainability

- **Code size.** The prototype is 1,812 lines, including component TSX, against 3,290 lines of
  Vanilla Extract styling modules for a wider feature set. Line counts do not separate scope from
  engine, so they do not decide anything here.
- **Authoring.** Conditions move from selector-first to property-first. A state change touches every
  property that state sets, and each competing state must exclude the others. Forced-colours maps
  repeat across 34 conditions in Button and Combobox.
- **Indirection.** StyleX removes the recipe engine, Rainbow Sprinkles, and `layered-style`, but
  adds a generated token mirror, a structural `global.css`, a build that runs Babel, and per-file
  copies of selector strings and foreground fallback chains.
- **Debugging.** Devtools show one class per declaration. A dynamic Box value shows as
  `var(--x-gfy1dv)`, set inline among up to 50 custom properties.
- **Silent failure.** Limitations 10 and 11 produced wrong layout with no error. Vanilla Extract's
  ordering regression in the naive split was also silent, which is why the split needs the parity
  checks this spike runs.

## Verification gaps

- Only Chromium ran. Firefox, Safari, and real Windows High Contrast were not checked.
- No pixel visual regression ran. Parity compares 22 computed properties on 24 elements, plus
  interaction states. Concentric radii are computed values, not screenshots.
- No screen reader pass ran. React Aria's roles and keyboard behaviour are unchanged, and axe ran.
- The mobile tray, pending spinners, and LoadingSkeleton were not ported, so their StyleX cost is
  unmeasured.
- Vertical writing modes were not tested. Limitation 9 predicts StyleX gets block padding wrong
  there.
- The VE optimised dev server was not run.
- Timings come from one container. Treat build and render times as relative.

## Reproduce

From the repository root, build the packages. Then, from this directory:

```sh
pnpm run build:packages            # at the repository root
node scripts/pack-luke-ui.mjs      # packs VE tarballs and theme CSS into vendor/
mkdir -p vendor/optimised && cp vendor/luke-ui-react.tgz vendor/optimised/
pnpm install
node scripts/optimise-ve.mjs && pnpm install --force
pnpm --filter @spike/stylex-ui run build
for variant in ve ve-optimised stylex-precompiled stylex-split stylex-source; do
	(cd "consumers/$variant" && node ../build-app.mjs)
done
(cd consumers/stylex-source && node ../build-app.mjs concentric)
node bench/run.mjs --runs 3
node bench/runtime-size.mjs
node bench/attribute-ve.mjs
node lib/scripts/probes.mjs
node verify/run.mjs
node verify/dev-and-misconfig.mjs
```

The `cp` line seeds a placeholder, because `pnpm install` resolves the optimised tarball before
`optimise-ve.mjs` can build it.
