import type { JSX } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import type { XStyleProp } from '../styles/xstyle.js';
import { resolveXStyleProps } from '../styles/xstyle.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedLinkProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import type { LinkRecipeVariants } from './recipe.js';
import { resolveLinkRecipeStyles } from './recipe.js';

interface LinkVariantProps extends NonNullable<LinkRecipeVariants> {}

interface LinkStyleProps {
	/** Hides the underline until hover or press and provides a structural 24px target. */
	isStandalone?: LinkVariantProps['isStandalone'];
	/** Sets the link tone. @default 'accent' */
	tone?: LinkVariantProps['tone'];
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after every variant prop
	 * above and before `className`. A same-property `xstyle` value wins over a variant such as
	 * `tone`. A consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
}

type _LinkOmit = DistributiveOmit<RacLinkProps, keyof DocumentedLinkProps>;

interface _LinkProps extends _LinkOmit, LinkStyleProps, DocumentedLinkProps {}

/** Props for the `Link` component. */
export type LinkProps = Prettify<_LinkProps>;

/** Styled link. */
export function Link(props: LinkProps): JSX.Element {
	const { className, isStandalone, style, tone, xstyle, ...restProps } = props;
	const recipeStyles = resolveLinkRecipeStyles({ isStandalone, tone });

	return (
		<RacLink
			{...restProps}
			className={composeRenderProps(className, (resolvedClassName) => {
				return (
					resolveXStyleProps(recipeStyles, xstyle, resolvedClassName, undefined).className ?? ''
				);
			})}
			style={composeRenderProps(style, (resolvedStyle) => {
				return resolveXStyleProps(recipeStyles, xstyle, undefined, resolvedStyle).style;
			})}
		/>
	);
}
