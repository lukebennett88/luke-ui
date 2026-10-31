# Testing

## Test types

- Unit tests (`*.test.ts`) run in Node for pure, non-DOM logic.
- Component tests (`*.browser.test.tsx`) run in Chromium. Each component has one file for behaviour,
  axe, and visual captures.

Two tests sit outside these types. The packed-consumer harness runs in Node and drives Chromium for
hydration. See [Package consumption](#package-consumption). The theme build test runs
`vp pack --watch`. See [Theme build](#theme-build).

Do not add another test type.

## Component tests

Test Luke UI's contract, not React Aria Components (RAC). RAC owns its interaction and ARIA
semantics. Test only what Luke UI changes or composes.

Import components from public package exports. Import test utilities relatively. Use `render()`. Do
not mount React yourself.

Assert observable public behaviour. Prefer roles and accessible names, `userEvent`, and local setup.
Do not test private functions, implementation details, or incidental styling. Use computed styles
only when layout, a semantic colour, or an interaction state is the contract.

Do not add production props, context defaults, or code paths that exist only to make tests easier.
Exercise the real loading and rendering path, and supply fixtures through the same seams the product
uses.

Do not use `test.each`, `it.each`, or `describe.each`. Parameterise with a `for…of` loop that calls
`test()` (or `describe()`) inside, and put the distinguishing value in the title:

```ts
for (const ratio of ratios) {
	test(`locks the frame to ${ratio}`, () => {
		// …
	});
}
```

Shared assertions take concrete elements and values. Keep the test, fixture, and contract choice in
the component's test file.

Fixture themes name `Inter`. Browser setup awaits `loadInter()` before each test so mounts use the
Inter file the theme packages ship from the first paint, not a host fallback. `captureVisual` awaits
the same loader. Code surfaces keep the production `--luke-font-family-code` stack. Do not override
component font styles in the test harness. Visual baseline and compare jobs run in a digest-pinned
Playwright container so browser, OS fonts, and font rendering stay aligned — see
[`VISUAL_TESTING.md`](./VISUAL_TESTING.md). A non-visual test whose layout depends on real font
metrics, such as Capsize trims or the cap height, can still call `await loadInter()`. Compare
positions with Inter's published metrics (`INTER_CAP_HEIGHT_EM`) and measured baselines, not with
the CSS under test.

Package component tests pin `window.screen.width` to a desktop value in `@luke-ui/react` browser
setup so `useIsMobileDevice` stays desktop. Vitest's browser iframe is 414px wide. Playwright
mirrors that onto `screen.width`, which would otherwise look like a phone. Call `mockScreenWidth`
for tray or mobile-modal cases. The docs app browser setup does not pin screen width.

Cascade contracts that need a real third-party stylesheet live beside `layer-order.browser.test.ts`.
`tailwind-integration.browser.test.tsx` is the Tailwind v4 consumer fixture. It runs in the
`tailwind-integration` Vitest project so it can compile Tailwind without loading the default browser
suite's global stylesheet.

Browser tests render with the built `@luke-ui/react/stylesheet.css` from `dist`, but a test's own
imports of `.css.ts` modules compile with debug identifiers. A `createVar` imported into a test
therefore names a different custom property from the one the built stylesheet declares. When a test
must read a private custom property, give it a stable name in source, as `core/styles/surface.ts`
does for its `--luke-internal-foreground-*` overrides, and import helpers from a plain `.ts` module.
A `.css.ts` module that exports a function fails to load in a browser test.

## Timing and synchronisation

Almost never sleep in a test. Do not use `setTimeout`, a fixed `delay()`, or an arbitrary frame
count to "give something time". Identify the event or observable state the test needs, then wait for
that.

- For asynchronous behaviour, control completion (for example with a promise gate or an injected
  clock) or assert the observable result with the browser/test framework's polling assertions. Avoid
  new test-only production APIs, and do not test implementation details.
- Treat negative assertions specially: an absence observed after an arbitrary delay does not prove
  something will never happen. Control the event or clock, or assert the completed operation and its
  final state — for a failure, await the failure outcome itself.
- Use fake time when elapsed time is the contract (debouncing, temporary feedback, spinner
  thresholds, timeout handling). Advance it deliberately, test the boundary when it matters, and
  restore real timers after the test.
- Distinguish a wait's maximum failure deadline from a delay the test must sit through. Bounded
  polling and execution limits protect against hangs. They are not themselves a reason to fail a
  review. Do not inflate a timeout to hide a slow or broken dependency, and give any unusually large
  deadline a comment saying what slow step it covers.
- Wait for an input's observable effect before sending the next input when it depends on that
  effect. Independent native discrete key events can be batched when the test asserts the final
  outcome.
- Use browser animation APIs and frame synchronisation only where rendering or animation genuinely
  matters. Prefer explicit animation completion over guessed milliseconds.
- Choose the smallest test that proves Luke UI's own contract. Avoid waiting for a large integration
  path when a smaller component test can establish the behaviour.

Legitimate deadlines stay: packed-consumer and theme-build execution limits, feedback-expiry tests
on a fake clock, and visual-capture animation waits all guard real work. This section bans guessed
durations, not `timeout`, `expect.poll`, or fake timers as such.

## Accessibility

Run axe with `expectNoAxeViolations` in component tests. Axe is a floor. Use behavioural assertions
for accessibility contracts it cannot express. Gradients can produce an `incomplete` colour-contrast
result. To check text over a gradient or a translucent layer, such as the control finish, measure
the screenshot pixels behind it with `lowestRenderedTextContrast`.

## Material contrast

`defineTheme` validates token colours and never sees `controlFinish`.
`core/styles/material-contrast.browser.test.tsx` measures the rendered result instead. For every
role it paints a test-only specimen with the solid `rest`, `hover` and `pressed` fill, the finish
rung a solid Button paints in that state (`resting`, `raised`, `recessed`), and the role's `onSolid`
text, in light and dark mode. `lowestRenderedTextContrastAt` hides the text, screenshots the
specimen, and returns the lowest contrast between the text colour and any pixel across the text's
whole box, with where it occurred. A ratio under 4.5:1 reports the theme, role, mode, state, ratio
and position. Those specimens never use a Button tone, so they add no component API. A second test
per appearance renders real standard and low Buttons of both tones over every role's solid fill and
measures their label in rest, hover and pressed, so the finish, fill and adaptive state layer are
covered where a Button paints them.

The suite covers Tactile, Paper and the `layeredFinish` fixture, whose finish stacks overlapping
layers. Two `midBandFailure` tests prove the gate catches a finish that fails only in the middle of
its gradient, and one `washFailure` test proves it catches a flat wash that lightens every dark
fill. It does not parse gradients, so these limits apply:

- It measures one specimen size and one label. A finish whose layers scale with a much larger
  control can paint differently there.
- Pixels are 8-bit sRGB from a Chromium screenshot, so it reads the finish as Chromium paints it.
- It measures normal text on solid fills only. Disabled and inactive UI, forced colours (a finish is
  not painted), and other layering are out of scope.
- The React fixtures of Paper and Tactile are the subject. The packed-consumer harness requires
  their solid fills, on-solid text and finish to match the published packages.

To check a custom theme, add its `ThemeInput` to `fixtureThemes` in `test-utils/fixture-themes.ts`,
add its name to `appearances` in the test, then run:

```sh
pnpm run build
pnpm --filter @luke-ui/react exec vp test run --project=browser --tagsFilter='!visual' \
  src/core/styles/material-contrast.browser.test.tsx
```

A pass is a guarantee for the finishes and specimens measured, not for arbitrary composition. CI
runs the suite in the browser job with the rest of `pnpm test:code`.

## Visual regression

Visual cases are `visual`-tagged browser tests. `render()` compiles React-owned copies of the
Tactile and Paper inputs from `src/theme/__fixtures__/`. Those copies can diverge from the published
theme packages, except in their solid fills, on-solid text, and control finish, which the
packed-consumer harness requires to match. Capture each visually meaningful component in its
representative fixture across Tactile light, Tactile dark, Paper light, and Paper dark. This is not
an exhaustive state matrix. Add another capture only for a materially different state.

`flatAppearances` renders Tactile's colours with every shadow and control finish set to `none`. Use
it, outside the theme matrix, for a capture that proves states stay distinct without materials.

Comparison is per-pixel with `includeAA: true` and `threshold: 0.1`. There is no canvas-wide
mismatch allowance. Remove nondeterminism. Do not add an allowance.

[`VISUAL_TESTING.md`](./VISUAL_TESTING.md) explains the baseline and review workflow.

## Type contracts

`check:types` protects normal source types. Add a unit test only when a public type contract can
regress while compilation still succeeds, such as a union widening.

Use `expectTypeOf` for positive shape and equality contracts. Use `assertType` with
`@ts-expect-error` for rejected values and prop combinations. Put those checks inside `test()`
blocks. Do not wrap rejected assignments in a runtime `expect([...]).toHaveLength(...)` or similar
just to create an assertion or keep consts referenced.

## Package consumption

`packages/@luke-ui/react/src/core/packed-consumer/` tests the packages the way an application
installs them. Its global setup, `setup.ts`, packs the workspace builds of React, Paper, and
Tactile, installs the tarballs with npm in directories outside the repository, so no workspace link
can satisfy an import, and builds each consumer once. The scenarios read those consumers and never
install or build. `react-package.test.ts` covers React, `theme-packages.test.ts` the theme packages,
and `fonts.test.ts` font loading and Capsize trims. The consumer files they need live in
`react-fixture.ts` and `theme-fixture.ts`. The comprehensive `pnpm test` includes the harness and
requires network access. Run it separately with `pnpm test:consumer`. The `consumer-tests` CI job
runs it on every pull request and on `main`.

Keep it to the package boundary: tarball contents, dependencies, peers, assets, server rendering, a
client build, hydration in Chromium, type checking, and what small imports bundle. Check installed
support packages for undeclared JavaScript and declaration imports too. For the theme packages it
also runs the docs' `compile-theme.ts` sample with Node 24, checks each stylesheet rule by rule
against the token contract, and renders the packages' Inter and a Lora display font from
`@fontsource/lora`. Component behaviour belongs in component tests.

One consumer installs the lowest published version each peer range allows, and the first release of
the TypeScript version in `MINIMUM_TYPESCRIPT`. That run is the evidence for those floors. Change a
peer range or `MINIMUM_TYPESCRIPT` only when the harness passes with the new floor.

A runtime import must not pull in theme-generation code, styling-authoring code, or components it
does not render. A failing bundle-boundary check means one does. Fix the import graph. Change a
boundary only when the code it flags has intentionally become runtime code.

Set `LUKE_UI_REACT_SPEC` to a published version or dist-tag to test that package from the registry
instead of the workspace build. That run skips the theme package checks and prints why.

## Theme build

`packages/@luke-ui/theme-build/theme-package.test.ts` runs `vp pack --watch` with the shared theme
build on a small theme package in a temporary directory. It edits the theme input twice and checks
the stylesheet after each rebuild. The comprehensive `pnpm test` includes this suite. Run it
separately with `pnpm test:integration`. The `package-tests` CI job runs it.

The React theme tests compile the copies in `src/theme/__fixtures__/`, not the published inputs.
Each theme package's `src/input.test.ts` compiles its published input with the public `defineTheme`,
so a contract or gate change that rejects Paper or Tactile fails there too. Tactile's test also
checks the custom-canvas contrast failures against the published input.

## Docs

Docs examples must type-check and build. They are not another test corpus.

## Bug fixes

Add a regression test when the intention needs protection. Put it with the contract it covers:

- pure logic: unit test
- component behaviour or axe: browser test
- meaningful appearance: `visual`-tagged browser test
- public type contract `check:types` cannot catch: unit test (see [Type contracts](#type-contracts))
