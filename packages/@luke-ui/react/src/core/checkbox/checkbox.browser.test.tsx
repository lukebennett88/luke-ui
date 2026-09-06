import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { cdp, page } from 'vite-plus/test/context';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import {
	CheckboxContent,
	CheckboxControl,
	CheckboxIndicator,
	Checkbox as PrimitiveCheckbox,
} from '../primitives/checkbox/checkbox.js';
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

test('an indicator outside content receives the field state', () => {
	const selected = render(
		<PrimitiveCheckbox isSelected>
			<CheckboxContent>Selected</CheckboxContent>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
		</PrimitiveCheckbox>,
	);
	const unselected = render(
		<PrimitiveCheckbox>
			<CheckboxContent>Unselected</CheckboxContent>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
		</PrimitiveCheckbox>,
	);

	const selectedIndicator = selected.container.querySelector('[aria-hidden="true"]');
	const unselectedIndicator = unselected.container.querySelector('[aria-hidden="true"]');
	if (!(selectedIndicator instanceof HTMLElement)) throw new Error('Expected selected indicator.');
	if (!(unselectedIndicator instanceof HTMLElement))
		throw new Error('Expected unselected indicator.');
	// The recipe resolves `isSelected` into a distinct compound-variant class, so a differing
	// className (not its resolved colour) is the state-agnostic proof that `isSelected` reached
	// an indicator rendered outside `CheckboxContent`, through context rather than through props.
	expect(selectedIndicator.className).not.toBe(unselectedIndicator.className);
});

test('content render receives merged recipe and consumer props', () => {
	const xstyle = stylex.create({ content: { letterSpacing: '0.1px' } }).content;
	const expectedXStyleClass = stylex.props(xstyle).className;
	let receivedClassName = '';
	let receivedOpacity: unknown;
	let receivedSelected: boolean | undefined;

	const { container } = render(
		<PrimitiveCheckbox>
			<CheckboxContent
				className="consumer-content"
				style={{ opacity: 0.5 }}
				xstyle={xstyle}
				render={(domProps, renderProps) => {
					receivedClassName = domProps.className ?? '';
					receivedOpacity = domProps.style?.opacity;
					receivedSelected = renderProps.isSelected;
					// The hidden input is part of the children in domProps.
					// oxlint-disable-next-line jsx-a11y/label-has-associated-control
					return <label {...domProps} data-custom-render />;
				}}
			>
				Custom render
			</CheckboxContent>
		</PrimitiveCheckbox>,
	);

	const content = checkboxContent(container);
	if (expectedXStyleClass == null) throw new Error('Expected the xstyle class.');
	expect(content.hasAttribute('data-custom-render')).toBe(true);
	expect(receivedClassName).toContain(expectedXStyleClass);
	expect(receivedClassName).toContain('consumer-content');
	expect(receivedOpacity).toBe(0.5);
	expect(receivedSelected).toBe(false);
});

test('selected hover uses a distinct compound from the unselected hover border', async () => {
	const selectedRest = await indicatorClassName({ selected: true });
	const selectedHover = await indicatorClassName({ hovered: true, selected: true });
	const unselectedHover = await indicatorClassName({ hovered: true });
	// The recipe's selected-hover compound is a rule distinct from both the selected-rest compound
	// and the unselected-hover compound, so all three resolve to different classes. A colour
	// assertion here would pin appearance the visual suite doesn't actually capture: the
	// "interactive states" fixture only exercises hover on invalid variants, never the plain accent
	// selected/unselected pairing this test protects.
	expect(selectedHover).not.toBe(selectedRest);
	expect(selectedHover).not.toBe(unselectedHover);
});

// An indeterminate checkbox paints the same filled affordance as a selected one, so it must take
// the same hover and pressed fills. The state matrix previously covered these for the invalid
// palette but not the valid one, which left a hovered indeterminate box falling back to the
// unselected hover treatment.
test('indeterminate hover matches selected-and-indeterminate hover, not the unselected hover border', async () => {
	const indeterminateRest = await indicatorClassName({ indeterminate: true });
	const indeterminateHover = await indicatorClassName({ hovered: true, indeterminate: true });
	// `isSelected` and `isIndeterminate` are independent per the recipe's own contract (RAC reports
	// both true for a selected checkbox showing a mixed state), and the minus glyph always wins over
	// the checkmark when both are set. Comparing against a render that is BOTH selected and
	// indeterminate — rather than only selected — keeps the `::after` glyph class identical between
	// the two sides, so the only className difference left to assert on is the fill/border compound
	// this test actually protects, not an incidental glyph mismatch.
	const selectedAndIndeterminateHover = await indicatorClassName({
		hovered: true,
		indeterminate: true,
		selected: true,
	});
	const unselectedHover = await indicatorClassName({ hovered: true });

	// The regression this guards resolved indeterminate-hover to the unselected-hover compound
	// instead of its own, so the class it resolves to is exactly what proves the fix: it must match
	// the shared filled-hover compound, not the unselected-hover compound or its own resting class.
	// Comparing classes (not colours) keeps appearance owned by the visual suite, which — like the
	// plain selected/unselected pairing above — only captures invalid-variant hover.
	expect(indeterminateHover).toBe(selectedAndIndeterminateHover);
	expect(indeterminateHover).not.toBe(unselectedHover);
	expect(indeterminateHover).not.toBe(indeterminateRest);
});

test('invalid selected hover uses a distinct compound from the accent hover fill', async () => {
	const accentHover = await indicatorClassName({ hovered: true, selected: true });
	const dangerHover = await indicatorClassName({
		hovered: true,
		invalid: true,
		selected: true,
	});
	// Same rationale as the plain hover pairing above: the visual "interactive states" fixture
	// hovers only invalid variants, so it never captures this specific accent-hover-vs-danger-hover
	// comparison. The class identity is the appearance-agnostic proxy for "a distinct compound
	// matched", which is the regression class this test protects against.
	expect(dangerHover).not.toBe(accentHover);
});

test('disabled content keeps the disabled cursor when also read-only', () => {
	const { container } = render(
		<Checkbox isDisabled isReadOnly name="competing">
			Competing
		</Checkbox>,
	);
	const content = checkboxContent(container);
	expect(getComputedStyle(content).cursor).toBe('not-allowed');
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
	hovered?: boolean;
	indeterminate?: boolean;
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

/**
 * Renders a checkbox in the given state and returns its indicator's resolved className. The
 * recipe emits a distinct compound-variant class per matching state combination, so comparing
 * classNames proves which compound matched without pinning the appearance that compound paints.
 */
async function indicatorClassName(state: IndicatorState): Promise<string> {
	const { container, user } = render(
		<Checkbox
			errorMessage={state.invalid === true ? 'Choose an option.' : undefined}
			isIndeterminate={state.indeterminate}
			isSelected={state.selected}
			name="competing"
		>
			Competing
		</Checkbox>,
	);
	const content = checkboxContent(container);
	if (state.hovered === true) await user.hover(content);
	return checkboxIndicator(container).className;
}
