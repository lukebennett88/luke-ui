# Testing

How to choose, place, and write tests in this repo.

## Choosing a test type

Use the smallest test surface that proves the behavior.

- **Unit tests** (`*.test.ts`): pure logic, generators, scripts, docs tooling, package metadata,
  and non-React utilities.
- **Storybook play tests**: React component behavior that belongs in a real story. For
  `@luke-ui/react` components, stories are the component tests; do not add separate `*.test.tsx`
  component tests unless Storybook cannot exercise the behavior cleanly.
- **Storybook visual tests**: public UI states and visual variants worth reviewing for regressions.
- **Browser Vitest tests** (`*.browser.test.{ts,tsx}`): non-component DOM logic that needs real
  browser APIs and does not fit a story — including style-contract tests for CSS recipes (see
  below).

## Placement

Tests colocate with the source file they cover (`foo.test.ts` beside `foo.ts`); no `__tests__`
directories except for suites that don't map to a single file (e.g. e2e). Never add DOM shims
(happy-dom, jsdom) — DOM-dependent tests run in a real browser (see `vitest.config.ts`), preferring
real APIs over stubs.

## Write the test first

For bugfixes, always start with a failing test that reproduces the bug, and watch it fail for the
right reason before touching the fix. The test is what proves the fix and keeps the bug from
returning.

For features, prefer writing the test first when the behavior is specifiable up front. Exploratory
UI work may need the component sketched before a story or play test makes sense — that's fine, but
the tests land in the same change as the behavior they cover.

## Test behavior, not implementation

A test should survive any refactor that preserves behavior. Exercise the code the way its consumers
do — through the public API for modules, through roles and interactions for components — and assert
the outcome a consumer can observe.

Never assert on internals: private functions, call counts of the repo's own modules, generated
class names, or the text of CSS selectors. If a test can only be written by reaching into
internals, that's a signal the module's interface is missing something, not that the test needs a
back door.

Mock only at true system boundaries (network, clock, external processes), and prefer real
implementations everywhere else — the same philosophy as running DOM tests in a real browser.
Filesystem-dependent tests use temp directories and the real `fs` rather than mocks.

## Behavior tests: queries and interactions

Behavior tests — play functions and anything else simulating a user — find elements the way
assistive technology does:

- Query by **role with accessible name** (`getByRole('combobox', { name: 'Country' })`), falling
  back to label or visible text when no role fits.
- **No test IDs, no CSS selectors.** This is a component library: if an element can't be found by
  role or accessible name, assistive-technology users can't find it either. Fix the component, not
  the test.
- Interact through **`userEvent` only** (click, keyboard, tab). Never `fireEvent`, manual event
  dispatch, or mutating attributes/state to fake an interaction the user would perform.

## Declarative over imperative

State what the behavior is; don't narrate a journey.

- **Name and assert one behavior at a time.** Each test (or `step()`, below) states a single
  behavior — "selecting an option closes the popover" — and asserts that outcome. Don't add
  checkpoint assertions after every interaction; steps exist only to reach the state being
  asserted.
- **Set up state with props, not interactions.** Start from the state under test
  (`defaultValue`, `isReadOnly`) instead of scripting clicks to arrive there. Interactions appear
  only when the interaction itself is the behavior under test.
- **Map behaviors to `step()`, not to new stories.** Keep one story per meaningful state or props
  combination; inside its play function, group each behavior in a named `step()` from
  `storybook/test`. Steps report individually without adding sidebar entries or visual-test
  snapshots of identical-looking states.

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
},
```

## Style-contract tests for CSS recipes

Recipes (`src/recipes/*.css.ts`) have no roles or user interactions — their contract is "given a
DOM structure in a given state, the element computes these styles". Tests for them are the one
place raw DOM construction and `querySelector` are appropriate: there is no user to impersonate.

- Assert **computed styles** (via `getComputedStyle`, resolving tokens to concrete values) — the
  outcome a user sees. Never assert generated class names or selector strings; those are the
  implementation.
- Build the DOM the recipe documents (e.g. a control containing an input and a trigger button),
  not incidental markup that happens to pass.
- Every state a recipe test covers must also exist as a story on at least one consuming component,
  so the recipe is exercised against real component markup in visual tests. If the story is
  missing, add it in the same change.
