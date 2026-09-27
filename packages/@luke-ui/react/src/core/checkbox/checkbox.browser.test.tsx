import { Checkbox } from '@luke-ui/react/checkbox';
import { Text } from '@luke-ui/react/text';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
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
			<Checkbox name="default">Default</Checkbox>
			<Checkbox defaultSelected name="selected">
				Selected
			</Checkbox>
			<Checkbox isIndeterminate name="indeterminate">
				Indeterminate
			</Checkbox>
			<Checkbox defaultSelected isDisabled name="disabled">
				Disabled
			</Checkbox>
			<Checkbox defaultSelected errorMessage="Choose an option." name="invalid">
				Invalid
			</Checkbox>
			<Checkbox description="Receive updates by email." name="description-small" size="small">
				Email notifications
			</Checkbox>
			<Checkbox
				description="This supporting text wraps onto a second line and should still start at the field's inline edge, not under the label."
				name="description-wrapping"
			>
				Email notifications
			</Checkbox>
			<Checkbox description="Receive updates by email." name="description-large" size="large">
				Email notifications
			</Checkbox>
			<Checkbox
				defaultSelected
				description="Receive updates by email."
				errorMessage="Choose an option."
				name="description-with-error"
			>
				Email notifications
			</Checkbox>
			<Checkbox description="Receive updates by email." isDisabled name="description-disabled">
				Email notifications
			</Checkbox>
			<Text elementType="div" typography="heading3">
				<Checkbox name="text-heading3">
					heading3: This label wraps to show that the control aligns with its first line.
				</Checkbox>
			</Text>
			<Checkbox name="standalone">Standalone control</Checkbox>
			<Checkbox defaultSelected errorMessage="Choose an option." name="invalid-wrapping">
				This label wraps onto a second line so the control should sit on the first line, not float
				at the row's top edge.
			</Checkbox>
			<Checkbox
				defaultSelected
				errorMessage="This error message wraps onto a second and third line so the icon should sit on the first line, not centre itself against the whole block."
				name="invalid-wrapping-message"
			>
				Accept the terms
			</Checkbox>
			<Checkbox
				defaultSelected
				errorMessage={
					<>
						Please accept the <strong>updated terms</strong> before continuing.
					</>
				}
				name="invalid-rich-message"
			>
				Accept the terms
			</Checkbox>
		</Stack>
	);
}

// Luke UI widens RAC's `inputRef` to accept React Hook Form's callback ref.
test('Checkbox resolves object and callback inputRef to the control, participates in a form, and fires onBlur', () => {
	const inputRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLElement | null> = [];
	let blurred = false;
	const { container, locator } = render(
		<>
			<Checkbox
				inputRef={inputRef}
				name="terms"
				onBlur={() => {
					blurred = true;
				}}
			>
				Terms
			</Checkbox>
			<Checkbox
				inputRef={(node: HTMLElement | null) => {
					callbackResolved.push(node);
				}}
				name="terms-callback"
			>
				Callback
			</Checkbox>
		</>,
	);
	const control = locator.getByRole('checkbox', { name: 'Terms' }).element();
	const callbackControl = locator.getByRole('checkbox', { name: 'Callback' }).element();

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

test('the Checkbox scene has no axe violations', async () => {
	const { container } = render(<CheckboxScene />);

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
		<Checkbox defaultSelected errorMessage="Choose an option." name="invalid">
			Invalid
		</Checkbox>,
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

test('keyboard focus ring', { tags: ['visual'] }, async () => {
	const { locator } = render(<Checkbox name="focus">Focus me</Checkbox>);
	await focusViaKeyboard(page.getByRole('checkbox', { name: 'Focus me' }));
	await captureVisual(locator, 'checkbox/focus-visible');
});

test('forced-colors resting', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<Checkbox name="default">Default</Checkbox>
				<Checkbox defaultSelected name="selected">
					Selected
				</Checkbox>
				<Checkbox defaultSelected isDisabled name="disabled">
					Disabled
				</Checkbox>
				<Checkbox defaultSelected errorMessage="Choose an option." name="invalid">
					Invalid
				</Checkbox>
			</Stack>,
		);
		await captureVisual(locator, 'checkbox/forced-colors-resting');
	} finally {
		await emulateForcedColors('none');
	}
});
