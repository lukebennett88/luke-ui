/// <reference types="vite/client" />

// Loads the design-token stylesheet into the test document.
import '../stylesheet.css.js';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
// The generated spritesheet is emitted to `dist/` by the `generate` task, which
// both `build` and `test` depend on, so it is always present when tests run.
import spritesheetHref from '../../../dist/spritesheet.svg?url';
import { themeClassName as paperThemeClassName } from '../../theme/bundles/paper/index.js';
import { themeClassName as tactileThemeClassName } from '../../theme/bundles/tactile/index.js';
import { rootClassName, vars } from '../../theme/index.js';
import { IconSpritesheetProvider } from '../icon/index.js';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

/** The identity class currently applied to `document.documentElement`, if any. */
let appliedIdentityClassName: string | undefined;

export type VisualAppearance = {
	mode: 'light' | 'dark';
	theme: 'tactile' | 'paper';
};

export const visualAppearances = [
	{ mode: 'light', theme: 'tactile' },
	{ mode: 'dark', theme: 'tactile' },
	{ mode: 'light', theme: 'paper' },
	{ mode: 'dark', theme: 'paper' },
] as const satisfies ReadonlyArray<VisualAppearance>;

const defaultVisualAppearance: VisualAppearance = visualAppearances[0];

export type RenderResult = {
	container: HTMLElement;
	locator: Locator;
	user: typeof userEvent;
	unmount: () => void;
};

/**
 * Renders `node` inside the same theme root and icon spritesheet provider the
 * app (and Storybook) wrap components with, then returns a Vitest locator for
 * the mounted subtree ready to pass to `captureVisual`, plus the page-bound
 * `userEvent` (a convenience re-export so callers do not need a second import).
 *
 * The identity class and colour mode go on `document.documentElement`, not the
 * container, so a portal (combobox popover, mobile tray) that mounts outside
 * the container still gets the intended theme and mode.
 */
export function render(node: ReactNode, options?: { appearance?: VisualAppearance }): RenderResult {
	const appearance = options?.appearance ?? defaultVisualAppearance;
	const identityClassName = identityClassNameFor(appearance.theme);
	if (appliedIdentityClassName != null) {
		document.documentElement.classList.remove(appliedIdentityClassName);
	}
	document.documentElement.classList.add(identityClassName);
	appliedIdentityClassName = identityClassName;
	document.documentElement.dataset.colorMode = appearance.mode;

	const container = document.body.appendChild(document.createElement('div'));
	container.className = rootClassName;
	container.style.backgroundColor = vars.color.surface.canvas;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(<IconSpritesheetProvider href={spritesheetHref}>{node}</IconSpritesheetProvider>);
	});

	return {
		container,
		locator: page.elementLocator(container),
		unmount: () => unmount(container, root),
		user: userEvent,
	};
}

function unmount(container: HTMLElement, root: Root) {
	const index = mounted.findIndex((entry) => entry.container === container);
	if (index !== -1) mounted.splice(index, 1);
	act(() => root.unmount());
	container.remove();
}

function identityClassNameFor(theme: VisualAppearance['theme']) {
	return theme === 'tactile' ? tactileThemeClassName : paperThemeClassName;
}

/**
 * Unmounts everything rendered by `render`. Registered globally, for both the
 * `browser` and `visual` Vitest projects, in `render-setup.ts`.
 */
export function cleanupMountedRenders() {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;

	if (appliedIdentityClassName != null) {
		document.documentElement.classList.remove(appliedIdentityClassName);
		appliedIdentityClassName = undefined;
	}
	delete document.documentElement.dataset.colorMode;
}
