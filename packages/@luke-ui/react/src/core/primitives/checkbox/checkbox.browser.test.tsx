import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import { FieldDescription, FieldError, InlineField } from '@luke-ui/react/primitives/field';
import { Text } from '@luke-ui/react/text';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
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

function parts(label: string) {
	return (
		<CheckboxContent>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
			{label}
		</CheckboxContent>
	);
}

test('CheckboxRoot puts id on its root element, inputId on the input, and ref on the root', () => {
	const ref = createRef<HTMLDivElement>();
	render(
		<CheckboxRoot className="example-root" id="example-root" inputId="example-input" ref={ref}>
			{parts('Example checkbox')}
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(ref.current).toBe(root);
});

test('CheckboxRoot owns state, form participation, and size for the parts inside it', async () => {
	const { container } = render(
		<>
			<CheckboxRoot name="terms" value="accepted">
				{parts('Terms')}
			</CheckboxRoot>
			<CheckboxRoot isDisabled>{parts('Disabled')}</CheckboxRoot>
			<CheckboxRoot size="small">{parts('Small')}</CheckboxRoot>
			<CheckboxRoot size="large">{parts('Large')}</CheckboxRoot>
		</>,
	);
	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);

	await userEvent.click(page.getByText('Terms'));

	expect(new FormData(form).get('terms')).toBe('accepted');
	expect(checkbox('Disabled')).toBeDisabled();
	expect(controlWidth('Small')).toBeLessThan(controlWidth('Large'));

	form.remove();
});

test('InlineField renders the content, description, and error in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			<InlineField
				className="example-field"
				description="Example description"
				errorMessage="Example error"
			>
				{parts('Example checkbox')}
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
				{parts('Example checkbox')}
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
				<InlineField>{parts('Terms')}</InlineField>
			</CheckboxRoot>
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms *');

	expect(getDescribedText(input)).toBe('');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
	expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('manual FieldDescription and FieldError parts work in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			{parts('Example checkbox')}
			<FieldDescription>Example description</FieldDescription>
			<FieldError>Example error</FieldError>
		</CheckboxRoot>,
	);

	const input = checkbox('Example checkbox');
	const error = page.getByText('Example error').element();

	expect(getDescribedText(input)).toBe('Example description Example error');
	// Manual composition has no `InlineField`, but the root still switches the message icon on.
	expect(getComputedStyle(error, '::before').display).not.toBe('none');
});

test('CheckboxContent draws the necessity marker only for a required root', () => {
	render(
		<>
			<CheckboxRoot isRequired>{parts('Raw')}</CheckboxRoot>
			<CheckboxRoot isRequired>
				<CheckboxContent necessityIndicator="label">
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					<Text elementType="span">Words</Text>
				</CheckboxContent>
			</CheckboxRoot>
			<CheckboxRoot isRequired>
				<CheckboxContent>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					<Text elementType="span">Icon</Text>
				</CheckboxContent>
			</CheckboxRoot>
			<CheckboxRoot>
				<CheckboxContent>
					<CheckboxControl>
						<CheckboxIndicator />
					</CheckboxControl>
					<Text elementType="span">Optional</Text>
				</CheckboxContent>
			</CheckboxRoot>
		</>,
	);
	const after = (element: Element | null) => {
		if (element == null) throw new Error('Expected an element.');
		return getComputedStyle(element, '::after').content;
	};
	const label = (name: string) => {
		const found = checkbox(name).closest('label');
		if (found == null) throw new Error('Expected a label.');
		return found;
	};

	// An element after the control carries the marker, so it follows the last word.
	expect(after(label('Icon*').lastElementChild)).toBe('"*"');
	expect(after(label('Icon*'))).toBe('none');
	expect(after(label('Words(required)').lastElementChild)).toBe('"(required)"');
	expect(after(label('Optional').lastElementChild)).toBe('none');
	// Raw text has no element to carry it, so the label draws the marker after the text.
	expect(after(label('Raw *'))).toBe('"*"');
	expect(after(label('Raw *').lastElementChild)).toBe('none');
});

// React Aria provides slotted `Text` context inside a checkbox field, and `Text` throws without a
// slot. `CheckboxContent` clears it, so ordinary `Text` and `VisuallyHidden` render in the label.
test('Text and VisuallyHidden render inside CheckboxContent', () => {
	render(
		<CheckboxRoot>
			<CheckboxContent>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				<Text elementType="span">Visible</Text>
				<VisuallyHidden> hidden context</VisuallyHidden>
			</CheckboxContent>
		</CheckboxRoot>,
	);

	expect(checkbox('Visible hidden context')).toBeInTheDocument();
});

test('CheckboxContent accepts a render function for its children', () => {
	render(
		<CheckboxRoot defaultSelected>
			<CheckboxContent>
				{({ isSelected }) => (
					<>
						<CheckboxControl>
							<CheckboxIndicator />
						</CheckboxControl>
						<Text elementType="span">{isSelected ? 'On' : 'Off'}</Text>
					</>
				)}
			</CheckboxContent>
		</CheckboxRoot>,
	);

	expect(checkbox('On')).toBeChecked();
});

test('a composed checkbox has no axe violations', async () => {
	const { container } = render(
		<CheckboxRoot isRequired>
			<InlineField description="Example description" errorMessage="Example error">
				{parts('Example checkbox')}
			</InlineField>
		</CheckboxRoot>,
	);

	await expectNoAxeViolations(container);
});
