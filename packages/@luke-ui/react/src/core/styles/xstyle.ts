import type { CompiledStyles, StyleXStyles } from '@stylexjs/stylex';
import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx, mergeStyleProps } from '../../shared/utils/utils.js';

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

/** A consumer's plain `className` and `style`, composed onto resolved recipe props. */
interface ConsumerDomProps {
	className: string | undefined;
	style: CSSProperties | undefined;
}

/** Resolves component styles and `xstyle` in one `stylex.props` call. */
export function resolveXStyleProps(
	styles: ReadonlyArray<CompiledStyles>,
	xstyle: XStyleProp | undefined,
	className: string | undefined,
	inlineStyle: CSSProperties | undefined,
): ResolvedStyleXProps {
	return composeRecipeProps(stylex.props(...styles, xstyle), { className, style: inlineStyle });
}

/**
 * Composes resolved recipe props with a consumer's plain `className` and `style`.
 *
 * The result is one spreadable object, so a call site is a single `{...composeRecipeProps(...)}`
 * instead of a recipe spread followed by hand-written `className` and `style` props that
 * immediately overwrite it. That kept the merge order — recipe classes first, consumer inline
 * style last — restated at every element, where it could drift. It is also the plain-element
 * counterpart to `composeRacRecipeProps`, so both rendering paths compose the same way.
 *
 * Delegates the actual merge to the shared `mergeStyleProps`, which has identical semantics
 * (`className` concatenated, `style` shallow-merged with the later value winning per property,
 * other keys overwritten). `mergeStyleProps` assigns `className` and `style` unconditionally
 * though, so merging onto recipe props with no styles at all would produce `className: ''` and
 * `style: {}` — which render as literal empty `class=""` and `style` attributes on the DOM.
 * Falling back to `undefined` here restores the previous behaviour of omitting both attributes
 * entirely when there is nothing to render.
 */
export function composeRecipeProps(
	recipeProps: ResolvedStyleXProps,
	consumerProps: ConsumerDomProps,
): ResolvedStyleXProps {
	const merged = mergeStyleProps(recipeProps, consumerProps);
	return {
		...merged,
		className: merged.className === '' ? undefined : merged.className,
		style: Object.keys(merged.style).length === 0 ? undefined : merged.style,
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
