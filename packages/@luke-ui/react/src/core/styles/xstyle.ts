import type { CompiledStyles, StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';

/** Public `xstyle` input accepted by every StyleX-migrated visual component. */
export type XStyleProp<CSS extends Record<string, unknown> = Record<string, unknown>> =
	StyleXStyles<CSS>;

/** Shared `xstyle` props for components with a single styling target. */
export interface XStyleProps {
	/** Extra `stylex.create(...)` styles for properties not exposed by the component. */
	xstyle?: XStyleProp;
}

/** Resolves component styles and `xstyle` in one `stylex.props` call. */
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

/** A React Aria prop value or a function that returns one. */
type RacRenderPropValue<T, V> = V | ((renderProps: T) => V);

/**
 * Resolves `className` and `style` for a React Aria component in one pass, applying the same
 * `xstyle` contract as `resolveXStyleProps`: component recipe/variant styles < `xstyle`,
 * guaranteed by resolving both in one `stylex.props(...)` call. Where a consumer `className` or
 * inline `style` lands relative to that is decided separately — the CSS cascade for `className`
 * (including importance, layers, specificity, and source order); for normal declarations, inline
 * `style` wins over class-based styling, though an author `!important` can override a normal
 * inline style. See `XStyleProps#xstyle` for the full precedence contract.
 *
 * React Aria Components lets `className` and `style` be plain values or functions of the
 * component's render props (`composeRenderProps`), so a RAC element cannot resolve both props
 * from one `resolveXStyleProps` call the way a plain element does. This helper hoists the
 * `stylex.props(...)` call so it runs once per render instead of once per prop, then wraps each
 * RAC prop in its own `composeRenderProps` closure that reuses that result. The returned object
 * spreads directly onto the RAC element.
 *
 * `className` and `style` take separate type parameters because RAC's own render props differ
 * between the two: the `className` function additionally receives `defaultClassName`, and the
 * `style` function receives `defaultStyle`, so unifying them under one type parameter would
 * reject either the `Button` or the `Group` render-prop shapes RAC actually produces.
 */
export function resolveRacXStyleProps<ClassNameRenderProps, StyleRenderProps>(
	styles: ReadonlyArray<CompiledStyles>,
	xstyle: XStyleProp | undefined,
	className: RacRenderPropValue<ClassNameRenderProps, string> | undefined,
	style: RacRenderPropValue<StyleRenderProps, CSSProperties | undefined> | undefined,
): {
	className: (renderProps: ClassNameRenderProps) => string;
	style: (renderProps: StyleRenderProps) => CSSProperties | undefined;
} {
	// `stylex.props` only depends on `styles` and `xstyle`, both known upfront, so computing it
	// here lets both closures below reuse the one result instead of resolving it twice.
	const resolved = stylex.props(...styles, xstyle);

	return {
		className: composeRenderProps(className, (resolvedClassName) => {
			return cx(resolved.className, resolvedClassName);
		}),
		style: composeRenderProps(style, (resolvedStyle) => {
			return resolved.style === undefined ? resolvedStyle : { ...resolved.style, ...resolvedStyle };
		}),
	};
}
