import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Text } from '../text/text.js';
import { Kbd } from './kbd.js';

testConformance({
	path: 'kbd',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Kbd element.');
		return target;
	},
	render: (props = {}) => render(<Kbd {...props}>⌘</Kbd>),
});

function getKbdElement(container: HTMLElement): HTMLElement {
	const target = container.querySelector('kbd');
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Kbd element.');
	return target;
}

function getTextElement(container: HTMLElement): HTMLElement {
	const target = container.querySelector('span');
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Text element.');
	return target;
}

// `kbdRecipe` is emitted after `textRecipe` in the shared stylesheet, so it wins the source-order
// tie for the properties it owns. It leaves `letterSpacing` unset so it keeps inheriting.
test('letterSpacing inherits from the surrounding Text typography', async () => {
	const { container } = render(
		<Text typography="lead">
			Press <Kbd>⌘</Kbd>
		</Text>,
	);
	const surroundingText = getTextElement(container);
	const kbd = getKbdElement(container);

	const { container: bodyContainer } = render(<Text>Body copy</Text>);
	const bodyText = getTextElement(bodyContainer);

	const leadLetterSpacing = getComputedStyle(surroundingText).letterSpacing;
	const bodyLetterSpacing = getComputedStyle(bodyText).letterSpacing;

	// Without this, the test would also pass with Kbd falling back to body letter-spacing.
	expect(leadLetterSpacing).not.toBe(bodyLetterSpacing);
	expect(getComputedStyle(kbd).letterSpacing).toBe(leadLetterSpacing);
});

test('Kbd keeps its own code font family, not the surrounding Text font family', async () => {
	const { container } = render(
		<Text typography="lead">
			Press <Kbd>⌘</Kbd>
		</Text>,
	);
	const surroundingText = getTextElement(container);
	const kbd = getKbdElement(container);

	expect(getComputedStyle(kbd).fontFamily).not.toBe(getComputedStyle(surroundingText).fontFamily);
});

test('Kbd owns its fontSize, fontWeight, and lineHeight regardless of surrounding typography', async () => {
	const { container: leadContainer } = render(
		<Text typography="lead">
			Press <Kbd>⌘</Kbd>
		</Text>,
	);
	const { container: headingContainer } = render(
		<Text typography="heading2">
			Press <Kbd>⌘</Kbd>
		</Text>,
	);
	const kbdInLead = getKbdElement(leadContainer);
	const kbdInHeading = getKbdElement(headingContainer);

	const leadStyle = getComputedStyle(kbdInLead);
	const headingStyle = getComputedStyle(kbdInHeading);

	expect(leadStyle.fontSize).toBe(headingStyle.fontSize);
	expect(leadStyle.fontWeight).toBe(headingStyle.fontWeight);
	expect(leadStyle.lineHeight).toBe(headingStyle.lineHeight);

	const headingText = getTextElement(headingContainer);
	expect(getComputedStyle(headingText).fontSize).not.toBe(headingStyle.fontSize);
	// `kbdRecipe` sets `lineHeight: 1`, so the computed value is a px length equal to fontSize.
	expect(leadStyle.lineHeight).toBe(leadStyle.fontSize);
});
