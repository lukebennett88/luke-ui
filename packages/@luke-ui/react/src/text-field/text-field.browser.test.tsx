import { createRef } from 'react';
import type { ComponentProps } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';
import { inputGroup } from '../recipes/input-group.css.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
import { TextField } from './index.js';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from './primitive/index.js';

testFieldShapedConformance({
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
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a text-field root.');
		return target;
	},
	name: 'TextField',
	registration: componentTestRegistration,
	render: (props = {}) =>
		render(
			<TextField
				{...(props as ComponentProps<typeof TextField>)}
				description="Helpful context"
				label="Name"
			/>,
		),
});

testIntegration(componentTestRegistration, 'TextField', async () => {
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

// `inputGroup().invalidIndicator()` returns one stable class list regardless of `size`
// (the slot's `marginInlineEnd` is a constant, see `input-group.css.ts`), but the lookup
// still keys on the first token only, matching the other slot lookups in this file.
const invalidIndicatorClass = inputGroup().invalidIndicator().split(' ')[0];

/**
 * The invalid indicator `InputGroup` renders itself, if it is present. Matched by the
 * recipe's own slot class rather than by tag name: a prefix or suffix can hold an
 * `<svg>` of its own.
 */
function indicatorFor(name: string): SVGSVGElement | null {
	return groupFor(name).querySelector<SVGSVGElement>(`.${invalidIndicatorClass}`);
}

test('the indicator icon adds no text to the accessible name', async () => {
	render(<TextField isInvalid label="Invalid" name="invalid" />);

	const input = page.getByRole('textbox', { name: 'Invalid' });
	// The field's label is an external `<label>` associated via `aria-labelledby`,
	// not an ancestor of the group carrying the indicator, so the indicator is never
	// in this input's accessible-name computation regardless. It is `aria-hidden`
	// either way, so there is nothing for a label ancestor to pick up — see
	// `checkbox.browser.test.tsx` for the case where the indicator does sit inside a
	// `<label>`.
	await expect.element(input).toHaveAccessibleName('Invalid');
	expect(indicatorFor('Invalid')?.getAttribute('aria-hidden')).toBe('true');
});

test('an invalid field keeps its description and error associated with the input', async () => {
	render(
		<TextField
			description="Use your work email."
			errorMessage="Enter a valid email."
			isInvalid
			label="Email"
			name="email"
		/>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	const description = page.getByText('Use your work email.');
	const error = page.getByText('Enter a valid email.');

	await expect.element(description).toBeVisible();
	await expect.element(error).toBeVisible();

	const describedBy = input.element().getAttribute('aria-describedby')?.split(' ') ?? [];
	expect(describedBy).toContain(description.element().id);
	expect(describedBy).toContain(error.element().id);
});

// The invalid icon must land before a trailing suffix, not after it. The suffix's
// flex `order` is what puts it there, so the DOM position of the appended icon
// alone does not prove it — the rendered geometry does.
test('the indicator lands after the input and before a trailing suffix', async () => {
	render(
		<InputGroup isInvalid>
			<InputGroupPrefix>$</InputGroupPrefix>
			<InputGroupInput aria-label="Amount" defaultValue="0.00" />
			<InputGroupSuffix>USD</InputGroupSuffix>
		</InputGroup>,
	);

	const input = page.getByRole('textbox', { name: 'Amount' });
	await expect.element(input).toBeVisible();

	const indicator = indicatorFor('Amount');
	if (indicator == null) throw new Error('Expected the invalid indicator.');

	const inputRect = input.element().getBoundingClientRect();
	const indicatorRect = indicator.getBoundingClientRect();
	const prefixRect = page.getByText('$').element().getBoundingClientRect();
	const suffixRect = page.getByText('USD').element().getBoundingClientRect();

	expect(prefixRect.left).toBeLessThan(inputRect.left);
	expect(indicatorRect.left).toBeGreaterThanOrEqual(inputRect.right);
	expect(indicatorRect.left).toBeLessThan(suffixRect.left);
});

// The primitive renders the control itself, so it takes a plain `ref`. Both ref
// shapes are covered: React Hook Form hands out a callback ref, so the callback
// arm is the one that decides whether the component is usable with it at all.
test('InputGroupInput resolves a ref object to the input element', async () => {
	const ref = createRef<HTMLInputElement>();
	render(
		<InputGroup>
			<InputGroupInput aria-label="Amount" ref={ref} />
		</InputGroup>,
	);

	const input = page.getByRole('textbox', { name: 'Amount' });
	await expect.element(input).toBeVisible();

	expect(ref.current).toBeInstanceOf(HTMLInputElement);
	expect(ref.current).toBe(input.element());
});

test('InputGroupInput resolves a callback ref to the input element', async () => {
	const resolved: Array<HTMLInputElement | null> = [];
	render(
		<InputGroup>
			<InputGroupInput
				aria-label="Amount"
				ref={(node) => {
					resolved.push(node);
				}}
			/>
		</InputGroup>,
	);

	const input = page.getByRole('textbox', { name: 'Amount' });
	await expect.element(input).toBeVisible();

	expect(resolved.at(-1)).toBeInstanceOf(HTMLInputElement);
	expect(resolved.at(-1)).toBe(input.element());
});

// The composed field takes no plain `ref`, so `inputRef` is the only way in — and
// it must land on the editable control, never on the wrapper `<div>` or the group.
test('TextField resolves inputRef to the input element, not a wrapper', async () => {
	const ref = createRef<HTMLInputElement>();
	render(<TextField inputRef={ref} label="Email" name="email" />);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();

	expect(ref.current).toBeInstanceOf(HTMLInputElement);
	expect(ref.current).toBe(input.element());
});

test('TextField resolves a callback inputRef to the input element', async () => {
	const resolved: Array<HTMLInputElement | null> = [];
	render(
		<TextField
			inputRef={(node) => {
				resolved.push(node);
			}}
			label="Email"
			name="email"
		/>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();

	expect(resolved.at(-1)).toBeInstanceOf(HTMLInputElement);
	expect(resolved.at(-1)).toBe(input.element());
});

// `name` and `onBlur` are the other half of uncontrolled use: without them a caller
// has to reach through `inputRef` to do what a native `<input>` does for free.
test('TextField forwards name to the input so a native form submit collects it', async () => {
	const { locator: scene } = render(
		<form>
			<TextField label="Email" name="email" />
		</form>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toHaveAttribute('name', 'email');

	await userEvent.fill(input, 'ada@example.com');

	const form = scene.element().querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	expect(new FormData(form).get('email')).toBe('ada@example.com');
});

test('TextField forwards onBlur to the input', async () => {
	const blurs: Array<string> = [];
	render(
		<>
			<TextField
				label="Email"
				name="email"
				onBlur={() => {
					blurs.push('email');
				}}
			/>
			<button type="button">Next</button>
		</>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();

	await userEvent.click(input);
	await expect.element(input).toHaveFocus();
	expect(blurs).toEqual([]);

	await userEvent.click(page.getByRole('button', { name: 'Next' }));
	expect(blurs).toEqual(['email']);
});

// `inputStates.invalid` must not match `:has(:invalid)`: that matches a required,
// empty input from first render — before any interaction or submit — while
// `aria-invalid` stays null, painting an untouched required field invalid even
// though assistive technology is told it's fine. These two tests guard that the
// group only picks up the invalid treatment once React Aria has recorded a real
// validation failure. The border stays 1px in both the untouched and the invalid
// case, since the in-control icon (not a width change) is the invalid cue, so the
// proof is the border colour and the icon's presence, not a width comparison.
test('a required field with no value is not painted invalid before validation runs', async () => {
	render(
		<>
			<TextField label="Resting" name="resting" />
			<TextField isRequired label="Email" name="email" />
		</>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();
	await expect.element(input).not.toHaveAttribute('aria-invalid');

	expect(getComputedStyle(groupFor('Email')).borderColor).toBe(
		getComputedStyle(groupFor('Resting')).borderColor,
	);
	expect(indicatorFor('Email')).toBe(null);
});

test('a required field is painted invalid once a real submit fails validation', async () => {
	// A plain `<form>`, not react-aria-components' `Form`: the latter fails to
	// resolve in this browser test environment. React Aria's own field
	// validation listens for the browser's native `invalid` event regardless of
	// an ancestor `Form`, so a native submit is enough to trigger it.
	render(
		<form>
			<TextField label="Resting" name="resting" />
			<TextField isRequired label="Email" name="email" />
			<button type="submit">Submit</button>
		</form>,
	);

	const input = page.getByRole('textbox', { name: 'Email' });
	await expect.element(input).toBeVisible();
	await expect.element(input).not.toHaveAttribute('aria-invalid');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.element(input).toHaveAttribute('aria-invalid', 'true');

	expect(getComputedStyle(groupFor('Email')).borderColor).not.toBe(
		getComputedStyle(groupFor('Resting')).borderColor,
	);
	expect(indicatorFor('Email')).not.toBe(null);
});
