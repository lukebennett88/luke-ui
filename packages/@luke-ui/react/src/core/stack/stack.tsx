import type { JSX } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { withResponsiveDefault } from '../styles/responsive.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { Prettify } from '../types/prettify.js';

/** Props for `Stack`. */
export type StackProps = Prettify<_StackElementProps | _StackRenderProps>;

/** Stacks direct children on the logical block axis. */
export function Stack({ alignItems = 'stretch', gap, ...props }: StackProps): JSX.Element {
	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, layoutProperties)}
			alignItems={withResponsiveDefault(alignItems, 'stretch')}
			display="flex"
			flexDirection="column"
			gap={gap}
		/>
	);
}

interface _StackLayoutProps {
	/**
	 * Alignment of children on the inline axis.
	 * @default stretch
	 */
	alignItems?: SprinklesProps['alignItems'];
	/** Space between children on the block axis. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
}

interface _StackElementProps extends BoxLikeElementProps, LayoutProps, _StackLayoutProps {}

interface _StackRenderProps extends BoxLikeRenderProps, LayoutProps, _StackLayoutProps {}
