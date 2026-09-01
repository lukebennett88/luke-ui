import type { CompiledStyles, StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { cx } from '../../shared/utils/utils.js';

/** Public `xstyle` input accepted by every StyleX-migrated visual component. */
export type XStyleProp<CSS extends Record<string, unknown> = Record<string, unknown>> =
	StyleXStyles<CSS>;

/**
 * The shared `xstyle` contract. A component whose styling target needs no further qualification
 * extends this instead of redeclaring the prop, so the published description is written once. A
 * component that targets a specific part of its own anatomy declares `xstyle` itself and says which
 * element receives it.
 */
export interface XStyleProps {
	/**
	 * Extra styles as one or more `stylex.create(...)` objects, for a CSS property the component's
	 * own props do not expose. Applied after the component's own styles and variants, and before
	 * `className`, so a same-property `xstyle` value replaces a competing default or variant. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

/**
 * Resolves a component's compiled styles and public override in the one `stylex.props` call that
 * defines their precedence. `stylex.props` retains only the last value for a CSS property, so an
 * `xstyle` atom replaces a competing default or variant atom before either reaches the DOM.
 */
export function resolveXStyleProps(
	styles: ReadonlyArray<CompiledStyles>,
	xstyle: XStyleProp | undefined,
	className: string | undefined,
	inlineStyle: CSSProperties | undefined,
): { className: string | undefined; style: CSSProperties | undefined } {
	const resolved = stylex.props(...styles, xstyle);
	return {
		className: cx(resolved.className, className),
		style: resolved.style === undefined ? inlineStyle : { ...resolved.style, ...inlineStyle },
	};
}
