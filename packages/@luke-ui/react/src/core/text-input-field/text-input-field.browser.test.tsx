import { Icon } from '@luke-ui/react/icon';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';

function TextInputFieldScene() {
	return (
		<Stack>
			<TextInputField
				description="Small control size."
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			/>
			<TextInputField
				description="Medium control size."
				isRequired
				label="Medium"
				name="medium"
				placeholder="Medium"
				size="medium"
			/>
			<TextInputField label="Amount" name="amount" placeholder="0.00" prefix="$" />
			<TextInputField label="Total" name="total" placeholder="0.00" suffix="USD" />
			<TextInputField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
			<TextInputField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
			<TextInputField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				label="Invalid"
				name="invalid"
			/>
			<TextInputField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				label="Invalid small"
				name="invalid-small"
				size="small"
			/>
			<TextInputField
				defaultValue="0.00"
				errorMessage="Enter a valid amount."
				label="Invalid with a prefix and suffix"
				name="invalid-adorned"
				placeholder="0.00"
				prefix="$"
				suffix="USD"
			/>
			<Stack width="14rem">
				<TextInputField
					label="Search"
					name="prefix-multiple-elements"
					placeholder="Search…"
					prefix={
						<>
							<Icon name="search" />
							<Icon name="check" />
						</>
					}
				/>
				<TextInputField
					label="Amount with icons"
					name="suffix-multiple-elements"
					placeholder="0.00"
					suffix={
						<>
							<Icon name="check" />
							<Icon name="close" />
						</>
					}
				/>
			</Stack>
		</Stack>
	);
}

/**
 * The control around the input, if there is one. `TextInputControl` is the input's parent and
 * carries `role="presentation"` inside a field, because the field's own `<label>` names the input.
 */
function controlFor(name: string): HTMLElement | null {
	const parent = page.getByRole('textbox', { name }).element().parentElement;
	return parent?.getAttribute('role') === 'presentation' ? parent : null;
}

// Luke UI widens RAC's `inputRef` to accept React Hook Form's callback ref.
test('TextInputField resolves object and callback inputRef to the input, participates in a form, and fires onBlur', () => {
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	let blurred = false;
	const { container, locator } = render(
		<>
			<TextInputField
				description="Helpful context"
				inputRef={inputRef}
				label="Name"
				name="full-name"
				onBlur={() => {
					blurred = true;
				}}
			/>
			<TextInputField
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				label="Callback"
				name="callback-name"
			/>
		</>,
	);
	const control = locator.getByRole('textbox', { name: 'Name' }).element();
	const callbackControl = locator.getByRole('textbox', { name: 'Callback' }).element();

	expect(inputRef.current).toBe(control);
	expect(callbackResolved.at(-1)).toBe(callbackControl);
	expect(control).toHaveAttribute('aria-describedby');

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	const namedControl = form.elements.namedItem('full-name');
	if (!(namedControl instanceof HTMLInputElement)) {
		throw new Error('Expected a native input named full-name.');
	}
	namedControl.value = 'Luke';
	expect(new FormData(form).get('full-name')).toBe('Luke');

	if (!(control instanceof HTMLElement)) throw new Error('Expected an HTML control.');
	control.focus();
	control.blur();
	expect(blurred).toBe(true);

	form.remove();
});

test('TextInputField puts id on its root element and inputId on the input', () => {
	render(
		<TextInputField
			className="example-root"
			description="Example description"
			id="example-root"
			inputId="example-input"
			label="Example field"
			name="example"
		/>,
	);
	const input = page.getByRole('textbox', { name: 'Example field' }).element();
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(getDescribedText(input)).toBe('Example description');
});

test('TextInputField resolves an object or callback ref to the root element and inputRef to the input', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLDivElement | null> = [];
	const { locator } = render(
		<>
			<TextInputField id="ref-root" inputRef={inputRef} label="Object" ref={ref} />
			<TextInputField
				id="callback-root"
				label="Callback"
				ref={(node) => {
					callbackResolved.push(node);
				}}
			/>
		</>,
	);
	const control = locator.getByRole('textbox', { name: 'Object' }).element();

	expect(ref.current).toBe(document.getElementById('ref-root'));
	expect(ref.current).toBeInstanceOf(HTMLDivElement);
	expect(ref.current?.contains(control)).toBe(true);
	expect(inputRef.current).toBe(control);
	expect(callbackResolved.at(-1)).toBe(document.getElementById('callback-root'));
});

test('TextInputField renders a control with or without a prefix or suffix', () => {
	render(
		<>
			<TextInputField label="Plain" name="plain" />
			<TextInputField label="Prefixed" name="prefixed" prefix="$" />
		</>,
	);

	expect(controlFor('Plain')).not.toBe(null);
	expect(controlFor('Prefixed')).not.toBe(null);
});

test('the TextInputField scene has no axe violations', async () => {
	const { container } = render(<TextInputFieldScene />);

	await expectNoAxeViolations(container);
});

// An untouched required field is valid until a submit fails validation, and `errorMessage={false}`
// must not suppress the native validation message.
test('a required field turns invalid only after a submit fails validation', async () => {
	// A plain `<form>`, not react-aria-components' `Form`: the latter fails to
	// resolve in this browser test environment. React Aria's own field
	// validation listens for the browser's native `invalid` event regardless of
	// an ancestor `Form`, so a native submit is enough to trigger it.
	render(
		<form>
			<TextInputField isRequired label="Email" name="email" />
			<TextInputField errorMessage={false} isRequired label="Username" name="username" />
			<button type="submit">Submit</button>
		</form>,
	);
	const email = page.getByRole('textbox', { name: 'Email*' }).element();
	const username = page.getByRole('textbox', { name: 'Username*' }).element();

	expect(email).not.toHaveAttribute('aria-invalid');
	expect(username).not.toHaveAttribute('aria-invalid');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => email.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => username.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => getDescribedText(username).length).toBeGreaterThan(0);
});

test('an errorMessage marks the field invalid, describes it, and renders its markup', () => {
	render(
		<TextInputField
			errorMessage={
				<>
					See the <strong>terms</strong> for details.
				</>
			}
			label="Email"
			name="email"
		/>,
	);

	const input = page.getByRole('textbox', { name: 'Email' }).element();

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(input).toHaveAccessibleDescription('See the terms for details.');
	expect(page.getByText('terms').element().tagName).toBe('STRONG');
});

test('an unlabeled TextInputField exposes aria-label on the textbox', () => {
	const { locator } = render(<TextInputField aria-label="Search documentation" name="search" />);

	expect(locator.getByRole('textbox', { name: 'Search documentation' }).element()).toBeTruthy();
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<TextInputFieldScene />, { appearance });
		await captureVisualAppearance(locator, 'text-input-field/kitchen-sink', appearance);
	}
});

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<TextInputField label="Focus me" name="focus" placeholder="Type here" />,
	);
	await focusViaKeyboard(page.getByRole('textbox', { name: 'Focus me' }));
	await captureVisual(locator, 'text-input-field/focus-visible');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<TextInputField label="Default" name="default" placeholder="Type here" />
				<TextInputField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
				<TextInputField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					label="Invalid"
					name="invalid"
				/>
			</Stack>,
		);
		await captureVisual(locator, 'text-input-field/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});
