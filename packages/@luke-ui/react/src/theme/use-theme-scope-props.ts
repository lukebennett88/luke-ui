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
	 * An element inside the themed subtree the portal belongs to. Used only when no `Theme`
	 * encloses the portal, to recover the identity and colour mode from the DOM instead: ancestors
	 * of `sourceRef.current` (or, when omitted, `document.activeElement`) are walked for the
	 * outermost identity class and the nearest `data-color-mode`. Pass the trigger element, since
	 * it sits inside the themed subtree the portal is conceptually part of.
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
 * When a `Theme` encloses the call site, the returned props are declarative: they read the
 * identity and colour mode straight from context, so a later change to either is applied on the
 * next render. Otherwise, they fall back to the documented low-level path: `className` is just
 * `themeRootClassName`, and the returned `ref` callback carries the identity class and colour mode
 * from the DOM ancestors of `sourceRef.current` (or `document.activeElement`) once, when the
 * portal element mounts.
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
