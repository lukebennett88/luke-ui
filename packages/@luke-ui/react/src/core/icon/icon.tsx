import type { HTMLAttributes, JSX, ReactNode, SVGAttributes, SVGProps } from 'react';
import { iconNames } from '../../../.generated/icon-data.js';
import type { IconName } from '../../../.generated/icon-data.js';
import { cx } from '../../shared/utils/utils.js';
import { ICON_VIEWBOX } from '../sizing/icon-sizing.js';
import type { Prettify } from '../types/prettify.js';
import type { IconRecipeVariants } from './recipe.css.js';
import { iconRecipe } from './recipe.css.js';
import { iconMask } from './styles.css.js';

export type { IconName };
export { iconNames };

interface SharedIconProps {
	/**
	 * Sets the icon size. Without it, the icon takes the size its container sets through
	 * `--luke-icon-size`, such as `xsmall` inside a Button, or `medium` elsewhere.
	 */
	size?: NonNullable<IconRecipeVariants>['size'];
	/** Accessible label. When set, the icon is announced as an image. */
	title?: string;
}

interface _IconProps
	extends
		Pick<HTMLAttributes<HTMLSpanElement>, 'aria-hidden' | 'className' | 'id' | 'style'>,
		SharedIconProps {
	/** Icon name from the built-in icon set. */
	name: IconName;
}

/** Props for the built-in `Icon` component. */
export type IconProps = Prettify<_IconProps>;

interface _CustomIconProps
	extends
		Pick<SVGAttributes<SVGSVGElement>, 'aria-hidden' | 'className' | 'id' | 'style' | 'viewBox'>,
		SharedIconProps {}

/** Props used by `createIcon` for custom icon components. */
export type CustomIconProps = Prettify<_CustomIconProps>;

/** Options for `createIcon`. */
export interface CreateIconOptions<TProps extends CustomIconProps = CustomIconProps> {
	/** SVG path content or a render function that returns path content. */
	path: ReactNode | ((props: TProps) => ReactNode);
	/** Static or dynamic viewBox value. */
	viewBox?: string | ((props: TProps) => string | undefined);
}

/** Renders a built-in icon in the colour of the surrounding text. */
export function Icon(props: IconProps): JSX.Element {
	const { 'aria-hidden': ariaHiddenProp, className, id, name, size, style, title } = props;
	const isHidden = isIconHidden(ariaHiddenProp, title);

	return (
		<span
			aria-hidden={isHidden ? true : undefined}
			aria-label={isHidden ? undefined : title}
			className={cx(iconMask, iconRecipe({ className, size }))}
			data-icon={name}
			id={id}
			role={isHidden ? undefined : 'img'}
			style={style}
		/>
	);
}

/**
 * Creates an SVG icon component with the same sizes and accessibility behaviour as `Icon`, for a
 * glyph that the built-in set does not include.
 */
export function createIcon<TProps extends CustomIconProps = CustomIconProps>({
	path,
	viewBox: defaultViewBox = ICON_VIEWBOX,
}: CreateIconOptions<TProps>): (props: TProps) => JSX.Element {
	return function CreatedIcon(props: TProps): JSX.Element {
		const { 'aria-hidden': ariaHiddenProp, className, id, size, style, title, viewBox } = props;
		const isHidden = isIconHidden(ariaHiddenProp, title);
		const resolvedViewBox =
			viewBox ?? (typeof defaultViewBox === 'function' ? defaultViewBox(props) : defaultViewBox);
		const resolvedPath = typeof path === 'function' ? path(props) : path;

		const svgProps: SVGProps<SVGSVGElement> = {
			'aria-hidden': isHidden ? true : undefined,
			className: iconRecipe({ className, size }),
			fill: 'currentColor',
			focusable: false,
			id,
			role: isHidden ? undefined : 'img',
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

/**
 * Whether an icon is hidden from assistive technology. `aria-hidden={false}` and
 * `aria-hidden="false"` are accepted by the prop types but must never reach the DOM, so any
 * non-`true` value is treated as unset.
 */
function isIconHidden(
	ariaHidden: boolean | 'true' | 'false' | undefined,
	title: string | undefined,
) {
	return ariaHidden === true || ariaHidden === 'true' || !title;
}
