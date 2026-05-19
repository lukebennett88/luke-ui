import type { JSX, ReactNode, SVGAttributes } from 'react';
import { createContext, useContext } from 'react';
import { iconNames, iconViewBoxes } from '../../.generated/icon-data.js';
import { useIconSizeContext } from '../icon-size-context/index.js';
import * as styles from '../recipes/icon.css.js';
import { ICON_VIEWBOX } from '../sizing/icon-sizing.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { cx } from '../utils/index.js';

export type { IconName } from '../../.generated/icon-data.js';
export { iconNames, iconViewBoxes };

const IconSpritesheetContext = createContext<string | null>(null);

interface IconVariantProps extends NonNullable<styles.IconVariants> {}

interface IconStyleProps {
	/**
	 * Sets the icon size.
	 * @default 'medium'
	 */
	size?: IconVariantProps['size'];
}

/** Props for `IconSpritesheetProvider`. */
export interface IconSpritesheetProviderProps {
	/** URL to the generated sprite sheet file. */
	href: string;
	children: ReactNode;
}

/** Provides the icon spritesheet URL for `Icon`. */
export function IconSpritesheetProvider({
	children,
	href,
}: IconSpritesheetProviderProps): JSX.Element {
	return <IconSpritesheetContext.Provider value={href}>{children}</IconSpritesheetContext.Provider>;
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

/**
 * Props for the built-in `Icon` component.
 *
 * @tier atom
 */
export type IconProps = Pick<
	SVGAttributes<SVGSVGElement>,
	'aria-hidden' | 'className' | 'id' | 'style' | 'viewBox'
> &
	IconStyleProps & {
		/** Icon name from the generated icon set. */
		name: (typeof iconNames)[number];
		/** Accessible label. When set, the icon is announced as an image. */
		title?: string;
	};

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
		const { 'aria-hidden': ariaHiddenProp, className, id, size, style, title, viewBox } = props;
		const ariaHidden = ariaHiddenProp ?? !title;
		const role = ariaHidden ? undefined : 'img';
		const resolvedViewBox =
			viewBox ?? (typeof defaultViewBox === 'function' ? defaultViewBox(props) : defaultViewBox);
		const resolvedPath = typeof path === 'function' ? path(props) : path;
		const contextSize = useIconSizeContext();
		const resolvedSize = size ?? contextSize ?? 'medium';

		const svgProps: React.SVGProps<SVGSVGElement> = {
			'aria-hidden': ariaHidden,
			className: cx(styles.icon({ size: resolvedSize }), className),
			fill: 'currentColor',
			focusable: false,
			id,
			role,
			style,
			viewBox: resolvedViewBox,
		};

		return (
			<svg {...svgProps}>
				{title && <title>{title}</title>}
				{resolvedPath}
			</svg>
		);
	};
}

type SpritesheetIconProps = IconProps & {
	spritesheetHref: string;
	name: (typeof iconNames)[number];
};

const SpritesheetIcon = createIcon<SpritesheetIconProps>({
	path: ({ name, spritesheetHref }) => <use href={`${spritesheetHref}#${name}`} />,
	viewBox: ({ name }) => iconViewBoxes[name],
});

/** Renders an icon from the shared sprite sheet. */
export function Icon(props: IconProps): JSX.Element {
	const spritesheetHref = useIconSpritesheetHref();
	return <SpritesheetIcon {...props} spritesheetHref={spritesheetHref} />;
}
