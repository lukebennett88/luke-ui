import { FieldDescription, FieldLabel, InlineField } from '@luke-ui/react/primitives/field';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { render } from '../../test-utils/render.js';

function toggle(name: string): HTMLInputElement {
	const element = page.getByRole('switch', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a switch "${name}".`);
	return element;
}

function Parts({ label }: { label: string }) {
	return (
		<SwitchLabel>
			<SwitchControl>
				<SwitchThumb />
			</SwitchControl>
			{label}
		</SwitchLabel>
	);
}

test('SwitchRoot puts id on its root element, inputId on the input, and ref on the root', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	render(
		<SwitchRoot
			className="example-root"
			id="example-root"
			inputId="example-input"
			inputRef={inputRef}
			ref={ref}
		>
			<Parts label="Example switch" />
		</SwitchRoot>,
	);
	const input = toggle('Example switch');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(inputRef.current).toBe(input);
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(ref.current).toBe(root);
});

test('SwitchLabel is the clickable native label around the input', async () => {
	const ref = createRef<HTMLLabelElement>();
	render(
		<SwitchRoot>
			<SwitchLabel ref={ref}>
				<SwitchControl>
					<SwitchThumb />
				</SwitchControl>
				Example switch
			</SwitchLabel>
		</SwitchRoot>,
	);
	const input = toggle('Example switch');

	expect(ref.current?.tagName).toBe('LABEL');
	expect(ref.current?.contains(input)).toBe(true);

	await userEvent.click(page.getByText('Example switch'));

	expect(input).toBeChecked();
});

test('SwitchLabel resolves className, style, and children from the switch state', async () => {
	render(
		<SwitchRoot>
			<SwitchLabel
				className={({ isSelected }) => (isSelected ? 'is-on' : 'is-off')}
				data-testid="label"
				style={({ isSelected }) => ({ opacity: isSelected ? 1 : 0.75 })}
			>
				{({ isSelected }) => {
					return (
						<>
							<SwitchControl>
								<SwitchThumb />
							</SwitchControl>
							{isSelected ? 'On' : 'Off'}
						</>
					);
				}}
			</SwitchLabel>
		</SwitchRoot>,
	);
	const label = page.getByTestId('label').element();
	if (!(label instanceof HTMLElement)) throw new Error('Expected an HTML label.');

	expect(label).toHaveClass('is-off');
	expect(label.style.opacity).toBe('0.75');

	await userEvent.click(page.getByText('Off', { exact: true }));

	expect(label).toHaveClass('is-on');
	expect(label.style.opacity).toBe('1');
	expect(toggle('On')).toBeChecked();
});

test('SwitchThumb renders custom children inside the hidden track', () => {
	render(
		<SwitchRoot>
			<SwitchLabel>
				<SwitchControl data-testid="control">
					<SwitchThumb data-testid="thumb">
						<span data-testid="glyph">✓</span>
					</SwitchThumb>
				</SwitchControl>
				Example switch
			</SwitchLabel>
		</SwitchRoot>,
	);

	expect(page.getByTestId('thumb').element()).toContainElement(page.getByTestId('glyph').element());
	expect(page.getByTestId('control').element()).toHaveAttribute('aria-hidden', 'true');
	expect(toggle('Example switch')).toHaveAccessibleName('Example switch');
});

test('InlineField renders the label, description, and error in a SwitchRoot', () => {
	render(
		<SwitchRoot isInvalid>
			<InlineField
				className="example-field"
				description="Example description"
				errorMessage="Example error"
			>
				<Parts label="Example switch" />
			</InlineField>
		</SwitchRoot>,
	);
	const input = toggle('Example switch');

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(input)).toBe('Example description Example error');
	expect(page.getByText('Example description').element().closest('.example-field')).not.toBe(null);
});

// `SwitchField` owns the required marker. A primitive label draws none.
test('SwitchLabel draws no required marker', () => {
	render(
		<SwitchRoot isRequired>
			<Parts label="Required" />
		</SwitchRoot>,
	);
	const input = toggle('Required');

	expect(input).toBeRequired();
	expect(input.closest('label')?.textContent).toBe('Required');
});

// The marker is hidden from assistive technology, so the label's text shows it and the name does not.
test('a FieldLabel marks a required SwitchRoot', () => {
	render(
		<>
			<SwitchRoot isRequired>
				<FieldLabel data-testid="required-label">Required</FieldLabel>
				<Bare />
			</SwitchRoot>
			<SwitchRoot>
				<FieldLabel data-testid="optional-label">Optional</FieldLabel>
				<Bare />
			</SwitchRoot>
		</>,
	);

	expect(toggle('Required')).toBeRequired();
	expect(page.getByTestId('required-label').element().textContent).toBe('Required\u00A0*');
	expect(toggle('Optional')).not.toBeRequired();
	expect(page.getByTestId('optional-label').element().textContent).toBe('Optional');
});

test('a composed switch primitive has no axe violations', async () => {
	const { container } = render(
		<SwitchRoot isInvalid isRequired>
			<InlineField description="Example description" errorMessage="Example error">
				<Parts label="Example switch" />
			</InlineField>
		</SwitchRoot>,
	);

	await expectNoAxeViolations(container);
});

function Bare() {
	return (
		<SwitchLabel>
			<SwitchControl>
				<SwitchThumb />
			</SwitchControl>
		</SwitchLabel>
	);
}

test('a FieldLabel inside SwitchRoot names and toggles the switch with no ids passed', async () => {
	render(
		<SwitchRoot>
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<FieldDescription>Example description</FieldDescription>
			<Bare />
		</SwitchRoot>,
	);
	const input = toggle('Example label');

	expect(input).toHaveAccessibleName('Example label');
	expect(input).toHaveAccessibleDescription('Example description');
	expect(input.id).not.toBe('');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', input.id);

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('SwitchRoot uses inputId as the input id and the FieldLabel for', async () => {
	render(
		<SwitchRoot inputId="example-input">
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<Bare />
		</SwitchRoot>,
	);
	const input = toggle('Example label');

	expect(input.id).toBe('example-input');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', 'example-input');

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('SwitchRoot keeps aria-labelledby and aria-describedby from the layout', () => {
	render(
		<>
			<span id="outside-label">Outside label</span>
			<span id="outside-description">Outside description</span>
			<SwitchRoot aria-describedby="outside-description" aria-labelledby="outside-label">
				<Bare />
			</SwitchRoot>
		</>,
	);
	const input = toggle('Outside label');

	expect(input).toHaveAccessibleDescription('Outside description');
});
