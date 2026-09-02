import type { CompiledStyles, StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
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
	 * `className`, so a same-property `xstyle` value replaces a competing default or variant.
	 *
	 * The `xstyle < className` step of this contract depends on how the consumer's own StyleX
	 * output is layered — resolution order alone does not decide it, CSS cascade layers do.
	 * Compiling `xstyle` requires the consumer's own StyleX compiler (`@stylexjs/babel-plugin` or
	 * an equivalent bundler integration); this package's `@stylexjs/stylex` runtime dependency is
	 * not enough on its own. A consumer `className` reliably beats `xstyle` only when the consumer
	 * compiles their StyleX into a dedicated `xstyle` layer that sits above `recipes` and below
	 * `components`/`utilities`, and declares the combined layer order —
	 * `@layer reset, theme, base, recipes, xstyle, components, utilities;` — before any stylesheet
	 * import. With StyleX's default (unlayered) output, an unlayered `xstyle` rule beats even a
	 * layered `className`, so the documented precedence does not hold without that configuration.
	 * See the "Override a single property with `xstyle`" and "Cascade layers" sections of the
	 * Styling guide. Inline `style` beats `className`.
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

/**
 * A React Aria render-prop value: either a plain value, or a function of the component's
 * render props that returns one. Matches RAC's own `ClassNameOrFunction<T>` /
 * `StyleOrFunction<T>` shapes closely enough to accept both without importing them, so this
 * stays a plain styles helper rather than a dependency of the RAC type surface.
 */
type RacRenderPropValue<T, V> = V | ((renderProps: T) => V);

/**
 * Resolves `className` and `style` for a React Aria component in one pass, enforcing the same
 * precedence as `resolveXStyleProps`: internal styles and variants < `xstyle` < consumer
 * `className` < inline `style`.
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
