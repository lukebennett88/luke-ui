# Testing

This guide explains how to choose, place, and write tests in this repo.

## Choosing test type

Use the smallest test surface that proves the behaviour.

- **Unit tests** (`*.test.ts`): pure logic, generators, scripts, docs tooling, package metadata, and
  non-React utilities.
- **Storybook play tests**: React component behaviour that belongs in a real story. For
  `@luke-ui/react` components, stories are component tests. Do not add separate `*.test.tsx`
  component tests unless Storybook cannot exercise the behaviour cleanly.
- **Visual regression tests** (`*.visual.test.tsx`): pixel snapshots of public UI states and
  variants worth reviewing for regressions. See [Visual regression tests](#visual-regression-tests).
- **Browser Vitest tests** (`*.browser.test.{ts,tsx}`): non-component DOM logic that needs real
  browser APIs and does not fit a story, including CSS recipe style-contract tests.

## Placement

Colocate tests with the source file they cover, for example `foo.test.ts` beside `foo.ts`.

Do not add `__tests__` directories unless the suite does not map to one source file.

Do not add DOM shims such as happy-dom or jsdom. DOM-dependent tests run in a real browser through
`vitest.config.ts`, using real browser APIs instead of stubs.

## Writing stories

Stories are both consumer examples and component tests. Each story should earn its place by showing
a materially distinct state or behaviour, not one point in a Cartesian product of props. Do not add
multiple stories that render the same state with small variations.

- Make `Default` a useful prop sandbox. Put representative values in `args` so controls can change
  the component without editing the story.
- Prefer `args` to `render`. Add `render` only when the example needs composition, local state,
  hooks, or a matrix of related variants.
- Show related visual variants together in a small matrix, such as every size or tone. A matrix is
  easier to compare and avoids duplicate sidebar entries.
- Keep controls usable. Forward story args through custom renders and use `argTypes` only to improve
  or constrain controls. Do not hide ordinary consumer props to make a story implementation easier.
- Add JSDoc that explains why a consumer would use the state or API. Do not merely restate the story
  name or describe what is visibly rendered. Replace the generator's JSDoc TODO with this
  consumer-value guidance before the story is complete.

A `play` function should prove behaviour, a CSS contract, or an accessibility contract that could
regress. Interactions, focus management, computed styles, and semantic state are useful assertions.
Semantic role and accessible-name assertions are useful when they protect an accessibility contract.
Presence-only smoke assertions for ordinary initial content add little value.

## Write the test first

For bug fixes, start with a failing test that reproduces the bug. Watch it fail for the right reason
before changing the implementation. That test proves the fix and keeps the bug from returning.

For features, prefer a test first when the behaviour can be specified up front. Exploratory UI work
may need a sketched component before a story play test makes sense. That is fine, but the test
should land in the same change as the behaviour it covers.

## Test behaviour, not implementation

Tests should survive refactors that preserve behaviour. Exercise code the way consumers do: through
public API modules, roles, and user interactions. Assert outcomes the consumer can observe.

Do not assert internals such as private functions, call counts inside repo modules, generated class
names, or CSS selector text. If a test only works by reaching into internals, the module interface
is probably missing something.

Mock only true system boundaries such as network, clock, or external processes. Prefer real
implementations everywhere else. Filesystem-dependent tests should use temp directories and real
`fs`, not mocks.

## Behaviour tests

Behaviour tests include Storybook play functions and any test that simulates a user.

- Query by role and accessible name, for example `getByRole('combobox', { name: 'Country' })`. Fall
  back to label or visible text only when no role fits.
- Do not use test IDs or CSS selectors. In a component library, if an element cannot be found by
  role or accessible name, assistive-technology users probably cannot find it either. Fix the
  component, not the test.
- Interact through `userEvent` only. Do not use `fireEvent`, manual event dispatch, or attribute and
  state mutation to fake interactions.

## Declarative over imperative

State the behaviour under test. Do not narrate every step in the journey.

- Name and assert one behaviour at a time. Each test or `step()` should name a single behaviour,
  such as "selecting an option closes the popover". Use setup interactions only to reach the state
  being asserted.
- Set up state with props rather than interactions when possible, for example `defaultValue` or
  `isReadOnly`. Use interactions only when the interaction itself is the behaviour under test.
- Map behaviours to `step()`, not to extra stories. Keep one story per meaningful state-prop
  combination. Inside the play function, group behaviours with named `step()` calls from
  `storybook/test`. Steps report individually without adding duplicate sidebar entries or visual
  snapshots.

```ts
play: async ({ canvasElement, step }) => {
	const canvas = within(canvasElement);
	const combobox = canvas.getByRole('combobox', { name: 'Country' });

	await step('selecting an option closes the popover and fills the input', async () => {
		await userEvent.click(combobox);
		await userEvent.click(within(document.body).getByRole('option', { name: 'Australia' }));

		await expect(combobox).toHaveValue('Australia');
		await expect(combobox).toHaveAttribute('aria-expanded', 'false');
	});
};
```

## Visual regression tests

Visual tests capture a rendered component in the current checkout and compare it with the local
`origin/main` ref captured on the same device. They catch unintended visual changes (spacing,
colour, focus rings, open menus) that behaviour assertions miss. They run via `pnpm run test:visual`
and as part of the aggregate `pnpm test` development flow.

Place them in `*.visual.test.tsx` beside the component. Render with the shared `renderVisual`
helper, which wraps the subtree in the theme root and icon spritesheet provider and returns a
locator:

```tsx
import { test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { captureVisual, renderVisual } from '../test-utils/render-visual.js';
import { Button } from './index.js';

test('keyboard focus ring', async () => {
	const locator = renderVisual(<Button tone="primary">Focus me</Button>);
	// Tab so the browser applies `:focus-visible`; a programmatic `.focus()` would not.
	await userEvent.tab();
	await captureVisual(locator, 'button/focus-visible');
});
```

- **Capture states, not just static variants.** Drive focus, open menus, and pressed states with
  `userEvent`, then screenshot. This is the main reason to reach for a visual test over a story.
- **Overlays render in a portal** appended to `document.body`, outside the rendered container. To
  capture an open menu, screenshot the overlay locator (for example `page.getByRole('listbox')`)
  rather than the container.
- **Frame tightly.** Render a small kitchen-sink grid of the states under test, not a whole page, so
  a diff points at the component that changed.
- **Use explicit, globally unique IDs.** Namespace every capture by component, for example
  `button/focus-visible`. Duplicate IDs fail before capture. Moving a test file does not change its
  identity.
- **Added and removed captures are informational.** Matching IDs with pixel differences require CI
  review; inventory changes are still visible in the report but do not block.
- **Keep responsive coverage explicit.** The default viewport is 1024 by 800. Change the viewport in
  a test only when the component has a responsive state worth capturing, then restore it.

The full workflow and report are documented in [`VISUAL_TESTING.md`](./VISUAL_TESTING.md).

## Style-contract tests for CSS recipes

Panda recipes in `src/recipes/*.recipe.ts` have no roles or user interactions. Their contract is:
given this DOM structure
in this state, the element computes these styles.

For recipe tests, raw DOM construction and `querySelector` are appropriate because there is no user
to impersonate.

- Assert computed styles with `getComputedStyle`, resolving tokens to concrete values. Assert the
  outcome the user sees.
- Do not assert generated class names or selector strings.
- Build DOM recipe documents, such as a control containing an input and trigger button. Do not rely
  on incidental markup that happens to pass.
- Every recipe state covered by a test must also exist in a story on at least one consuming
  component. If the story is missing, add it in the same change.
