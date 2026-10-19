import type { JSX } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { containerMaxInlineSizeTokens } from './recipe.css.js';
import { containerRecipe } from './recipe.css.js';

/** Props for `Container`. */
export type ContainerProps = Prettify<_ContainerElementProps | _ContainerRenderProps>;

/** Constrains content to a maximum inline size and establishes a size container for descendants. */
export function Container({
	className,
	marginInline = 'auto',
	maxInlineSize,
	paddingInline,
	style,
	...props
}: ContainerProps): JSX.Element {
	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, containerProperties)}
			className={containerRecipe({ className, maxInlineSize })}
			marginInline={marginInline}
			paddingInline={paddingInline}
			style={style}
		/>
	);
}

/** Layout utilities Container owns, so a caller cannot set them through Box. */
type _ContainerOwnedProperty = 'inlineSize' | 'marginInline' | 'maxInlineSize' | 'paddingInline';

type _ContainerOmit = DistributiveOmit<LayoutProps, _ContainerOwnedProperty>;

interface _ContainerLayoutProps {
	/**
	 * Inline margin around the container.
	 * @default auto
	 */
	marginInline?: SprinklesProps['marginInline'];
	/** Maximum inline size of the container's border box. */
	maxInlineSize: ContainerMaxInlineSize;
	/** Padding inside the container's query box. */
	paddingInline?: SprinklesProps['paddingInline'];
}

interface _ContainerElementProps
	extends BoxLikeElementProps, _ContainerOmit, _ContainerLayoutProps {}

interface _ContainerRenderProps extends BoxLikeRenderProps, _ContainerOmit, _ContainerLayoutProps {}

/** Approved maximum inline-size presets. Use Box for arbitrary widths. */
type ContainerMaxInlineSize = keyof typeof containerMaxInlineSizeTokens;

const containerOwnedProperties: ReadonlySet<PropertyKey> = new Set<_ContainerOwnedProperty>([
	'inlineSize',
	'marginInline',
	'maxInlineSize',
	'paddingInline',
]);

const containerProperties = new Set(layoutProperties);
for (const property of containerOwnedProperties) {
	containerProperties.delete(property);
}
