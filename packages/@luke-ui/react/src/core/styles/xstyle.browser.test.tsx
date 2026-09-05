import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from '../text/text.js';
import type { XStyleProp } from './xstyle.js';
import { resolveXStyleProps } from './xstyle.js';

// This file's `stylex.create()` call is compiled by Luke UI's OWN `createStylexDevPlugin`
// (`vitest.config.ts`), so its atom lands in Luke UI's `recipes.*` layers alongside the
// component's own styles. That covers the in-repo/dev-compiled path — the resolution order
// `resolveXStyleProps` applies within one `stylex.props` call — but it cannot prove the public
// `xstyle < className` cascade contract, because a real consumer compiles `xstyle` with THEIR
// OWN StyleX configuration, not this package's. `packed-consumer.test.ts` covers that real
// configuration end to end (a real packed tarball, a consumer-driven StyleX compile using the
// documented `useLayers` config, and real browser cascade resolution), and is the test that
// backs the published contract. Do not read this file's second test as proof of it.
const styles = stylex.create({
	xstyleColor: { color: 'rgb(9, 9, 9)' },
});

function computedColor(props: React.ComponentProps<typeof Text>): string {
	const { container } = render(<Text {...props}>Precedence</Text>);
	return getComputedStyle(container.firstElementChild as HTMLElement).color;
}

test('applies same-property xstyle after a Text variant', () => {
	expect(computedColor({ color: 'accent', xstyle: styles.xstyleColor })).toBe('rgb(9, 9, 9)');
});

// Here `xstyle` lands in a `recipes.*` layer (via `createStylexDevPlugin`) and `className` is
// unlayered, so `className` wins on source order, not on a general layer guarantee — see the
// module comment above for why this does not stand in for the public contract.
test('lets an unlayered className and then inline style override xstyle', () => {
	const style = document.createElement('style');
	style.textContent = '.consumer-text-color { color: rgb(40, 50, 60); }';
	document.head.append(style);

	try {
		expect(computedColor({ className: 'consumer-text-color', xstyle: styles.xstyleColor })).toBe(
			'rgb(40, 50, 60)',
		);
		expect(
			computedColor({
				className: 'consumer-text-color',
				style: { color: 'rgb(70, 80, 90)' },
				xstyle: styles.xstyleColor,
			}),
		).toBe('rgb(70, 80, 90)');
	} finally {
		style.remove();
	}
});

// `resolveXStyleProps` is what every StyleX-migrated component calls to combine its own recipe
// styles with a consumer's `xstyle`, always placing `xstyle` last in the one `stylex.props(...)`
// call. Proving the shorthand/longhand overlap classes at this level, with real computed style,
// isolates the actual precedence rule from any one component's unrelated styling.
const componentPaddingStyles = stylex.create({
	componentPaddingShorthand: { padding: '4px' },
});

const consumerPaddingStyles = stylex.create({
	xstylePaddingLonghand: { paddingInlineStart: '20px' },
});

function computedPaddingLeftFor(xstyle: XStyleProp | undefined): string {
	const { className } = resolveXStyleProps(
		[componentPaddingStyles.componentPaddingShorthand],
		xstyle,
		undefined,
		undefined,
	);
	const { container } = render(<div className={className} />);
	return getComputedStyle(container.firstElementChild as HTMLElement).paddingLeft;
}

test('a consumer xstyle longhand overrides an earlier component recipe shorthand', () => {
	// `xstyle` is always the last argument to `stylex.props`, so an author relying on the
	// documented `xstyle` > component-recipe precedence for a padding override is relying on this
	// case: a LOGICAL `xstyle` longhand (`paddingInlineStart`) against an earlier component
	// `padding` shorthand. `padding`'s `application-order` tombstone set omits the logical
	// longhand keys (a StyleX 0.19.0 defect — see `recipe-authoring.browser.test.tsx`), so `styleq`
	// keeps both classes here and it is the compiler's fixed specificity tier — which always
	// favours a logical longhand over a shorthand — that decides, not source order. It happens
	// to agree with "xstyle wins" for this pairing, but not because of the mechanism the contract
	// depends on: a `padding` `xstyle` overriding an earlier component longhand would NOT win.
	expect(computedPaddingLeftFor(consumerPaddingStyles.xstylePaddingLonghand)).toBe('20px');
});
