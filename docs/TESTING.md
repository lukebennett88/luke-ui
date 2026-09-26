# Testing

## Test types

- Unit tests (`*.test.ts`) run in Node for pure, non-DOM logic.
- Component tests (`*.browser.test.tsx`) run in Chromium. Each component has one file for behaviour,
  axe, and visual captures.
- Docs deployment checks are scripts under `apps/docs/scripts/` that exercise a production `docs`
  build (for example `check:ssr-nav`). They are not a third Vitest project.

Do not add another Vitest test type.

## Component tests

Test Luke UI's contract, not React Aria Components (RAC). RAC owns its interaction and ARIA
semantics. Test only what Luke UI changes or composes.

Import components from public package exports. Import test utilities relatively. Use `render()`. Do
not mount React yourself.

Assert observable public behaviour. Prefer roles and accessible names, `userEvent`, and local setup.
Do not test private functions, implementation details, or computed appearance. Use computed styles
only when layout is the contract.

Shared assertions take concrete elements and values. Keep the test, fixture, and contract choice in
the component's test file.

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

## Docs

Docs examples must type-check and build. They are not another test corpus.

## Bug fixes

Add a regression test when the intention needs protection. Put it with the contract it covers:

- pure logic: unit test
- component behaviour or axe: browser test
- meaningful appearance: `visual`-tagged browser test
- public type contract `check:types` cannot catch: unit test (see [Type contracts](#type-contracts))
- production docs host behaviour that unit/browser tests cannot reach: a docs deployment check
  script (see [Docs deployment checks](#docs-deployment-checks))

## Docs deployment checks

Use these when the failure only appears against a production `docs` build (SSR vs static deploy
mode, prerender cache files, Netlify `preferStatic`, and similar).

- Build with the mode under test. Netlify SSR is the default (`DOCS_STATIC` unset). Fully
  prerendered static hosts set `DOCS_STATIC=true`.
- `pnpm --filter docs run check:ssr-nav` serves `dist/` like Netlify (`preferStatic` then SSR),
  loads a docs page, clicks an internal docs link, and fails on `__tsr/staticServerFnCache` 404s or
  JSON parse errors from those responses.
