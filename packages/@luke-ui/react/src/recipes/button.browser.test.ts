import '@luke-ui/react/themes/machined-edge.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { themeRootClassName } from '../theme/index.js';
import { machinedEdgeThemeClassName } from '../themes/index.js';
import { button } from './button.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
});

test('defaults to accent solid with medium geometry', () => {
	const control = mountButton();
	const style = getComputedStyle(control);

	expect(style.blockSize).toBe('40px');
	expect(style.minBlockSize).toBe('24px');
	expect(style.minInlineSize).toBe('24px');
	expect(style.transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('small and medium share the control geometry contract', () => {
	const small = mountButton({ size: 'small' });
	const medium = mountButton({ size: 'medium' });

	expect(getComputedStyle(small).blockSize).toBe('32px');
	expect(getComputedStyle(medium).blockSize).toBe('40px');
});

test('hover raises and press recesses without scale', () => {
	const control = mountButton();
	control.dataset.hovered = 'true';
	expect(getComputedStyle(control).transform).toBe('matrix(1, 0, 0, 1, 0, -1)');

	delete control.dataset.hovered;
	control.dataset.pressed = 'true';
	const pressedTransform = getComputedStyle(control).transform;
	expect(pressedTransform).toBe('matrix(1, 0, 0, 1, 0, 1)');
	expect(pressedTransform.startsWith('matrix(1, 0, 0, 1')).toBe(true);
});

test('disabled preserves resting material and ignores interaction', () => {
	const resting = mountButton();
	const disabled = mountButton();
	disabled.dataset.disabled = 'true';
	disabled.dataset.hovered = 'true';
	disabled.dataset.pressed = 'true';

	expect(getComputedStyle(disabled).boxShadow).toBe(getComputedStyle(resting).boxShadow);
	expect(getComputedStyle(disabled).opacity).toBe('0.55');
	expect(getComputedStyle(disabled).transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('focus uses the independent semantic ring', () => {
	const control = mountButton();
	control.dataset.focusVisible = 'true';
	const style = getComputedStyle(control);

	expect(style.outlineStyle).toBe('solid');
	expect(style.outlineWidth).toBe('2px');
	expect(style.outlineOffset).toBe('2px');
	expect(style.boxShadow).not.toBe('none');
});

function mountButton(variants: Parameters<typeof button>[0] = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${machinedEdgeThemeClassName}`;
	root.dataset.colorMode = 'light';
	const control = root.appendChild(document.createElement('button'));
	control.className = button(variants);
	control.style.transition = 'none';
	mounted.push(root);
	return control;
}
