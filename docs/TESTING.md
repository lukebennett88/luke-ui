# Testing

This is the normative testing guide for the repository. The goal is fewer tests with more confidence
and one obvious place for each new regression.

## Test types

Use the smallest surface that can falsify the intention.

- **Unit tests** (`*.test.ts`) cover pure logic, generators, scripts, docs tooling, package
  metadata, and other non-React utilities. The component-testing rules below do not apply to them.
- **Component tests** (`*.browser.test.tsx`) run in real Chromium beside the component. They test
  the behaviour and plumbing Luke UI owns on top of React Aria Components (RAC).
- **Visual tests** (`*.visual.test.tsx`) capture public appearance and layout. They use the same
  renderer as component tests and add capture helpers.
- **Stories** (`*.stories.tsx`) are curated documentation, render-smoke fixtures, and the surface
  used by the automated accessibility scan. They contain no assertions.

Do not add a new test flavour for a component. Recipe tests are infrastructure tests, not a
component-testing category. If a recipe implementation needs a browser to test its own machinery,
keep that test under `src/styles/` and exclude it from these component rules.

## Component tests

Component tests use the shared renderer:

```tsx
import { expect, test } from 'vite-plus/test';
import { Button } from './index.js';
import { render } from '../test-utils/render.js';

test('calls the consumer handler when the button is pressed', async () => {
	let pressed = false;
	const { locator, user } = render(<Button onPress={() => (pressed = true)}>Save</Button>);

	await user.click(locator.getByRole('button', { name: 'Save' }));
	expect(pressed).toBe(true);
});
```

`render()` mounts the component in the real themed browser environment and returns
`{ locator, user }`. Do not call `createRoot`, `hydrateRoot`, or hand-roll a React mount in a
component or visual test. Ancillary DOM nodes are fine when a browser/layout fixture needs them.

### Test our delta over RAC

Do not test RAC's contract. RAC already owns focus management, keyboard navigation, selection
semantics, ARIA wiring, validation semantics, and disabled/read-only interaction blocking. Test the
composition, prop plumbing, styling hooks, and behaviour that Luke UI adds or deliberately changes.

Each component opts into the contracts it satisfies in the component test manifest. The two
contracts are independent, and a component can hold both:

- **DOM**: documented element, `ref`, `className`, `id`, and `data-*` forwarding.
- **Field**: object and callback `inputRef`, native `name`/form participation, `onBlur`, and label,
  description, and error association.

An empty list is an explicit exception for a component that does not satisfy either contract.

The shared conformance helper tests these contracts once. A component's test file declares its
locators and does not name which contracts run. Do not repeat the contracts in individual tests.

Interactive RAC-backed components also register exactly one `testIntegration()` journey. It is an
upgrade tripwire: perform one representative real-user workflow and assert only the result Luke UI
owns. For example, a combobox may type and select an option, then assert that the selected value is
exposed. Do not accumulate RAC assertions about focus, ARIA attributes, popup keyboard semantics, or
intermediate state in this test.

### Assertions

An authored assertion should fail if, and only if, an intention we own is not met.

- Assert observable outcomes through public APIs, roles, accessible names, and user interactions.
- Prefer role and accessible-name queries. Use label or visible text when no role fits. Do not
  invent semantics purely to make a test queryable.
- Use `getBy*` for synchronous presence and `findBy*` for asynchronous presence. Use `queryBy*` only
  to assert absence.
- Prefer `userEvent`. Do not use `fireEvent`, manual event dispatch, or state mutation to fake a
  user interaction.
- Keep workflow tests fewer and longer: one meaningful journey with related assertions. Generated
  matrices are different: finite, valid combinations should remain separate cases or rows when
  exhaustive contract coverage is useful. Exclude forbidden or meaningless combinations.
- Keep setup local and explicit. Avoid shared mutable state and `beforeEach` setup. Use cleanup
  hooks only for real cleanup; the shared renderer cleans up its own mounts automatically.

Do not test TypeScript guarantees, private functions, call counts inside repository modules,
generated class names, selector text, incidental copy, or low-value bugs unlikely to recur.

## Stories

Every story is a render-smoke test and an accessibility fixture. Keep stories curated: show
materially distinct consumer states, not every point in a prop Cartesian product.

`play` has one job: drive a story into a state that cannot be expressed declaratively. It must not
contain `expect`, behavioural verification, accessibility assertions, or computed-style assertions.
Most stories should have no `play` function. A story play may interact with the component to open a
menu, focus a control, or reveal a loading state for documentation or an accessibility scan.

## Visual tests

Visual tests use `render()` from `src/test-utils/render.tsx` and capture helpers from
`src/test-utils/visual.tsx`. The visual test is not a story and does not reuse a story as its
fixture.

Each component with a meaningful visual surface gets one kitchen-sink fixture:

- derive declared variant coverage with `variantValuesFor` or `PropOptions`;
- explicitly add semantic/rendering states not represented by variants, such as disabled, invalid,
  pending, loading, prefixes, suffixes, and long content;
- generate the finite valid matrix, but do not generate meaningless or forbidden combinations;
- expand the kitchen-sink capture across the four shared Tactile/Paper and light/dark appearances;
- add state-specific captures only for material states that cannot be represented declaratively;
  those use one canonical appearance by default;
- add a dark-mode state capture only for a concrete mode-specific implementation or regression.

Do not capture a state already covered by the kitchen sink. Visual tests own appearance. Do not
assert resolved token values, colours, shadows, opacity, border colours, or focus-ring colours in a
component test. Never import the theme contract merely to assert an appearance; the lint rule is a
deliberately simple proxy and rare structural uses may suppress it with a reason.

Computed-style assertions are allowed only when browser-computed layout is itself the contract and
there is no meaningful DOM or ARIA assertion, such as the documented `ReactNode` flex-wrapping case.
Never use them to pin token values or appearance.

See [`VISUAL_TESTING.md`](./VISUAL_TESTING.md) for capture, comparison, and review workflow.

## Accessibility

Storybook's automated axe check is a floor, not proof of accessibility. It covers only part of WCAG
and does not replace deliberate testing of the behaviour Luke UI owns. Keep the automated check
enabled as an error gate, then use component tests for the small number of composition and behaviour
contracts that axe cannot express.

## Bug fixes and maintenance

For a bug fix, start with a failing test that reproduces the bug when the intention is worth
protecting. Watch it fail for the right reason, then make the smallest fix. Delete duplicate tests
when the shared conformance suite, one integration journey, or visual fixture already protects the
same intention.

The acceptance test for this strategy is not a case count. Every surviving assertion should protect
an intention we own, and a new regression should normally have one obvious place for its test.
