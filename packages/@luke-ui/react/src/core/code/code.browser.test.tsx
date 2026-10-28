import { Box } from '@luke-ui/react/box';
import { Code } from '@luke-ui/react/code';
import { Text } from '@luke-ui/react/text';
import { expect, test } from 'vite-plus/test';
import { expectAxeContrastPasses } from '../test-utils/axe.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { pairedColors, surfaceColors } from '../test-utils/surface-colors.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';

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

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack width="20rem">
				<Text>
					Run <Code>npm install</Code> to install dependencies.
				</Text>
				<Text typography="lead">
					The <Code>useTheme</Code> hook tracks the active theme.
				</Text>
				<Text typography="caption">
					Set <Code>data-color-mode</Code> on the root element.
				</Text>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'code/kitchen-sink', appearance);
	}
});

test('long content states', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="10rem">
			<Code lineClamp>{LONG_CONTENT}</Code>
			<Code lineClamp={3}>{LONG_CONTENT}</Code>
		</Stack>,
	);

	await captureVisual(locator, 'code/long-content');
});

for (const appearance of visualAppearances) {
	const name = `${appearance.theme} ${appearance.mode}`;

	// The chip is a neutral subtle fill, so it reads the neutral hierarchy rather than inheriting a
	// solid fill's on-solid colour onto a neutral background.
	test(`Code establishes its own chip context on a solid fill in ${name}`, async () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" padding="space.8">
				<Text>
					Run <Code>pnpm install</Code>
				</Text>
			</Box>,
			{ appearance },
		);
		const code = getCodeElement(container);

		expect(surfaceColors(code)).toEqual(pairedColors(code, 'neutral.subtle'));
		await expectAxeContrastPasses(container);
	});

	test(`Code inside a code block draws no second chip in ${name}`, () => {
		const { container } = render(
			<Box backgroundColor="accent.solid" padding="space.8">
				<pre data-testid="block">
					<Code>{'const a = 1;\nconst b = 2;'}</Code>
				</pre>
			</Box>,
			{ appearance },
		);
		const block = container.querySelector('pre');
		if (block === null) throw new Error('Expected a pre element.');
		const code = getCodeElement(container);
		const styles = getComputedStyle(code);

		expect(surfaceColors(code)).toEqual({
			...surfaceColors(block),
			background: 'rgba(0, 0, 0, 0)',
		});
		expect(styles.borderTopStyle).toBe('none');
		expect(styles.paddingInlineStart).toBe('0px');
		expect(styles.fontSize).toBe(getComputedStyle(block).fontSize);
		expect(styles.whiteSpace).toBe(getComputedStyle(block).whiteSpace);
	});
}
