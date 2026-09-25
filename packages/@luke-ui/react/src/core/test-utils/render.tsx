/// <reference types="vite/client" />

import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/paper/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import { rootClassName, vars } from '@luke-ui/react/theme';
import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import type { ReactNode } from 'react';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type { Locator } from 'vite-plus/test/context';
import { page, userEvent } from 'vite-plus/test/context';
import spritesheetHref from '../../../dist/spritesheet.svg?url';
import {
	getAppliedIdentityClassName,
	setAppliedIdentityClassName,
	trackMountedRender,
	untrackMountedRender,
} from './render-mount-state.js';

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

export type HydrateResult = RenderResult & {
	/** Recoverable React errors observed during hydrate, including hydration mismatches. */
	recoverableErrors: Array<unknown>;
};

export function render(node: ReactNode, options?: { appearance?: VisualAppearance }): RenderResult {
	const appearance = options?.appearance ?? defaultVisualAppearance;
	applyAppearance(appearance);

	const container = document.body.appendChild(document.createElement('div'));
	container.className = rootClassName;
	container.style.backgroundColor = vars.color.surface.canvas;
	const root = createRoot(container);
	trackMountedRender(container, root);

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

/**
 * Hydrates server markup into a themed container. Use for SSR/hydration regressions that must not
 * mount through `createRoot`.
 */
export function hydrate(
	markup: string,
	node: ReactNode,
	options?: { appearance?: VisualAppearance },
): HydrateResult {
	const appearance = options?.appearance ?? defaultVisualAppearance;
	applyAppearance(appearance);

	const container = document.body.appendChild(document.createElement('div'));
	container.className = rootClassName;
	container.style.backgroundColor = vars.color.surface.canvas;
	container.innerHTML = markup;

	const recoverableErrors: Array<unknown> = [];
	let root!: Root;
	act(() => {
		root = hydrateRoot(container, node, {
			onRecoverableError: (error) => {
				recoverableErrors.push(error);
			},
		});
	});
	trackMountedRender(container, root);

	return {
		container,
		locator: page.elementLocator(container),
		recoverableErrors,
		unmount: () => unmount(container, root),
		user: userEvent,
	};
}

function applyAppearance(appearance: VisualAppearance) {
	const identityClassName = identityClassNameFor(appearance.theme);
	const appliedIdentityClassName = getAppliedIdentityClassName();
	if (appliedIdentityClassName != null) {
		document.documentElement.classList.remove(appliedIdentityClassName);
	}
	document.documentElement.classList.add(identityClassName);
	setAppliedIdentityClassName(identityClassName);
	document.documentElement.dataset.colorMode = appearance.mode;
}

function unmount(container: HTMLElement, root: Root) {
	untrackMountedRender(container);
	act(() => root.unmount());
	container.remove();
}

function identityClassNameFor(theme: VisualAppearance['theme']) {
	return theme === 'tactile' ? tactileThemeClassName : paperThemeClassName;
}
