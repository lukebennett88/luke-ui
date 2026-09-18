import { assignInlineVars } from '@vanilla-extract/dynamic';
import type { JSX } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import {
	containerMaxInlineSizeTokens,
	containerMaxInlineSizeVar,
	containerRecipe,
} from './recipe.css.js';

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
	const isMaxInlineSizeToken = isContainerMaxInlineSizeToken(maxInlineSize);
	const maxInlineSizeToken = isMaxInlineSizeToken ? maxInlineSize : undefined;
	const arbitraryMaxInlineSize = isMaxInlineSizeToken ? undefined : maxInlineSize;
	const resolvedStyle = (() => {
		if (arbitraryMaxInlineSize === undefined) return style;
		return {
			...assignInlineVars({ [containerMaxInlineSizeVar]: arbitraryMaxInlineSize }),
			...style,
		};
	})();

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, containerProperties)}
			className={containerRecipe({ className, maxInlineSize: maxInlineSizeToken })}
			marginInline={marginInline}
			paddingInline={paddingInline}
			style={resolvedStyle}
		/>
	);
}

/** Layout utilities Container owns, so a caller cannot set them through Box. */
type _ContainerOwnedProperty = 'inlineSize' | 'marginInline' | 'maxInlineSize' | 'paddingInline';

type _ContainerOmit = DistributiveOmit<LayoutProps, _ContainerOwnedProperty>;

interface _ContainerLayoutProps {
	/** Maximum inline size of the container's border box. */
	maxInlineSize: ContainerMaxInlineSize;
	/**
	 * Inline margin around the container.
	 * @default auto
	 */
	marginInline?: SprinklesProps['marginInline'];
	/** Padding inside the container's query box. */
	paddingInline?: SprinklesProps['paddingInline'];
}

interface _ContainerElementProps
	extends BoxLikeElementProps, _ContainerOmit, _ContainerLayoutProps {}

interface _ContainerRenderProps extends BoxLikeRenderProps, _ContainerOmit, _ContainerLayoutProps {}

type ContainerMaxInlineSizeToken = keyof typeof containerMaxInlineSizeTokens;

/** A fixed container size, or any CSS value `max-inline-size` accepts. */
type ContainerMaxInlineSize = ContainerMaxInlineSizeToken | (string & {});

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

function isContainerMaxInlineSizeToken(
	maxInlineSize: ContainerMaxInlineSize,
): maxInlineSize is ContainerMaxInlineSizeToken {
	return Object.hasOwn(containerMaxInlineSizeTokens, maxInlineSize);
}
