import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Code } from './code.js';

testConformance({
	path: 'code',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Code element.');
		return target;
	},
	render: (props = {}) => render(<Code {...props}>npm install</Code>),
});

const LONG_CONTENT =
	'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';

function getCodeElement(container: HTMLElement): HTMLElement {
	const target = container.querySelector('code');
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Code element.');
	return target;
}

// Line clamp needs the text to wrap to produce more than one line, so the rendered box height is
// the contract here: there is no DOM/ARIA assertion that can distinguish a wrapped, clamped block
// from a single-line one.
test('lineClamp of 2 wraps the content and clamps it to two lines', async () => {
	const { container } = render(
		<div style={{ inlineSize: '8rem' }}>
			<Code lineClamp={2}>{LONG_CONTENT}</Code>
		</div>,
	);
	const element = getCodeElement(container);
	const singleLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
	const { height } = element.getBoundingClientRect();

	expect(height).toBeGreaterThan(singleLineHeight * 1.5);
	// At this width the content wants about seven lines, so an unclamped box would be far taller.
	// The bound sits above two padded lines and below three, and `scrollHeight` confirms there is
	// still overflowing content for the clamp to cut.
	expect(height).toBeLessThan(singleLineHeight * 3);
	expect(element.scrollHeight).toBeGreaterThan(height);
});

// `Text` emits `textWrap` after `lineClamp`, so `balance`/`pretty` would otherwise let a
// single-line clamp wrap. Every single-line clamp value is paired with every wrapping value.
for (const lineClamp of [true, 1] as const) {
	for (const textWrap of ['balance', 'pretty'] as const) {
		test(`lineClamp of ${String(lineClamp)} stays on one line with textWrap ${textWrap}`, async () => {
			const { container } = render(
				<div style={{ inlineSize: '8rem' }}>
					<Code lineClamp={lineClamp} textWrap={textWrap}>
						{LONG_CONTENT}
					</Code>
				</div>,
			);
			const element = getCodeElement(container);
			const singleLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);

			expect(element.getBoundingClientRect().height).toBeLessThanOrEqual(singleLineHeight * 1.5);
		});
	}
}

test('textWrap still wraps when no single-line clamp is set', async () => {
	const { container } = render(
		<div style={{ inlineSize: '8rem' }}>
			<Code textWrap="balance">{LONG_CONTENT}</Code>
		</div>,
	);
	const element = getCodeElement(container);
	const singleLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);

	expect(element.getBoundingClientRect().height).toBeGreaterThan(singleLineHeight * 1.5);
});

test('default Code stays on one line with the same long content', async () => {
	const { container } = render(
		<div style={{ inlineSize: '8rem' }}>
			<Code>{LONG_CONTENT}</Code>
		</div>,
	);
	const element = getCodeElement(container);
	const singleLineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);

	expect(element.getBoundingClientRect().height).toBeLessThanOrEqual(singleLineHeight * 1.5);
});
