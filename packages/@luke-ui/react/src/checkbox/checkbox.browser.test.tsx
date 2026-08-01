import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { Checkbox } from './index.js';

afterEach(() => {
	cleanupVisual();
});

test('invalid without an error message keeps the 1px border', async () => {
	renderVisual(
		<Checkbox defaultSelected isInvalid name="invalid">
			Invalid
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid' });
	await expect.element(checkbox).toBeVisible();

	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	const indicator = content.querySelector<HTMLElement>('[aria-hidden="true"]');
	if (indicator == null) throw new Error('Expected the checkbox indicator.');

	expect(getComputedStyle(indicator).borderWidth).toBe('1px');
});

// With an `errorMessage`, the icon leading the message is the non-colour cue; the
// box itself stays colour-only.
test('invalid with an error message shows the message-leading icon', async () => {
	renderVisual(
		<Checkbox defaultSelected errorMessage="Choose an option." isInvalid name="invalid-message">
			Invalid
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid' });
	await expect.element(checkbox).toBeVisible();

	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	const indicator = content.querySelector<HTMLElement>('[aria-hidden="true"]');
	if (indicator == null) throw new Error('Expected the checkbox indicator.');
	expect(getComputedStyle(indicator).borderWidth).toBe('1px');

	const message = page.getByText('Choose an option.');
	await expect.element(message).toBeVisible();
	const icon = getComputedStyle(message.element(), '::before');
	expect(icon.content).toBe('""');
	expect(icon.display).not.toBe('none');
	expect(icon.maskImage).not.toBe('none');
});

// `fieldMessageIndent` exists to align the message's hang indent with the label
// text above it, icon width included. Pinned with real rendered text-node
// geometry rather than computed-style padding math, so a change to either side
// of the hang-indent calc trips this the moment the two texts stop lining up.
test('the error message text aligns with the label text, not the icon', async () => {
	renderVisual(
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

test('valid indicator has the same 1px border as invalid', async () => {
	renderVisual(<Checkbox name="valid">Valid</Checkbox>);

	const checkbox = page.getByRole('checkbox', { name: 'Valid' });
	await expect.element(checkbox).toBeVisible();

	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	const indicator = content.querySelector<HTMLElement>('[aria-hidden="true"]');
	if (indicator == null) throw new Error('Expected the checkbox indicator.');

	expect(getComputedStyle(indicator).borderWidth).toBe('1px');
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
	renderVisual(
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
