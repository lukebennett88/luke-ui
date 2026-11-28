# Testing

## Test types

Choose the smallest test that proves the contract:

- **Pure logic**, including validation cases and return values: a Node unit test (`*.test.ts`). Keep
  it out of browser tests, even when the code serves a component.
- **Component behaviour and axe**: a component test (`*.browser.test.tsx`) in Chromium. Each
  component has one file for behaviour, axe, and visual captures.
- **Meaningful appearance**: a `visual`-tagged component test. See
  [Visual regression](#visual-regression).
- **Public type contract** that can regress while compilation succeeds, such as a union widening: a
  unit test. See [Type contracts](#type-contracts).

The [packed-consumer harness](#package-consumption) and the [theme build test](#theme-build) are the
only other test types. Do not add another.

For a bug fix, add a regression test when the intention needs protection.

## Component tests

- **Queries:** Locate an interactive control by its role and accessible name, such as
  `getByRole('combobox', { name: 'Country' })`, not with `querySelector`. Use a DOM selector only
  for structure that has no role, such as a wrapper, a decorative node, or a pseudo-element.
- **No test-only production code:** Give every production prop, export, context default, and code
  path a production caller. Do not add one to make a test easier, such as a cache-reset export.
  Exercise the real loading and rendering path, and supply fixtures through the seams the product
  uses.
- **Scope:** Test what Luke UI changes or composes. React Aria Components owns its interaction and
  ARIA semantics.

Import components from public package exports and test utilities relatively. Mount with `render()`.
Assert observable public behaviour with `userEvent` and local setup, not private functions,
implementation details, or incidental styling. Read computed styles only when layout, a semantic
colour, or an interaction state is the contract.

Parameterise with a `for…of` loop that calls `test()` or `describe()`, with the distinguishing value
in the title. Do not use `test.each`, `it.each`, or `describe.each`.

```ts
for (const ratio of ratios) {
	test(`locks the frame to ${ratio}`, () => {
		// …
	});
}
```

Keep the test, fixture, and contract choice in the component's test file. Shared assertions take
concrete elements and values.

### Browser gotchas

- **Colours:** Controls transition their colours, so a read straight after a state change is
  interpolated. Use `settledSurfaceColors` from `test-utils/surface-colors.ts`, and set hover or
  pressed with `setInteractionState`.
- **Media:** Emulate media features through `test-utils/emulate-media.ts`. Chromium ignores emulated
  `pointer`, so call `emulatePointer('coarse')` and restore `emulatePointer('fine')` after the test.
  It also reports `hover: none`.
- **Screen width:** Vitest's 414px iframe would make `useIsMobileDevice` report a phone, so
  `@luke-ui/react` browser setup pins a desktop `screen.width`. Call `mockScreenWidth` for tray or
  mobile-modal cases. The docs app setup does not pin it.
- **Fonts:** Setup loads the shipped Inter. Do not override component font styles in the harness.
  For layout that depends on font metrics, `await loadInter()` and compare with
  `INTER_CAP_HEIGHT_EM` and measured baselines, not the CSS under test.
- **Private custom properties:** Tests use the built stylesheet, but their own `.css.ts` imports
  compile with debug identifiers, so an imported `createVar` names a different property. Give the
  property a stable name in source, as `core/styles/surface.ts` does for
  `--luke-internal-foreground-*`. Import helpers from a plain `.ts` module, because a `.css.ts`
  module that exports a function fails to load.
- **Cascade:** Put contracts that need a real third-party stylesheet beside
  `layer-order.browser.test.ts`. `tailwind-integration.browser.test.tsx`, the Tailwind v4 consumer
  fixture, runs in its own Vitest project without the default suite's global stylesheet.

## Timing and synchronisation

Wait for the event or observable state the test needs. Do not sleep with `setTimeout`, a fixed
`delay()`, or a guessed frame count.

- Control asynchronous completion, such as with a promise gate or an injected clock, or assert the
  result with polling assertions.
- An absence after an arbitrary delay proves nothing. Control the event or clock, or await the
  completed operation, including a failure outcome.
- Use fake time when elapsed time is the contract, such as a debounce or a timeout. Advance it
  deliberately, test the boundary when it matters, and restore real timers.
- Wait for an input's effect before sending an input that depends on it. Independent native discrete
  key events can be batched when the test asserts the final outcome.
- Prefer explicit animation completion to guessed milliseconds, and use frame synchronisation only
  where rendering matters.

A failure deadline is not a sleep. `timeout`, `expect.poll`, execution limits, and visual-capture
animation waits are fine. Do not inflate a timeout to hide a slow or broken dependency. Comment an
unusually large deadline with the slow step it covers.

## Accessibility

Run axe with `expectNoAxeViolations` in component tests. Axe is a floor, so add behavioural
assertions for contracts it cannot express. For text over a gradient or a translucent layer, such as
the control finish, axe can return `incomplete`. Measure the pixels behind it with
`lowestRenderedTextContrast`.

## Material contrast

`defineTheme` does not see `controlFinish`, so `core/styles/material-contrast.browser.test.tsx`
measures rendered text contrast from Chromium screenshots. Each solid role specimen and Button state
must reach 4.5:1 in every fixture appearance. A pass guarantees only what it measures. It excludes
disabled and inactive UI, forced colours, and arbitrary composition.

To check a custom theme, add its `ThemeInput` to `fixtureThemes` in `test-utils/fixture-themes.ts`,
add its name to `appearances` in the test, then run:

```sh
pnpm run build
pnpm --filter @luke-ui/react exec vp test run --project=browser --tagsFilter='!visual' \
  src/core/styles/material-contrast.browser.test.tsx
```

## Visual regression

Capture each visually meaningful component in its representative fixture across Tactile light,
Tactile dark, Paper light, and Paper dark. Add a capture only for a materially different state. To
prove states stay distinct without materials, capture `flatAppearances` outside that matrix.

Comparison is per-pixel with no mismatch allowance. Remove nondeterminism instead of adding one.

`render()` uses React-owned copies of the theme inputs in `src/theme/__fixtures__/`. Only their
solid fills, on-solid text, and control finish must match the published packages, and the
packed-consumer harness checks that. [`VISUAL_TESTING.md`](./VISUAL_TESTING.md) owns the rendering
environment, baseline, and review workflow.

## Type contracts

Use `expectTypeOf` for positive shape and equality contracts. Use `assertType` with
`@ts-expect-error` for rejected values and prop combinations. Put both inside `test()` blocks. Do
not wrap rejected assignments in a runtime `expect` just to create an assertion or keep consts
referenced.

## Package consumption

`packages/@luke-ui/react/src/core/packed-consumer/` installs the packed React, Paper, and Tactile
packages in consumers outside the repository, so workspace links cannot satisfy imports. It needs
network access. Run it with `pnpm test:consumer`.

Keep it to the package boundary: tarball contents, dependencies, peers, assets, server rendering,
client builds, hydration, types, published samples, and what small imports bundle. Component
behaviour belongs in component tests.

- **Floors:** One consumer installs the lowest version each peer range allows and the first release
  of `MINIMUM_TYPESCRIPT`. Change a peer range or `MINIMUM_TYPESCRIPT` only when the harness passes
  with the new floor.
- **Bundle boundaries:** A runtime import must not pull in theme-generation code, styling-authoring
  code, or components it does not render. When a boundary check fails, fix the import graph. Move a
  boundary only when the flagged code has intentionally become runtime code.
- **Registry runs:** Set `LUKE_UI_REACT_SPEC` to a published version or dist-tag to test React from
  the registry. That run skips the theme package checks.

## Theme build

`packages/@luke-ui/theme-build/theme-package.test.ts` runs `vp pack --watch` on a theme package and
checks each rebuild. Run it with `pnpm test:integration`.

Each theme package's `src/input.test.ts` compiles its published input with `defineTheme`, so a
contract or gate change that rejects Paper or Tactile fails there, not only against the React
fixture copies.

## Docs

Docs examples must type-check and build. They are not another test corpus.
