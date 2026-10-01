import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Field, FieldDescription, FieldError, FieldLabel } from '@luke-ui/react/primitives/field';
import {
	TextInput,
	TextInputControl,
	TextInputPrefix,
	TextInputRoot,
	TextInputSuffix,
} from '@luke-ui/react/primitives/text-input';
import { useState } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../../test-utils/visual.js';

function TextInputScene() {
	return (
		<Stack>
			<TextInput aria-label="Standalone" defaultValue="Standalone" />
			<TextInput aria-invalid aria-label="Standalone invalid" defaultValue="Invalid" />
			<TextInput aria-label="Standalone small" defaultValue="Small" size="small" />
			<TextInput aria-label="Standalone disabled" defaultValue="Unavailable" disabled />
			<TextInput aria-label="Standalone read-only" defaultValue="Read only" readOnly />
			<TextInputRoot defaultValue="nope" isInvalid name="rooted">
				<FieldLabel>Rooted</FieldLabel>
				<TextInput />
				<FieldError>Enter a valid value.</FieldError>
			</TextInputRoot>
			<TextInputControl>
				<TextInputPrefix>$</TextInputPrefix>
				<TextInput aria-label="Amount" defaultValue="1250.00" inputMode="decimal" />
				<TextInputSuffix>USD</TextInputSuffix>
			</TextInputControl>
			<TextInputControl>
				<TextInput aria-label="Workspace" defaultValue="acme" />
				<TextInputSuffix>.luke-ui.dev</TextInputSuffix>
			</TextInputControl>
			<TextInputControl>
				<TextInputPrefix>
					<Icon name="search" />
				</TextInputPrefix>
				<TextInput aria-label="Search control" defaultValue="invoices" />
				<TextInputSuffix>
					<Button size="small">Clear</Button>
				</TextInputSuffix>
			</TextInputControl>
			<TextInputControl size="small">
				<TextInputPrefix>$</TextInputPrefix>
				<TextInput aria-invalid aria-label="Refund" defaultValue="-1" inputMode="decimal" />
				<TextInputSuffix>USD</TextInputSuffix>
			</TextInputControl>
		</Stack>
	);
}

function input(name: string): HTMLInputElement {
	const element = page.getByRole('textbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected an input named "${name}".`);
	return element;
}

/** The `TextInputControl` around an input. Its parts are direct children of the control. */
function controlFor(name: string): HTMLElement {
	const control = input(name).parentElement;
	if (control == null) throw new Error(`Expected a control for "${name}".`);
	return control;
}

/**
 * Whether the control draws its CSS invalid icon. The icon is a `::after` mask with no DOM node, so
 * its computed `content` is the only observable signal that it renders.
 */
function hasControlIcon(name: string): boolean {
	return getComputedStyle(controlFor(name), '::after').content !== 'none';
}

/** Whether an error message linked to the input draws its leading icon. */
function hasMessageIcon(name: string): boolean {
	const describedBy = input(name).getAttribute('aria-describedby') ?? '';
	return describedBy
		.split(' ')
		.flatMap((id) => document.getElementById(id) ?? [])
		.some((message) => getComputedStyle(message, '::before').display !== 'none');
}

test('a standalone TextInput takes its name from aria-label and participates in a form', () => {
	const { container } = render(<TextInput aria-label="Example input" name="example" />);
	const element = input('Example input');

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	element.value = 'Example value';
	expect(new FormData(form).get('example')).toBe('Example value');

	form.remove();
});

test('a standalone TextInput owns its native state', () => {
	render(
		<>
			<TextInput aria-label="Disabled" disabled />
			<TextInput aria-label="Read-only" readOnly />
			<TextInput aria-label="Required" required />
		</>,
	);

	expect(input('Disabled')).toBeDisabled();
	expect(input('Disabled')).toHaveAttribute('data-disabled', 'true');
	expect(input('Read-only')).toHaveAttribute('readonly');
	expect(input('Required')).toBeRequired();
});

// The cue is a layout contract: an invalid input must not change size.
test('a standalone invalid TextInput draws a structural cue without changing size', () => {
	render(
		<>
			<TextInput aria-label="Valid" defaultValue="Example" />
			<TextInput aria-invalid aria-label="Invalid" defaultValue="Example" />
		</>,
	);
	const valid = input('Valid');
	const invalid = input('Invalid');
	const validBox = valid.getBoundingClientRect();
	const invalidBox = invalid.getBoundingClientRect();

	expect(invalid).toHaveAttribute('data-invalid', 'true');
	expect(getComputedStyle(invalid).boxShadow).not.toBe(getComputedStyle(valid).boxShadow);
	expect(invalidBox.width).toBe(validBox.width);
	expect(invalidBox.height).toBe(validBox.height);
});

// Forced colours drop `box-shadow`, so the cue becomes a thicker border. Focus must keep its
// outline and the box must not change size, or the input shifts when it turns invalid.
test('a focused invalid TextInput keeps its structural cue in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		render(
			<>
				<TextInput aria-label="Valid" defaultValue="Example" />
				<TextInput aria-invalid aria-label="Invalid" defaultValue="Example" />
			</>,
		);
		const valid = input('Valid');
		const invalid = input('Invalid');
		const validBox = valid.getBoundingClientRect();
		const validStyle = getComputedStyle(valid);

		await focusViaKeyboard(page.getByRole('textbox', { name: 'Valid' }));
		const focusedValidOutline = getComputedStyle(valid).outlineWidth;
		await focusViaKeyboard(page.getByRole('textbox', { name: 'Invalid' }));
		const invalidBox = invalid.getBoundingClientRect();
		const invalidStyle = getComputedStyle(invalid);

		expect(invalidStyle.borderTopWidth).toBe('2px');
		expect(validStyle.borderTopWidth).toBe('1px');
		expect(invalidStyle.outlineStyle).toBe('solid');
		expect(invalidStyle.outlineWidth).toBe(focusedValidOutline);
		expect(invalidBox.width).toBe(validBox.width);
		expect(invalidBox.height).toBe(validBox.height);
		// The border grows by 1px, so the padding gives that pixel back and the text stays put.
		expect(
			Number.parseFloat(invalidStyle.borderLeftWidth) + Number.parseFloat(invalidStyle.paddingLeft),
		).toBe(
			Number.parseFloat(validStyle.borderLeftWidth) + Number.parseFloat(validStyle.paddingLeft),
		);
	} finally {
		await emulateForcedColors('none');
	}
});

test('a rooted TextInput is wired to its label, description, and error with no manual ids', () => {
	render(
		<TextInputRoot isInvalid>
			<FieldLabel>Example field</FieldLabel>
			<TextInput />
			<FieldDescription>Example description</FieldDescription>
			<FieldError>Example error</FieldError>
		</TextInputRoot>,
	);
	const element = input('Example field');

	expect(element).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(element)).toBe('Example description Example error');
	expect(hasMessageIcon('Example field')).toBe(true);
});

// Root-coordinated props have one owner. A rooted input ignores its own values for them.
test('a rooted TextInput ignores its own coordinated props and keeps the root state', async () => {
	const rootChanges: Array<string> = [];
	const eventValues: Array<string> = [];

	function Example() {
		const [value, setValue] = useState('from root');
		return (
			<form>
				<TextInputRoot
					inputId="root-input"
					isInvalid
					name="root-name"
					onChange={(next) => {
						rootChanges.push(next);
						setValue(next);
					}}
					value={value}
				>
					<FieldLabel>Example field</FieldLabel>
					<TextInput
						aria-invalid={false}
						id="own-input"
						name="own-name"
						onChange={(event) => {
							eventValues.push(event.target.value);
						}}
						value="other"
					/>
					<FieldError>Example error</FieldError>
				</TextInputRoot>
			</form>
		);
	}
	const { container } = render(<Example />);
	const element = input('Example field');
	const form = container.querySelector('form');
	if (form == null) throw new Error('Expected a form.');

	expect(element.id).toBe('root-input');
	expect(element.value).toBe('from root');
	expect(element).toHaveAttribute('aria-invalid', 'true');
	expect(new FormData(form).get('root-name')).toBe('from root');
	expect(new FormData(form).has('own-name')).toBe(false);

	await userEvent.type(page.getByRole('textbox', { name: 'Example field' }), '!');

	expect(rootChanges.at(-1)).toBe('from root!');
	expect(eventValues.at(-1)).toBe('from root!');
	expect(element.value).toBe('from root!');
	expect(new FormData(form).get('root-name')).toBe('from root!');
});

test('a rooted TextInput follows the root for disabled, read-only, and required', () => {
	render(
		<>
			<TextInputRoot isDisabled>
				<FieldLabel>Disabled</FieldLabel>
				<TextInput disabled={false} />
			</TextInputRoot>
			<TextInputRoot isReadOnly>
				<FieldLabel>Read-only</FieldLabel>
				<TextInput readOnly={false} />
			</TextInputRoot>
			<TextInputRoot isRequired>
				<FieldLabel>Mandatory</FieldLabel>
				<TextInput required={false} />
			</TextInputRoot>
			<TextInputRoot>
				<FieldLabel>Editable</FieldLabel>
				<TextInput disabled readOnly required />
			</TextInputRoot>
		</>,
	);

	expect(input('Disabled')).toBeDisabled();
	expect(input('Read-only')).toHaveAttribute('readonly');
	expect(input('Mandatory*')).toBeRequired();
	expect(input('Editable')).toBeEnabled();
	expect(input('Editable')).not.toHaveAttribute('readonly');
	expect(input('Editable')).not.toBeRequired();
});

// `type`, `pattern`, `minLength`, and `maxLength` take part in the field's validation, so the root
// owns them when a `TextInput` is rooted.
test('a rooted TextInput uses the root type, pattern, and lengths over its own', () => {
	render(
		<TextInputRoot maxLength={20} minLength={5} pattern="[a-z]+@example[.]com" type="email">
			<FieldLabel>Example field</FieldLabel>
			<TextInput maxLength={3} minLength={1} pattern="[0-9]+" type="text" />
		</TextInputRoot>,
	);
	const element = input('Example field');

	expect(element).toHaveAttribute('type', 'email');
	expect(element).toHaveAttribute('pattern', '[a-z]+@example[.]com');
	expect(element).toHaveAttribute('minlength', '5');
	expect(element).toHaveAttribute('maxlength', '20');
});

test('a rooted TextInput ignores its own type, pattern, and lengths when the root sets none', () => {
	render(
		<TextInputRoot>
			<FieldLabel>Example field</FieldLabel>
			<TextInput maxLength={3} minLength={1} pattern="[0-9]+" type="email" />
		</TextInputRoot>,
	);
	const element = input('Example field');

	expect(element).toHaveAttribute('type', 'text');
	expect(element).not.toHaveAttribute('pattern');
	expect(element).not.toHaveAttribute('minlength');
	expect(element).not.toHaveAttribute('maxlength');
});

test('the root minLength decides native validation of a rooted TextInput', async () => {
	render(
		<form>
			<TextInputRoot minLength={5} validationBehavior="native">
				<FieldLabel>Example field</FieldLabel>
				<TextInput minLength={1} />
				<FieldError />
			</TextInputRoot>
			<button type="submit">Submit</button>
		</form>,
	);
	const element = input('Example field');

	await userEvent.type(page.getByRole('textbox', { name: 'Example field' }), 'abc');
	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	expect(element.validity.tooShort).toBe(true);
	await expect.poll(() => element.getAttribute('aria-invalid')).toBe('true');
});

test('a standalone TextInput applies its own type, pattern, and lengths', () => {
	render(
		<TextInput
			aria-label="Standalone"
			maxLength={20}
			minLength={5}
			pattern="[a-z]+@example[.]com"
			type="email"
		/>,
	);
	const element = input('Standalone');

	expect(element).toHaveAttribute('type', 'email');
	expect(element).toHaveAttribute('pattern', '[a-z]+@example[.]com');
	expect(element).toHaveAttribute('minlength', '5');
	expect(element).toHaveAttribute('maxlength', '20');
});

// A part must never disconnect the field's own wiring, so its ids add to the root's.
test('a rooted TextInput adds its aria-describedby to the field description and error', () => {
	render(
		<>
			<TextInputRoot isInvalid>
				<FieldLabel>Example field</FieldLabel>
				<TextInput aria-describedby="extra" />
				<FieldDescription>Example description</FieldDescription>
				<FieldError>Example error</FieldError>
			</TextInputRoot>
			<p id="extra">Extra hint</p>
		</>,
	);
	const element = input('Example field');

	expect(element).toHaveAccessibleDescription('Example description Example error Extra hint');
});

test('a rooted TextInput adds its aria-labelledby to the field label', () => {
	render(
		<>
			<TextInputRoot>
				<FieldLabel>Example field</FieldLabel>
				<TextInput aria-labelledby="extra" />
			</TextInputRoot>
			<p id="extra">Extra label</p>
		</>,
	);

	expect(page.getByRole('textbox').element()).toHaveAccessibleName('Example field Extra label');
});

test('a standalone TextInput keeps its own aria-describedby', () => {
	render(
		<>
			<TextInput aria-describedby="extra" aria-label="Standalone" />
			<p id="extra">Extra hint</p>
		</>,
	);

	expect(input('Standalone')).toHaveAccessibleDescription('Extra hint');
});

// Input-local props are inherited from the root and can be overridden on the part.
test('a rooted TextInput overrides input-local props from the root', async () => {
	const changes: Array<string> = [];
	const rootChanges: Array<string> = [];
	render(
		<TextInputRoot
			autoComplete="off"
			onChange={(value) => {
				rootChanges.push(value);
			}}
		>
			<Field label="Email">
				<TextInput
					autoComplete="email"
					className="own-input"
					onChange={(event) => {
						changes.push(event.target.value);
					}}
					placeholder="you@example.com"
				/>
			</Field>
		</TextInputRoot>,
	);
	const element = input('Email');

	expect(element).toHaveAttribute('autocomplete', 'email');
	expect(element).toHaveAttribute('placeholder', 'you@example.com');
	expect(element).toHaveClass('own-input');

	await userEvent.type(page.getByRole('textbox', { name: 'Email' }), 'a');

	expect(changes.at(-1)).toBe('a');
	expect(rootChanges.at(-1)).toBe('a');
});

test('a rooted TextInput inherits input-local props from the root unless it sets its own', () => {
	render(
		<>
			<TextInputRoot autoComplete="off" inputMode="numeric">
				<Field label="Inherits">
					<TextInput />
				</Field>
			</TextInputRoot>
			<TextInputRoot autoComplete="off" inputMode="numeric">
				<Field label="Overrides">
					<TextInput autoComplete="email" inputMode="decimal" />
				</Field>
			</TextInputRoot>
		</>,
	);

	expect(input('Inherits')).toHaveAttribute('autocomplete', 'off');
	expect(input('Inherits')).toHaveAttribute('inputmode', 'numeric');
	expect(input('Overrides')).toHaveAttribute('autocomplete', 'email');
	expect(input('Overrides')).toHaveAttribute('inputmode', 'decimal');
});

test('TextInputRoot puts id on its root element and inputId on the input', () => {
	render(
		<TextInputRoot className="example-root" id="example-root" inputId="example-input">
			<FieldLabel>Example field</FieldLabel>
			<TextInput />
		</TextInputRoot>,
	);
	const element = input('Example field');
	const root = document.getElementById('example-root');

	expect(element.id).toBe('example-input');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(element)).toBe(true);
});

test('an adorned TextInput shows one invalid icon, inside the control', () => {
	render(
		<TextInputRoot isInvalid>
			<Field errorMessage="Example error" label="Example field">
				<TextInputControl>
					<TextInputPrefix>$</TextInputPrefix>
					<TextInput />
				</TextInputControl>
			</Field>
		</TextInputRoot>,
	);

	expect(hasControlIcon('Example field')).toBe(true);
	expect(hasMessageIcon('Example field')).toBe(false);
});

test('a TextInputControl derives invalid state from its input', () => {
	render(
		<>
			<TextInputControl>
				<TextInput aria-label="Valid" />
			</TextInputControl>
			<TextInputControl>
				<TextInput aria-invalid aria-label="Invalid" />
			</TextInputControl>
		</>,
	);

	expect(hasControlIcon('Valid')).toBe(false);
	expect(hasControlIcon('Invalid')).toBe(true);
	// The control owns the cue, so the input inside it draws none of its own.
	expect(getComputedStyle(input('Invalid')).boxShadow).toBe('none');
});

// Block size is the layout contract for `size`.
test('the nearest control-level size owner sets the input size', () => {
	render(
		<>
			<TextInput aria-label="Medium reference" />
			<TextInput aria-label="Small reference" size="small" />
			<TextInputRoot size="small">
				<FieldLabel>Root small</FieldLabel>
				<TextInput size="medium" />
			</TextInputRoot>
			<TextInputRoot size="small">
				<FieldLabel>Control medium</FieldLabel>
				<TextInputControl size="medium">
					<TextInput />
				</TextInputControl>
			</TextInputRoot>
		</>,
	);
	const medium = input('Medium reference').getBoundingClientRect().height;
	const small = input('Small reference').getBoundingClientRect().height;

	expect(small).toBeLessThan(medium);
	expect(input('Root small').getBoundingClientRect().height).toBe(small);
	expect(controlFor('Control medium').getBoundingClientRect().height).toBe(medium);
});

test('the TextInput scene has no axe violations', async () => {
	const { container } = render(<TextInputScene />);

	await expectNoAxeViolations(container);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<TextInputScene />, { appearance });
		await captureVisualAppearance(locator, 'text-input/kitchen-sink', appearance);
	}
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<TextInput aria-label="Default" placeholder="Type here" />
				<TextInput aria-invalid aria-label="Invalid" defaultValue="nope" />
				<TextInputControl>
					<TextInput aria-invalid aria-label="Invalid control" defaultValue="nope" />
					<TextInputSuffix>USD</TextInputSuffix>
				</TextInputControl>
			</Stack>,
		);
		await captureVisual(locator, 'text-input/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});
