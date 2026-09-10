import type { JSX, ReactNode } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import { buttonContent, buttonLabel } from '../button/styles.css.js';
import { IconSizeProvider } from '../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { LinkRecipeVariants } from './recipe.css.js';
import { linkRecipe } from './recipe.css.js';
import { linkCursor } from './styles.css.js';

interface LinkRecipeProps extends NonNullable<LinkRecipeVariants> {}

interface LinkButtonBaseProps {
	/** Renders the Link with button presentation. */
	appearance: 'button';
	/** Non-interactive adornment shown after the label. Nested interactive controls are unsupported. */
	endContent?: ReactNode;
	/** Whether the Link takes up the full inline size of its container. @default false */
	isBlock?: LinkRecipeProps['isBlock'];
	/** Sets the Link size. @default 'medium' */
	size?: LinkRecipeProps['size'];
	/** Non-interactive adornment shown before the label. Nested interactive controls are unsupported. */
	startContent?: ReactNode;
}

type LinkButtonProps =
	| (LinkButtonBaseProps & {
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
	  })
	| (LinkButtonBaseProps & {
			/** Visual tone. */
			tone: 'accent';
			/** Visual prominence. @default 'standard' */
			prominence?: 'standard' | 'high';
	  });

interface LinkTextBaseProps {
	/**
	 * Renders the Link with text presentation.
	 * @default 'text'
	 */
	appearance?: 'text';
	/** Text Links do not use control sizing. */
	size?: never;
	/** Text Links do not fill their container. */
	isBlock?: never;
	/** Text Links do not support start content. */
	startContent?: never;
	/** Text Links do not support end content. */
	endContent?: never;
}

type LinkTextProps =
	| (LinkTextBaseProps & {
			/** Visual tone. @default 'neutral' */
			tone?: 'neutral';
			/** Visual prominence. @default 'standard' */
			prominence?: 'low' | 'standard';
	  })
	| (LinkTextBaseProps & {
			/** Visual tone. */
			tone: 'accent';
			/** Visual prominence. @default 'standard' */
			prominence?: 'standard' | 'high';
	  });

type _LinkOmit = DistributiveOmit<RacLinkProps, 'href' | 'isDisabled' | 'onPress'>;

interface _LinkProps extends _LinkOmit {
	/** URL the Link points to. */
	href: NonNullable<RacLinkProps['href']>;
	/** Whether the Link is disabled. @default false */
	isDisabled?: RacLinkProps['isDisabled'];
	/** Press handler for navigation-related handling. */
	onPress?: RacLinkProps['onPress'];
}

/** Props for the `Link` component. */
export type LinkProps = Prettify<_LinkProps & (LinkButtonProps | LinkTextProps)>;

/** Link for navigation to another URL or route. */
export function Link(props: LinkProps): JSX.Element {
	const {
		appearance = 'text',
		tone,
		prominence = 'standard',
		children,
		endContent,
		isBlock,
		size,
		startContent,
		...restProps
	} = props;

	if (appearance === 'button') {
		return (
			<IconSizeProvider size={BUTTON_ICON_SIZE}>
				<RacLink
					{...restProps}
					className={composeRenderProps(props.className, (className) => {
						return linkRecipe({
							appearance: 'button',
							tone,
							prominence,
							className: cx(linkCursor, className),
							isBlock,
							size,
						});
					})}
				>
					{(renderProps) => (
						<span className={buttonContent({ appearance: 'button' })}>
							<span className={buttonLabel({ appearance: 'button', isPending: false })}>
								{startContent}
								<Text elementType="span" lineClamp shouldInheritFont>
									{typeof children === 'function' ? children(renderProps) : children}
								</Text>
								{endContent}
							</span>
						</span>
					)}
				</RacLink>
			</IconSizeProvider>
		);
	}

	return (
		<RacLink
			{...restProps}
			className={composeRenderProps(props.className, (className) => {
				return linkRecipe({
					appearance: 'text',
					tone,
					prominence,
					className: cx(linkCursor, className),
				});
			})}
		>
			{children}
		</RacLink>
	);
}
