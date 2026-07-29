import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { checkbox } from './checkbox.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('the control follows a Text line-height custom property and centres its indicator', () => {
	const lineHeights = [16, 20, 24, 26, 28, 30, 36, 40, 60];

	for (const lineHeight of lineHeights) {
		const { content, control, indicator } = mountCheckbox(lineHeight);
		const contentRect = content.getBoundingClientRect();
		const controlRect = control.getBoundingClientRect();
		const indicatorRect = indicator.getBoundingClientRect();

		expect(Math.abs(controlRect.top - contentRect.top)).toBeLessThan(0.1);
		expect(controlRect.height).toBe(lineHeight);
		expect(
			Math.abs(
				indicatorRect.top + indicatorRect.height / 2 - (controlRect.top + controlRect.height / 2),
			),
		).toBeLessThan(0.1);
	}
});

test('the standalone control uses the compact default line height', () => {
	const { control } = mountCheckbox();
	expect(control.getBoundingClientRect().height).toBe(24);
});

function mountCheckbox(lineHeight?: number) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	root.dataset.colorMode = 'light';
	if (lineHeight != null) root.style.setProperty('--luke-text-line-height', `${lineHeight}px`);

	const classes = checkbox();
	const field = root.appendChild(document.createElement('div'));
	field.className = classes.root();
	const content = field.appendChild(document.createElement('label'));
	content.className = classes.content();
	const control = content.appendChild(document.createElement('span'));
	control.className = classes.control();
	const indicator = control.appendChild(document.createElement('span'));
	indicator.className = classes.indicator();
	content.append('Checkbox label');
	mounted.push(root);

	return { content, control, indicator };
}
