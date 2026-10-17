import type { JSX } from 'react';
import { createContext, use } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { LockupRecipeVariants } from './recipe.css.js';
import { lockupRecipe } from './recipe.css.js';

/** Props for `Lockup`. */
export type LockupProps = Prettify<_LockupElementProps | _LockupRenderProps>;

/** Props for `LockupRail`. */
export type LockupRailProps = Prettify<_LockupRailElementProps | _LockupRailRenderProps>;

/** Props for `LockupBody`. */
export type LockupBodyProps = Prettify<_LockupBodyElementProps | _LockupBodyRenderProps>;

/**
 * Lays out one flexible `LockupBody` with supporting `LockupRail` content before or after it, in
 * DOM order. Rails keep their inline size, and the body uses the remaining space.
 */
export function Lockup({
	className,
	elementType,
	gap,
	railAlignment = 'firstLine',
	renderRoot,
	...props
}: LockupProps): JSX.Element {
	const parent = use(LockupContext);
	const rootElement = resolveRootElement(elementType, renderRoot, parent.isPhrasing);
	// A caller-owned root can be any element, so it keeps the surrounding mode.
	const isPhrasing =
		rootElement.renderRoot == null ? rootElement.elementType === 'span' : parent.isPhrasing;
	const { root } = lockupRecipe({ isInline: isPhrasing, railAlignment });

	return (
		<LockupContext.Provider value={{ isPhrasing, railAlignment }}>
			<Box
				{...omitUnsupportedSprinklesProps(props, layoutProperties)}
				{...rootElement}
				className={root({ className })}
				gap={gap}
			/>
		</LockupContext.Provider>
	);
}

/** Supporting content beside a `LockupBody` that keeps its intrinsic inline size. */
export function LockupRail({
	className,
	elementType,
	renderRoot,
	...props
}: LockupRailProps): JSX.Element {
	const { isPhrasing, railAlignment } = use(LockupContext);
	const { rail } = lockupRecipe({ railAlignment });

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, railProperties)}
			{...resolveRootElement(elementType, renderRoot, isPhrasing)}
			className={rail({ className })}
		/>
	);
}

/** The primary content of a `Lockup`. It grows and shrinks to fill the space the rails leave. */
export function LockupBody({
	className,
	elementType,
	renderRoot,
	...props
}: LockupBodyProps): JSX.Element {
	const { isPhrasing } = use(LockupContext);
	const { body } = lockupRecipe();

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, bodyProperties)}
			{...resolveRootElement(elementType, renderRoot, isPhrasing)}
			className={body({ className })}
		/>
	);
}

type LockupRailAlignment = NonNullable<LockupRecipeVariants>['railAlignment'];

interface LockupContextValue {
	/** Whether parts render phrasing content, which makes `span` their default element. */
	isPhrasing: boolean;
	railAlignment: LockupRailAlignment;
}

const LockupContext = createContext<LockupContextValue>({
	isPhrasing: false,
	railAlignment: 'firstLine',
});

type RenderRoot = BoxLikeRenderProps['renderRoot'];

type RootElement =
	| { elementType: 'div' | 'li' | 'span'; renderRoot?: undefined }
	| { elementType?: undefined; renderRoot: RenderRoot };

/** Keeps a caller-owned root, or picks the element, defaulting to `span` in phrasing mode. */
function resolveRootElement(
	elementType: 'div' | 'li' | 'span' | undefined,
	renderRoot: RenderRoot | undefined,
	isPhrasing: boolean,
): RootElement {
	if (renderRoot != null) return { renderRoot };

	return { elementType: elementType ?? (isPhrasing ? 'span' : 'div') };
}

interface _LockupOwnProps {
	/** Space between adjacent parts. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/**
	 * How rails align with the body. `firstLine` centres each rail on the cap height of the body's
	 * first line, measured with the typography Lockup inherits. `center` centres each rail on the
	 * whole body.
	 * @default firstLine
	 */
	railAlignment?: LockupRailAlignment;
}

/** Box-like element props with `elementType` narrowed per part below. */
type _LockupElementOmit = DistributiveOmit<BoxLikeElementProps, 'elementType'>;

interface _LockupElementProps extends _LockupElementOmit, LayoutProps, _LockupOwnProps {
	/**
	 * Root element. Use `li` as a direct child of `ul` or `ol`. Use `span` inside phrasing content,
	 * which also makes `span` the default element for its parts and nested Lockups. Inside a `span`
	 * Lockup, the default is `span`.
	 * @default div
	 */
	elementType?: 'div' | 'li' | 'span';
}

interface _LockupRenderProps extends BoxLikeRenderProps, LayoutProps, _LockupOwnProps {}

/** Flex item utilities a rail owns, so it keeps its intrinsic inline size. */
const railOwnedProperties = [
	'alignSelf',
	'flex',
	'flexBasis',
	'flexGrow',
	'flexShrink',
	'order',
	'placeSelf',
] as const;

/** Flex item utilities the body owns, so it grows and can shrink below its content. */
const bodyOwnedProperties = [...railOwnedProperties, 'minInlineSize'] as const;

type _LockupRailLayoutProps = DistributiveOmit<LayoutProps, (typeof railOwnedProperties)[number]>;

type _LockupBodyLayoutProps = DistributiveOmit<LayoutProps, (typeof bodyOwnedProperties)[number]>;

interface _LockupPartElementProps extends _LockupElementOmit {
	/**
	 * Element to render. Inside a `span` Lockup, the default is `span`.
	 * @default div
	 */
	elementType?: 'div' | 'span';
}

interface _LockupRailElementProps extends _LockupPartElementProps, _LockupRailLayoutProps {}

type _LockupRailRenderOmit = DistributiveOmit<BoxLikeRenderProps, 'renderRoot'>;

interface _LockupRailRenderProps extends _LockupRailRenderOmit, _LockupRailLayoutProps {
	/**
	 * Passes resolved `children`, `className`, `style`, and a callback `ref` as `domProps`. The second
	 * argument is an empty state object. Return a container element that can lay out flex items and
	 * draw a `::before` box, such as a `div` or `span`, spread `domProps` onto it, and render its
	 * children. Put an image inside the rail, not in place of it.
	 */
	renderRoot: BoxLikeRenderProps['renderRoot'];
}

interface _LockupBodyElementProps extends _LockupPartElementProps, _LockupBodyLayoutProps {}

interface _LockupBodyRenderProps extends BoxLikeRenderProps, _LockupBodyLayoutProps {}

const railProperties = new Set(layoutProperties);
for (const property of railOwnedProperties) {
	railProperties.delete(property);
}

const bodyProperties = new Set(layoutProperties);
for (const property of bodyOwnedProperties) {
	bodyProperties.delete(property);
}
