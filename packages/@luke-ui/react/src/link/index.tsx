import type { JSX } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/link.css.js';
import { cx } from '../utils/index.js';

interface LinkVariantProps extends NonNullable<styles.LinkVariants> {}

interface LinkStyleProps {
	/** Hides underline until hover. */
	isStandalone?: LinkVariantProps['isStandalone'];
	/** Sets the link tone. */
	tone?: LinkVariantProps['tone'];
}

interface LinkRedeclaredRACProps {
	/** Whether the link is disabled. Disabled links can't be focused or activated. */
	isDisabled?: RacLinkProps['isDisabled'];
	/** URL the link points to. */
	href?: RacLinkProps['href'];
}

/**
 * Props for the primitive link.
 *
 * @tier atom
 */
export interface LinkProps
	extends
		Omit<RacLinkProps, keyof LinkStyleProps | keyof LinkRedeclaredRACProps>,
		LinkStyleProps,
		LinkRedeclaredRACProps {}

/** Styled link. */
export function Link(props: LinkProps): JSX.Element {
	const { isStandalone, tone, ...restProps } = props;

	return (
		<RacLink
			{...restProps}
			className={composeRenderProps(props.className, (className) => {
				return cx(styles.link({ isStandalone, tone }), className);
			})}
		/>
	);
}
