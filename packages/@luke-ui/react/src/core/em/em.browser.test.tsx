import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { testConformance } from '../conformance/helpers.js';
import { render } from '../test-utils/render.js';
import { Em } from './em.js';

testConformance({
	path: 'em',
	getTarget: (result) => {
		const target = result.container.firstElementChild;
		if (!(target instanceof HTMLElement)) throw new Error('Expected an Em element.');
		return target;
	},
	render: (props = {}) => render(<Em {...props}>stressed</Em>),
});

// `Em` composes `Text` through the public `xstyle` prop (`xstyle={[styles.root, xstyle]}`) rather
// than a package-private renderer. These tests prove that composition's precedence: the wrapper's
// own authored style applies, a consumer `xstyle` on the SAME property beats it, an unrelated
// consumer `xstyle` leaves it untouched, and `Text` props that flow through unaffected (lineClamp,
// textWrap) still work.
const styles = stylex.create({
	// Deliberately collides with the wrapper's own `fontStyle: 'italic'` (see `em/recipe.ts`), so
	// this test can only pass if the consumer's `xstyle` value is resolved AFTER the wrapper style
	// in the same `stylex.props` call — the composition order `[styles.root, xstyle]` this test
	// guards.
	consumerFontStyle: { fontStyle: 'normal' },
	consumerLetterSpacing: { letterSpacing: '4px' },
});

test('applies the wrapper italic style', () => {
	const { container } = render(<Em>stressed</Em>);
	const target = container.firstElementChild as HTMLElement;
	expect(getComputedStyle(target).fontStyle).toBe('italic');
});

test('consumer xstyle on the same property beats the wrapper style', () => {
	const { container } = render(<Em xstyle={styles.consumerFontStyle}>stressed</Em>);
	const target = container.firstElementChild as HTMLElement;
	expect(getComputedStyle(target).fontStyle).toBe('normal');
});

test('an unrelated consumer xstyle does not clobber the wrapper style', () => {
	const { container } = render(<Em xstyle={styles.consumerLetterSpacing}>stressed</Em>);
	const target = container.firstElementChild as HTMLElement;
	expect(getComputedStyle(target).letterSpacing).toBe('4px');
	expect(getComputedStyle(target).fontStyle).toBe('italic');
});

test('lineClamp still works through composition', () => {
	const { container } = render(<Em lineClamp={2}>stressed</Em>);
	const target = container.firstElementChild as HTMLElement;
	const computed = getComputedStyle(target);
	expect(computed.getPropertyValue('-webkit-line-clamp')).toBe('2');
	expect(computed.overflow).toBe('hidden');
});

test('textWrap still works through composition', () => {
	const { container } = render(<Em textWrap="balance">stressed</Em>);
	const target = container.firstElementChild as HTMLElement;
	expect(getComputedStyle(target).textWrap).toBe('balance');
});
