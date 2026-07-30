import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { Checkbox } from './index.js';

afterEach(() => {
	cleanupVisual();
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional — the case #247 flags as otherwise colour-only and imperceptible.
test('invalid without an error message still carries a non-colour cue', async () => {
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

	const icon = getComputedStyle(content, '::after');
	expect(icon.content).toBe('""');
	expect(icon.maskImage).not.toBe('none');

	expect(getComputedStyle(indicator).borderWidth).toBe('2px');
});

test('valid indicator keeps the 1px boundary the invalid state widens', async () => {
	renderVisual(<Checkbox name="valid">Valid</Checkbox>);

	const checkbox = page.getByRole('checkbox', { name: 'Valid' });
	await expect.element(checkbox).toBeVisible();

	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	const indicator = content.querySelector<HTMLElement>('[aria-hidden="true"]');
	if (indicator == null) throw new Error('Expected the checkbox indicator.');

	expect(getComputedStyle(indicator).borderWidth).toBe('1px');
});

// The indicator is a CSS mask now, not a text glyph: its `content` is empty
// (`content: '""'`), so there is nothing for `CheckboxContent` (a native
// `<label>` wrapping the hidden input, which otherwise takes its name from its
// contents) to pick up as accessible-name text. The old badge used the CSS
// alt-text syntax (`content: "!" / ""`) for the same guarantee, which needed
// this CDP-based assertion because the test libraries in this stack (Vitest
// browser mode's own port of Playwright's locator engine, and the
// `dom-accessibility-api` package behind jest-dom's `toHaveAccessibleName`) are
// JS reimplementations of the accname algorithm that do not parse the `/ "alt"`
// delimiter at all. An empty `content` has no such gap — `getByRole`'s name
// matching would already prove this — but the guard is kept as the right belt-
// and-braces check against a future regression back to a text glyph.
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
