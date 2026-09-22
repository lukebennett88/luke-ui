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

type ExitStyleLock = {
	element: HTMLElement;
	properties: Array<string>;
};

function animationTarget(animation: Animation): Element | null {
	const effect = animation.effect;
	return effect && 'target' in effect ? (effect.target as Element | null) : null;
}

/**
 * Jump running CSS transitions and animations to their end values.
 *
 * Applying `prefers-reduced-motion: reduce` or `transition: none` mid-flight cancels the
 * transition and leaves interpolated values (for example a semi-transparent
 * `text-decoration-color`) frozen in place. Finish first, then freeze.
 *
 * Exit animations are paused instead of finished so finishing them cannot unmount an
 * overlay before the screenshot. Only animations that were running when paused are returned
 * for resume — already-paused exit animations stay paused after restore.
 */
function finishInFlightMotion(root: Document | Element = document): Array<Animation> {
	const pausedByFreeze: Array<Animation> = [];
	if (typeof root.getAnimations !== 'function') return pausedByFreeze;

	for (const animation of root.getAnimations({ subtree: true })) {
		const target = animationTarget(animation);
		if (target instanceof Element && target.closest('[data-exiting]')) {
			if (animation.playState !== 'running') continue;
			try {
				animation.pause();
				pausedByFreeze.push(animation);
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
	return pausedByFreeze;
}

/**
 * Luke UI recipes set `transition: none` and retarget opacity/translate under
 * `prefers-reduced-motion: reduce`. That cancels paused CSSTransitions React Aria already
 * snapped for `useExitAnimation`, which unmounts the overlay before the screenshot.
 *
 * Lock each exiting element's transition and CSSTransition end values so reduced-motion and
 * freeze styles cannot cancel those animations.
 */
function lockExitingCssTransitions(root: Document | Element = document): Array<ExitStyleLock> {
	const locks: Array<ExitStyleLock> = [];
	if (typeof root.getAnimations !== 'function') return locks;

	const byElement = new Map<HTMLElement, Array<Animation>>();
	for (const animation of root.getAnimations({ subtree: true })) {
		if (!(animation instanceof CSSTransition)) continue;
		const target = animationTarget(animation);
		if (!(target instanceof HTMLElement) || !target.closest('[data-exiting]')) continue;
		const existing = byElement.get(target);
		if (existing) existing.push(animation);
		else byElement.set(target, [animation]);
	}

	for (const [element, animations] of byElement) {
		const properties: Array<string> = [];
		element.style.setProperty('transition', getComputedStyle(element).transition, 'important');
		properties.push('transition');

		for (const animation of animations) {
			const effect = animation.effect;
			if (!effect || !('getKeyframes' in effect)) continue;
			const end = effect.getKeyframes().at(-1);
			if (!end) continue;
			for (const [property, value] of Object.entries(end)) {
				if (
					property === 'offset' ||
					property === 'easing' ||
					property === 'composite' ||
					property === 'computedOffset' ||
					(typeof value !== 'string' && typeof value !== 'number')
				) {
					continue;
				}
				element.style.setProperty(property, String(value), 'important');
				properties.push(property);
			}
		}
		locks.push({ element, properties });
	}
	return locks;
}

function clearExitStyleLocks(locks: Array<ExitStyleLock>) {
	for (const { element, properties } of locks) {
		for (const property of properties) {
			element.style.removeProperty(property);
		}
	}
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
	const pausedByFreeze: Array<Animation> = [];
	const collectPausedByFreeze = (batch: Array<Animation>) => {
		for (const animation of batch) {
			if (!pausedByFreeze.includes(animation)) pausedByFreeze.push(animation);
		}
	};
	collectPausedByFreeze(finishInFlightMotion());
	// Lock before reduced-motion: recipes' `transition: none` would cancel paused CSS exits.
	const exitStyleLocks = lockExitingCssTransitions();

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
/* Keep paused [data-exiting] CSSTransitions alive for React Aria's exit wait. */
[data-exiting], [data-exiting] *, [data-exiting]::before, [data-exiting]::after {
	animation-delay: unset !important;
	animation-duration: unset !important;
	transition-delay: unset !important;
	transition-duration: unset !important;
}
/* Pin entering overlays only. Pinning exiting opacity/translate cancels paused CSS exits. */
[data-entering] {
	opacity: 1 !important;
	translate: none !important;
}
`;
	document.head.append(freezeMotion);
	await waitAnimationFrames();
	collectPausedByFreeze(finishInFlightMotion());

	return async () => {
		freezeMotion.remove();
		await setEmulatedMediaFeature('prefers-reduced-motion', previousReducedMotion);
		clearExitStyleLocks(exitStyleLocks);
		for (const animation of pausedByFreeze) {
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
