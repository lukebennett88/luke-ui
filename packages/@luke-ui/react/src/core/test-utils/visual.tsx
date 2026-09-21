import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import { expect } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import type { VisualAppearance } from './render.js';
import { formatVisualCaptureName, formatVisualViewport } from './visual-capture-id.js';

const VISUAL_CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Fixed viewport for visual captures only, so full-page captures (open menus
// render in portals outside the component) are deterministic. Behavioural
// tests keep the browser provider's own default viewport.
const VISUAL_VIEWPORT_WIDTH = 1024;
const VISUAL_VIEWPORT_HEIGHT = 800;

/**
 * Freezes CSS animations and transitions so animated UI (e.g. the loading
 * spinner) screenshots deterministically. The Playwright provider also
 * disables animations during capture; this is the belt-and-suspenders path
 * for transitions triggered by interactions before the screenshot is taken.
 *
 * Also freezes the text-input caret, which blinks on its own timer and isn't
 * a CSS animation.
 *
 * Overlays skip enter transitions under `prefers-reduced-motion: reduce`.
 * Emulate that media feature so zeroed transition durations do not leave
 * `[data-entering]` trays at opacity 0 for visual captures.
 *
 * This must be undone after the capture (see the returned function) so it
 * cannot leak into a behavioural test sharing the same page context.
 */
async function freezeMotionForCapture(): Promise<() => Promise<void>> {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
	});

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

	return async () => {
		freezeMotion.remove();
		await cdp().send('Emulation.setEmulatedMedia', {
			features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
		});
	};
}

/** Captures a named scene into the revision output selected by the visual runner. */
export async function captureVisual(locator: Locator, id: string) {
	if (!VISUAL_CAPTURE_ID_PATTERN.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}

	const originalViewportWidth = window.innerWidth;
	const originalViewportHeight = window.innerHeight;
	await page.viewport(VISUAL_VIEWPORT_WIDTH, VISUAL_VIEWPORT_HEIGHT);
	const restoreMotion = await freezeMotionForCapture();
	try {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const viewport = formatVisualViewport(viewportWidth, viewportHeight);
		const element = locator.element();
		const fullHeight = element.scrollHeight;
		const isTall = fullHeight > viewportHeight;

		if (isTall) {
			// Vitest browser mode renders the test inside an iframe sized to the
			// configured viewport; growing only the top-level page (via CDP) leaves
			// the iframe's own box unchanged, so it never paints past its original
			// height. `page.viewport` resizes and re-lays-out the iframe itself, so
			// both must grow together for the revealed region to paint.
			await cdp().send('Emulation.setDeviceMetricsOverride', {
				deviceScaleFactor: window.devicePixelRatio,
				height: fullHeight,
				mobile: false,
				width: viewportWidth,
			});
			await page.viewport(viewportWidth, fullHeight);
		}

		await expect.element(locator).toMatchScreenshot(formatVisualCaptureName(id, viewport));

		if (isTall) {
			await page.viewport(viewportWidth, viewportHeight);
			await cdp().send('Emulation.clearDeviceMetricsOverride');
		}
	} finally {
		await restoreMotion();
		await page.viewport(originalViewportWidth, originalViewportHeight);
	}
}

/** Captures one look with a stable identity-and-mode suffix added to `id`. */
export async function captureVisualAppearance(
	locator: Locator,
	id: string,
	appearance: VisualAppearance,
) {
	await captureVisual(locator, `${id}-${appearance.theme}-${appearance.mode}`);
}

/** Emulates Chromium forced colours for a visual scene. */
export async function emulateForcedColors(value: 'active' | 'none') {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'forced-colors', value }],
	});
}

/**
 * The non-nullable union of values a component accepts for `Prop`, for building
 * variant arrays without repeating `NonNullable<SomeProps['x']>`. For example
 * `PropOptions<typeof Button, 'tone'>`.
 */
export type PropOptions<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
> = NonNullable<ComponentProps<Component>[Prop]>;

/**
 * Constrains `values` to valid prop values for `Component[Prop]` and returns
 * the exact tuple type. Replaces the `as const satisfies ReadonlyArray<PropOptions<…>>`
 * pattern.
 *
 * @example
 * const tones = variantValuesFor<typeof Button, 'tone'>()(['neutral', 'accent', 'danger']);
 */
export function variantValuesFor<
	Component extends ComponentType<any>,
	Prop extends keyof ComponentProps<Component>,
>() {
	return <const T extends ReadonlyArray<PropOptions<Component, Prop>>>(values: T): T => values;
}

const SCENE_GAP = '1rem';
const SCENE_PADDING = '1rem';

/**
 * Vertical scene with consistent padding and gap, for form-like components.
 * Children stretch to `width` by default; pass `align="flex-start"` for content
 * that should hug its own size (e.g. buttons, links, inline placeholders).
 */
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

/** Grid scene with consistent padding and gap, for laying out many variants. */
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

/**
 * Moves keyboard focus to `target` by tabbing, so the browser applies
 * `:focus-visible` (which a programmatic `.focus()` would not), and asserts focus
 * landed. Follow with `captureVisual` on the scene to capture the focus ring.
 */
export async function focusViaKeyboard(target: Locator) {
	await userEvent.tab();
	await expect.element(target).toHaveFocus();
}
