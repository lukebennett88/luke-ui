import type { JSX, ReactElement } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import { iconButtonRecipe, iconButtonReset } from '../icon-button/recipe.css.js';
import { IconSizeProvider } from '../icon/icon-size-context.js';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import { linkCursor } from '../link/styles.css.js';
import { buttonRecipe } from '../primitives/button/recipe.css.js';
import type { ButtonRecipeVariants as PrimitiveButtonRecipeVariants } from '../primitives/button/recipe.css.js';
import { BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { iconLinkIconWrapper } from './styles.css.js';

interface PrimitiveButtonRecipeProps extends NonNullable<PrimitiveButtonRecipeVariants> {}

interface IconLinkBaseProps {
	/** Icon name from the generated icon set, or a custom icon element such as a brand mark. */
	icon: IconName | ReactElement;
	/**
	 * Sets the IconLink size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonRecipeProps['size'];
}

type IconLinkStyleProps =
	| (IconLinkBaseProps & {
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
	  })
	| (IconLinkBaseProps & {
			/** Visual tone. */
			tone: 'accent';
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
	  })
	| (IconLinkBaseProps & {
			/** Visual tone. */
			tone: 'critical';
			/** Visual prominence. @default 'standard' */
			prominence?: PrimitiveButtonRecipeProps['prominence'];
	  });

type _IconLinkOmit = DistributiveOmit<
	RacLinkProps,
	'aria-label' | 'aria-labelledby' | 'children' | 'href' | 'isDisabled' | 'onPress'
>;

interface _IconLinkProps extends _IconLinkOmit {
	/** URL the IconLink points to. */
	href: NonNullable<RacLinkProps['href']>;
	/** Whether the IconLink is disabled. @default false */
	isDisabled?: RacLinkProps['isDisabled'];
	/** Press handler for navigation-related handling. */
	onPress?: RacLinkProps['onPress'];
}

/** Props for the `IconLink` component. */
export type IconLinkProps = Prettify<_IconLinkProps & IconLinkStyleProps & RequiredAccessibleName>;

/** Link that renders only an icon, for icon-only navigation. */
export function IconLink(props: IconLinkProps): JSX.Element {
	const { tone = 'neutral', prominence = 'standard', icon, size = 'medium', ...restProps } = props;

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacLink
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					const base = buttonRecipe({ appearance: 'button', tone, prominence, size });
					return iconButtonRecipe({
						className: cx(iconButtonReset, base, linkCursor, className),
						size,
					});
				})}
			>
				<span aria-hidden className={iconLinkIconWrapper}>
					{typeof icon === 'string' ? <Icon aria-hidden name={icon} /> : icon}
				</span>
			</RacLink>
		</IconSizeProvider>
	);
}
