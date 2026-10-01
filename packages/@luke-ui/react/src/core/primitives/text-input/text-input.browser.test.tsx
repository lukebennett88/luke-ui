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

/** Asserts that two inputs share a box and put their text at the same inline offset. */
function expectSameLayout(reference: HTMLInputElement, actual: HTMLInputElement) {
	const referenceBox = reference.getBoundingClientRect();
	const actualBox = actual.getBoundingClientRect();

	expect(actualBox.width).toBe(referenceBox.width);
	expect(actualBox.height).toBe(referenceBox.height);
	expect(textInset(actual)).toBe(textInset(reference));
}

/** Distance from an input's border edge to its text. */
function textInset(element: HTMLInputElement): number {
	const style = getComputedStyle(element);
	return Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft);
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

// Layout is the contract: turning invalid must not move the input or its text.
test('a standalone invalid TextInput keeps its size and text position', () => {
	render(
		<>
			<TextInput aria-label="Valid" defaultValue="Example" />
			<TextInput aria-invalid aria-label="Invalid" defaultValue="Example" />
		</>,
	);

	expect(input('Invalid')).toHaveAttribute('aria-invalid', 'true');
	expectSameLayout(input('Valid'), input('Invalid'));
});

// Forced colours drop `box-shadow`, so the invalid cue there is a thicker border. The input and its
// text must still stay put, including while focused.
test('a focused invalid TextInput keeps its size and text position in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		render(
			<>
				<TextInput aria-label="Valid" defaultValue="Example" />
				<TextInput aria-invalid aria-label="Invalid" defaultValue="Example" />
			</>,
		);
		await focusViaKeyboard(page.getByRole('textbox', { name: 'Valid' }));
		await focusViaKeyboard(page.getByRole('textbox', { name: 'Invalid' }));

		expect(input('Invalid')).toHaveAttribute('aria-invalid', 'true');
		expectSameLayout(input('Valid'), input('Invalid'));
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

test('a rooted TextInput takes the root aria-label unless it sets its own', () => {
	render(
		<>
			<TextInputRoot aria-label="Root name">
				<TextInput />
			</TextInputRoot>
			<TextInputRoot aria-label="Root name">
				<TextInput aria-label="Input name" />
			</TextInputRoot>
		</>,
	);

	expect(page.getByRole('textbox', { name: 'Root name' }).elements()).toHaveLength(1);
	expect(page.getByRole('textbox', { name: 'Input name' }).elements()).toHaveLength(1);
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

// An invalid adorned field puts its error message in the input's description.
test('an invalid adorned TextInput describes the error', () => {
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
	const element = input('Example field');

	expect(element).toHaveAttribute('aria-invalid', 'true');
	expect(element).toHaveAccessibleDescription('Example error');
});

// Block size is the layout contract for `size`. The root sets a default, a part can override it,
// and a control sets the size of everything inside it.
test('a part size overrides the root size, and a control sizes its input', () => {
	render(
		<>
			<TextInput aria-label="Medium reference" />
			<TextInput aria-label="Small reference" size="small" />
			<TextInputRoot size="small">
				<FieldLabel>Root small</FieldLabel>
				<TextInput />
			</TextInputRoot>
			<TextInputRoot size="small">
				<FieldLabel>Input medium</FieldLabel>
				<TextInput size="medium" />
			</TextInputRoot>
			<TextInputRoot size="small">
				<FieldLabel>Control medium</FieldLabel>
				<TextInputControl size="medium">
					<TextInput size="small" />
				</TextInputControl>
			</TextInputRoot>
		</>,
	);
	const medium = input('Medium reference').getBoundingClientRect().height;
	const small = input('Small reference').getBoundingClientRect().height;

	expect(small).toBeLessThan(medium);
	expect(input('Root small').getBoundingClientRect().height).toBe(small);
	expect(input('Input medium').getBoundingClientRect().height).toBe(medium);
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
				<TextInput aria-invalid aria-label="Focused invalid" defaultValue="nope" />
				<TextInput aria-label="Default" placeholder="Type here" />
				<TextInput aria-invalid aria-label="Invalid" defaultValue="nope" />
				<TextInputControl>
					<TextInput aria-invalid aria-label="Invalid control" defaultValue="nope" />
					<TextInputSuffix>USD</TextInputSuffix>
				</TextInputControl>
			</Stack>,
		);
		await focusViaKeyboard(page.getByRole('textbox', { name: 'Focused invalid' }));
		await captureVisual(locator, 'text-input/forced-colors-states');
	} finally {
		await emulateForcedColors('none');
	}
});
