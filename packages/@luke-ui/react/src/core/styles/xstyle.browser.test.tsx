import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
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
