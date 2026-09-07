import { expect, test } from 'vite-plus/test';
import { Code } from '../code/code.js';
import { testConformance } from '../conformance/helpers.js';
import { Em } from '../em/em.js';
import { Kbd } from '../kbd/kbd.js';
import { Strong } from '../strong/strong.js';
import { render } from '../test-utils/render.js';
import { Text } from './text.js';

testConformance({
	path: 'text',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected a Text element.');
		return target;
	},
	render: (props = {}) => render(<Text {...props}>Body copy</Text>),
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
