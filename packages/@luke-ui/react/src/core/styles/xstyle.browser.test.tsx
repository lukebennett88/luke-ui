import * as stylex from '@stylexjs/stylex';
import { expect, test } from 'vite-plus/test';
import { render } from '../test-utils/render.js';
import { Text } from '../text/text.js';

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
