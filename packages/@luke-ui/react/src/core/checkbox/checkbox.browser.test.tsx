import { expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { fieldMessageIcon, fieldMessageIndent } from '../primitives/field/recipe.js';
import { render } from '../test-utils/render.js';
import { textLineHeight } from '../text/text-line-height.js';
import { Checkbox } from './checkbox.js';

testConformance({
	path: 'checkbox',
	getControl: (result) => {
		const control = result.locator.getByRole('checkbox', { name: 'Terms' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a checkbox control.');
		return control;
	},
	render: (props = {}) => {
		return render(<Checkbox {...props}>Terms</Checkbox>);
	},
});

testIntegration('checkbox', async () => {
	let selected = false;
	const { locator, user } = render(
		<Checkbox onChange={(isSelected) => (selected = isSelected)}>Terms</Checkbox>,
	);

	await user.click(locator.getByText('Terms'));
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(selected).toBe(true);
});

test('selected hover uses the filled hover fill, not the unselected hover border', async () => {
	const selectedRest = await indicatorComputedStyle({ selected: true });
	const selectedHover = await indicatorComputedStyle({ hovered: true, selected: true });
	const unselectedHover = await indicatorComputedStyle({ hovered: true });
	expect(selectedHover.backgroundColor).not.toBe(selectedRest.backgroundColor);
	expect(selectedHover.borderColor).not.toBe(unselectedHover.borderColor);
});

test('invalid selected uses the danger fill, not the accent fill', async () => {
	const accent = await indicatorComputedStyle({ selected: true });
	const danger = await indicatorComputedStyle({ invalid: true, selected: true });
	expect(danger.backgroundColor).not.toBe(accent.backgroundColor);
	expect(danger.color).not.toBe(accent.color);
});

test('invalid selected hover uses the danger hover fill, not the accent hover fill', async () => {
	const accentHover = await indicatorComputedStyle({ hovered: true, selected: true });
	const dangerHover = await indicatorComputedStyle({
		hovered: true,
		invalid: true,
		selected: true,
	});
	expect(dangerHover.backgroundColor).not.toBe(accentHover.backgroundColor);
});

test('disabled selected hover keeps the resting selected fill', async () => {
	const { container, user } = render(
		<Checkbox defaultSelected isDisabled name="competing">
			Competing
		</Checkbox>,
	);
	const indicator = checkboxIndicator(container);
	const rest = getComputedStyle(indicator).backgroundColor;
	await user.hover(checkboxContent(container));
	expect(getComputedStyle(indicator).backgroundColor).toBe(rest);
});

test('disabled content keeps the disabled cursor when also read-only', () => {
	const { container } = render(
		<Checkbox isDisabled isReadOnly name="competing">
			Competing
		</Checkbox>,
	);
	const enabled = render(
		<Checkbox isReadOnly name="readonly">
			Read only
		</Checkbox>,
	);
	const content = checkboxContent(container);
	expect(getComputedStyle(content).cursor).toBe('not-allowed');
	expect(getComputedStyle(content).color).not.toBe(
		getComputedStyle(checkboxContent(enabled.container)).color,
	);
});

test('sets Field message custom properties on the checkbox root', () => {
	const { container } = render(
		<Checkbox errorMessage="Choose an option." name="message-vars">
			Terms
		</Checkbox>,
	);
	const root = container.firstElementChild;
	if (!(root instanceof HTMLElement)) throw new Error('Expected checkbox root.');
	expect(getComputedStyle(root).getPropertyValue(fieldMessageIcon).trim()).toBe('inline-block');
	expect(getComputedStyle(root).getPropertyValue(fieldMessageIndent).trim()).not.toBe('');
	expect(textLineHeight).toBe('var(--text-line-height)');
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

type IndicatorState = {
	disabled?: boolean;
	hovered?: boolean;
	invalid?: boolean;
	selected?: boolean;
};

function checkboxContent(container: HTMLElement): HTMLElement {
	const content = container.querySelector('label');
	if (!(content instanceof HTMLElement)) throw new Error('Expected checkbox content.');
	return content;
}

function checkboxIndicator(container: HTMLElement): HTMLElement {
	const indicator = checkboxContent(container).querySelector('[aria-hidden="true"]');
	if (!(indicator instanceof HTMLElement)) throw new Error('Expected checkbox indicator.');
	return indicator;
}

function applyPointerState(content: HTMLElement, state: IndicatorState): void {
	if (state.hovered === true) content.setAttribute('data-hovered', 'true');
}

async function indicatorComputedStyle(state: IndicatorState) {
	const { container, user } = render(
		<Checkbox
			errorMessage={state.invalid === true ? 'Choose an option.' : undefined}
			isDisabled={state.disabled}
			isSelected={state.selected}
			name="competing"
		>
			Competing
		</Checkbox>,
	);
	const content = checkboxContent(container);
	if (state.hovered === true) await user.hover(content);
	applyPointerState(content, state);
	const style = getComputedStyle(checkboxIndicator(container));
	return {
		backgroundColor: style.backgroundColor,
		borderColor: style.borderTopColor,
		color: style.color,
	};
}
