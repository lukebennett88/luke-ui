import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Strong } from '@luke-ui/react/strong';
import { Text } from '@luke-ui/react/text';
import { createRef } from 'react';
import { CheckboxFieldContext } from 'react-aria-components';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { getTextStart, measureFieldError } from '../test-utils/measure-field-error.js';
import { flatAppearances, render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';

function CheckboxScene() {
	return (
		<Stack>
			<CheckboxField label="Default" name="default" />
			<CheckboxField defaultSelected label="Selected" name="selected" />
			<CheckboxField isIndeterminate label="Indeterminate" name="indeterminate" />
			<CheckboxField defaultSelected isDisabled label="Disabled" name="disabled" />
			<CheckboxField
				defaultSelected
				errorMessage="Choose an option."
				label="Invalid"
				name="invalid"
			/>
			<CheckboxField
				description="Receive updates by email."
				label="Email notifications"
				name="description-small"
				size="small"
			/>
			<CheckboxField
				description="This supporting text wraps onto a second line and should still start at the field's inline edge, not under the label."
				label="Email notifications"
				name="description-wrapping"
			/>
			<CheckboxField
				description="Receive updates by email."
				label="Email notifications"
				name="description-large"
				size="large"
			/>
			<CheckboxField
				defaultSelected
				description="Receive updates by email."
				errorMessage="Choose an option."
				label="Email notifications"
				name="description-with-error"
			/>
			<CheckboxField
				description="Receive updates by email."
				isDisabled
				label="Email notifications"
				name="description-disabled"
			/>
			<Text elementType="div" typography="heading3">
				<CheckboxField
					label="heading3: This label wraps to show that the control aligns with its first line."
					name="text-heading3"
				/>
			</Text>
			<CheckboxField label="Standalone control" name="standalone" />
			<CheckboxField
				defaultSelected
				errorMessage="Choose an option."
				label="This label wraps onto a second line so the control should sit on the first line, not float at the row's top edge."
				name="invalid-wrapping"
			/>
			<CheckboxField
				defaultSelected
				errorMessage="This error message wraps onto a second and third line so the icon should sit on the first line, not centre itself against the whole block."
				label="Accept the terms"
				name="invalid-wrapping-message"
			/>
			<CheckboxField
				defaultSelected
				errorMessage={
					<>
						Please accept the <strong>updated terms</strong> before continuing.
					</>
				}
				label="Accept the terms"
				name="invalid-rich-message"
			/>
		</Stack>
	);
}

/** The input for a checkbox, found by its accessible name. */
function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a checkbox "${name}".`);
	return element;
}

/** The native `<label>` that holds a checkbox's control and label text. */
function labelFor(input: HTMLInputElement): HTMLLabelElement {
	const label = input.closest('label');
	if (label == null) throw new Error('Expected the checkbox input inside a label.');
	return label;
}

/** The element holding a piece of text. */
function textElement(text: string): HTMLElement {
	const element = page.getByText(text).element();
	if (!(element instanceof HTMLElement)) throw new Error(`Expected an HTML element for "${text}".`);
	return element;
}

/** The control span inside a checkbox's label. */
function controlFor(input: HTMLInputElement): HTMLElement {
	const control = labelFor(input).querySelector('[aria-hidden="true"]')?.parentElement;
	if (control == null) throw new Error('Expected the checkbox control.');
	return control;
}

/** A range from `start` to the end of a text node. */
function textRange(text: Text, start: number): Range {
	const range = document.createRange();
	range.setStart(text, start);
	range.setEnd(text, text.data.length);
	return range;
}

test('CheckboxField resolves ref to the root, resolves object and callback inputRef to the control, participates in a form, and fires onBlur', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	let blurred = false;
	const { container, locator } = render(
		<>
			<CheckboxField
				inputRef={inputRef}
				label="Terms"
				name="terms"
				onBlur={() => {
					blurred = true;
				}}
				ref={ref}
			/>
			<CheckboxField
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				label="Callback"
				name="terms-callback"
			/>
		</>,
	);
	const control = locator.getByRole('checkbox', { name: 'Terms' }).element();
	const callbackControl = locator.getByRole('checkbox', { name: 'Callback' }).element();

	expect(ref.current?.tagName).toBe('DIV');
	expect(ref.current?.contains(control)).toBe(true);
	expect(inputRef.current).toBe(control);
	expect(callbackResolved.at(-1)).toBe(callbackControl);

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	const namedControl = form.elements.namedItem('terms');
	if (!(namedControl instanceof HTMLInputElement)) {
		throw new Error('Expected a native checkbox input named terms.');
	}
	namedControl.checked = true;
	namedControl.value = 'accepted';
	expect(new FormData(form).get('terms')).toBe('accepted');

	if (!(control instanceof HTMLElement)) throw new Error('Expected an HTML control.');
	control.focus();
	control.blur();
	expect(blurred).toBe(true);

	form.remove();
});

test('CheckboxField renders its label inside the clickable label', async () => {
	render(<CheckboxField label="Terms" name="terms" />);
	const input = checkbox('Terms');

	expect(labelFor(input).textContent).toBe('Terms');

	await userEvent.click(page.getByText('Terms'));

	expect(input).toBeChecked();
});

test('CheckboxField renders Luke UI typography inside its label', () => {
	render(
		<CheckboxField
			label={
				<>
					Accept the <Strong>terms</Strong>
				</>
			}
			name="terms"
		/>,
	);

	expect(checkbox('Accept the terms')).toBeInTheDocument();
});

test('a disabled or read-only CheckboxField keeps its selection', async () => {
	const changes: Array<boolean> = [];
	render(
		<>
			<CheckboxField isDisabled label="Disabled" onChange={(value) => changes.push(value)} />
			<CheckboxField isReadOnly label="Read only" onChange={(value) => changes.push(value)} />
		</>,
	);

	expect(checkbox('Disabled')).toBeDisabled();

	await userEvent.click(page.getByText('Read only'));

	expect(checkbox('Read only')).not.toBeChecked();
	expect(changes).toEqual([]);
});

test('CheckboxField runs a validate function', async () => {
	render(
		<form>
			<CheckboxField
				label="Terms"
				name="terms"
				validate={(isSelected) => (isSelected ? null : 'Accept the terms to continue.')}
			/>
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(input)).toBe('Accept the terms to continue.');
	expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('the control renders before the label', () => {
	render(<CheckboxField label="Terms" name="terms" />);
	const control = controlFor(checkbox('Terms'));

	expect(control.nextSibling?.textContent).toBe('Terms');
});

// The marker is hidden from assistive technology, so the label's text shows it and the name does not.
test('a required CheckboxField marks its label with its necessityIndicator', () => {
	render(
		<>
			<CheckboxField isRequired label="Checkbox asterisk" name="checkbox-asterisk" />
			<CheckboxField
				isRequired
				label="Checkbox words"
				name="checkbox-words"
				necessityIndicator="required-label"
			/>
		</>,
	);
	const asterisk = checkbox('Checkbox asterisk');
	const words = checkbox('Checkbox words');

	expect(asterisk).toBeRequired();
	expect(labelFor(asterisk).textContent).toBe('Checkbox asterisk\u00A0*');
	expect(words).toBeRequired();
	expect(labelFor(words).textContent).toBe('Checkbox words\u00A0(required)');
});

test('an optional CheckboxField shows no marker', () => {
	render(<CheckboxField label="Optional" name="optional" />);
	const input = checkbox('Optional');

	expect(input).not.toBeRequired();
	expect(labelFor(input).textContent).toBe('Optional');
});

const requiredCheckboxFieldContext = { isRequired: true };

test('a CheckboxField without isRequired keeps isRequired from React Aria context', () => {
	render(
		<CheckboxFieldContext.Provider value={requiredCheckboxFieldContext}>
			<CheckboxField label="Terms" necessityIndicator="optional-label" />
			<CheckboxField label="Required asterisk" />
		</CheckboxFieldContext.Provider>,
	);
	const optionalLabel = checkbox('Terms');
	const asterisk = checkbox('Required asterisk');

	expect(optionalLabel).toBeRequired();
	expect(labelFor(optionalLabel).textContent).toBe('Terms');
	expect(asterisk).toBeRequired();
	expect(labelFor(asterisk).textContent).toBe('Required asterisk\u00A0*');
});

// Layout is the contract: in a container that only fits the label text, the label wraps before its
// last word instead of leaving the marker alone on the next line.
for (const { accessibleName, label, necessityIndicator, ...fieldProps } of [
	{ accessibleName: 'Accept the terms', isRequired: true, label: 'Accept the terms' },
	{
		accessibleName: 'Accept the terms (optional)',
		label: 'Accept the terms',
		necessityIndicator: 'optional-label' as const,
	},
]) {
	test(`the ${necessityIndicator ?? 'required-asterisk'} marker stays on the line of the last label word`, () => {
		render(
			<div data-testid="frame">
				<CheckboxField
					{...fieldProps}
					label={label}
					name="terms"
					necessityIndicator={necessityIndicator}
				/>
			</div>,
		);
		const frame = page.getByTestId('frame').element();
		if (!(frame instanceof HTMLElement)) throw new Error('Expected an HTML frame.');
		const labelText = controlFor(checkbox(accessibleName)).nextElementSibling;
		const text = labelText?.firstChild;
		const marker = labelText?.lastElementChild;
		// `Text` here is the Luke UI component, so check against the DOM's `Text` node type.
		if (!(text instanceof window.Text) || marker == null) {
			throw new Error('Expected text, then the marker.');
		}

		const textEnd = textRange(text, 0).getBoundingClientRect().right;
		frame.style.inlineSize = `${Math.ceil(textEnd - frame.getBoundingClientRect().left)}px`;
		const firstLine = textRange(text, 0).getClientRects()[0];
		const lastWord = textRange(text, text.data.lastIndexOf(' ') + 1).getBoundingClientRect();
		const markerBox = marker.getBoundingClientRect();
		if (firstLine == null) throw new Error('Expected the label text to render.');

		expect(lastWord.top).toBeGreaterThan(firstLine.top);
		expect(markerBox.top).toBe(lastWord.top);
		expect(markerBox.left).toBeGreaterThanOrEqual(lastWord.right - 1);
	});
}

test('an errorMessage marks the checkbox invalid and shows the error under the label', () => {
	render(<CheckboxField errorMessage="Choose an option." label="Terms" name="terms" />);
	const input = checkbox('Terms');
	const error = textElement('Choose an option.');

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(input)).toBe('Choose an option.');
	expect(error.getBoundingClientRect().top).toBeGreaterThanOrEqual(
		labelFor(input).getBoundingClientRect().bottom,
	);
});

// A required checkbox has no error message of its own. React Aria's native validation supplies one
// after a submit, so Luke UI must render the error slot with no `errorMessage`.
test('a required CheckboxField shows its native validation message after a failed submit', async () => {
	render(
		<form>
			<CheckboxField isRequired label="Terms" name="terms" />
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms');

	expect(input).not.toHaveAttribute('aria-invalid', 'true');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
});

test('the CheckboxField scene has no axe violations', async () => {
	const { container } = render(
		<>
			<CheckboxScene />
			<CheckboxField
				description="Example description"
				errorMessage="Example error"
				isRequired
				label="Required"
			/>
			<CheckboxField isRequired label="Required words" necessityIndicator="required-label" />
		</>,
	);

	await expectNoAxeViolations(container);
});

// The error hangs at the label's inline edge, not under the control. The icon is centred on the
// message's first line, and wrapped lines align with the first.
test('the CheckboxField error text starts at the label text and its icon sits on the first line', () => {
	const errorMessage =
		'Accept the terms to continue. This message wraps onto a second line to check its alignment.';
	const { container } = render(
		<Stack width="16rem">
			<CheckboxField
				defaultSelected
				errorMessage={errorMessage}
				label="Accept the terms"
				name="terms"
			/>
		</Stack>,
	);

	const input = page.getByRole('checkbox', { name: 'Accept the terms' }).element();
	const measurement = measureFieldError(page.getByText(errorMessage).element());
	const labelStart = getTextStart(container, 'Accept the terms');

	expect(input).toHaveAccessibleDescription(errorMessage);
	expect(measurement.firstLineStart).toBeCloseTo(labelStart, 0);
	expect(measurement.secondLineStart).toBeCloseTo(labelStart, 0);
	expect(Math.abs(measurement.iconCentre - measurement.firstLineCentre)).toBeLessThan(1);
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<CheckboxScene />, { appearance });
		await captureVisualAppearance(locator, 'checkbox-field/kitchen-sink', appearance);
	}
});

// Only `danger.solid.rest` carries the 3:1 control-boundary guarantee. Off and on invalid boxes use
// different selector branches (subtle vs solid fill), and hover/pressed are separate rules, so each
// combination must keep the border.
for (const isSelected of [false, true]) {
	for (const state of ['data-hovered', 'data-pressed'] as const) {
		test(`an invalid ${isSelected ? 'on' : 'off'} checkbox keeps the guaranteed border with ${state}`, () => {
			render(<CheckboxField defaultSelected={isSelected} errorMessage="Required" label="Accept" />);
			const input = checkbox('Accept');
			const label = labelFor(input);
			const indicator = label.querySelector<HTMLElement>('[aria-hidden="true"]');
			if (indicator == null) throw new Error('Expected the checkbox indicator.');
			indicator.style.transition = 'none';
			label.setAttribute(state, 'true');

			expect(getComputedStyle(indicator).borderTopColor).toBe(
				resolvedBorderColor(label, 'var(--luke-color-background-danger-solid-rest)'),
			);
		});
	}
}

// Regression: hover and pressed must look different from each other, and from rest, by colour
// alone. The flat fixture has no depth or control finish to tell them apart.
test('rest, hover, and pressed stay distinct without materials', { tags: ['visual'] }, async () => {
	for (const appearance of flatAppearances) {
		const { locator } = render(
			<Stack>
				{(['rest', 'hover', 'pressed'] as const).flatMap((state) => [
					<CheckboxField key={`off-${state}`} label={`Off, ${state}`} />,
					<CheckboxField defaultSelected key={`on-${state}`} label={`On, ${state}`} />,
				])}
			</Stack>,
			{ appearance },
		);
		for (const state of ['hover', 'pressed'] as const) {
			for (const name of [`Off, ${state}`, `On, ${state}`]) {
				const label = locator.getByRole('checkbox', { name }).element().closest('label');
				label?.setAttribute(state === 'hover' ? 'data-hovered' : 'data-pressed', 'true');
			}
		}
		await captureVisualAppearance(locator, 'checkbox-field/interaction-states', appearance);
	}
});

test('necessity markers', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack>
			<CheckboxField isRequired label="Accept the terms" name="icon" />
			<CheckboxField
				isRequired
				label="Accept the terms"
				name="label"
				necessityIndicator="required-label"
			/>
			<CheckboxField
				errorMessage="Choose an option."
				isRequired
				label="Accept the terms"
				name="invalid"
			/>
			<CheckboxField
				isRequired
				label="This required label wraps onto a second line so the marker sits after its last word."
				name="wrapping"
			/>
			<CheckboxField
				isRequired
				label="This required label wraps onto a second line so the marker follows."
				name="wrapping-words"
				necessityIndicator="required-label"
			/>
		</Stack>,
	);
	await captureVisual(locator, 'checkbox-field/necessity-markers');
});

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(<CheckboxField label="Focus me" name="focus" />);
	await focusViaKeyboard(page.getByRole('checkbox', { name: 'Focus me' }));
	await captureVisual(locator, 'checkbox-field/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<CheckboxField label="Default" name="default" />
				<CheckboxField defaultSelected label="Selected" name="selected" />
				<CheckboxField defaultSelected isDisabled label="Disabled" name="disabled" />
				<CheckboxField
					defaultSelected
					errorMessage="Choose an option."
					label="Invalid"
					name="invalid"
				/>
				<CheckboxField
					defaultSelected
					errorMessage="Choose an option."
					isDisabled
					label="Disabled invalid"
					name="disabled-invalid"
				/>
			</Stack>,
		);
		await captureVisual(locator, 'checkbox-field/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});

/** Resolves a colour the way the browser would for a border, in the same theme scope. */
function resolvedBorderColor(scope: Element, color: string): string {
	const probe = scope.appendChild(document.createElement('span'));
	probe.style.borderTop = `1px solid ${color}`;
	const resolved = getComputedStyle(probe).borderTopColor;
	probe.remove();
	return resolved;
}
