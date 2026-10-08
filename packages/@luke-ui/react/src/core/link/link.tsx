import type { JSX, ReactNode, Ref } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { cx } from '../../shared/utils/utils.js';
import type { LinkPresentationProps } from '../action-presentation.js';
import { buttonContent, buttonLabel } from '../button/styles.css.js';
import { IconSizeProvider } from '../icon/icon-size-context.js';
import { BUTTON_ICON_SIZE } from '../sizing/button-sizing.js';
import { Text } from '../text/text.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { linkRecipe } from './recipe.css.js';
import { linkCursor } from './styles.css.js';

type LinkContentProps =
	| {
			appearance: 'button';
			endContent?: ReactNode;
			startContent?: ReactNode;
	  }
	| {
			appearance?: 'text';
			endContent?: never;
			startContent?: never;
	  };

type _LinkOmit = DistributiveOmit<RacLinkProps, 'href' | 'isDisabled' | 'onPress' | 'slot'>;

interface _LinkProps extends _LinkOmit {
	/** URL the Link points to. */
	href: NonNullable<RacLinkProps['href']>;
	/** Whether the Link is disabled. @default false */
	isDisabled?: RacLinkProps['isDisabled'];
	/** Press handler for navigation-related handling. */
	onPress?: RacLinkProps['onPress'];
	/** Ref forwarded to the underlying anchor element. */
	ref?: Ref<HTMLAnchorElement>;
	/** Language of the linked resource. React Aria Components does not forward it. */
	hrefLang?: string;
	/** Advisory text the browser shows as a tooltip. React Aria Components does not forward it. */
	title?: string;
	/** MIME type hint for the linked resource. React Aria Components does not forward it. */
	type?: string;
}

/** Props for the `Link` component. */
export type LinkProps = Prettify<_LinkProps & LinkPresentationProps & LinkContentProps>;

/** Link for navigation to another URL or route. */
export function Link(props: LinkProps): JSX.Element {
	const {
		appearance = 'text',
		prominence = 'standard',
		children,
		endContent,
		hrefLang,
		isBlock,
		render,
		size,
		startContent,
		title,
		type,
		...restProps
	} = props;
	const renderWithAnchorAttributes = withAnchorAttributes({ hrefLang, title, type }, render);

	if (appearance === 'button') {
		return (
			<IconSizeProvider size={BUTTON_ICON_SIZE}>
				<RacLink
					{...restProps}
					render={renderWithAnchorAttributes}
					className={composeRenderProps(props.className, (className) => {
						return linkRecipe({
							appearance: 'button',
							className: cx(linkCursor, className),
							isBlock,
							prominence,
							size,
						});
					})}
				>
					{(renderProps) => (
						<span className={buttonContent()}>
							<span className={buttonLabel({ hasAdornments: true, isPending: false })}>
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
			render={renderWithAnchorAttributes}
			className={composeRenderProps(props.className, (className) => {
				return linkRecipe({
					appearance: 'text',
					className: cx(linkCursor, className),
					prominence,
				});
			})}
		>
			{children}
		</RacLink>
	);
}

type LinkRender = NonNullable<RacLinkProps['render']>;

interface AnchorAttributes {
	hrefLang: string | undefined;
	title: string | undefined;
	type: string | undefined;
}

/**
 * React Aria Components filters these attributes out of the DOM props. A render function receives
 * the filtered props, so adding them there puts them on the element. It runs before any `render`
 * the consumer passed so that one still owns the final element.
 */
function withAnchorAttributes(
	attributes: AnchorAttributes,
	render: RacLinkProps['render'],
): LinkRender | undefined {
	const defined = Object.fromEntries(
		Object.entries(attributes).filter(([, value]) => value !== undefined),
	);
	if (Object.keys(defined).length === 0) return render;

	return (domProps, renderProps) => {
		const propsWithAttributes = { ...domProps, ...defined };
		if (render) return render(propsWithAttributes, renderProps);
		const { children, ...rest } = propsWithAttributes;
		return 'href' in rest ? <a {...rest}>{children}</a> : <span {...rest}>{children}</span>;
	};
}
