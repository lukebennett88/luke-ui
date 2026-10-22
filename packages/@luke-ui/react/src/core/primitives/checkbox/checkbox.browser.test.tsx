import { Box } from '@luke-ui/react/box';
import {
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import {
	FieldDescription,
	FieldError,
	FieldLabel,
	InlineField,
} from '@luke-ui/react/primitives/field';
import { vars } from '@luke-ui/react/theme';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import type { PairedBackground } from '../../test-utils/surface-colors.js';
import {
	pairedColors,
	resolvedColor,
	settledSurfaceColors,
} from '../../test-utils/surface-colors.js';

function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a checkbox "${name}".`);
	return element;
}

function Parts({ label }: { label: string }) {
	return (
		<CheckboxLabel>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
			{label}
		</CheckboxLabel>
	);
}

test('CheckboxRoot puts id on its root element, inputId on the input, and ref on the root', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	render(
		<CheckboxRoot
			className="example-root"
			id="example-root"
			inputId="example-input"
			inputRef={inputRef}
			ref={ref}
		>
			<Parts label="Example checkbox" />
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(inputRef.current).toBe(input);
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(ref.current).toBe(root);
});

test('CheckboxLabel is the clickable native label around the input', async () => {
	const ref = createRef<HTMLLabelElement>();
	render(
		<CheckboxRoot>
			<CheckboxLabel ref={ref}>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				Example checkbox
			</CheckboxLabel>
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');

	expect(ref.current?.tagName).toBe('LABEL');
	expect(ref.current?.contains(input)).toBe(true);

	await userEvent.click(page.getByText('Example checkbox'));

	expect(input).toBeChecked();
});

test('CheckboxLabel resolves className, style, and children from the checkbox state', async () => {
	render(
		<CheckboxRoot>
			<CheckboxLabel
				className={({ isSelected }) => (isSelected ? 'is-on' : 'is-off')}
				data-testid="label"
				style={({ isSelected }) => ({ opacity: isSelected ? 1 : 0.75 })}
			>
				{({ isSelected }) => {
					return (
						<>
							<CheckboxControl>
								<CheckboxIndicator />
							</CheckboxControl>
							{isSelected ? 'On' : 'Off'}
						</>
					);
				}}
			</CheckboxLabel>
		</CheckboxRoot>,
	);
	const label = page.getByTestId('label').element();
	if (!(label instanceof HTMLElement)) throw new Error('Expected an HTML label.');

	expect(label).toHaveClass('is-off');
	expect(label.style.opacity).toBe('0.75');

	await userEvent.click(page.getByText('Off', { exact: true }));

	expect(label).toHaveClass('is-on');
	expect(label.style.opacity).toBe('1');
	expect(checkbox('On')).toBeChecked();
});

test('CheckboxRoot owns the indeterminate state', () => {
	render(
		<CheckboxRoot isIndeterminate>
			<Parts label="Mixed" />
		</CheckboxRoot>,
	);

	expect(checkbox('Mixed').indeterminate).toBe(true);
});

test('InlineField renders the label, description, and error in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			<InlineField
				className="example-field"
				description="Example description"
				errorMessage="Example error"
			>
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(input)).toBe('Example description Example error');
	expect(page.getByText('Example description').element().closest('.example-field')).not.toBe(null);
});

test('InlineField takes div props and adds no semantics of its own', () => {
	render(
		<CheckboxRoot>
			<InlineField data-testid="inline-field" id="inline-field">
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);
	const field = page.getByTestId('inline-field').element();

	expect(field.tagName).toBe('DIV');
	expect(field.id).toBe('inline-field');
	expect(field).not.toHaveAttribute('role');
	expect(getDescribedText(checkbox('Example checkbox'))).toBe('');
});

// `InlineField` renders no description unless it has one, but always renders the error slot so
// constraint and `validate` messages appear without an `errorMessage`.
test('InlineField always renders the error slot', async () => {
	render(
		<form>
			<CheckboxRoot isRequired>
				<InlineField>
					<Parts label="Terms" />
				</InlineField>
			</CheckboxRoot>
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms');

	expect(getDescribedText(input)).toBe('');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
	expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('manual FieldDescription and FieldError parts work in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			<Parts label="Example checkbox" />
			<FieldDescription>Example description</FieldDescription>
			<FieldError>Example error</FieldError>
		</CheckboxRoot>,
	);

	const input = checkbox('Example checkbox');

	expect(getDescribedText(input)).toBe('Example description Example error');
});

// `CheckboxField` owns the required marker. A primitive label draws none.
test('CheckboxLabel draws no required marker', () => {
	render(
		<CheckboxRoot isRequired>
			<Parts label="Required" />
		</CheckboxRoot>,
	);
	const input = checkbox('Required');

	expect(input).toBeRequired();
	expect(input.closest('label')?.textContent).toBe('Required');
});

// The marker is hidden from assistive technology, so the label's text shows it and the name does not.
test('a FieldLabel marks a required CheckboxRoot', () => {
	render(
		<>
			<CheckboxRoot isRequired>
				<FieldLabel data-testid="required-label">Required</FieldLabel>
				<Bare />
			</CheckboxRoot>
			<CheckboxRoot>
				<FieldLabel data-testid="optional-label">Optional</FieldLabel>
				<Bare />
			</CheckboxRoot>
		</>,
	);

	expect(checkbox('Required')).toBeRequired();
	expect(page.getByTestId('required-label').element().textContent).toBe('Required\u00A0*');
	expect(checkbox('Optional')).not.toBeRequired();
	expect(page.getByTestId('optional-label').element().textContent).toBe('Optional');
});

test('a composed checkbox primitive has no axe violations', async () => {
	const { container } = render(
		<CheckboxRoot isInvalid isRequired>
			<InlineField description="Example description" errorMessage="Example error">
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);

	await expectNoAxeViolations(container);
});

function Bare() {
	return (
		<CheckboxLabel>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
		</CheckboxLabel>
	);
}

test('a FieldLabel inside CheckboxRoot names and toggles the checkbox with no ids passed', async () => {
	render(
		<CheckboxRoot>
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<FieldDescription>Example description</FieldDescription>
			<Bare />
		</CheckboxRoot>,
	);
	const input = checkbox('Example label');

	expect(input).toHaveAccessibleName('Example label');
	expect(input).toHaveAccessibleDescription('Example description');
	expect(input.id).not.toBe('');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', input.id);

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('CheckboxRoot uses inputId as the input id and the FieldLabel for', async () => {
	render(
		<CheckboxRoot inputId="example-input">
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<Bare />
		</CheckboxRoot>,
	);
	const input = checkbox('Example label');

	expect(input.id).toBe('example-input');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', 'example-input');

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('CheckboxRoot keeps aria-labelledby and aria-describedby from the layout', () => {
	render(
		<>
			<span id="outside-label">Outside label</span>
			<span id="outside-description">Outside description</span>
			<CheckboxRoot aria-describedby="outside-description" aria-labelledby="outside-label">
				<Bare />
			</CheckboxRoot>
		</>,
	);
	const input = checkbox('Outside label');

	expect(input).toHaveAccessibleDescription('Outside description');
});

for (const appearance of visualAppearances) {
	// The box's fill establishes the glyph's colour, so the check mark reads on-solid primary once
	// checked, whatever surface the checkbox sits on.
	test(`the checkbox box pairs each fill with its glyph colour in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<Box backgroundColor="success.solid" padding="space.8">
				<CheckboxRoot>
					<Parts label="Plain" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected>
					<Parts label="Checked" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected isInvalid>
					<Parts label="Invalid" />
				</CheckboxRoot>
			</Box>,
			{ appearance },
		);
		const indicators = [...container.querySelectorAll('[aria-hidden="true"]')];
		const backgrounds: ReadonlyArray<PairedBackground> = [
			'surface.field',
			'accent.solid.rest',
			'danger.solid.rest',
		];

		expect(indicators.map((indicator) => settledSurfaceColors(indicator))).toEqual(
			indicators.map((indicator, index) =>
				pairedColors(indicator, backgrounds[index] ?? 'surface.field'),
			),
		);
		// The check mark is the indicator's text, so it shows the checked fills' on-solid primary.
		expect(
			indicators.slice(1).map((indicator) => getComputedStyle(indicator, '::after').color),
		).toEqual(
			[
				vars.color.foreground.accent.onSolid.primary,
				vars.color.foreground.danger.onSolid.primary,
			].map((token) => resolvedColor(token, container)),
		);
	});
}
