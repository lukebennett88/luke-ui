import type { JSX, ReactNode, SVGAttributes } from 'react';
import { createContext, useContext } from 'react';
import { iconNames, iconViewBoxes } from '../../../../.generated/icon-data.js';
import { ICON_VIEWBOX } from '../../../lib/icon.js';
import * as styles from '../../../recipes/icon.css.js';
import type { IconSizeToken } from '../../../tokens.js';
import type { DistributiveOmit } from '../../../types.js';
import { cx } from '../../../utils.js';
import { useIconSizeContext } from './icon-size-context.js';

export type { IconName } from '../../../../.generated/icon-data.js';
export { iconNames, iconViewBoxes };

const IconSpritesheetContext = createContext<string | null>(null);

export interface IconSpritesheetProviderProps {
	href: string;
	children: ReactNode;
}

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

export type IconProps = Pick<
	SVGAttributes<SVGSVGElement>,
	'aria-hidden' | 'className' | 'id' | 'style' | 'viewBox'
> & {
	name: (typeof iconNames)[number];
	title?: string;
	size?: IconSizeToken;
};

export type CustomIconProps = DistributiveOmit<IconProps, 'name'>;

export interface CreateIconOptions<TProps extends CustomIconProps = CustomIconProps> {
	path: ReactNode | ((props: TProps) => ReactNode);
	viewBox?: string | ((props: TProps) => string | undefined);
}

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

export function Icon(props: IconProps): JSX.Element {
	const spritesheetHref = useIconSpritesheetHref();
	return <SpritesheetIcon {...props} spritesheetHref={spritesheetHref} />;
}
