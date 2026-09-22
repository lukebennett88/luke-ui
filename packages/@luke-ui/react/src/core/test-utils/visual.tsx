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

/** Coordinates outside the viewport so `:hover` / React Aria `data-hovered` cannot stick. */
export function parkedPointerCoordinates() {
	return { x: -50, y: -50 };
}

/** Park the pointer outside the viewport so a prior test's cursor cannot leave hover state. */
export async function parkPointer() {
	const { x, y } = parkedPointerCoordinates();
	await cdp().send('Input.dispatchMouseEvent', {
		button: 'none',
		buttons: 0,
		modifiers: 0,
		type: 'mouseMoved',
		x,
		y,
	});
}

/**
 * Jump running CSS transitions and animations to their end values.
 *
 * Applying `prefers-reduced-motion: reduce` or `transition: none` mid-flight cancels the
 * transition and leaves interpolated values (for example a semi-transparent
 * `text-decoration-color`) frozen in place. Finish first, then freeze.
 *
 * Exit animations are paused instead of finished so finishing them cannot unmount an
 * overlay before the screenshot.
 */
function finishInFlightMotion(root: Document | Element = document): Array<Animation> {
	const pausedExitAnimations: Array<Animation> = [];
	if (typeof root.getAnimations !== 'function') return pausedExitAnimations;

	for (const animation of root.getAnimations({ subtree: true })) {
		const effect = animation.effect;
		const target = effect && 'target' in effect ? (effect.target as Element | null) : null;
		if (target instanceof Element && target.closest('[data-exiting]')) {
			try {
				animation.pause();
				pausedExitAnimations.push(animation);
			} catch {
				// Ignore animations that cannot be paused.
			}
			continue;
		}
		try {
			animation.finish();
		} catch {
			// Already finished or not finishable (e.g. infinite iterations).
		}
	}
	return pausedExitAnimations;
}

function waitAnimationFrames(frames = 2): Promise<void> {
	return new Promise((resolve) => {
		const step = (remaining: number) => {
			if (remaining <= 0) {
				resolve();
				return;
			}
			requestAnimationFrame(() => step(remaining - 1));
		};
		step(frames);
	});
}

// Reduced motion prevents entering overlays from capturing at opacity 0.
export async function freezeMotionForCapture(): Promise<() => Promise<void>> {
	// Mount-time transitions (Link underline colour, control chrome) often start a frame after
	// paint. Wait, finish them, then freeze so reduced-motion cannot cancel mid-flight.
	await waitAnimationFrames();
	const pausedExitAnimations: Array<Animation> = [];
	const collectPausedExitAnimations = (batch: Array<Animation>) => {
		for (const animation of batch) {
			if (!pausedExitAnimations.includes(animation)) pausedExitAnimations.push(animation);
		}
	};
	collectPausedExitAnimations(finishInFlightMotion());

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
	/* Pin decoration colour so a cancelled text-decoration-color transition cannot hide underlines. */
	text-decoration-color: currentColor !important;
}
[data-entering], [data-exiting] {
	opacity: 1 !important;
	translate: none !important;
}
`;
	document.head.append(freezeMotion);
	await waitAnimationFrames();
	collectPausedExitAnimations(finishInFlightMotion());

	return async () => {
		freezeMotion.remove();
		await setEmulatedMediaFeature('prefers-reduced-motion', previousReducedMotion);
		for (const animation of pausedExitAnimations) {
			try {
				if (animation.playState === 'paused') animation.play();
			} catch {
				// Animation may have finished or been removed while frozen.
			}
		}
	};
}

export async function captureVisual(locator: Locator, id: string) {
	if (!VISUAL_CAPTURE_ID_PATTERN.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}

	// Resolve before async viewport/motion work so scrollHeight uses a live element reference.
	const element = locator.element();

	const originalViewportWidth = window.innerWidth;
	const originalViewportHeight = window.innerHeight;
	// Skip a no-op viewport resize: React Aria closes popovers on document scroll, and some
	// viewport implementations reset scroll even when the size is unchanged.
	if (
		originalViewportWidth !== VISUAL_VIEWPORT_WIDTH ||
		originalViewportHeight !== VISUAL_VIEWPORT_HEIGHT
	) {
		await page.viewport(VISUAL_VIEWPORT_WIDTH, VISUAL_VIEWPORT_HEIGHT);
	}
	if (document.fonts?.status !== 'loaded') {
		await document.fonts.ready;
	}
	const restoreMotion = await freezeMotionForCapture();
	let isTall = false;
	try {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const viewport = formatVisualViewport(viewportWidth, viewportHeight);
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

		// Re-bind from the resolved element after freeze. Body captures use text-derived locators
		// that live regions can invalidate while motion is frozen.
		await expect
			.element(page.elementLocator(element))
			.toMatchScreenshot(formatVisualCaptureName(id, viewport));
	} finally {
		if (isTall) {
			await page.viewport(VISUAL_VIEWPORT_WIDTH, VISUAL_VIEWPORT_HEIGHT);
			await cdp().send('Emulation.clearDeviceMetricsOverride');
		}
		await restoreMotion();
		if (
			window.innerWidth !== originalViewportWidth ||
			window.innerHeight !== originalViewportHeight
		) {
			await page.viewport(originalViewportWidth, originalViewportHeight);
		}
		// Park outside the viewport so the next capture does not inherit an accidental hover
		// (text Links invert underline under `:hover` / `data-hovered`).
		await parkPointer();
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
