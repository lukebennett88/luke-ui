import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import { contrastRatio, parseColor } from '../theme/color.js';
import { themeRootClassName } from '../theme/index.js';
import { paperThemeClassName, tactileThemeClassName } from '../themes/index.js';
import { loadingSkeleton } from './loading-skeleton.js';

let root: HTMLElement | undefined;

const themeCases = [
	{ className: tactileThemeClassName, name: 'Tactile' },
	{ className: paperThemeClassName, name: 'Paper' },
] as const;

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

test('block skeleton masking overrides wrapped content and its descendants', () => {
	const inlineSkeleton = mountInlineSkeleton();
	const { child, nested } = mountBlockSkeleton();
	const skeletonSurface = getComputedStyle(inlineSkeleton);
	const childStyle = getComputedStyle(child);
	const nestedStyle = getComputedStyle(nested);
	const overlayStyle = getComputedStyle(child, '::after');

	expect(childStyle.backgroundColor).toBe(skeletonSurface.backgroundColor);
	expect(childStyle.backgroundClip).toBe('border-box');
	expect(childStyle.backgroundImage).toBe('none');
	expect(childStyle.borderStyle).toBe('none');
	expect(childStyle.boxDecorationBreak).toBe('clone');
	expect(childStyle.boxShadow).toBe('none');
	expect(childStyle.color).toBe(skeletonSurface.color);
	expect(childStyle.cursor).toBe('default');
	expect(childStyle.outlineStyle).toBe('none');
	expect(childStyle.outlineWidth).toBe('0px');
	expect(childStyle.overflow).toBe('hidden');
	expect(childStyle.position).toBe('relative');
	expect(childStyle.pointerEvents).toBe('none');
	expect(childStyle.userSelect).toBe('none');
	expect(nestedStyle.backgroundColor).toBe(skeletonSurface.backgroundColor);
	expect(nestedStyle.backgroundImage).toBe('none');
	expect(nestedStyle.color).toBe(skeletonSurface.color);
	expect(overlayStyle.backgroundColor).toBe(skeletonSurface.backgroundColor);
	expect(overlayStyle.content).toBe('""');
	expect(overlayStyle.inset).toBe('-1px');
	expect(overlayStyle.position).toBe('absolute');
});

for (const theme of themeCases) {
	for (const mode of ['light', 'dark'] as const) {
		test(`${theme.name} ${mode} keeps both pulse extremes distinct from the canvas`, async () => {
			const skeleton = mountInlineSkeleton(theme.className, mode);
			const canvasColor = getComputedStyle(requireRoot()).backgroundColor;
			const animation = requireAnimation(skeleton);

			const brightRatio = await samplePulseContrast(skeleton, animation, canvasColor, 50);
			const dimRatio = await samplePulseContrast(skeleton, animation, canvasColor, 1050);

			expect(Math.min(brightRatio, dimRatio)).toBeGreaterThanOrEqual(1.4);
		});
	}
}

function mountInlineSkeleton(
	themeClassName = tactileThemeClassName,
	mode: 'light' | 'dark' = 'light',
) {
	root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${themeClassName}`;
	root.dataset.colorMode = mode;
	root.style.backgroundColor = 'var(--luke-color-surface-canvas)';
	const skeleton = root.appendChild(document.createElement('span'));
	skeleton.className = loadingSkeleton();
	skeleton.dataset.skeletonInline = '';
	return skeleton;
}

function mountBlockSkeleton() {
	const skeleton = requireRoot().appendChild(document.createElement('span'));
	skeleton.className = loadingSkeleton();
	const child = skeleton.appendChild(document.createElement('div'));
	child.style.backgroundColor = 'red';
	child.style.backgroundClip = 'content-box';
	child.style.backgroundImage = 'linear-gradient(blue, green)';
	child.style.border = '1px solid blue';
	child.style.boxDecorationBreak = 'slice';
	child.style.boxShadow = '1px 1px blue';
	child.style.color = 'blue';
	child.style.cursor = 'pointer';
	child.style.outline = '1px solid yellow';
	child.style.overflow = 'visible';
	child.style.position = 'static';
	child.style.pointerEvents = 'auto';
	child.style.userSelect = 'text';
	const nested = child.appendChild(document.createElement('span'));
	nested.style.backgroundColor = 'red';
	nested.style.backgroundImage = 'linear-gradient(blue, green)';
	nested.style.color = 'blue';

	return { child, nested };
}

function requireRoot() {
	if (!root) throw new Error('Expected theme root.');
	return root;
}

function requireAnimation(element: Element) {
	const animation = element.getAnimations()[0];
	if (!animation) throw new Error('Expected skeleton animation.');
	return animation;
}

async function samplePulseContrast(
	element: Element,
	animation: Animation,
	canvasColor: string,
	activeTime: number,
) {
	animation.pause();
	animation.currentTime = 500 + activeTime;
	await new Promise(requestAnimationFrame);
	const style = getComputedStyle(element);
	return contrastRatio(
		parseColor(rgbToHex(applyBrightness(style.backgroundColor, brightnessValue(style.filter)))),
		parseColor(rgbToHex(cssColorToRgb(canvasColor))),
	);
}

function brightnessValue(filter: string) {
	const match = /^brightness\((?<value>[\d.]+)\)$/.exec(filter);
	if (!match?.groups?.value) throw new Error(`Expected brightness filter, received "${filter}".`);
	return Number(match.groups.value);
}

interface Rgb {
	b: number;
	g: number;
	r: number;
}

function cssColorToRgb(color: string): Rgb {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Expected canvas context.');
	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
	if (r === undefined || g === undefined || b === undefined) {
		throw new Error(`Expected RGB channels for "${color}".`);
	}
	return { b, g, r };
}

function applyBrightness(color: string, brightness: number): Rgb {
	const rgb = cssColorToRgb(color);
	return {
		b: Math.min(rgb.b * brightness, 255),
		g: Math.min(rgb.g * brightness, 255),
		r: Math.min(rgb.r * brightness, 255),
	};
}

function rgbToHex(color: Rgb) {
	const channel = (value: number) => Math.round(value).toString(16).padStart(2, '0');
	return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
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
