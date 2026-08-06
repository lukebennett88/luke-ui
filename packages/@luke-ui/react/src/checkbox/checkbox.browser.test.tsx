import { createRef } from 'react';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import type { Locator } from 'vite-plus/test/context';
import { cleanupVisual, renderVisual, Stack } from '../test-utils/render-visual.js';
import { Checkbox } from './index.js';

// Freeze CSS transitions so colour reads are deterministic mid-interaction; the
// indicator animates its state colours over the fast motion token otherwise.
const freezeMotion = document.createElement('style');
freezeMotion.textContent = `
*, *::before, *::after {
	transition-delay: 0s !important;
	transition-duration: 0s !important;
}
`;
document.head.append(freezeMotion);

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

test('an invalid unchecked checkbox stays danger across rest, hover, and pressed', async () => {
	const scene = renderVisual(
		<Checkbox isInvalid name="invalid-unchecked">
			Invalid unchecked
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid unchecked' });
	await expect.element(checkbox).toBeVisible();
	const indicator = indicatorFor(checkbox);

	expect(getComputedStyle(indicator).borderColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-rest'),
	);

	await userEvent.hover(contentFor(checkbox));
	expect(getComputedStyle(indicator).borderColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-hover'),
	);
	await userEvent.unhover(contentFor(checkbox));

	await pressViaKeyboard(checkbox);
	expect(getComputedStyle(indicator).borderColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-pressed'),
	);
});

test('an invalid selected checkbox stays danger across rest, hover, and pressed', async () => {
	const scene = renderVisual(
		<Checkbox defaultSelected isInvalid name="invalid-selected">
			Invalid selected
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid selected' });
	await expect.element(checkbox).toBeVisible();
	const indicator = indicatorFor(checkbox);

	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-rest'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);

	await userEvent.hover(contentFor(checkbox));
	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-hover'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);
	await userEvent.unhover(contentFor(checkbox));

	await pressViaKeyboard(checkbox);
	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-pressed'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);
});

test('an invalid indeterminate checkbox stays danger across rest, hover, and pressed', async () => {
	const scene = renderVisual(
		<Checkbox isIndeterminate isInvalid name="invalid-indeterminate">
			Invalid indeterminate
		</Checkbox>,
	);

	const checkbox = page.getByRole('checkbox', { name: 'Invalid indeterminate' });
	await expect.element(checkbox).toBeVisible();
	const indicator = indicatorFor(checkbox);

	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-rest'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);

	await userEvent.hover(contentFor(checkbox));
	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-hover'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);
	await userEvent.unhover(contentFor(checkbox));

	await pressViaKeyboard(checkbox);
	expect(getComputedStyle(indicator).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-danger-solid-pressed'),
	);
	expect(getComputedStyle(indicator).color).toBe(
		resolvedColor(scene, '--luke-color-foreground-danger-on-solid'),
	);
});

test('invalid disabled and read-only checkboxes do not adopt interactive states', async () => {
	const scene = renderVisual(
		<Stack>
			<Checkbox defaultSelected isDisabled isInvalid name="invalid-disabled">
				Invalid disabled
			</Checkbox>
			<Checkbox defaultSelected isInvalid isReadOnly name="invalid-readonly">
				Invalid read-only
			</Checkbox>
		</Stack>,
	);

	const disabled = page.getByRole('checkbox', { name: 'Invalid disabled' });
	const readOnly = page.getByRole('checkbox', { name: 'Invalid read-only' });
	await expect.element(disabled).toBeVisible();

	const dangerRest = resolvedColor(scene, '--luke-color-background-danger-solid-rest');
	const disabledIndicator = indicatorFor(disabled);
	const readOnlyIndicator = indicatorFor(readOnly);

	expect(getComputedStyle(disabledIndicator).backgroundColor).toBe(dangerRest);
	expect(getComputedStyle(readOnlyIndicator).backgroundColor).toBe(dangerRest);

	await userEvent.hover(contentFor(disabled));
	await userEvent.hover(contentFor(readOnly));
	expect(getComputedStyle(disabledIndicator).backgroundColor).toBe(dangerRest);
	expect(getComputedStyle(readOnlyIndicator).backgroundColor).toBe(dangerRest);
	await userEvent.unhover(contentFor(disabled));
	await userEvent.unhover(contentFor(readOnly));

	await userEvent.tab();
	await userEvent.keyboard('{Space>}');
	expect(getComputedStyle(readOnlyIndicator).backgroundColor).toBe(dangerRest);
	await userEvent.keyboard('{/Space}');
});

test('a valid checkbox keeps its accent interaction colours', async () => {
	const scene = renderVisual(
		<Stack>
			<Checkbox name="valid-unchecked">Valid</Checkbox>
			<Checkbox defaultSelected name="valid-selected">
				Valid selected
			</Checkbox>
		</Stack>,
	);

	const unchecked = page.getByRole('checkbox', { name: 'Valid', exact: true });
	const selected = page.getByRole('checkbox', { name: 'Valid selected' });
	await expect.element(unchecked).toBeVisible();

	await userEvent.hover(contentFor(unchecked));
	expect(getComputedStyle(indicatorFor(unchecked)).borderColor).toBe(
		resolvedColor(scene, '--luke-color-border-accent'),
	);
	await userEvent.unhover(contentFor(unchecked));

	await userEvent.hover(contentFor(selected));
	expect(getComputedStyle(indicatorFor(selected)).backgroundColor).toBe(
		resolvedColor(scene, '--luke-color-background-accent-solid-hover'),
	);
	expect(getComputedStyle(indicatorFor(selected)).borderColor).toBe(
		resolvedColor(scene, '--luke-color-background-accent-solid-hover'),
	);
});

// `inputRef` must land on the hidden `<input type="checkbox">`, not on the wrapper
// `<div>` React Aria's own `ref` targets.
test('resolves an inputRef object to the checkbox input, not a wrapper', async () => {
	const ref = createRef<HTMLInputElement>();
	renderVisual(
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
	renderVisual(
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
	const scene = renderVisual(
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
	renderVisual(
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

/** Focuses `checkbox` with a real keyboard press and returns once it is held. */
async function pressViaKeyboard(checkbox: Locator) {
	await userEvent.tab();
	await expect.element(checkbox).toHaveFocus();
	await userEvent.keyboard('{Space>}');
}

/** The visual box inside a checkbox's content label, target of the recipe styles. */
function indicatorFor(checkbox: Locator): HTMLElement {
	const content = contentFor(checkbox);
	const indicator = content.querySelector<HTMLElement>('[aria-hidden="true"]');
	if (indicator == null) throw new Error('Expected the checkbox indicator.');
	return indicator;
}

/** The clickable `<label>` carrying the checkbox's interactive data attributes. */
function contentFor(checkbox: Locator): HTMLElement {
	const content = checkbox.element().closest('label');
	if (content == null) throw new Error('Expected the checkbox content label.');
	return content;
}

/** The computed colour a theme token resolves to inside the scene's theme root. */
function resolvedColor(scene: Locator, variable: string): string {
	const probe = scene.element().appendChild(document.createElement('span'));
	probe.style.backgroundColor = `var(${variable})`;
	const value = getComputedStyle(probe).backgroundColor;
	probe.remove();
	return value;
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
