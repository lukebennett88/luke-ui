import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual } from '../test-utils/render-visual.js';
import { Checkbox } from './index.js';

afterEach(() => {
	cleanupVisual();
});

// Proves the invalid cue survives without `errorMessage`, which `composeField` treats
// as optional — the case #247 flags as otherwise colour-only and imperceptible. Unlike
// TextField/ComboboxField (whose in-control icon carries this), Checkbox has no message
// to attach an icon to here, so its box's own 2px border is the whole non-colour cue.
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

	expect(getComputedStyle(indicator).borderWidth).toBe('2px');
});

// #247/#312: with an `errorMessage`, the icon that used to sit on `content` now leads
// the message instead — proves both halves of the cue at once: the box keeps its 2px
// border regardless, and the message grows the leading icon `field.css.ts` gates behind
// `fieldMessageIcon`.
test('invalid with an error message shows the 2px box and the message-leading icon', async () => {
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
	expect(getComputedStyle(indicator).borderWidth).toBe('2px');

	const message = page.getByText('Choose an option.');
	await expect.element(message).toBeVisible();
	const icon = getComputedStyle(message.element(), '::before');
	expect(icon.content).toBe('""');
	expect(icon.display).not.toBe('none');
	expect(icon.maskImage).not.toBe('none');
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

// #247/#312's invalid icon now lives on the error message, not on `content` (the
// native `<label>` wrapping the hidden input, which otherwise takes its name from
// its contents), so there is nothing on the label itself for accessible-name
// computation to pick up regardless. This CDP-based assertion predates that move —
// it originally guarded a text-glyph badge that _did_ sit on `content` — and is kept
// as the right belt-and-braces regression guard against a future icon landing back
// inside the label, since the test libraries in this stack (Vitest browser mode's
// own port of Playwright's locator engine, and the `dom-accessibility-api` package
// behind jest-dom's `toHaveAccessibleName`) are JS reimplementations of the accname
// algorithm that can diverge from a real browser's computation in edge cases like
// that one.
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
