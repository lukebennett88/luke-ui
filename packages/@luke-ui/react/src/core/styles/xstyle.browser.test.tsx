import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from '../text/text.js';
import { resolveXStyleClassName } from './xstyle.js';

const styles = stylex.create({
	xstyleOverride: {
		color: 'rgb(9, 9, 9)',
	},
});

const recipeClassName = 'recipe-class';

function computedColorFor(className: string) {
	const { container } = render(<div className={className} />);
	return getComputedStyle(container.firstElementChild as HTMLElement).color;
}

test('composes the recipe class, xstyle, and className in order', () => {
	const className = resolveXStyleClassName(recipeClassName, undefined, 'consumer-class');
	expect(className.split(' ')).toEqual([recipeClassName, 'consumer-class']);
});

test('omits xstyle entirely when it is undefined', () => {
	const className = resolveXStyleClassName(recipeClassName, undefined, undefined);
	expect(className).toBe(recipeClassName);
});

test('xstyle resolves to a real class that applies in the browser', () => {
	const className = resolveXStyleClassName(recipeClassName, styles.xstyleOverride, undefined);
	expect(computedColorFor(className)).toBe('rgb(9, 9, 9)');
});

// ---------------------------------------------------------------------------
// Precedence chain (check 2.11): the canonical proof for every StyleX-migrated component, not to
// be duplicated per component. Proves the resolution order documented on `resolveXStyleClassName`
// with real computed styles from a real migrated component (`Text`), rather than by inspecting
// class-name strings.
//
// `xstyle` is proven here on `outline*`, a property `Text`'s own recipe never sets — not on a
// property its variants already declare, such as `color`. StyleX assigns each CSS property to a
// numbered `luke.sx.priorityN` cascade layer purely by property identity (see `getDefaultPriority`
// in `@stylexjs/shared`), independent of which `stylex.create` call or module produced the rule.
// Two *different* properties from two different `stylex.create` calls reliably land in different,
// correctly ordered layers, but two rules for the *same* property collide in the very same layer,
// where the winner is a StyleX-internal sort with no "xstyle wins" guarantee — and in this
// package's dev/test pipeline each module's own priority numbering is computed independently (see
// `stylex-vite-plugin.ts`), so a same-property collision between a component's own recipe and a
// caller's `xstyle` is not reliably won by either side. `xstyle` is a real, working escape hatch
// for styling a property a component does not otherwise expose — proven below — not a guaranteed
// override for a property the component's own variants already set.
// ---------------------------------------------------------------------------

const precedence = stylex.create({
	xstyleOutline: {
		outlineColor: 'rgb(10, 20, 30)',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
});

function computedOutlineForText(props: React.ComponentProps<typeof Text>) {
	const { container } = render(<Text {...props}>Precedence</Text>);
	const computed = getComputedStyle(container.firstElementChild as HTMLElement);
	return `${computed.outlineStyle} ${computed.outlineColor}`;
}

test('xstyle applies on top of a component variant, for a property the recipe does not set', () => {
	// The `color="accent"` variant alone has no outline style at all — confirms `xstyle` is adding
	// styling the component itself never declares, not overriding a variant's own outline.
	const variantOnly = computedOutlineForText({ color: 'accent' });
	expect(variantOnly.startsWith('none')).toBe(true);

	const withXstyle = computedOutlineForText({
		color: 'accent',
		xstyle: precedence.xstyleOutline,
	});
	expect(withXstyle).toBe('solid rgb(10, 20, 30)');
});

test('a consumer className beats xstyle', () => {
	const withXstyle = computedOutlineForText({ xstyle: precedence.xstyleOutline });
	expect(withXstyle).toBe('solid rgb(10, 20, 30)');

	// An unlayered consumer class: no `@layer`, so it beats every layered StyleX atom regardless
	// of where `resolveXStyleClassName` places it in the class-string source order.
	const style = document.createElement('style');
	style.textContent =
		'.consumer-beats-xstyle { outline-color: rgb(40, 50, 60); outline-style: dashed; }';
	document.head.append(style);

	try {
		const withClassName = computedOutlineForText({
			className: 'consumer-beats-xstyle',
			xstyle: precedence.xstyleOutline,
		});
		expect(withClassName).toBe('dashed rgb(40, 50, 60)');
	} finally {
		style.remove();
	}
});

test('inline style beats a consumer className', () => {
	const style = document.createElement('style');
	style.textContent = '.consumer-beats-inline-style { outline-color: rgb(40, 50, 60); }';
	document.head.append(style);

	try {
		const { container } = render(
			<Text className="consumer-beats-inline-style" style={{ outlineColor: 'rgb(70, 80, 90)' }}>
				Precedence
			</Text>,
		);
		const computed = getComputedStyle(container.firstElementChild as HTMLElement);
		expect(computed.outlineColor).toBe('rgb(70, 80, 90)');
	} finally {
		style.remove();
	}
});
