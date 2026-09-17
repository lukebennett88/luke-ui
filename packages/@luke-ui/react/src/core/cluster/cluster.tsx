import type { JSX } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { withResponsiveDefault } from '../styles/responsive.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';

/** Props for `Cluster`. */
export type ClusterProps = Prettify<_ClusterElementProps | _ClusterRenderProps>;

/** Clusters direct children on the logical inline axis and always wraps. */
export function Cluster({
	alignItems = 'center',
	gap,
	justifyContent = 'flex-start',
	...props
}: ClusterProps): JSX.Element {
	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			alignItems={withResponsiveDefault(alignItems, 'center')}
			display="flex"
			flexDirection="row"
			flexWrap="wrap"
			gap={gap}
			justifyContent={withResponsiveDefault(justifyContent, 'flex-start')}
		/>
	);
}

interface _ClusterLayoutProps {
	/**
	 * Alignment of children on the block axis.
	 * @default center
	 */
	alignItems?: SprinklesProps['alignItems'];
	/** Space between children on both axes. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/**
	 * Distribution of children on the inline axis.
	 * @default flex-start
	 */
	justifyContent?: SprinklesProps['justifyContent'];
}

interface _ClusterElementProps extends BoxLikeElementProps, LayoutProps, _ClusterLayoutProps {}

interface _ClusterRenderProps extends BoxLikeRenderProps, LayoutProps, _ClusterLayoutProps {}
