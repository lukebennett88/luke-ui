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

/** Props for the primitive link. */
export interface LinkProps extends Omit<RacLinkProps, keyof LinkStyleProps>, LinkStyleProps {}

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
