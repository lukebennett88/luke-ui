import type { JSX } from 'react';
import { cx, mergeStyleProps } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import type { SpaceStep } from '../../theme/contract.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import { resolveResponsiveCssProperty } from '../styles/responsive-css-property.js';
import type { RequiredInitialResponsiveValue } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { BoxLikeElementProps, BoxLikeRenderProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import {
	bleedBlockEndProperty,
	bleedBlockStartProperty,
	bleedInlineEndProperty,
	bleedInlineStartProperty,
} from './recipe.css.js';

/** Props for `Bleed`. */
export type BleedProps = Prettify<_BleedElementProps | _BleedRenderProps>;

/** Extends content beyond the space provided by its parent. */
export function Bleed({
	all,
	block,
	blockEnd,
	blockStart,
	className,
	inline,
	inlineEnd,
	inlineStart,
	style,
	...props
}: BleedProps): JSX.Element {
	const inlineStartStyle = resolveBleedEdge(
		bleedInlineStartProperty,
		all,
		'inline',
		inline,
		'inlineStart',
		inlineStart,
	);
	const inlineEndStyle = resolveBleedEdge(
		bleedInlineEndProperty,
		all,
		'inline',
		inline,
		'inlineEnd',
		inlineEnd,
	);
	const blockStartStyle = resolveBleedEdge(
		bleedBlockStartProperty,
		all,
		'block',
		block,
		'blockStart',
		blockStart,
	);
	const blockEndStyle = resolveBleedEdge(
		bleedBlockEndProperty,
		all,
		'block',
		block,
		'blockEnd',
		blockEnd,
	);

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, bleedProperties)}
			{...mergeStyleProps(inlineStartStyle, inlineEndStyle, blockStartStyle, blockEndStyle, {
				className,
				style,
			})}
		/>
	);
}

/** A spacing token, or a responsive object keyed by breakpoint. */
type BleedSpaceProp = NonNullable<SprinklesProps['padding']>;

interface _BleedSpaceProps {
	/** Amount to extend from all four edges. Axis and edge props override this at the same breakpoint. */
	all?: BleedSpaceProp;
	/** Amount to extend from both block edges. Overrides `all` at the same breakpoint. */
	block?: BleedSpaceProp;
	/** Amount to extend from the block-end edge. Overrides `block` at the same breakpoint. */
	blockEnd?: BleedSpaceProp;
	/** Amount to extend from the block-start edge. Overrides `block` at the same breakpoint. */
	blockStart?: BleedSpaceProp;
	/** Amount to extend from both inline edges. Overrides `all` at the same breakpoint. */
	inline?: BleedSpaceProp;
	/** Amount to extend from the inline-end edge. Overrides `inline` at the same breakpoint. */
	inlineEnd?: BleedSpaceProp;
	/** Amount to extend from the inline-start edge. Overrides `inline` at the same breakpoint. */
	inlineStart?: BleedSpaceProp;
}

type _BleedOwnedProperty = (typeof bleedOwnedProperties)[number];

type _BleedOmit = DistributiveOmit<LayoutProps, _BleedOwnedProperty>;

interface _BleedElementProps extends BoxLikeElementProps, _BleedOmit, _BleedSpaceProps {}

interface _BleedRenderProps extends BoxLikeRenderProps, _BleedOmit, _BleedSpaceProps {}

/** Layout utilities Bleed owns, so a caller cannot set them through Box. */
const bleedOwnedProperties = [
	'margin',
	'marginBlock',
	'marginBlockEnd',
	'marginBlockStart',
	'marginInline',
	'marginInlineEnd',
	'marginInlineStart',
] as const;

const bleedProperties = new Set(layoutProperties);
for (const property of bleedOwnedProperties) {
	bleedProperties.delete(property);
}

type BleedProperty = Parameters<typeof resolveResponsiveCssProperty>[1];

type StyleProps = { className: string; style: Record<string, string> };

/**
 * Resolves all, axis, and edge props against the same property. Later custom properties replace
 * earlier ones only at the conditions they set.
 */
function resolveBleedEdge(
	property: BleedProperty,
	all: BleedSpaceProp | undefined,
	axisPropName: string,
	axis: BleedSpaceProp | undefined,
	edgePropName: string,
	edge: BleedSpaceProp | undefined,
): StyleProps {
	const allStyle = resolveBleedValue(property, 'all', all);
	const axisStyle = resolveBleedValue(property, axisPropName, axis);
	const edgeStyle = resolveBleedValue(property, edgePropName, edge);

	return {
		className: cx(allStyle?.className, axisStyle?.className, edgeStyle?.className),
		style: { ...allStyle?.style, ...axisStyle?.style, ...edgeStyle?.style },
	};
}

function resolveBleedValue(
	property: BleedProperty,
	propName: string,
	value: BleedSpaceProp | undefined,
): StyleProps | undefined {
	if (value == null) return undefined;

	return resolveResponsiveCssProperty(value as RequiredInitialResponsiveValue<string>, property, {
		expectedValueDescription: 'a spacing token',
		format: formatBleedSpace,
		isValid: isBleedSpaceToken,
		propName,
	});
}

function formatBleedSpace(value: string | number): string {
	// `calc(-1 * 0)` is a number, not a length, so the negated margin needs a unit.
	if (value === '0') return '0px';
	return isSpaceStep(value) ? vars.space[value] : String(value);
}

function isBleedSpaceToken(value: string | number): boolean {
	return value === '0' || isSpaceStep(value);
}

function isSpaceStep(value: string | number): value is SpaceStep {
	return typeof value === 'string' && Object.hasOwn(vars.space, value);
}
