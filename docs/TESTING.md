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
Do not test private functions, implementation details, or computed appearance. Use computed styles
only when layout is the contract.

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

Fixture themes name `Inter`. Browser setup awaits `loadVisualFonts()` and pins code _rendering_ to
JetBrains Mono before each test (without remapping `--luke-font-family-code`) so mounts share those
faces from the first paint. The pin covers `code` / `samp` / `pre` and elements that apply the code
token via an inline `font-family: var(--luke-font-family-code)` (TokenBoard's font.family.code
preview). `captureVisual` awaits the same loader and does not pin again. Setup releases the pin in
`afterEach` even when React unmount throws. Token boards and theme authoring tests can read the
production code stack from the live custom property or from generated CSS (`extractValue`). A
non-visual test whose layout depends on real font metrics, such as Capsize trims or the cap height,
can still call `await loadInter()`. Compare positions with Inter's published metrics
(`INTER_CAP_HEIGHT_EM`) and measured baselines, not with the CSS under test.

Package component tests pin `window.screen.width` to a desktop value in `@luke-ui/react` browser
setup so `useIsMobileDevice` stays desktop. Vitest's browser iframe is 414px wide. Playwright
mirrors that onto `screen.width`, which would otherwise look like a phone. Call `mockScreenWidth`
for tray or mobile-modal cases. The docs app browser setup does not pin screen width.

Cascade contracts that need a real third-party stylesheet live beside `layer-order.browser.test.ts`.
`tailwind-integration.browser.test.tsx` is the Tailwind v4 consumer fixture. It runs in the
`tailwind-integration` Vitest project so it can compile Tailwind without loading the default browser
suite's global stylesheet.

## Accessibility

Run axe with `expectNoAxeViolations` in component tests. Axe is a floor. Use behavioural assertions
for accessibility contracts it cannot express. Gradients can produce an `incomplete` colour-contrast
result.

## Visual regression

Visual cases are `visual`-tagged browser tests. `render()` compiles React-owned copies of the
Tactile and Paper inputs from `src/theme/__fixtures__/`. Those copies can diverge from the published
theme packages. Capture each visually meaningful component in its representative fixture across
Tactile light, Tactile dark, Paper light, and Paper dark. This is not an exhaustive state matrix.
Add another capture only for a materially different state.

`flatAppearances` renders Tactile's colours with every depth and control finish set to `none`. Use
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
`react-fixture.ts` and `theme-fixture.ts`. The installs need network access, so `pnpm run test`
leaves the harness out. Run it with `pnpm run test:consumer`. The `consumer-tests` CI job runs it on
every pull request.

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
the stylesheet after each rebuild. Starting a watcher is slow, so `pnpm run test` leaves it out. Run
it with `pnpm run test:integration`. The `component-tests` CI job runs it after the component tests.

## Docs

Docs examples must type-check and build. They are not another test corpus.

## Bug fixes

Add a regression test when the intention needs protection. Put it with the contract it covers:

- pure logic: unit test
- component behaviour or axe: browser test
- meaningful appearance: `visual`-tagged browser test
- public type contract `check:types` cannot catch: unit test (see [Type contracts](#type-contracts))
