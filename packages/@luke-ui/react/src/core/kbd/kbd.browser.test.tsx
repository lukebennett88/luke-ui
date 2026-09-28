import { Code } from '@luke-ui/react/code';
import { Kbd } from '@luke-ui/react/kbd';
import { Text } from '@luke-ui/react/text';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';

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

function parsePxLength(value: string): number {
	return Number.parseFloat(value);
}

function kbdToParentFontSizeRatio(textElement: HTMLElement, kbdElement: HTMLElement): number {
	const parentFontSize = parsePxLength(getComputedStyle(textElement).fontSize);
	const kbdFontSize = parsePxLength(getComputedStyle(kbdElement).fontSize);
	return kbdFontSize / parentFontSize;
}

test('Kbd font size scales with surrounding typography', async () => {
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

	const leadText = getTextElement(leadContainer);
	const headingText = getTextElement(headingContainer);
	const kbdInLead = getKbdElement(leadContainer);
	const kbdInHeading = getKbdElement(headingContainer);

	expect(getComputedStyle(kbdInLead).fontSize).not.toBe(getComputedStyle(kbdInHeading).fontSize);
	expect(kbdToParentFontSizeRatio(leadText, kbdInLead)).toBeCloseTo(0.75, 2);
	expect(kbdToParentFontSizeRatio(headingText, kbdInHeading)).toBeCloseTo(0.75, 2);
});

test('Kbd sets its own letter-spacing and word-spacing', async () => {
	const { container } = render(
		<Text style={{ letterSpacing: '0.5em', wordSpacing: '0.4em' }} typography="body">
			Press <Kbd>Ctrl + K</Kbd>
		</Text>,
	);
	const text = getTextElement(container);
	const kbd = getKbdElement(container);
	const textStyle = getComputedStyle(text);
	const kbdStyle = getComputedStyle(kbd);

	expect(textStyle.letterSpacing).not.toBe(kbdStyle.letterSpacing);
	expect(textStyle.wordSpacing).not.toBe(kbdStyle.wordSpacing);
});

test('Kbd uses the body font family, not the code font used by Code', async () => {
	const { container: kbdContainer } = render(<Kbd>⌘K</Kbd>);
	const { container: codeContainer } = render(<Code>⌘K</Code>);
	const kbd = getKbdElement(kbdContainer);
	const code = codeContainer.querySelector('code');
	if (!(code instanceof HTMLElement)) throw new Error('Expected a Code element.');

	expect(getComputedStyle(kbd).fontFamily).not.toBe(getComputedStyle(code).fontFamily);
});
