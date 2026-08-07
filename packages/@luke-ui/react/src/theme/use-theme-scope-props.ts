import type { RefCallback, RefObject } from 'react';
import { useMemo } from 'react';
import { cx } from '../utils/index.js';
import { THEME_CLASS_NAME_PREFIX, themeClassName } from './theme-class-name.js';
import { themeRootClassName } from './theme-root-class-name.js';
import type { ColorMode } from './theme-scope.js';
import { useThemeScope } from './theme-scope.js';

/** Options for `useThemeScopeProps`. */
export interface UseThemeScopePropsOptions {
	/**
	 * An element inside the themed subtree the portal belongs to. It applies only when no `Theme`
	 * encloses the portal. The hook then walks the ancestors of `sourceRef.current` for the
	 * outermost identity class and the nearest `data-color-mode`. It walks from
	 * `document.activeElement` when this option is omitted. Pass the trigger element, because it
	 * sits inside the subtree the portal belongs to.
	 */
	sourceRef?: RefObject<Element | null>;
}

/** Props `useThemeScopeProps` returns for a portal root to apply directly. */
export interface ThemeScopeProps {
	className: string;
	'data-color-mode': ColorMode | undefined;
	ref: RefCallback<HTMLElement>;
}

const noopRef: RefCallback<HTMLElement> = () => {};

/**
 * Carries the enclosing theme scope onto a portal root that React does not otherwise place inside
 * the themed subtree (for example a popover rendered into `document.body`).
 *
 * When a `Theme` encloses the call site, the returned props are declarative. They read the
 * identity and colour mode straight from context. A later change to either applies on the next
 * render.
 *
 * Otherwise they fall back to the documented low-level path. `className` is `themeRootClassName`
 * alone, and the returned `ref` callback carries the identity class and colour mode from the DOM.
 * It reads them once, when the portal element mounts.
 */
export function useThemeScopeProps(options?: UseThemeScopePropsOptions): ThemeScopeProps {
	const scope = useThemeScope();
	const sourceRef = options?.sourceRef;

	return useMemo<ThemeScopeProps>(() => {
		if (scope !== null) {
			return {
				className: cx(themeRootClassName, themeClassName(scope.name)),
				'data-color-mode': scope.colorMode,
				ref: noopRef,
			};
		}

		return {
			className: themeRootClassName,
			'data-color-mode': undefined,
			ref: (node) => {
				if (node === null) return;

				const source = resolveThemeSource(sourceRef);
				if (source === undefined) return;

				carryThemeScope(source, node);
			},
		};
	}, [scope, sourceRef]);
}

function resolveThemeSource(sourceRef?: RefObject<Element | null>): Element | undefined {
	const source = sourceRef?.current ?? document.activeElement;
	return source instanceof Element ? source : undefined;
}

function carryThemeScope(source: Element, portal: HTMLElement) {
	const identityClassName = findThemeIdentity(source);
	if (identityClassName !== undefined) portal.classList.add(identityClassName);

	const modeRoot = source.closest<HTMLElement>('[data-color-mode]');
	const mode = modeRoot?.dataset.colorMode;
	if (mode === 'light' || mode === 'dark') portal.dataset.colorMode = mode;
}

function findThemeIdentity(source: Element) {
	let identityClassName: string | undefined;
	let ancestor: Element | null = source;

	while (ancestor !== null) {
		for (const className of ancestor.classList) {
			// Keep the outer identity because nested identities are not supported.
			if (className.startsWith(THEME_CLASS_NAME_PREFIX)) identityClassName = className;
		}
		ancestor = ancestor.parentElement;
	}

	return identityClassName;
}
