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
import { expect, test } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
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

test('a rooted TextInput yields its semantic props to the root', () => {
	render(
		<TextInputRoot inputId="root-input" isDisabled name="root-name">
			<FieldLabel>Example field</FieldLabel>
			<TextInput id="own-input" name="own-name" />
		</TextInputRoot>,
	);
	const element = input('Example field');

	expect(element.id).toBe('root-input');
	expect(element.name).toBe('root-name');
	expect(element).toBeDisabled();
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
