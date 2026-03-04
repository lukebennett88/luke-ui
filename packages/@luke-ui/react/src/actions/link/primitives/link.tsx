import type { JSX } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components';
import { composeRenderProps, Link as RacLink } from 'react-aria-components';
import * as styles from '../../../recipes/link.css.js';
import { cx } from '../../../utils.js';

interface LinkVariantProps extends NonNullable<styles.LinkVariants> {}

/** Props for the primitive link. */
export interface LinkProps extends RacLinkProps, LinkVariantProps {}

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
