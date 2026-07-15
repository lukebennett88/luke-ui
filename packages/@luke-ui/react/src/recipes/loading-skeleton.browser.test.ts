import '@luke-ui/react/themes/machined-edge.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { themeRootClassName } from '../theme/index.js';
import { machinedEdgeThemeClassName } from '../themes/index.js';
import { loadingSkeleton } from './loading-skeleton.css.js';

let root: HTMLElement | undefined;

afterEach(async () => {
	root?.remove();
	root = undefined;
	await setEmulatedMedia();
});

test('forced colors keeps the static skeleton surface visible', async () => {
	await setEmulatedMedia('forced-colors', 'active');
	const skeleton = mountInlineSkeleton();
	const style = getComputedStyle(skeleton);

	expect(style.animationName).toBe('none');
	expect(style.backgroundColor).toBe(resolveSystemColor('CanvasText'));
	expect(style.forcedColorAdjust).toBe('none');
});

test('reduced motion keeps the skeleton surface without a running animation', async () => {
	await setEmulatedMedia('prefers-reduced-motion', 'reduce');
	const skeleton = mountInlineSkeleton();
	const style = getComputedStyle(skeleton);

	expect(style.animationName).toBe('none');
	expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

function mountInlineSkeleton() {
	root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${machinedEdgeThemeClassName}`;
	root.dataset.colorMode = 'light';
	const skeleton = root.appendChild(document.createElement('span'));
	skeleton.className = loadingSkeleton;
	skeleton.dataset.skeletonInline = '';
	return skeleton;
}

function resolveSystemColor(color: string) {
	if (!root) throw new Error('Expected theme root.');
	const probe = root.appendChild(document.createElement('div'));
	probe.style.color = color;
	const value = getComputedStyle(probe).color;
	probe.remove();
	return value;
}

async function setEmulatedMedia(name?: string, value?: string) {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: name === undefined || value === undefined ? [] : [{ name, value }],
	});
}
