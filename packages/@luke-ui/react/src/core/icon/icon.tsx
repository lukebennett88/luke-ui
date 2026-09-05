import type { JSX, ReactNode, SVGAttributes } from 'react';
import { createContext, useContext } from 'react';
import { iconNames, iconViewBoxes } from '../../../.generated/icon-data.js';
import { cx } from '../../shared/utils/utils.js';
import { ICON_VIEWBOX } from '../sizing/icon-sizing.js';
import type { XStyleProps } from '../styles/xstyle.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { useIconSizeContext } from './icon-size-context.js';
import type { IconRecipeVariants } from './recipe.js';
import { iconRecipe } from './recipe.js';

export type { IconName } from '../../../.generated/icon-data.js';
export { IconSizeProvider } from './icon-size-context.js';
export { iconNames, iconViewBoxes };

const IconSpritesheetContext = createContext<string | null>(null);

interface IconVariantProps extends NonNullable<IconRecipeVariants> {}

interface IconStyleProps extends XStyleProps {
	/**
	 * Sets the icon size.
	 * @default 'medium'
	 */
	size?: IconVariantProps['size'];
}

/** Props for `IconSpritesheetProvider`. */
export interface IconSpritesheetProviderProps {
	children: ReactNode;
	/** URL to the generated sprite sheet file. */
	href: string;
}

/** Provides the icon spritesheet URL for `Icon`. */
export function IconSpritesheetProvider({
	children,
	href,
}: IconSpritesheetProviderProps): JSX.Element {
	return <IconSpritesheetContext.Provider value={href}>{children}</IconSpritesheetContext.Provider>;
}

interface _IconProps
	extends
		Pick<SVGAttributes<SVGSVGElement>, 'aria-hidden' | 'className' | 'id' | 'style' | 'viewBox'>,
		IconStyleProps {
	/** Icon name from the generated icon set. */
	name: (typeof iconNames)[number];
	/** Accessible label. When set, the icon is announced as an image. */
	title?: string;
}

/** Props for the built-in `Icon` component. */
export type IconProps = Prettify<_IconProps>;

/** Props used by `createIcon` for custom icon components. */
export type CustomIconProps = DistributiveOmit<IconProps, 'name'>;

/** Options for `createIcon`. */
export interface CreateIconOptions<TProps extends CustomIconProps = CustomIconProps> {
	/** SVG path content or a render function that returns path content. */
	path: ReactNode | ((props: TProps) => ReactNode);
	/** Static or dynamic viewBox value. */
	viewBox?: string | ((props: TProps) => string | undefined);
}

/** Creates a custom icon component with Luke UI icon styling. */
export function createIcon<TProps extends CustomIconProps = CustomIconProps>({
	path,
	viewBox: defaultViewBox = ICON_VIEWBOX,
}: CreateIconOptions<TProps>): (props: TProps) => JSX.Element {
	return function Icon(props: TProps): JSX.Element {
		const {
			'aria-hidden': ariaHiddenProp,
			className,
			id,
			size,
			style,
			title,
			viewBox,
			xstyle,
		} = props;
		// `aria-hidden={false}` and `aria-hidden="false"` are accepted by the prop
		// type but must never reach the DOM, so any non-`true` value is treated as
		// unset.
		const isExplicitlyHidden = ariaHiddenProp === true || ariaHiddenProp === 'true';
		const ariaHidden = isExplicitlyHidden || !title ? true : undefined;
		const role = ariaHidden ? undefined : 'img';
		const resolvedViewBox =
			viewBox ?? (typeof defaultViewBox === 'function' ? defaultViewBox(props) : defaultViewBox);
		const resolvedPath = typeof path === 'function' ? path(props) : path;
		const contextSize = useIconSizeContext();
		const resolvedSize = size ?? contextSize ?? 'medium';
		const recipeProps = iconRecipe({ size: resolvedSize, xstyle });

		const svgProps: React.SVGProps<SVGSVGElement> = {
			'aria-hidden': ariaHidden,
			fill: 'currentColor',
			focusable: false,
			id,
			role,
			viewBox: resolvedViewBox,
			...recipeProps,
			className: cx(recipeProps.className, className),
			style: recipeProps.style === undefined ? style : { ...recipeProps.style, ...style },
		};

		return (
			<svg {...svgProps}>
				{title && <title>{title}</title>}
				{resolvedPath}
			</svg>
		);
	};
}

/** Renders an icon from the shared sprite sheet. */
export function Icon(props: IconProps): JSX.Element {
	const spritesheetHref = useIconSpritesheetHref();
	return <SpritesheetIcon {...props} spritesheetHref={spritesheetHref} />;
}

function useIconSpritesheetHref(): string {
	const href = useContext(IconSpritesheetContext);
	if (!href) {
		throw new Error(
			'IconSpritesheetProvider is required. Wrap your app with <IconSpritesheetProvider href="...">.',
		);
	}
	return href;
}

interface SpritesheetIconProps extends IconProps {
	name: (typeof iconNames)[number];
	spritesheetHref: string;
}

const SpritesheetIcon = createIcon<SpritesheetIconProps>({
	path: ({ name, spritesheetHref }) => <use href={`${spritesheetHref}#${name}`} />,
	viewBox: ({ name }) => iconViewBoxes[name],
});
