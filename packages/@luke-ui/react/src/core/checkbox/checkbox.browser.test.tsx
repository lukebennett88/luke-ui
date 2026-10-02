import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { getTextStart, measureFieldError } from '../test-utils/measure-field-error.js';
import { render, visualAppearances } from '../test-utils/render.js';
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
			<Checkbox label="Default" name="default" />
			<Checkbox defaultSelected label="Selected" name="selected" />
			<Checkbox isIndeterminate label="Indeterminate" name="indeterminate" />
			<Checkbox defaultSelected isDisabled label="Disabled" name="disabled" />
			<Checkbox defaultSelected errorMessage="Choose an option." label="Invalid" name="invalid" />
			<Checkbox
				description="Receive updates by email."
				label="Email notifications"
				name="description-small"
				size="small"
			/>
			<Checkbox
				description="This supporting text wraps onto a second line and should still start at the field's inline edge, not under the label."
				label="Email notifications"
				name="description-wrapping"
			/>
			<Checkbox
				description="Receive updates by email."
				label="Email notifications"
				name="description-large"
				size="large"
			/>
			<Checkbox
				defaultSelected
				description="Receive updates by email."
				errorMessage="Choose an option."
				label="Email notifications"
				name="description-with-error"
			/>
			<Checkbox
				description="Receive updates by email."
				isDisabled
				label="Email notifications"
				name="description-disabled"
			/>
			<Text elementType="div" typography="heading3">
				<Checkbox
					label="heading3: This label wraps to show that the control aligns with its first line."
					name="text-heading3"
				/>
			</Text>
			<Checkbox label="Standalone control" name="standalone" />
			<Checkbox
				defaultSelected
				errorMessage="Choose an option."
				label="This label wraps onto a second line so the control should sit on the first line, not float at the row's top edge."
				name="invalid-wrapping"
			/>
			<Checkbox
				defaultSelected
				errorMessage="This error message wraps onto a second and third line so the icon should sit on the first line, not centre itself against the whole block."
				label="Accept the terms"
				name="invalid-wrapping-message"
			/>
			<Checkbox
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

// Luke UI widens RAC's `inputRef` to accept React Hook Form's callback ref.
test('Checkbox resolves ref to the root, resolves object and callback inputRef to the control, participates in a form, and fires onBlur', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	let blurred = false;
	const { container, locator } = render(
		<>
			<Checkbox
				inputRef={inputRef}
				label="Terms"
				name="terms"
				onBlur={() => {
					blurred = true;
				}}
				ref={ref}
			/>
			<Checkbox
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

test('Checkbox puts id on its root element and inputId on the input', () => {
	render(
		<Checkbox
			className="example-root"
			description="Example description"
			id="example-root"
			inputId="example-input"
			label="Example checkbox"
			name="example"
		/>,
	);
	const input = checkbox('Example checkbox');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(getDescribedText(input)).toBe('Example description');
});

test('Checkbox takes its name from a visible label, aria-label, or aria-labelledby', () => {
	render(
		<>
			<Checkbox label="Visible label" name="visible" />
			<Checkbox aria-label="Label attribute" name="attribute" />
			<span id="external-label">External label</span>
			<Checkbox aria-labelledby="external-label" name="external" />
		</>,
	);

	expect(checkbox('Visible label')).toHaveAttribute('name', 'visible');
	expect(checkbox('Label attribute')).toHaveAttribute('name', 'attribute');
	expect(checkbox('External label')).toHaveAttribute('name', 'external');
});

test('an externally named Checkbox renders the control alone', () => {
	render(<Checkbox aria-label="Select row" name="row" />);
	const input = checkbox('Select row');

	expect(labelFor(input).textContent).toBe('');
});

test('the control renders before the label', () => {
	render(<Checkbox label="Terms" name="terms" />);
	const control = controlFor(checkbox('Terms'));

	expect(control.nextSibling?.textContent).toBe('Terms');
});

// The marker is CSS content with no DOM node, so the accessible name is how the tests observe it.
// It follows the last word with no space before it.
test('a required Checkbox marks its label with its necessityIndicator', () => {
	render(
		<>
			<Checkbox isRequired label="Checkbox icon" name="checkbox-icon" />
			<Checkbox
				isRequired
				label="Checkbox words"
				name="checkbox-words"
				necessityIndicator="label"
			/>
		</>,
	);

	expect(checkbox('Checkbox icon*')).toBeInTheDocument();
	expect(checkbox('Checkbox words(required)')).toBeInTheDocument();
});

test('an optional or externally named Checkbox shows no marker', () => {
	render(
		<>
			<Checkbox label="Optional" name="optional" />
			<Checkbox aria-label="Select row" isRequired name="row" />
			<span id="external-label">External label</span>
			<Checkbox aria-labelledby="external-label" isRequired name="external" />
		</>,
	);

	expect(checkbox('Optional')).toHaveAccessibleName('Optional');
	expect(checkbox('Select row')).toHaveAccessibleName('Select row');
	expect(checkbox('External label')).toHaveAccessibleName('External label');
});

test('an errorMessage marks the checkbox invalid and shows the error under the label', () => {
	render(<Checkbox errorMessage="Choose an option." label="Terms" name="terms" />);
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
test('a required Checkbox shows its native validation message after a failed submit', async () => {
	render(
		<form>
			<Checkbox isRequired label="Terms" name="terms" />
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms*');

	expect(input).not.toHaveAttribute('aria-invalid', 'true');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');
	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
});

test('Checkbox size changes the control size', () => {
	render(
		<>
			<Checkbox label="Small" size="small" />
			<Checkbox label="Large" size="large" />
		</>,
	);
	const small = controlFor(checkbox('Small')).getBoundingClientRect().width;
	const large = controlFor(checkbox('Large')).getBoundingClientRect().width;

	expect(small).toBeLessThan(large);
});

test('the Checkbox scene has no axe violations', async () => {
	const { container } = render(
		<>
			<CheckboxScene />
			<Checkbox
				aria-label="Select row"
				description="One row."
				errorMessage="Pick one."
				isRequired
			/>
			<span id="external-label">External label</span>
			<Checkbox aria-labelledby="external-label" />
			<Checkbox isRequired label="Required" necessityIndicator="label" />
		</>,
	);

	await expectNoAxeViolations(container);
});

// The invalid icon lives on the error message, not on `content` (the native
// `<label>` wrapping the hidden input, which otherwise takes its name from its
// contents), so there is nothing on the label itself for accessible-name
// computation to pick up. Checked via CDP against the browser's own accname
// computation, not Vitest browser mode's locator engine or the
// `dom-accessibility-api` package behind `toHaveAccessibleName` — both are JS
// reimplementations of the accname algorithm that can diverge from a real
// browser in edge cases.
test('the icon indicator stays out of the accessible name', async () => {
	render(
		<Checkbox defaultSelected errorMessage="Choose an option." label="Invalid" name="invalid" />,
	);

	// Only a role-only lookup here: the name-matching arm of `getByRole` is exactly
	// the JS-reimplementation path this test deliberately bypasses.
	page.getByRole('checkbox').element();

	const inputNode = await findDomNodeByAttribute('name', 'invalid');
	if (inputNode == null)
		throw new Error('Expected the invalid checkbox input in the CDP DOM tree.');

	const axNode = await getAccessibilityNode(inputNode.nodeId);
	expect(axNode.name?.value).toBe('Invalid');
});

// The error hangs at the label's inline edge at every size, not under the control. The icon
// is centred on the message's first line, and wrapped lines align with the first.
for (const size of ['small', 'medium', 'large'] as const) {
	test(`the ${size} Checkbox error text starts at the label text and its icon sits on the first line`, () => {
		const errorMessage =
			'Accept the terms to continue. This message wraps onto a second line to check its alignment.';
		const { container } = render(
			<Stack width="16rem">
				<Checkbox
					defaultSelected
					errorMessage={errorMessage}
					label="Accept the terms"
					name="terms"
					size={size}
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
}

/** Fetches the CDP DOM tree root, piercing into the Vitest iframe and any shadow roots. */
async function getDomRoot() {
	const { root } = await cdp().send('DOM.getDocument', { depth: -1, pierce: true });
	return root;
}

/** The CDP DOM node shape, inferred from `DOM.getDocument`'s own response type. */
type DomNode = Awaited<ReturnType<typeof getDomRoot>>;

/** Reads one attribute from a DOM node's flat `[name1, value1, name2, value2, …]` array. */
function domAttribute(node: DomNode, name: string): string | undefined {
	const attributes = node.attributes ?? [];
	for (let index = 0; index < attributes.length; index += 2) {
		if (attributes[index] === name) return attributes[index + 1];
	}
	return undefined;
}

/**
 * Depth-first search for a DOM node with the given attribute value, piercing into
 * iframe content documents and shadow roots. The test renders inside Vitest's own
 * iframe, so this must walk past the top-level page document to reach it.
 */
function findNodeIn(node: DomNode, attribute: string, value: string): DomNode | undefined {
	if (domAttribute(node, attribute) === value) return node;

	for (const child of node.children ?? []) {
		const found = findNodeIn(child, attribute, value);
		if (found != null) return found;
	}
	if (node.contentDocument != null) {
		const found = findNodeIn(node.contentDocument, attribute, value);
		if (found != null) return found;
	}
	for (const shadowRoot of node.shadowRoots ?? []) {
		const found = findNodeIn(shadowRoot, attribute, value);
		if (found != null) return found;
	}
	return undefined;
}

async function findDomNodeByAttribute(
	attribute: string,
	value: string,
): Promise<DomNode | undefined> {
	const root = await getDomRoot();
	return findNodeIn(root, attribute, value);
}

/** Fetches the CDP accessibility node for one DOM node. */
async function getAccessibilityNode(nodeId: DomNode['nodeId']) {
	await cdp().send('Accessibility.enable');
	const { nodes } = await cdp().send('Accessibility.getPartialAXTree', {
		fetchRelatives: false,
		nodeId,
	});
	const [axNode] = nodes;
	if (axNode == null) throw new Error('Expected a partial accessibility tree for the node.');
	return axNode;
}

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<CheckboxScene />, { appearance });
		await captureVisualAppearance(locator, 'checkbox/kitchen-sink', appearance);
	}
});

test('necessity markers', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack>
			<Checkbox isRequired label="Accept the terms" name="icon" />
			<Checkbox isRequired label="Accept the terms" name="label" necessityIndicator="label" />
			<Checkbox
				errorMessage="Choose an option."
				isRequired
				label="Accept the terms"
				name="invalid"
			/>
			<Checkbox
				isRequired
				label="This required label wraps onto a second line so the marker sits after its last word."
				name="wrapping"
			/>
			<Checkbox
				isRequired
				label="This required label wraps onto a second line so the marker follows."
				name="wrapping-words"
				necessityIndicator="label"
			/>
			<Checkbox aria-label="Select row" isRequired name="external" />
		</Stack>,
	);
	await captureVisual(locator, 'checkbox/necessity-markers');
});

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(<Checkbox label="Focus me" name="focus" />);
	await focusViaKeyboard(page.getByRole('checkbox', { name: 'Focus me' }));
	await captureVisual(locator, 'checkbox/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<Checkbox label="Default" name="default" />
				<Checkbox defaultSelected label="Selected" name="selected" />
				<Checkbox defaultSelected isDisabled label="Disabled" name="disabled" />
				<Checkbox defaultSelected errorMessage="Choose an option." label="Invalid" name="invalid" />
			</Stack>,
		);
		await captureVisual(locator, 'checkbox/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});
