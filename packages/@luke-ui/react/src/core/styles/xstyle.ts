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

type ResolvedStyleXProps = Omit<ReturnType<typeof stylex.props>, 'className' | 'style'> & {
	className?: string;
	style?: CSSProperties;
};

/** Resolves component styles and `xstyle` in one `stylex.props` call. */
export function resolveXStyleProps(
	styles: ReadonlyArray<CompiledStyles>,
	xstyle: XStyleProp | undefined,
	className: string | undefined,
	inlineStyle: CSSProperties | undefined,
): ResolvedStyleXProps {
	const resolved = stylex.props(...styles, xstyle);
	return {
		...resolved,
		className: cx(resolved.className, className),
		style: resolved.style === undefined ? inlineStyle : { ...resolved.style, ...inlineStyle },
	};
}

/** A React Aria prop value or a function that returns one. */
type RacRenderPropValue<T, V> = V | ((renderProps: T) => V);

/** Composes resolved recipe props with React Aria's function-valued className and style props. */
export function composeRacRecipeProps<ClassNameRenderProps, StyleRenderProps>(
	recipeProps: ResolvedStyleXProps,
	className: RacRenderPropValue<ClassNameRenderProps, string> | undefined,
	style: RacRenderPropValue<StyleRenderProps, CSSProperties | undefined> | undefined,
): Omit<ResolvedStyleXProps, 'className' | 'style'> & {
	className: (renderProps: ClassNameRenderProps) => string;
	style: (renderProps: StyleRenderProps) => CSSProperties | undefined;
} {
	return {
		...recipeProps,
		className: composeRenderProps(className, (resolvedClassName) => {
			return cx(recipeProps.className, resolvedClassName);
		}),
		style: composeRenderProps(style, (resolvedStyle) => {
			return recipeProps.style === undefined
				? resolvedStyle
				: { ...recipeProps.style, ...resolvedStyle };
		}),
	};
}

/** Resolves styles once and composes them with React Aria's function-valued props. */
export function resolveRacXStyleProps<ClassNameRenderProps, StyleRenderProps>(
	styles: ReadonlyArray<CompiledStyles>,
	xstyle: XStyleProp | undefined,
	className: RacRenderPropValue<ClassNameRenderProps, string> | undefined,
	style: RacRenderPropValue<StyleRenderProps, CSSProperties | undefined> | undefined,
): Omit<ResolvedStyleXProps, 'className' | 'style'> & {
	className: (renderProps: ClassNameRenderProps) => string;
	style: (renderProps: StyleRenderProps) => CSSProperties | undefined;
} {
	// `stylex.props` only depends on `styles` and `xstyle`, both known upfront, so computing it
	// here lets both closures below reuse the one result instead of resolving it twice.
	const resolved = stylex.props(...styles, xstyle);

	return {
		...resolved,
		className: composeRenderProps(className, (resolvedClassName) => {
			return cx(resolved.className, resolvedClassName);
		}),
		style: composeRenderProps(style, (resolvedStyle) => {
			return resolved.style === undefined ? resolvedStyle : { ...resolved.style, ...resolvedStyle };
		}),
	};
}
