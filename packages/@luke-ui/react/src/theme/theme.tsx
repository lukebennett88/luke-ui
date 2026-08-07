import type { ComponentProps, JSX } from 'react';
import { useMemo } from 'react';
import { cx } from '../utils/index.js';
import { themeClassName } from './theme-class-name.js';
import { themeRootClassName } from './theme-root-class-name.js';
import type { ColorMode, ThemeScope } from './theme-scope.js';
import { ThemeScopeContext, useThemeScope } from './theme-scope.js';

/** Props for `Theme`. */
export interface ThemeProps extends ComponentProps<'div'> {
	/** The explicit colour mode. Omit it to follow `prefers-color-scheme`. */
	colorMode?: ColorMode;
	/**
	 * The theme's name, as given to `defineTheme`. Provide it to start a theme root; omit it to
	 * change only the colour mode of an enclosing `Theme`'s identity. Do not nest one named
	 * `Theme` inside another.
	 */
	name?: string;
}

/**
 * Applies a theme identity and/or colour mode to a subtree.
 *
 * With `name`, this is a theme root: it renders the CSS reset, the base theme layer, and the
 * named identity, matching a hand-built `cx(themeRootClassName, themeClassName(name))`. Without
 * `name`, it changes only the colour mode of the identity established by an enclosing `Theme` —
 * it renders no reset and no identity class of its own, so the reset never runs twice and the
 * identity is never re-applied.
 *
 * `data-color-mode` is always rendered, including as `undefined` (which React omits) when the
 * scope follows the system preference, so server rendering emits the same markup a client
 * hydrates against.
 *
 * Identities do not nest. A named `Theme` inside another one emits an identity class that ties
 * with the outer identity's `[data-color-mode]` rules at equal specificity, so which one wins
 * depends on stylesheet order. Render an independent theme root outside the first instead.
 */
export function Theme(props: ThemeProps): JSX.Element {
	const { children, className, colorMode, name, ref, ...restProps } = props;

	const enclosingScope = useThemeScope();
	const resolvedColorMode = colorMode ?? enclosingScope?.colorMode;
	const effectiveName = name ?? enclosingScope?.name;

	const scope = useMemo<ThemeScope | null>(() => {
		if (effectiveName === undefined) return null;
		return { colorMode: resolvedColorMode, name: effectiveName };
	}, [effectiveName, resolvedColorMode]);

	const resolvedClassName =
		name === undefined ? className : cx(themeRootClassName, themeClassName(name), className);

	return (
		<ThemeScopeContext.Provider value={scope}>
			<div
				{...restProps}
				className={resolvedClassName}
				data-color-mode={resolvedColorMode}
				ref={ref}
			>
				{children}
			</div>
		</ThemeScopeContext.Provider>
	);
}
