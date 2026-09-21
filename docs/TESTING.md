# Testing

This is the normative testing guide for the repository. Every surviving assertion should protect an
intention Luke UI owns, and a new regression should have one obvious place for its test.

## Test types

There are two.

- **Unit tests** (`*.test.ts`) run in Node. They cover pure, non-DOM logic: the theme compiler,
  generators, scripts, and docs tooling.
- **Component tests** (`*.browser.test.tsx`) run in real Chromium. One file per component holds
  everything that component needs: behaviour, accessibility, and visual captures.

Do not add a third. A regression belongs in the file that already owns the contract.

## Component tests

Import components through their public package exports:

```tsx
import { Button } from '@luke-ui/react/button';
```

Tests then exercise what a consumer installs: the export map, emitted JavaScript and CSS, generated
assets, and build-time transforms. `test:ci` builds the package first. Test utilities are imported
relatively (`../test-utils/render.js`) and are deliberately not public exports.

Use the shared renderer:

```tsx
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

test('calls the consumer handler when the button is pressed', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Save</Button>);

	await user.click(locator.getByRole('button', { name: 'Save' }));

	expect(pressed).toBe(true);
});
```

`render()` mounts into the themed browser environment, returns `{ locator, user }`, and cleans up
its own mounts. Do not call `createRoot`, `hydrateRoot`, or hand-roll a React mount.

### Test our delta over RAC

React Aria Components already owns focus management, keyboard navigation, selection semantics, ARIA
wiring, validation semantics, and disabled or read-only interaction blocking. Do not retest it.

Test it only where Luke UI changes, composes, or depends on that behaviour closely enough to create
a contract of its own. The field components are the standing example: `className` and `data-*` land
on the root while `id` reaches an inner control, no `ref` is forwarded, and `inputRef` is widened
over React Aria to accept a callback so React Hook Form's `field.ref` works without an adapter.

### Assertions

An assertion should fail if, and only if, an intention Luke UI owns is not met.

- Assert observable outcomes through public APIs, roles, accessible names, and user interactions.
- Prefer role and accessible-name queries. Use label or visible text when no role fits. Do not
  invent semantics purely to make a test queryable.
- Use `getBy*` for synchronous presence and `findBy*` for asynchronous presence. Use `queryBy*` only
  to assert absence.
- Prefer `userEvent`. Do not use `fireEvent`, manual event dispatch, or state mutation to fake a
  user interaction.
- Keep workflow tests fewer and longer when several assertions belong to one user journey.
- Keep setup local and explicit. Avoid shared mutable state and `beforeEach`.

Do not test private functions, call counts inside repository modules, generated class names,
selector text, or other implementation details consumers cannot observe.

Computed-style assertions are appropriate only when browser-computed layout is itself the contract.
Do not use them to pin token values, colours, shadows, or other appearance that visual regression
already protects.

### Extract the assertion, never the dispatch

Shared helpers such as `expectForwardsDomProps` and `expectHtmlElement`
(`src/core/test-utils/forwarding.ts`) are plain assertions. The `test(...)` call, the fixture, and
the choice of target element stay in the component's own file.

A helper takes concrete elements, refs, and values. It must never take a component name or metadata,
and must never decide which contracts a component satisfies. A component whose contract differs
should assert inline rather than bend a shared helper to fit.

## Accessibility

Axe is an automated floor, not proof of accessibility. Run it as an ordinary assertion inside a
component test, via `expectNoAxeViolations` (`src/core/test-utils/axe.ts`). There is no separate
accessibility flavour and no central suite.

`color-contrast` is enabled. Where a surface paints a gradient, axe reports `incomplete` rather than
a violation, which is a limit of the rule.

An axe check is strongly recommended for a new component but is not mandatory. Delete it where it
protects nothing. Where practical, share one representative fixture between the axe check and the
visual capture.

Use behavioural assertions for the accessibility contracts axe cannot express: interactions, state
transitions, focus behaviour, announcements, and Luke UI's composition on top of RAC.

## Visual regression

Visual regression is a capability of component tests, not a separate flavour. Cases live in
`*.browser.test.tsx` and are tagged:

```tsx
test('kitchen sink', { tags: ['visual'] }, async () => {
	/* ... */
});
```

The `visual` tag is declared on the browser project in `vitest.config.ts`, which Vitest requires
because `strictTags` defaults to true. `test:browser` runs `--tagsFilter='!visual'`, so behavioural
runs stay fast. The visual path runs `--tagsFilter='visual'`.

[`VISUAL_TESTING.md`](./VISUAL_TESTING.md) covers how to run the gate and where artefacts land.

### What to capture

Give each visually meaningful component one representative kitchen-sink fixture, captured across the
four appearances: Tactile light, Tactile dark, Paper light, and Paper dark. Both themes are
first-class contracts.

This is not an exhaustive state matrix, and it is not multiplied by RTL. Test RTL with browser
assertions where direction materially affects the component.

Add a second capture only for a materially different visual state that cannot fit the representative
fixture, such as an open portal. Do not add a screenshot merely because a state exists. A component
with no meaningful visual surface needs none.

### Sensitivity

Comparison is per-pixel, with `includeAA: true` and `threshold: 0.1` as the only tolerance. There is
no canvas-wide mismatch-ratio allowance: no percentage of a screenshot may change silently. Any
meaningful changed pixel is a baseline change.

If rendering noise causes flakiness, remove the nondeterminism. Do not add an allowance to hide it.

### Baselines and review

No screenshots are committed. A push to `main` on relevant paths renders the baseline and uploads it
as a GitHub Actions artefact. A pull request downloads the latest `main` baseline, renders only its
own branch, and compares. Nothing re-renders `main` during a pull request, and there is no fallback:
a missing baseline fails with an actionable error.

A changed, added, or removed capture all count as baseline changes, and all require approval at the
`visual-review` GitHub Environment. That pause only takes effect once a repository administrator
configures a required reviewer on that environment. Without the protection rule GitHub runs the job
immediately and nothing is enforced.

Review artefacts are plain expected, actual, and diff PNGs.

## Type contracts

There is no type-test flavour. `tsc --noEmit` (`check:types`) covers source types, and `publint`
runs on every build through `publint: true` in `vite.config.ts`.

Write a test about types only when a public consumer contract could regress while compilation still
succeeds — a public union or inferred type quietly widening.
`src/core/styles/utilities-emitted.test.ts` is the standing example: an ordinary unit test that
reads the emitted `dist/*.d.ts` text and fails if the utility prop types widen. Keep such a test as
a normal unit test.

## Docs

Docs examples explain components. They must type-check and the docs app must build, but they are not
a test surface. Do not build behavioural, accessibility, or visual testing around them.

## Bug fixes

Start with a failing test when the intention is worth protecting. Watch it fail for the expected
reason, then make the smallest fix.

Put the regression where the contract already lives:

- pure logic → unit test
- component behaviour, DOM contract, or an axe-detectable violation → the component's browser test
- meaningful appearance → a `visual`-tagged case in that same file
- a public type contract compilation cannot catch → unit test

Delete a duplicate when an existing assertion or fixture already protects the same intention.
