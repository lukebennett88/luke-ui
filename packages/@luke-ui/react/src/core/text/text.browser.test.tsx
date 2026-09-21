import { Text } from '@luke-ui/react/text';
import type { CSSProperties } from 'react';
import { test, expect } from 'vite-plus/test';
import { typeStyles } from '../../theme/contract.js';
import { Code } from '../code/code.js';
import { Em } from '../em/em.js';
import { Kbd } from '../kbd/kbd.js';
import { Strong } from '../strong/strong.js';
import { render, visualAppearances } from '../test-utils/render.js';
import { captureVisual, captureVisualAppearance, Stack } from '../test-utils/visual.js';

test('Text forwards className, data attributes, id, and ref to its element', () => {
	const ref = { current: null as HTMLElement | null };
	const { container } = render(
		<Text className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Body copy
		</Text>,
	);
	const target = container.firstElementChild;
	if (!(target instanceof HTMLElement)) throw new Error('Expected a Text element.');

	expect(target).toHaveClass('forwarded-class');
	expect(target).toHaveAttribute('data-forwarded', 'true');
	expect(target).toHaveAttribute('id', 'forwarded-id');
	expect(ref.current).toBe(target);
});

// `shouldInheritFont` inherits `textTransform` and `fontVariantNumeric` along with the other font
// properties, and their variants default to emitting nothing. Without both halves, a composing
// component would reset the surrounding uppercase and numeric styling to `none`/`normal`.
test('components composed on Text inherit surrounding case and numeric styling', () => {
	const { container } = render(
		<Text fontVariantNumeric="tabular-nums" textTransform="uppercase">
			total <Code>abc123</Code> <Kbd>esc</Kbd> <Em>em</Em> <Strong>strong</Strong>
		</Text>,
	);

	for (const selector of ['code', 'kbd', 'em', 'strong']) {
		const element = container.querySelector(selector);
		if (!(element instanceof HTMLElement)) throw new Error(`Expected a ${selector} element.`);

		const styles = getComputedStyle(element);
		expect(styles.textTransform).toBe('uppercase');
		expect(styles.fontVariantNumeric).toBe('tabular-nums');
	}
});

test('an explicit textTransform still wins over the inherited one', () => {
	// `textTransform` is declared after `shouldInheritFont`, so an explicit value outranks the
	// inherited one. Nested `Text` stands in for any composed component that forwards the prop.
	const { container } = render(
		<Text textTransform="uppercase">
			total{' '}
			<Text elementType="em" shouldInheritFont textTransform="lowercase">
				ABC
			</Text>
		</Text>,
	);
	const nested = container.querySelector('em');
	if (!(nested instanceof HTMLElement)) throw new Error('Expected the nested Text element.');

	expect(getComputedStyle(nested).textTransform).toBe('lowercase');
});

test('Text on its own does not inherit case or numeric styling from the page', () => {
	// The resets live in the recipe base, so a plain `Text` stays insulated from ambient page
	// styling. Only `shouldInheritFont` lifts them.
	const { container } = render(
		<div style={{ fontVariantNumeric: 'tabular-nums', textTransform: 'uppercase' }}>
			<Text>Body copy</Text>
		</div>,
	);
	const text = container.querySelector('span');
	if (!(text instanceof HTMLElement)) throw new Error('Expected a Text element.');

	const styles = getComputedStyle(text);
	expect(styles.textTransform).toBe('none');
	expect(styles.fontVariantNumeric).toBe('normal');
});

const rowStyle = {
	alignItems: 'baseline',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '1rem',
} satisfies CSSProperties;

test('typography styles', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack width="40rem">
				<div style={rowStyle}>
					{typeStyles.map((typography) => (
						<Text key={typography} typography={typography}>
							{typography}
						</Text>
					))}
				</div>
				<div style={rowStyle}>
					<Text fontWeight="body">Body</Text>
					<Text fontWeight="label">Label</Text>
					<Text fontWeight="heading">Heading</Text>
					<Text fontWeight="emphasis">Emphasis</Text>
				</div>
				<Text fontWeight="emphasis" typography="body">
					Nested defaults and overrides: <Text typography="label">Label default</Text>{' '}
					<Text fontWeight="body" typography="label">
						Label with body weight
					</Text>{' '}
					<Text shouldInheritFont>Inherited emphasis</Text>
				</Text>
				<div style={rowStyle}>
					<Text color="primary">Primary</Text>
					<Text color="secondary">Secondary</Text>
					<Text color="accent">Accent</Text>
					<Text color="info">Info</Text>
					<Text color="success">Success</Text>
					<Text color="warning">Warning</Text>
					<Text color="danger">Danger</Text>
				</div>
				<Text>Trimmed by default</Text>
				<Text shouldDisableTrim>Trim disabled</Text>
			</Stack>,
			{ appearance },
		);

		await captureVisualAppearance(locator, 'text/type-scale', appearance);
	}
});

test('Em, Strong, and Kbd inheritance', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="24rem">
			<Text fontWeight="emphasis" typography="lead">
				Read the <Em>full</Em> guide, mark the <Strong>required</Strong> steps, then run{' '}
				<Kbd>Cmd+S</Kbd> to save.
			</Text>
			<Text typography="caption">
				A caption sentence with <Em>emphasis</Em>, <Strong>importance</Strong>, and a <Kbd>Tab</Kbd>{' '}
				key at a smaller size — the Kbd chip stays the same size as above.
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/em-strong-kbd-inheritance');
});

test('line clamp and transforms', { tags: ['visual'] }, async () => {
	const { locator } = render(
		<Stack width="18rem">
			<Text lineClamp={2}>
				A short paragraph of placeholder copy that wraps across multiple lines and then clamps.
			</Text>
			<Text textDecoration="underline" textTransform="uppercase">
				Decorated text
			</Text>
		</Stack>,
	);

	await captureVisual(locator, 'text/line-clamp-transforms');
});
