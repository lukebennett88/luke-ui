import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { button } from './button.css.js';

let mounted: Array<HTMLElement> = [];

afterEach(async () => {
	await setEmulatedMedia();
	for (const element of mounted) element.remove();
	mounted = [];
});

test('defaults to neutral solid with medium geometry', () => {
	const control = mountButton();
	const neutralSolid = mountButton({ appearance: 'solid', tone: 'neutral' });
	const accentSolid = mountButton({ appearance: 'solid', tone: 'accent' });
	const style = getComputedStyle(control);
	const neutralSolidStyle = getComputedStyle(neutralSolid);

	expect(style.blockSize).toBe('40px');
	expect(style.backgroundColor).toBe(neutralSolidStyle.backgroundColor);
	expect(style.backgroundImage).toBe(neutralSolidStyle.backgroundImage);
	expect(style.backgroundImage).not.toBe('none');
	expect(style.backgroundColor).not.toBe(getComputedStyle(accentSolid).backgroundColor);
	expect(style.borderColor).toBe('rgba(0, 0, 0, 0)');
	expect(style.borderWidth).toBe('1px');
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
	const restingFinish = getComputedStyle(control).backgroundImage;
	expect(restingFinish).not.toBe('none');
	control.dataset.hovered = 'true';
	const raisedFinish = getComputedStyle(control).backgroundImage;
	expect(raisedFinish).not.toBe(restingFinish);
	expect(getComputedStyle(control).transform).toBe('matrix(1, 0, 0, 1, 0, -1)');

	delete control.dataset.hovered;
	control.dataset.pressed = 'true';
	expect(getComputedStyle(control).backgroundImage).not.toBe(restingFinish);
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
	expect(getComputedStyle(disabled).backgroundImage).toBe(
		getComputedStyle(resting).backgroundImage,
	);
	expect(getComputedStyle(disabled).opacity).toBe('0.55');
	expect(getComputedStyle(disabled).transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('pending uses disabled-like resting material and ignores interaction styles', () => {
	const resting = mountButton();
	const pending = mountButton();
	pending.dataset.pending = 'true';
	pending.dataset.hovered = 'true';
	pending.dataset.pressed = 'true';
	const ghost = mountButton({ appearance: 'ghost' });

	expect(getComputedStyle(pending).backgroundImage).toBe(getComputedStyle(resting).backgroundImage);
	expect(getComputedStyle(pending).boxShadow).toBe(getComputedStyle(resting).boxShadow);
	expect(getComputedStyle(pending).opacity).toBe('0.55');
	expect(getComputedStyle(pending).color).toBe(getComputedStyle(resting).color);
	expect(getComputedStyle(pending).transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
	expect(getComputedStyle(ghost).backgroundImage).toBe('none');
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

test('reduced motion removes hover and press travel', async () => {
	await setEmulatedMedia('prefers-reduced-motion', 'reduce');
	const control = mountButton();

	control.dataset.hovered = 'true';
	expect(getComputedStyle(control).transform).toBe('none');

	delete control.dataset.hovered;
	control.dataset.pressed = 'true';
	expect(getComputedStyle(control).transform).toBe('none');
});

function mountButton(options: Parameters<typeof button>[0] = {}) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${tactileThemeClassName}`;
	root.dataset.colorMode = 'light';
	const control = root.appendChild(document.createElement('button'));
	control.className = button(options);
	control.style.transition = 'none';
	mounted.push(root);
	return control;
}

async function setEmulatedMedia(name?: string, value?: string) {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: name === undefined || value === undefined ? [] : [{ name, value }],
	});
}
