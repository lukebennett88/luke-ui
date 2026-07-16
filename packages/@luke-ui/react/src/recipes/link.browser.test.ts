import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { link } from './link.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('defaults to the accent tone and keeps neutral distinct', () => {
	const defaultLink = mountLink();
	const accent = mountLink({ tone: 'accent' });
	const neutral = mountLink({ tone: 'neutral' });

	expect(getComputedStyle(defaultLink).color).toBe(getComputedStyle(accent).color);
	expect(getComputedStyle(neutral).color).not.toBe(getComputedStyle(accent).color);
});

test('only standalone links provide a structural 24px target', () => {
	const inline = mountLink();
	const standalone = mountLink({ isStandalone: true });

	expect(getComputedStyle(inline).minBlockSize).toBe('0px');
	expect(getComputedStyle(inline).minInlineSize).toBe('0px');
	expect(getComputedStyle(standalone).minBlockSize).toBe('24px');
	expect(getComputedStyle(standalone).minInlineSize).toBe('24px');
});

test.each(['accent', 'neutral'] as const)(
	'%s hover and press change color and decoration without tactile travel',
	(tone) => {
		const resting = mountLink({ isStandalone: true, tone });
		const hovered = mountLink({ isStandalone: true, tone });
		hovered.dataset.hovered = 'true';
		const pressed = mountLink({ isStandalone: true, tone });
		pressed.dataset.pressed = 'true';

		const restingStyle = getComputedStyle(resting);
		const hoveredStyle = getComputedStyle(hovered);
		const pressedStyle = getComputedStyle(pressed);

		expect(restingStyle.textDecorationLine).toBe('none');
		expect(hoveredStyle.color).not.toBe(restingStyle.color);
		expect(hoveredStyle.textDecorationLine).toBe('underline');
		expect(pressedStyle.color).toBe(hoveredStyle.color);
		expect(pressedStyle.textDecorationLine).toBe('underline');
		expect(hoveredStyle.boxShadow).toBe('none');
		expect(pressedStyle.boxShadow).toBe('none');
		expect(hoveredStyle.transform).toBe('none');
		expect(pressedStyle.transform).toBe('none');
	},
);

test.each(['accent', 'neutral'] as const)(
	'disabled %s links preserve their resting tone and ignore interaction states',
	(tone) => {
		const resting = mountLink({ isStandalone: true, tone });
		const disabled = mountLink({ isStandalone: true, tone });
		disabled.dataset.disabled = 'true';
		disabled.dataset.hovered = 'true';
		disabled.dataset.pressed = 'true';

		expect(getComputedStyle(disabled).color).toBe(getComputedStyle(resting).color);
		expect(getComputedStyle(disabled).textDecorationLine).toBe('none');
		expect(getComputedStyle(disabled).opacity).toBe('0.55');
	},
);

test('focus-visible shows the complete independent semantic ring', () => {
	const focused = mountLink();
	focused.dataset.focusVisible = 'true';
	const style = getComputedStyle(focused);

	expect(style.outlineStyle).toBe('solid');
	expect(style.outlineWidth).toBe('2px');
	expect(style.outlineOffset).toBe('2px');
	expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
});

function mountLink(options: Parameters<typeof link>[0] = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	root.dataset.colorMode = 'light';
	const anchor = root.appendChild(document.createElement('a'));
	anchor.className = link(options);
	anchor.href = '#';
	anchor.textContent = 'Link';
	anchor.style.transition = 'none';
	mounted.push(root);
	return anchor;
}
