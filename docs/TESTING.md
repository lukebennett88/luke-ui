# Testing

## Test types

- Unit tests (`*.test.ts`) run in Node for pure, non-DOM logic.
- Component tests (`*.browser.test.tsx`) run in Chromium. Each component has one file for behaviour,
  axe, and visual captures.

Do not add another test type.

## Component tests

Test Luke UI's contract, not React Aria Components (RAC). RAC owns its interaction and ARIA
semantics. Test only what Luke UI changes or composes.

Import components from public package exports. Import test utilities relatively. Use `render()`. Do
not mount React yourself.

Assert observable public behaviour. Prefer roles and accessible names, `userEvent`, and local setup.
Do not test private functions, implementation details, or computed appearance. Use computed styles
only when layout is the contract.

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

Package component tests pin `window.screen.width` to a desktop value in `@luke-ui/react` browser
setup so `useIsMobileDevice` stays desktop. Vitest's browser iframe is 414px wide. Playwright
mirrors that onto `screen.width`, which would otherwise look like a phone. Call `mockScreenWidth`
for tray or mobile-modal cases. The docs app browser setup does not pin screen width.

## Accessibility

Run axe with `expectNoAxeViolations` in component tests. Axe is a floor. Use behavioural assertions
for accessibility contracts it cannot express. Gradients can produce an `incomplete` colour-contrast
result.

## Visual regression

Visual cases are `visual`-tagged browser tests. Capture each visually meaningful component in its
representative fixture across Tactile light, Tactile dark, Paper light, and Paper dark. This is not
an exhaustive state matrix. Add another capture only for a materially different state.

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

`packages/@luke-ui/react/src/core/styles/packed-consumer.test.ts` tests the published boundary. It
packs `@luke-ui/react` and any `@luke-ui/*` runtime dependency, then installs the tarballs with npm
in a directory outside the repository, so no workspace link can satisfy an import. It is a unit test
and runs with `pnpm run test`.

It checks the tarball contents and the dependencies its exports import. Then it runs one consumer
with the newest peers and one with the lowest peers and the minimum TypeScript. Each consumer proves
SSR and hydration, CSS and SVG asset resolution, a Vite client build, one copy of each peer, the
install size, type checking of every entrypoint, and what a small import bundles.

Keep it to representative imports and flows. Component behaviour belongs in component tests.

Raise `MINIMUM_TYPESCRIPT` or a bundle allowlist only when a change needs it, and say why in the
pull request. To run the same fixtures against a published version or dist-tag, run
`LUKE_UI_REACT_SPEC=snapshot pnpm run test:consumer` from the repo root.

## Docs

Docs examples must type-check and build. They are not another test corpus.

## Bug fixes

Add a regression test when the intention needs protection. Put it with the contract it covers:

- pure logic: unit test
- component behaviour or axe: browser test
- meaningful appearance: `visual`-tagged browser test
- public type contract `check:types` cannot catch: unit test (see [Type contracts](#type-contracts))
