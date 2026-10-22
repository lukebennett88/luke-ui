import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { TextFieldContext } from 'react-aria-components/TextField';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectAccessibleNameWords } from '../test-utils/expect-accessible-name-words.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { measureFieldError } from '../test-utils/measure-field-error.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedColors, resolvedColor, surfaceColors } from '../test-utils/surface-colors.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';

const wrappingErrorMessage =
	'Enter an email address in the form name@example.com, with no spaces or trailing punctuation.';

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
					defaultValue="nope"
					errorMessage={wrappingErrorMessage}
					label="Invalid with a wrapping message"
					name="invalid-wrapping"
				/>
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

function textbox(name: string): HTMLInputElement {
	const element = page.getByRole('textbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected an input "${name}".`);
	return element;
}

// Luke UI widens RAC's `inputRef` to accept React Hook Form's callback ref.
test('TextInputField resolves object and callback inputRef to the input', () => {
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	const { locator } = render(
		<>
			<TextInputField inputRef={inputRef} label="Name" name="full-name" />
			<TextInputField
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				label="Callback"
				name="callback-name"
			/>
		</>,
	);

	expect(inputRef.current).toBe(locator.getByRole('textbox', { name: 'Name' }).element());
	expect(callbackResolved.at(-1)).toBe(
		locator.getByRole('textbox', { name: 'Callback' }).element(),
	);
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
	const email = page.getByRole('textbox', { name: 'Email' }).element();
	const username = page.getByRole('textbox', { name: 'Username' }).element();

	expect(email).not.toHaveAttribute('aria-invalid');
	expect(username).not.toHaveAttribute('aria-invalid');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => email.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => username.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => getDescribedText(username).length).toBeGreaterThan(0);
});

// Required markers are hidden from assistive technology, so the name does not include them.
test('a required TextInputField marks its label with its necessityIndicator', () => {
	render(
		<>
			<TextInputField isRequired label="Required asterisk" />
			<TextInputField isRequired label="Required words" necessityIndicator="required-label" />
			<TextInputField label="Optional" />
		</>,
	);
	const asterisk = textbox('Required asterisk');
	const words = textbox('Required words');
	const optional = textbox('Optional');

	expect(asterisk).toBeRequired();
	expect(asterisk.labels?.[0]?.textContent).toBe('Required asterisk\u00A0*');
	expect(words).toBeRequired();
	expect(words.labels?.[0]?.textContent).toBe('Required words\u00A0(required)');
	expect(optional).not.toBeRequired();
	expect(optional.labels?.[0]?.textContent).toBe('Optional');
});

test('an optional TextInputField with optional-label includes "(optional)" in its name', async () => {
	render(<TextInputField label="Middle name" necessityIndicator="optional-label" />);

	const input = textbox('Middle name (optional)');
	expect(input).not.toBeRequired();
	expect(input.labels?.[0]?.textContent).toBe('Middle name\u00A0(optional)');
	await expectAccessibleNameWords(input, 'Middle name (optional)');
});

test('an aria-label TextInputField with optional-label has no "(optional)" in its name', async () => {
	render(<TextInputField aria-label="Middle name" necessityIndicator="optional-label" />);

	const input = textbox('Middle name');
	expect(input.labels).toHaveLength(0);
	await expectAccessibleNameWords(input, 'Middle name');
});

for (const appearance of visualAppearances) {
	test(`an optional-label TextInputField has no axe violations in ${appearance.theme} ${appearance.mode}`, async () => {
		const { container } = render(
			<TextInputField label="Middle name" necessityIndicator="optional-label" />,
			{ appearance },
		);
		await expectNoAxeViolations(container);
	});
}

test('optional-label', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<TextInputField label="Middle name" necessityIndicator="optional-label" />
				<TextInputField isDisabled label="Middle name" necessityIndicator="optional-label" />
				<TextInputField
					isDisabled
					isRequired
					label="Family name"
					necessityIndicator="required-label"
				/>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'text-input-field/optional-label', appearance);
	}
});

const requiredTextFieldContext = { isRequired: true };

test('a TextInputField without isRequired keeps isRequired from React Aria context', () => {
	render(
		<TextFieldContext.Provider value={requiredTextFieldContext}>
			<TextInputField label="Email" />
		</TextFieldContext.Provider>,
	);

	expect(textbox('Email')).toBeRequired();
});

// RAC mergeProps keeps context `isRequired` when the root omits the prop; FieldStateContext must
// match so optional-label does not show "(optional)" on a required control.
for (const { expectedLabel, necessityIndicator, title } of [
	{
		expectedLabel: 'Email\u00A0*',
		necessityIndicator: undefined,
		title: 'default required-asterisk',
	},
	{
		expectedLabel: 'Email\u00A0*',
		necessityIndicator: 'required-asterisk' as const,
		title: 'explicit required-asterisk',
	},
	{
		expectedLabel: 'Email',
		necessityIndicator: 'optional-label' as const,
		title: 'optional-label',
	},
]) {
	test(`TextFieldContext isRequired drives the ${title} marker`, () => {
		render(
			<TextFieldContext.Provider value={requiredTextFieldContext}>
				<TextInputField
					label="Email"
					{...(necessityIndicator == null ? {} : { necessityIndicator })}
				/>
			</TextFieldContext.Provider>,
		);
		const input = textbox('Email');

		expect(input).toBeRequired();
		expect(input.labels?.[0]?.textContent).toBe(expectedLabel);
	});
}

test('an aria-labelledby TextInputField with optional-label has no "(optional)" in its name', async () => {
	render(
		<>
			<span id="middle-name-heading">Middle name</span>
			<TextInputField aria-labelledby="middle-name-heading" necessityIndicator="optional-label" />
		</>,
	);

	const input = textbox('Middle name');
	expect(input.labels).toHaveLength(0);
	await expectAccessibleNameWords(input, 'Middle name');
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

test('the error icon is centred on the first line and wrapped lines align with the text', () => {
	render(
		<Stack width="14rem">
			<TextInputField errorMessage={wrappingErrorMessage} label="Email" name="email" />
		</Stack>,
	);

	const input = page.getByRole('textbox', { name: 'Email' }).element();
	const measurement = measureFieldError(page.getByText(wrappingErrorMessage).element());

	expect(input).toHaveAccessibleDescription(wrappingErrorMessage);
	expect(Math.abs(measurement.iconCentre - measurement.capCentre)).toBeLessThanOrEqual(0.5);
	expect(measurement.firstLineStart).toBeGreaterThanOrEqual(measurement.iconEnd);
	expect(measurement.secondLineStart).toBeDefined();
	expect(measurement.secondLineStart).toBeCloseTo(measurement.firstLineStart, 0);
});

test('a message with mixed inline content flows as one run beside the icon', () => {
	render(
		<Stack width="14rem">
			<TextInputField
				errorMessage={
					<>
						Enter an email address in the form <strong>name@example.com</strong> with no spaces.
					</>
				}
				label="Email"
				name="email"
			/>
		</Stack>,
	);

	const input = page.getByRole('textbox', { name: 'Email' }).element();
	const emphasis = page.getByText('name@example.com').element();
	const text = emphasis.parentElement;
	if (text == null) throw new Error('Expected the emphasis to sit inside the message text.');
	const measurement = measureFieldError(text);

	expect(text.parentElement?.children).toHaveLength(2);
	expect(input).toHaveAccessibleDescription(
		'Enter an email address in the form name@example.com with no spaces.',
	);
	expect(Math.abs(measurement.iconCentre - measurement.capCentre)).toBeLessThanOrEqual(0.5);
	expect(measurement.secondLineStart).toBeCloseTo(measurement.firstLineStart, 0);
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

/** The error message root and its decorative icon, from the element holding the message text. */
function fieldErrorParts(text: string) {
	const body = page.getByText(text).element();
	const message = body.parentElement;
	const icon = message?.firstElementChild;
	if (message == null || icon == null || icon.getAttribute('aria-hidden') !== 'true') {
		throw new Error('Expected an error message with a leading icon.');
	}
	return { icon, message };
}

function fieldLabel(container: HTMLElement): HTMLElement {
	const label = container.querySelector('label');
	if (label === null) throw new Error('Expected a field label.');
	return label;
}

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	test(`field text reads a solid fill while the control keeps its field surface in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" data-testid="parent" padding="space.8">
				<TextInputField description="Used for receipts." label="Email" name="email" />
			</Box>,
			{ appearance },
		);
		const parent = page.getByTestId('parent').element();
		const { foreground } = pairedColors(parent, 'accent.solid');
		const input = page.getByRole('textbox', { name: 'Email' }).element();
		const control = input.parentElement;
		if (control === null) throw new Error('Expected the input control.');

		expect(getComputedStyle(fieldLabel(container)).color).toBe(foreground.primary);
		expect(getComputedStyle(page.getByText('Used for receipts.').element()).color).toBe(
			foreground.secondary,
		);
		expect(surfaceColors(control)).toEqual(pairedColors(control, 'surface.field'));
	});

	// On a solid fill the danger hue collapses to on-solid primary, so the icon shape, the message,
	// and the field's invalid state and description carry the error rather than the colour.
	test(`an error keeps its meaning when its hue collapses on a solid fill in ${name}`, () => {
		render(
			<Box backgroundColor="danger.solid" data-testid="parent" padding="space.8">
				<TextInputField errorMessage="Enter a valid email." label="Email" name="email" />
			</Box>,
			{ appearance },
		);
		const parent = page.getByTestId('parent').element();
		const input = page.getByRole('textbox', { name: 'Email' }).element();
		const { icon, message } = fieldErrorParts('Enter a valid email.');
		const messageColor = getComputedStyle(message).color;

		expect(messageColor).toBe(pairedColors(parent, 'danger.solid').foreground.primary);
		expect(getComputedStyle(icon).backgroundColor).toBe(messageColor);
		expect(getComputedStyle(icon).maskImage).not.toBe('none');
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('Enter a valid email.');
	});

	test(`an error keeps its danger hue on another role's subtle fill in ${name}`, () => {
		render(
			<Box backgroundColor="success.subtle" padding="space.8">
				<TextInputField errorMessage="Enter a valid email." label="Email" name="email" />
			</Box>,
			{ appearance },
		);
		const { icon, message } = fieldErrorParts('Enter a valid email.');
		const danger = resolvedColor(vars.color.foreground.danger.rest, message);

		expect(getComputedStyle(message).color).toBe(danger);
		expect(getComputedStyle(icon).backgroundColor).toBe(danger);
	});

	test(`a disabled label stays readable on a solid fill in ${name}`, () => {
		const { container } = render(
			<>
				<Box backgroundColor="accent.solid" data-testid="solid" padding="space.8">
					<TextInputField isDisabled label="On solid" name="solid" />
				</Box>
				<Box backgroundColor="surface.subdued" data-testid="surface" padding="space.8">
					<TextInputField isDisabled label="On surface" name="surface" />
				</Box>
			</>,
			{ appearance },
		);
		const [onSolid, onSurface] = container.querySelectorAll('label');
		if (onSolid === undefined || onSurface === undefined) throw new Error('Expected two labels.');

		expect(getComputedStyle(onSolid).color).toBe(
			pairedColors(page.getByTestId('solid').element(), 'accent.solid').foreground.secondary,
		);
		expect(getComputedStyle(onSurface).color).toBe(
			resolvedColor(vars.color.text.disabled, onSurface),
		);
	});
}

test('an error keeps a solid icon and system text in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		render(
			<Box backgroundColor="danger.solid" padding="space.8">
				<TextInputField errorMessage="Enter a valid email." label="Email" name="email" />
			</Box>,
		);
		const input = page.getByRole('textbox', { name: 'Email' }).element();
		const { icon, message } = fieldErrorParts('Enter a valid email.');
		const canvasText = resolvedColor('CanvasText', message);

		expect(getComputedStyle(message).color).toBe(canvasText);
		expect(getComputedStyle(icon).backgroundColor).toBe(canvasText);
		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(input).toHaveAccessibleDescription('Enter a valid email.');
	} finally {
		await emulateForcedColors('none');
	}
});
