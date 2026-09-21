import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import { expect } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import { setEmulatedMediaFeature } from './emulate-media.js';
import { peekEmulatedMediaFeatures } from './emulated-media.js';
import type { VisualAppearance } from './render.js';
import { formatVisualCaptureName, formatVisualViewport } from './visual-capture-id.js';

const VISUAL_CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VISUAL_VIEWPORT_WIDTH = 1024;
const VISUAL_VIEWPORT_HEIGHT = 800;

/**
 * Jump running CSS transitions and animations to their end values.
 *
 * Applying `prefers-reduced-motion: reduce` or `transition: none` mid-flight cancels the
 * transition and leaves interpolated values (for example a semi-transparent
 * `text-decoration-color`) frozen in place. Finish first, then freeze.
 */
function finishInFlightMotion(root: Document | Element = document) {
	if (typeof root.getAnimations !== 'function') return;

	for (const animation of root.getAnimations({ subtree: true })) {
		try {
			animation.finish();
		} catch {
			// Already finished or not finishable (e.g. infinite iterations).
		}
	}
}

// Reduced motion prevents entering overlays from capturing at opacity 0.
export async function freezeMotionForCapture(): Promise<() => Promise<void>> {
	finishInFlightMotion();

	const previousReducedMotion = peekEmulatedMediaFeatures()['prefers-reduced-motion'];
	await setEmulatedMediaFeature('prefers-reduced-motion', 'reduce');

	const freezeMotion = document.createElement('style');
	freezeMotion.textContent = `
*, *::before, *::after {
	animation-delay: 0s !important;
	animation-duration: 0s !important;
	transition-delay: 0s !important;
	transition-duration: 0s !important;
	caret-color: transparent !important;
}
[data-entering], [data-exiting] {
	opacity: 1 !important;
	translate: none !important;
}
`;
	document.head.append(freezeMotion);
	// Catch transitions that started between finish and the freeze stylesheet.
	finishInFlightMotion();

	return async () => {
		freezeMotion.remove();
		await setEmulatedMediaFeature('prefers-reduced-motion', previousReducedMotion);
	};
}

export async function captureVisual(locator: Locator, id: string) {
	if (!VISUAL_CAPTURE_ID_PATTERN.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}

	const originalViewportWidth = window.innerWidth;
	const originalViewportHeight = window.innerHeight;
	await page.viewport(VISUAL_VIEWPORT_WIDTH, VISUAL_VIEWPORT_HEIGHT);
	if (document.fonts?.status !== 'loaded') {
		await document.fonts.ready;
	}
	const restoreMotion = await freezeMotionForCapture();
	let isTall = false;
	try {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const viewport = formatVisualViewport(viewportWidth, viewportHeight);
		const element = locator.element();
		const fullHeight = element.scrollHeight;
		isTall = fullHeight > viewportHeight;

		if (isTall) {
			// Resize the test iframe as well as the page or the added height stays blank.
			await cdp().send('Emulation.setDeviceMetricsOverride', {
				deviceScaleFactor: window.devicePixelRatio,
				height: fullHeight,
				mobile: false,
				width: viewportWidth,
			});
			await page.viewport(viewportWidth, fullHeight);
		}

		await expect.element(locator).toMatchScreenshot(formatVisualCaptureName(id, viewport));
	} finally {
		if (isTall) {
			await page.viewport(VISUAL_VIEWPORT_WIDTH, VISUAL_VIEWPORT_HEIGHT);
			await cdp().send('Emulation.clearDeviceMetricsOverride');
		}
		await restoreMotion();
		await page.viewport(originalViewportWidth, originalViewportHeight);
	}
}

export async function captureVisualAppearance(
	locator: Locator,
	id: string,
	appearance: VisualAppearance,
) {
	await captureVisual(locator, `${id}-${appearance.theme}-${appearance.mode}`);
}

export { emulateForcedColors } from './emulate-media.js';

export type PropOptions<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
> = NonNullable<ComponentProps<Component>[Prop]>;

export function variantValuesFor<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
>() {
	return <const T extends ReadonlyArray<PropOptions<Component, Prop>>>(values: T): T => values;
}

const SCENE_GAP = '1rem';
const SCENE_PADDING = '1rem';

export function Stack({
	children,
	align,
	width = '24rem',
}: {
	children: ReactNode;
	align?: CSSProperties['alignItems'];
	width?: string;
}) {
	return (
		<div
			style={{
				alignItems: align,
				display: 'flex',
				flexDirection: 'column',
				gap: SCENE_GAP,
				padding: SCENE_PADDING,
				width,
			}}
		>
			{children}
		</div>
	);
}

export function Grid({ children, columns }: { children: ReactNode; columns: number }) {
	return (
		<div
			style={{
				alignItems: 'center',
				display: 'grid',
				gap: SCENE_GAP,
				gridTemplateColumns: `repeat(${columns}, max-content)`,
				padding: SCENE_PADDING,
				width: 'max-content',
			}}
		>
			{children}
		</div>
	);
}

export async function focusViaKeyboard(target: Locator) {
	await userEvent.tab();
	await expect.element(target).toHaveFocus();
}
