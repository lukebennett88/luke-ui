import type { JSX } from 'react';
import type { LinkProps as RacLinkProps } from 'react-aria-components/Link';
import { Link as RacLink } from 'react-aria-components/Link';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../recipes/link.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { DocumentedLinkProps } from '../types/documented-rac-props.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

interface LinkVariantProps extends NonNullable<styles.LinkVariants> {}

interface LinkStyleProps {
	/** Hides the underline until hover or press and provides a structural 24px target. */
	isStandalone?: LinkVariantProps['isStandalone'];
	/** Sets the link tone. @default 'accent' */
	tone?: LinkVariantProps['tone'];
}

type _LinkOmit = DistributiveOmit<RacLinkProps, keyof DocumentedLinkProps>;

interface _LinkProps extends _LinkOmit, LinkStyleProps, DocumentedLinkProps {}

/**
 * Props for the primitive link.
 *
 * @tier atom
 */
export type LinkProps = Prettify<_LinkProps>;

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
