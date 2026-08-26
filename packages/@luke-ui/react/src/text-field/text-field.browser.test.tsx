import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { InputGroup, InputGroupInput } from '../primitives/input-group/index.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render } from '../test-utils/render.js';
import { TextField } from './index.js';

testConformance({
	path: 'text-field',
	assertAssociation: (result) => {
		const input = result.locator.getByRole('textbox', { name: 'Name' }).element();
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(input).toHaveAttribute('aria-describedby');
	},
	getControl: (result) => {
		const control = result.locator.getByRole('textbox', { name: 'Name' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a text input.');
		return control;
	},
	render: (props = {}) => {
		return render(<TextField {...props} description="Helpful context" label="Name" />);
	},
});

testIntegration('text-field', async () => {
	let value = '';
	const { locator, user } = render(<TextField label="Name" onChange={(next) => (value = next)} />);
	const input = locator.getByRole('textbox', { name: 'Name' });

	await user.type(input, 'Luke');
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(value).toBe('Luke');
});

/**
 * The input is always a direct child of the styled group (prefix and suffix are
 * siblings, not wrappers), so `parentElement` is the group regardless of what else
 * the composition contains. The group carries `role="presentation"` under a
 * `TextField` (`RacTextField` supplies that through `GroupContext` when the field has
 * its own external `<label>`), so it cannot be found via `[role="group"]`.
 */
function groupFor(name: string): HTMLElement {
	const group = page.getByRole('textbox', { name }).element().parentElement;
	if (group == null) throw new Error(`Expected a text input group for "${name}".`);
	return group;
}

/**
 * The invalid indicator `InputGroup` renders itself, if it is present. Matched by the
 * public `exclamationTriangle` icon, not a generated recipe class. A prefix or suffix
 * can hold an `<svg>` of its own.
 */
function indicatorFor(name: string): SVGSVGElement | null {
	const glyph = groupFor(name).querySelector('use[href$="#exclamationTriangle"]');
	return glyph?.closest('svg') ?? null;
}

// The primitive renders the control itself, so it takes a plain `ref`. Both ref
// shapes are covered: React Hook Form hands out a callback ref, so the callback
// arm is the one that decides whether the component is usable with it at all.
test('InputGroupInput resolves object and callback refs to the input element', () => {
	const objectRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLInputElement | null> = [];
	render(
		<>
			<InputGroup>
				<InputGroupInput aria-label="Amount object" ref={objectRef} />
			</InputGroup>
			<InputGroup>
				<InputGroupInput
					aria-label="Amount callback"
					ref={(node) => {
						callbackResolved.push(node);
					}}
				/>
			</InputGroup>
		</>,
	);

	const objectInput = page.getByRole('textbox', { name: 'Amount object' });
	const callbackInput = page.getByRole('textbox', { name: 'Amount callback' });

	expect(objectRef.current).toBe(objectInput.element());
	expect(callbackResolved.at(-1)).toBe(callbackInput.element());
});

// The shared invalid selector must not match `:has(:invalid)`: that matches a required,
// empty input from first render — before any interaction or submit — while
// `aria-invalid` stays null, painting an untouched required field invalid even
// though assistive technology is told it's fine. Guard that the group only picks
// up the invalid treatment once React Aria has recorded a real validation
// failure. The in-control icon is the invalid cue Luke UI owns.
test('a required field is painted invalid only after a real submit fails validation', async () => {
	// A plain `<form>`, not react-aria-components' `Form`: the latter fails to
	// resolve in this browser test environment. React Aria's own field
	// validation listens for the browser's native `invalid` event regardless of
	// an ancestor `Form`, so a native submit is enough to trigger it.
	render(
		<form>
			<TextField isRequired label="Email" name="email" />
			<button type="submit">Submit</button>
		</form>,
	);

	expect(indicatorFor('Email')).toBe(null);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => indicatorFor('Email')).not.toBe(null);
});

test('an errorMessage alone marks the field invalid', () => {
	render(<TextField errorMessage="Enter a valid email." label="Email" name="email" />);

	const input = page.getByRole('textbox', { name: 'Email' });
	expect(indicatorFor('Email')).not.toBe(null);
	expect(getDescribedText(input.element())).toBe('Enter a valid email.');
});

test('a rich errorMessage marks the field invalid and renders its markup', () => {
	render(
		<TextField
			errorMessage={
				<>
					See the <strong>terms</strong> for details.
				</>
			}
			label="Email"
			name="email"
		/>,
	);

	expect(indicatorFor('Email')).not.toBe(null);
	expect(page.getByText('terms').element().tagName).toBe('STRONG');
});

test("a falsy errorMessage does not suppress React Aria's own validation message", async () => {
	render(
		<form>
			<TextField errorMessage={false} isRequired label="Email" name="email" />
			<button type="submit">Submit</button>
		</form>,
	);

	expect(indicatorFor('Email')).toBe(null);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => indicatorFor('Email')).not.toBe(null);
	await expect
		.poll(() => getDescribedText(page.getByRole('textbox', { name: 'Email' }).element()).length)
		.toBeGreaterThan(0);
});
