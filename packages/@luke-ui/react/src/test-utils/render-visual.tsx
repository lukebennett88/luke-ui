/// <reference types="vite/client" />

// Loads the design-token stylesheet into the test document.
import '../stylesheet.css.js';
import type { ComponentProps, ComponentType, CSSProperties, ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { expect } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
// The generated spritesheet is emitted to `dist/` by the `generate` task, which
// both `build` and `test` depend on, so it is always present when tests run.
import spritesheetHref from '../../dist/spritesheet.svg?url';
import { IconSpritesheetProvider } from '../icon/index.js';
import { themeRootClassName } from '../theme/index.js';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

/**
 * Renders `node` inside the same theme root and icon spritesheet provider the
 * app (and Storybook) wrap components with, then returns a Vitest locator for
 * the mounted subtree ready to pass to `captureVisual`.
 */
export function renderVisual(node: ReactNode) {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = themeRootClassName;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(<IconSpritesheetProvider href={spritesheetHref}>{node}</IconSpritesheetProvider>);
	});

	return page.elementLocator(container);
}

/** Captures a named scene into the revision output selected by the visual runner. */
export async function captureVisual(locator: Locator, id: string) {
	if (!/^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
		throw new Error(`Visual capture IDs must use a component namespace: ${id}`);
	}
	const viewport = `${window.innerWidth}x${window.innerHeight}`;
	await expect.element(locator).toMatchScreenshot(`${id}__viewport-${viewport}`);
}

/** Unmounts everything rendered by `renderVisual`. Registered globally in `visual-setup.ts`. */
export function cleanupVisual() {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
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
 * const tones = variantValuesFor<typeof Button, 'tone'>()(['primary', 'critical', 'ghost', 'neutral']);
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
