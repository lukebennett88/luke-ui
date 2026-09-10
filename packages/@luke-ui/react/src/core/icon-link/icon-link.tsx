import type { JSX, ReactElement } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import type { IconLinkPresentationProps } from '../action-presentation.js';
import { iconButtonRecipe, iconButtonReset } from '../icon-button/recipe.css.js';
import { IconSizeProvider } from '../icon/icon-size-context.js';
import type { IconName } from '../icon/icon.js';
import { Icon } from '../icon/icon.js';
import { linkCursor } from '../link/styles.css.js';
import { buttonRecipeInternal } from '../primitives/button/recipe.css.js';
import { BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { iconLinkIconWrapper } from './styles.css.js';

interface IconLinkBaseProps extends IconLinkPresentationProps {
	/** Icon name from the generated icon set, or a custom icon element such as a brand mark. */
	icon: IconName | ReactElement;
}

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
export type IconLinkProps = Prettify<_IconLinkProps & IconLinkBaseProps & RequiredAccessibleName>;

/** Link that renders only an icon, for icon-only navigation. */
export function IconLink(props: IconLinkProps): JSX.Element {
	const { prominence = 'standard', icon, size = 'medium', ...restProps } = props;

	return (
		<IconSizeProvider size={BUTTON_ICON_SIZE}>
			<RacLink
				{...restProps}
				className={composeRenderProps(props.className, (className) => {
					const base = buttonRecipeInternal({
						appearance: 'button',
						prominence,
						size,
						tone: 'neutral',
					});
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
