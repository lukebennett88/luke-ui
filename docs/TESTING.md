# Testing

This is the normative testing guide for the repository. The goal is fewer tests with more confidence
and one obvious place for each regression.

## Test types

Use the smallest test that can falsify an intention Luke UI owns.

- **Unit tests** (`*.test.ts`) cover pure logic, generators, scripts, package metadata, docs
  tooling, and other code that does not need a browser.
- **Component tests** (`*.browser.test.tsx`) run against the built `@luke-ui/react` package in real
  Chromium. They cover component behaviour, accessibility, and representative visual regression.

Do not introduce another component-test flavour.

Component tests may contain:

- behavioural assertions;
- axe accessibility assertions;
- high-value public type assertions where appropriate;
- tests tagged `visual` for representative screenshot regression.

Docs examples are documentation. They must type-check and build, but they are not a component-test
surface.

## Component tests

Component tests import components through their public package exports:

```tsx
import { Button } from '@luke-ui/react/button';
```

Do not import component implementations through relative source paths.

Tests exercise the built package so they cover what consumers actually receive, including package
exports, emitted JavaScript and CSS, generated assets, and build-time transformations.

The browser-test command owns building and watching the package. Do not rely on a manually started
build process or an existing `dist` directory.

Use the shared renderer:

```tsx
import { Button } from '@luke-ui/react/button';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('calls the consumer handler when the button is pressed', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Save</Button>);

	await user.click(locator.getByRole('button', { name: 'Save' }));

	expect(pressed).toBe(true);
});
```

`render()` mounts the component in the themed browser environment and returns `{ locator, user }`.

Do not call `createRoot`, `hydrateRoot`, or hand-roll a React mount in a component test. Ancillary
DOM nodes are fine when a browser or layout fixture needs them.

### Test our delta over RAC

Do not retest behaviour owned by React Aria Components unless Luke UI changes, composes, or depends
on that behaviour in a way that creates a contract of its own.

RAC already owns behaviour such as focus management, keyboard navigation, selection semantics, ARIA
wiring, validation semantics, and disabled or read-only interaction blocking.

Test observable Luke UI behaviour through public APIs, roles, accessible names, DOM output, and user
interactions.

Prefer one representative workflow over several tests that restate the same contract.

### Assertions

An authored assertion should fail if, and only if, an intention Luke UI owns is not met.

- Assert observable outcomes through public APIs, roles, accessible names, and user interactions.
- Prefer role and accessible-name queries. Use label or visible text when no role fits. Do not
  invent semantics purely to make a test queryable.
- Use `getBy*` for synchronous presence and `findBy*` for asynchronous presence. Use `queryBy*` only
  to assert absence.
- Prefer `userEvent`. Do not use `fireEvent`, manual event dispatch, or state mutation to fake a
  user interaction.
- Keep workflow tests fewer and longer when several assertions belong to the same user journey.
- Generated matrices are appropriate when a finite set of valid combinations forms the contract.
  Exclude forbidden or meaningless combinations.
- Keep setup local and explicit. Avoid shared mutable state and `beforeEach` setup.
- Use cleanup hooks only for real cleanup. The shared renderer cleans up its own mounts
  automatically.

Do not test private functions, call counts inside repository modules, generated class names,
selector text, incidental copy, or implementation details that consumers cannot observe.

Computed-style assertions are appropriate only when browser-computed layout is itself the contract
and there is no more meaningful DOM, behavioural, or accessibility assertion.

Do not use computed styles to pin token values, colours, shadows, opacity, border colours, or other
appearance that visual regression already protects.

## Accessibility

Axe is an automated floor, not proof of accessibility. It covers only part of WCAG and does not
replace deliberate testing of behaviour Luke UI owns.

Run axe as an ordinary assertion in component browser tests.

`generate:component` scaffolds a representative axe check by default. Keep it when it provides
meaningful coverage; remove it when it does not.

Where practical, use the same representative fixture for axe and visual regression. Use a separate
fixture only when accessibility coverage requires materially different markup or interaction state.

Use behavioural tests for accessibility contracts axe cannot express, particularly interactions,
state transitions, focus behaviour, announcements, and Luke UI composition on top of RAC.

## Visual regression

Visual regression is a capability of component browser tests, not a separate test flavour.

Visual cases live in `*.browser.test.tsx` and are explicitly tagged `visual`. Normal browser-test
runs exclude that tag; visual CI runs it independently.

Components with meaningful owned appearance should normally have one representative fixture.
Components without a meaningful visual surface do not need screenshot coverage.

`generate:component` scaffolds a visual case by default. Delete it when the component does not own
enough appearance to justify one.

### Representative fixtures

Prefer one kitchen-sink fixture that contains the materially distinct declarative states worth
protecting.

Do not mechanically generate every point in a prop Cartesian product.

Add another visual case only when a materially different appearance cannot reasonably be represented
in the main fixture, such as an open portal or another interaction-driven state.

Do not add screenshots merely because a state exists.

Where practical, reuse the representative fixture for the component's axe check.

### Themes and colour modes

Capture each representative fixture in:

- Tactile light;
- Tactile dark;
- Paper light;
- Paper dark.

Both themes are first-class visual contracts.

Do not automatically multiply the matrix by RTL or every component state.

Test RTL where direction materially affects the component, normally with targeted browser
assertions. Add RTL visual coverage only when there is a concrete visual contract that those
assertions cannot protect adequately.

### Comparison

Visual comparison should ignore insignificant per-pixel rendering differences such as anti-aliasing,
but it must not allow a percentage of the screenshot to change silently.

Do not use a global mismatch-ratio allowance.

If meaningful pixels change, the visual baseline has changed and requires review.

If rendering noise causes flaky comparisons, remove the source of nondeterminism first. Only
introduce a small absolute changed-pixel allowance if unavoidable noise remains and there is
evidence that the allowance is necessary.

### Baselines and review

Visual baselines are not committed to the repository.

Relevant pushes to `main` generate the current baseline and upload it as a GitHub Actions artefact.

Pull requests:

1. download the latest `main` baseline;
2. render the PR's visual cases;
3. compare the captures;
4. upload expected, actual, and diff artefacts when the baseline changes.

If the required baseline is missing, fail clearly. Do not silently regenerate `main` as a fallback.

Any visual baseline change requires explicit review, including:

- changed captures;
- added captures;
- removed captures.

Visual changes pause at the protected `visual-review` GitHub Environment. The workflow passes only
after the change is explicitly approved.

Use the runner's normal screenshot failure artefacts. Do not maintain a custom HTML report unless
the standard review experience proves inadequate.

## Type contracts

Ordinary TypeScript compilation should protect ordinary source correctness.

A type assertion is worthwhile only when a public consumer contract could regress while normal
compilation still succeeds. Keep those assertions in the nearest existing `*.test.ts` file where
practical.

Examples include public unions or generic inference becoming unintentionally wider while the
repository itself continues to compile.

Do not test implementation-only TypeScript details.

Emitted declaration behaviour may be tested when it protects a consumer-visible contract that
package validation tools such as `publint` cannot verify.

If an emitted-declaration regression test survives, keep it as an ordinary unit test rather than
introducing a separate testing category.

## Docs

Docs examples exist to explain components, not to provide another test corpus.

They must type-check and the docs application must build successfully.

Do not add behavioural, accessibility, or visual testing infrastructure around docs examples merely
because they render components. Component contracts belong in component browser tests.

## Generated components

`generate:component` should produce the preferred testing shape rather than relying on authors to
remember it later.

A generated component should begin with runnable coverage for:

- basic component behaviour;
- axe accessibility;
- representative visual regression.

Delete generated coverage when it does not protect a meaningful contract.

Do not retain boilerplate merely because the generator created it.

## Bug fixes and maintenance

For a bug fix, start with a failing regression test when the intention is worth protecting.

Watch it fail for the expected reason, then make the smallest fix.

Put the regression in the existing test surface that owns the contract:

- pure logic → unit test;
- component behaviour or DOM contract → browser test;
- accessibility violation detectable by axe → axe assertion in the browser test;
- meaningful appearance regression → tagged visual case;
- public type contract → ordinary unit test where compilation alone cannot protect it.

Do not create a new testing category for one regression.

Delete duplicate tests when an existing assertion or representative fixture already protects the
same intention.

The acceptance test for this strategy is not case count or coverage percentage. Every surviving
assertion or visual capture should protect an intention Luke UI owns, and a new regression should
normally have one obvious place for its test.
