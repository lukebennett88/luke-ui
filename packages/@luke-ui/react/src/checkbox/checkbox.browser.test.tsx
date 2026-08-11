import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { testFieldShapedConformance, testIntegration } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { componentTestRegistration } from './component-test-registration.js';
import { Checkbox } from './index.js';

testFieldShapedConformance({
	assertAssociation: (result) => {
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(result.locator.getByRole('checkbox', { name: 'Terms' }).element()).toHaveAccessibleName(
			'Terms',
		);
	},
	getControl: (result) => {
		const control = result.locator.getByRole('checkbox', { name: 'Terms' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a checkbox control.');
		return control;
	},
	getTarget: (result) => {
		const target = result.container.querySelector('label');
		if (!(target instanceof HTMLElement)) throw new Error('Expected a checkbox label.');
		return target;
	},
	name: 'Checkbox',
	registration: componentTestRegistration,
	render: (props = {}) => {
		return render(<Checkbox {...props}>Terms</Checkbox>);
	},
});

testIntegration(componentTestRegistration, 'Checkbox', async () => {
	const { locator, user } = render(<Checkbox>Terms</Checkbox>);
	const checkbox = locator.getByRole('checkbox', { name: 'Terms' });

	await user.click(locator.getByText('Terms'));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(checkbox).toBeChecked();
});

// `fieldMessageIndent` exists to align the message's hang indent with the label
// text above it, icon width included. Pinned with real rendered text-node
// geometry rather than computed-style padding math, so a change to either side
// of the hang-indent calc trips this the moment the two texts stop lining up.
test('the error message text aligns with the label text, not the icon', async () => {
	render(
		<Checkbox errorMessage="Choose an option." isInvalid name="invalid-alignment">
			Invalid
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid' });
	await expect.element(checkbox).toBeVisible();

	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	const labelTextNode = Array.from(content.childNodes).find(
		(node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
	);
	if (labelTextNode == null) throw new Error('Expected the checkbox label text node.');

	const message = page.getByText('Choose an option.');
	await expect.element(message).toBeVisible();
	const messageTextNode = findTextNode(message.element(), 'Choose an option.');
	if (messageTextNode == null) throw new Error('Expected the error message text node.');

	const labelRect = rangeRectFor(labelTextNode);
	const messageRect = rangeRectFor(messageTextNode);

	expect(messageRect.left).toBeCloseTo(labelRect.left, 0);
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
		<Checkbox defaultSelected isInvalid name="invalid">
			Invalid
		</Checkbox>,
	);

	// Only a role-only lookup here: the name-matching arm of `getByRole` is exactly
	// the JS-reimplementation path this test deliberately bypasses.
	await expect.element(page.getByRole('checkbox')).toBeVisible();

	const inputNode = await findDomNodeByAttribute('name', 'invalid');
	if (inputNode == null)
		throw new Error('Expected the invalid checkbox input in the CDP DOM tree.');

	const axNode = await getAccessibilityNode(inputNode.nodeId);
	expect(axNode.role?.value).toBe('checkbox');
	expect(axNode.name?.value).toBe('Invalid');
});

// `inputRef` must land on the hidden `<input type="checkbox">`, not on the wrapper
// `<div>` React Aria's own `ref` targets.
test('resolves an inputRef object to the checkbox input, not a wrapper', async () => {
	const ref = createRef<HTMLInputElement>();
	render(
		<Checkbox inputRef={ref} name="terms">
			Terms
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Terms' });
	await expect.element(checkbox).toBeVisible();

	expect(ref.current).toBeInstanceOf(HTMLInputElement);
	expect(ref.current).toBe(checkbox.element());
});

// React Aria types its own `inputRef` as a ref object, so this is the case our
// widened prop plus the `useObjectRef` bridge exists for: React Hook Form's
// `field.ref` is a callback.
test('resolves a callback inputRef to the checkbox input', async () => {
	const resolved: Array<HTMLInputElement | null> = [];
	render(
		<Checkbox
			inputRef={(node) => {
				resolved.push(node);
			}}
			name="terms"
		>
			Terms
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Terms' });
	await expect.element(checkbox).toBeVisible();

	expect(resolved.at(-1)).toBeInstanceOf(HTMLInputElement);
	expect(resolved.at(-1)).toBe(checkbox.element());
});

test('forwards name to the input so a native form submit collects it', async () => {
	const { locator: scene } = render(
		<form>
			<Checkbox name="terms">Terms</Checkbox>
		</form>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Terms' });
	await expect.element(checkbox).toHaveAttribute('name', 'terms');

	const form = scene.element().querySelector('form');
	if (form == null) throw new Error('Expected the form element.');
	expect(new FormData(form).get('terms')).toBe(null);

	// The input itself is visually hidden behind the indicator, so the clickable
	// content label is the only hit target — same as every other test in this file.
	await userEvent.click(contentFor(checkbox));
	expect(new FormData(form).get('terms')).toBe('on');
});

test('forwards onBlur to the input', async () => {
	const blurs: Array<string> = [];
	render(
		<>
			<Checkbox
				name="terms"
				onBlur={() => {
					blurs.push('terms');
				}}
			>
				Terms
			</Checkbox>
			<button type="button">Next</button>
		</>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Terms' });
	await expect.element(checkbox).toBeVisible();

	// Tabbed rather than clicked: the input is visually hidden behind the indicator,
	// so it is not its own hit target.
	await userEvent.tab();
	await expect.element(checkbox).toHaveFocus();
	expect(blurs).toEqual([]);

	await userEvent.click(page.getByRole('button', { name: 'Next' }));
	expect(blurs).toEqual(['terms']);
});

/** The clickable `<label>` carrying the checkbox's interactive data attributes. */
function contentFor(checkbox: Locator): HTMLElement {
	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	return content;
}

/** A `Range` spanning `node`'s own content, for measuring rendered text geometry. */
function rangeRectFor(node: Node): DOMRect {
	const range = document.createRange();
	range.selectNodeContents(node);
	return range.getBoundingClientRect();
}

/** Depth-first search for a descendant text node whose content includes `text`. */
function findTextNode(root: Node, text: string): Node | undefined {
	if (root.nodeType === Node.TEXT_NODE && root.textContent?.includes(text)) return root;
	for (const child of Array.from(root.childNodes)) {
		const found = findTextNode(child, text);
		if (found != null) return found;
	}
	return undefined;
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
