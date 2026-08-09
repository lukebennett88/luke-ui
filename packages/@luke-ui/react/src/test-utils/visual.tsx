import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import { expect } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { cdp, page, userEvent } from 'vite-plus/test/context';
import type { VisualAppearance } from './render.js';

const VISUAL_CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Captures a named scene into the revision output selected by the visual runner. */
export async function captureVisual(locator: Locator, id: string) {
	if (!VISUAL_CAPTURE_ID_PATTERN.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const viewport = `${viewportWidth}x${viewportHeight}`;
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
			width: viewportWidth,
			height: fullHeight,
			deviceScaleFactor: window.devicePixelRatio,
			mobile: false,
		});
		await page.viewport(viewportWidth, fullHeight);
	}

	await expect.element(locator).toMatchScreenshot(`${id}__viewport-${viewport}`);

	if (isTall) {
		await page.viewport(viewportWidth, viewportHeight);
		await cdp().send('Emulation.clearDeviceMetricsOverride');
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
