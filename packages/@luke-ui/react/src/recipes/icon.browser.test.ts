import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { icon } from './icon.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('defaults to the medium semantic icon size', () => {
	const root = mountIcon();
	const rootStyle = getComputedStyle(root.parentElement!);
	const style = getComputedStyle(root);
	const size = rootStyle.getPropertyValue('--luke-icon-size-medium');

	expect(style.blockSize).toBe(size);
	expect(style.inlineSize).toBe(size);
	expect(style.display).toBe('inline-flex');
});

test('uses the requested semantic icon size', () => {
	const element = mountIcon({ size: 'small' });
	const rootStyle = getComputedStyle(element.parentElement!);
	const style = getComputedStyle(element);
	const size = rootStyle.getPropertyValue('--luke-icon-size-small');

	expect(style.blockSize).toBe(size);
	expect(style.inlineSize).toBe(size);
	expect(style.display).toBe('inline-flex');
});

function mountIcon(options: Parameters<typeof icon>[0] = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	root.dataset.colorMode = 'light';
	const element = root.appendChild(document.createElement('span'));
	element.className = icon(options);
	mounted.push(root);
	return element;
}
