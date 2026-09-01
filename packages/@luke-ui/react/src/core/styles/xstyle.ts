import type { CompiledStyles, StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { cx } from '../../shared/utils/utils.js';

/** Public `xstyle` input accepted by every StyleX-migrated visual component. */
export type XStyleProp<CSS extends Record<string, unknown> = Record<string, unknown>> =
	StyleXStyles<CSS>;

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
