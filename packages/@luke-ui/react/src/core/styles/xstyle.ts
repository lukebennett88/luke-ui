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
	 * own props do not expose.
	 *
	 * The one relationship this prop guarantees is `component recipe/variant styles < xstyle`: both
	 * are resolved inside a single `stylex.props(...)` call, and StyleX keeps only the last value
	 * for a given CSS property, so a same-property `xstyle` value always replaces a competing
	 * default or variant.
	 *
	 * `xstyle` versus a consumer `className` is decided by the ordinary CSS cascade — cascade
	 * layer, then specificity, then source order, then `!important` — not by the order props are
	 * passed or resolved. Appending a class to the rendered `class` attribute does not create
	 * precedence; DOM class token order is irrelevant to the cascade. A class compiled into a
	 * higher-priority layer such as `utilities`, or ordinary unlayered application CSS, can beat
	 * `xstyle`. A class compiled into a lower-priority layer such as `base` still loses to it.
	 * Inline `style` always wins over any class-based styling.
	 *
	 * Compiling `xstyle` requires the consumer's own StyleX compiler. `@luke-ui/vite` is the
	 * supported way to set this up for a Vite app; an equivalent StyleX bundler integration works
	 * too, but this package's `@stylexjs/stylex` runtime dependency alone is not enough. See the
	 * "Override a single property with `xstyle`" and "Cascade layers" sections of the Styling
	 * guide for the layer setup and full precedence walkthrough.
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
 * Resolves `className` and `style` for a React Aria component in one pass, applying the same
 * `xstyle` contract as `resolveXStyleProps`: component recipe/variant styles < `xstyle`,
 * guaranteed by resolving both in one `stylex.props(...)` call. Where a consumer `className` or
 * inline `style` lands relative to that is decided separately — the CSS cascade for `className`,
 * always-wins for inline `style`. See `XStyleProps#xstyle` for the full precedence contract.
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
