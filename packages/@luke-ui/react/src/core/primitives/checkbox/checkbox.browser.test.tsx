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
import { Text } from '@luke-ui/react/text';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render } from '../../test-utils/render.js';

function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a checkbox "${name}".`);
	return element;
}

/** The width of the `CheckboxControl` span around the indicator. */
function controlWidth(name: string): number {
	const control = checkbox(name)
		.closest('label')
		?.querySelector('[aria-hidden="true"]')?.parentElement;
	if (control == null) throw new Error('Expected the checkbox control.');
	return control.getBoundingClientRect().width;
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

test('CheckboxLabel keeps its slot', () => {
	render(
		<CheckboxRoot>
			<CheckboxLabel data-testid="label" slot="example">
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				Example checkbox
			</CheckboxLabel>
		</CheckboxRoot>,
	);

	expect(page.getByTestId('label').element()).toHaveAttribute('slot', 'example');
});

// The root provides React Aria's slotted `Text` context for the description and error, so `Text`
// in the label opts out with `slot={null}`.
test('Text with slot null renders inside CheckboxLabel', () => {
	render(
		<CheckboxRoot>
			<CheckboxLabel>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				<Text slot={null}>Visible</Text>
				<Text isVisuallyHidden slot={null}>
					{' hidden context'}
				</Text>
			</CheckboxLabel>
		</CheckboxRoot>,
	);

	expect(checkbox('Visible hidden context')).toBeInTheDocument();
});

test('CheckboxRoot owns controlled selection and the indeterminate state', async () => {
	const changes: Array<boolean> = [];
	render(
		<>
			<CheckboxRoot isSelected={false} onChange={(isSelected) => changes.push(isSelected)}>
				<Parts label="Controlled" />
			</CheckboxRoot>
			<CheckboxRoot isIndeterminate>
				<Parts label="Mixed" />
			</CheckboxRoot>
		</>,
	);

	await userEvent.click(page.getByText('Controlled', { exact: true }));

	expect(changes).toEqual([true]);
	expect(checkbox('Controlled')).not.toBeChecked();
	expect(checkbox('Mixed').indeterminate).toBe(true);
});

test('CheckboxRoot joins FormData with its name and value', async () => {
	render(
		<form data-testid="form">
			<CheckboxRoot name="terms" value="accepted">
				<Parts label="Terms" />
			</CheckboxRoot>
		</form>,
	);
	const form = page.getByTestId('form').element();
	if (!(form instanceof HTMLFormElement)) throw new Error('Expected a form.');

	expect(new FormData(form).get('terms')).toBe(null);

	await userEvent.click(page.getByText('Terms', { exact: true }));

	expect(new FormData(form).get('terms')).toBe('accepted');
});

test('CheckboxRoot size changes the control size', () => {
	render(
		<>
			<CheckboxRoot size="small">
				<Parts label="Small" />
			</CheckboxRoot>
			<CheckboxRoot size="large">
				<Parts label="Large" />
			</CheckboxRoot>
		</>,
	);

	expect(controlWidth('Small')).toBeLessThan(controlWidth('Large'));
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

	expect(checkbox('Required')).toHaveAccessibleName('Required');
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

test('a checkbox with a FieldLabel has no axe violations', async () => {
	const { container } = render(
		<CheckboxRoot>
			<FieldLabel>Example label</FieldLabel>
			<FieldDescription>Example description</FieldDescription>
			<Bare />
		</CheckboxRoot>,
	);

	await expectNoAxeViolations(container);
});
