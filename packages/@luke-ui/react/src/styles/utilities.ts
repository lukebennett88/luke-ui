import type { CSSProperties } from 'react';
import { css } from '../../styled-system/css/index.mjs';
import { token } from '../../styled-system/tokens/index.mjs';
import type { SpacingToken } from '../../styled-system/tokens/index.mjs';
import type { Conditions } from '../../styled-system/types/conditions.d.mts';
import type { SystemStyleObject } from '../../styled-system/types/system-types.d.mts';
import { cx } from '../utils/index.js';

type Breakpoint = RemoveConditionPrefix<Exclude<keyof Conditions, 'base' | '_focus' | '_hover'>>;
type Responsive<Value> = Value | Partial<Record<Breakpoint, Value>>;
type Space = '0' | Exclude<SpacingToken, 'none' | 'sm' | 'md' | `-${string}`>;
type DynamicValue = CSSProperties[keyof CSSProperties];

const spaceValues = new Set<string>([
	'0',
	'100',
	'200',
	'300',
	'400',
	'600',
	'800',
	'1000',
	'1200',
	'1600',
]);

type StaticBoxProps = {
	alignContent?: Responsive<
		'center' | 'flex-end' | 'flex-start' | 'normal' | 'space-around' | 'space-between' | 'stretch'
	>;
	alignItems?: Responsive<'baseline' | 'center' | 'flex-end' | 'flex-start' | 'normal' | 'stretch'>;
	alignSelf?: Responsive<
		'auto' | 'baseline' | 'center' | 'flex-end' | 'flex-start' | 'normal' | 'stretch'
	>;
	columnGap?: Responsive<Space>;
	display?: Responsive<
		| 'block'
		| 'contents'
		| 'flex'
		| 'grid'
		| 'inline'
		| 'inline-block'
		| 'inline-flex'
		| 'inline-grid'
		| 'none'
	>;
	flexDirection?: Responsive<'column' | 'column-reverse' | 'row' | 'row-reverse'>;
	flexGrow?: Responsive<'0' | '1'>;
	flexShrink?: Responsive<'0' | '1'>;
	flexWrap?: Responsive<'nowrap' | 'wrap' | 'wrap-reverse'>;
	gap?: Responsive<Space>;
	justifyContent?: Responsive<
		| 'center'
		| 'flex-end'
		| 'flex-start'
		| 'normal'
		| 'space-around'
		| 'space-between'
		| 'space-evenly'
		| 'stretch'
	>;
	justifySelf?: Responsive<'auto' | 'center' | 'end' | 'normal' | 'start' | 'stretch'>;
	margin?: Responsive<Space | 'auto'>;
	marginBlock?: Responsive<Space | 'auto'>;
	marginBlockEnd?: Responsive<Space | 'auto'>;
	marginBlockStart?: Responsive<Space | 'auto'>;
	marginInline?: Responsive<Space | 'auto'>;
	marginInlineEnd?: Responsive<Space | 'auto'>;
	marginInlineStart?: Responsive<Space | 'auto'>;
	overflow?: Responsive<'auto' | 'clip' | 'hidden' | 'scroll' | 'visible'>;
	overflowX?: Responsive<'auto' | 'clip' | 'hidden' | 'scroll' | 'visible'>;
	overflowY?: Responsive<'auto' | 'clip' | 'hidden' | 'scroll' | 'visible'>;
	padding?: Responsive<Space>;
	paddingBlock?: Responsive<Space>;
	paddingBlockEnd?: Responsive<Space>;
	paddingBlockStart?: Responsive<Space>;
	paddingInline?: Responsive<Space>;
	paddingInlineEnd?: Responsive<Space>;
	paddingInlineStart?: Responsive<Space>;
	placeSelf?: Responsive<'auto' | 'center' | 'end' | 'normal' | 'start' | 'stretch'>;
	position?: Responsive<'absolute' | 'fixed' | 'relative' | 'static' | 'sticky'>;
	rowGap?: Responsive<Space>;
};

type DynamicBoxProps = {
	blockSize?: DynamicValue;
	flex?: DynamicValue;
	flexBasis?: DynamicValue;
	gridArea?: DynamicValue;
	gridColumn?: DynamicValue;
	gridColumnEnd?: DynamicValue;
	gridColumnStart?: DynamicValue;
	gridRow?: DynamicValue;
	gridRowEnd?: DynamicValue;
	gridRowStart?: DynamicValue;
	inlineSize?: DynamicValue;
	inset?: DynamicValue;
	insetBlock?: DynamicValue;
	insetBlockEnd?: DynamicValue;
	insetBlockStart?: DynamicValue;
	insetInline?: DynamicValue;
	insetInlineEnd?: DynamicValue;
	insetInlineStart?: DynamicValue;
	maxBlockSize?: DynamicValue;
	maxInlineSize?: DynamicValue;
	minBlockSize?: DynamicValue;
	minInlineSize?: DynamicValue;
	order?: DynamicValue;
};

export type SprinklesProps = StaticBoxProps & DynamicBoxProps;
// This manifest is the single source for the Box split boundary and is kept in
// lockstep with the curated Panda staticCss surface.
const boxPropertyManifest = [
	'alignContent',
	'alignItems',
	'alignSelf',
	'blockSize',
	'columnGap',
	'display',
	'flex',
	'flexBasis',
	'flexDirection',
	'flexGrow',
	'flexShrink',
	'flexWrap',
	'gap',
	'gridArea',
	'gridColumn',
	'gridColumnEnd',
	'gridColumnStart',
	'gridRow',
	'gridRowEnd',
	'gridRowStart',
	'inlineSize',
	'inset',
	'insetBlock',
	'insetBlockEnd',
	'insetBlockStart',
	'insetInline',
	'insetInlineEnd',
	'insetInlineStart',
	'justifyContent',
	'justifySelf',
	'margin',
	'marginBlock',
	'marginBlockEnd',
	'marginBlockStart',
	'marginInline',
	'marginInlineEnd',
	'marginInlineStart',
	'maxBlockSize',
	'maxInlineSize',
	'minBlockSize',
	'minInlineSize',
	'order',
	'overflow',
	'overflowX',
	'overflowY',
	'padding',
	'paddingBlock',
	'paddingBlockEnd',
	'paddingBlockStart',
	'paddingInline',
	'paddingInlineEnd',
	'paddingInlineStart',
	'placeSelf',
	'position',
	'rowGap',
] as const satisfies ReadonlyArray<keyof SprinklesProps>;

/** The generated Box runtime splits only this curated Panda property surface. */
export const boxProperties: ReadonlySet<string> = new Set(boxPropertyManifest);

const dynamicClasses = {
	blockSize: css({ boxBlockSize: 'dynamic' }),
	flex: css({ boxFlex: 'dynamic' }),
	flexBasis: css({ boxFlexBasis: 'dynamic' }),
	gridArea: css({ boxGridArea: 'dynamic' }),
	gridColumn: css({ boxGridColumn: 'dynamic' }),
	gridColumnEnd: css({ boxGridColumnEnd: 'dynamic' }),
	gridColumnStart: css({ boxGridColumnStart: 'dynamic' }),
	gridRow: css({ boxGridRow: 'dynamic' }),
	gridRowEnd: css({ boxGridRowEnd: 'dynamic' }),
	gridRowStart: css({ boxGridRowStart: 'dynamic' }),
	inlineSize: css({ boxInlineSize: 'dynamic' }),
	inset: css({ boxInset: 'dynamic' }),
	insetBlock: css({ boxInsetBlock: 'dynamic' }),
	insetBlockEnd: css({ boxInsetBlockEnd: 'dynamic' }),
	insetBlockStart: css({ boxInsetBlockStart: 'dynamic' }),
	insetInline: css({ boxInsetInline: 'dynamic' }),
	insetInlineEnd: css({ boxInsetInlineEnd: 'dynamic' }),
	insetInlineStart: css({ boxInsetInlineStart: 'dynamic' }),
	maxBlockSize: css({ boxMaxBlockSize: 'dynamic' }),
	maxInlineSize: css({ boxMaxInlineSize: 'dynamic' }),
	minBlockSize: css({ boxMinBlockSize: 'dynamic' }),
	minInlineSize: css({ boxMinInlineSize: 'dynamic' }),
	order: css({ boxOrder: 'dynamic' }),
} as const;

export function createSprinkles(props: Partial<SprinklesProps>): {
	className: string;
	style: Record<string, DynamicValue>;
} {
	const classes: Array<string> = [];
	const style: Record<string, DynamicValue> = {};
	const responsiveProps: SystemStyleObject = {};
	const staticProps: SystemStyleObject = {};

	for (const [property, value] of Object.entries(props)) {
		if (isDynamicProperty(property) && (typeof value === 'number' || typeof value === 'string')) {
			classes.push(dynamicClasses[property]);
			style[`--box-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`] = value;
		} else if (isStaticProperty(property) && isResponsiveValue(value)) {
			for (const [breakpoint, responsiveValue] of Object.entries(value)) {
				Object.assign(responsiveProps, { [toResponsiveBoxAlias(property, breakpoint)]: 'dynamic' });
				style[`--box-${toKebabCase(property)}-${breakpoint}`] = toResponsiveCssValue(
					property,
					responsiveValue,
				);
			}
		} else if (isStaticProperty(property)) {
			Object.assign(staticProps, { [toBoxAlias(property)]: value });
		} else {
			Object.assign(staticProps, { [property]: value });
		}
	}

	return { className: cx(css(staticProps), css(responsiveProps), ...classes), style };
}

function isDynamicProperty(property: string): property is keyof typeof dynamicClasses {
	return property in dynamicClasses;
}

function isStaticProperty(property: string): property is keyof StaticBoxProps {
	return boxProperties.has(property) && !isDynamicProperty(property);
}

function toBoxAlias(property: keyof StaticBoxProps): string {
	return `box${property.charAt(0).toUpperCase()}${property.slice(1)}`;
}

function toResponsiveBoxAlias(property: keyof StaticBoxProps, breakpoint: string): string {
	return `${toBoxAlias(property)}${breakpoint.charAt(0).toUpperCase()}${breakpoint.slice(1)}`;
}

function toKebabCase(value: string): string {
	return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function isResponsiveValue(value: unknown): value is Record<string, DynamicValue> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toResponsiveCssValue(property: keyof StaticBoxProps, value: DynamicValue): DynamicValue {
	if (!isTokenBoundProperty(property) || typeof value !== 'string' || !isSpace(value)) return value;
	if (value === '0') return value;

	return token.var(`spacing.${value}`);
}

function isTokenBoundProperty(property: keyof StaticBoxProps): boolean {
	return (
		property === 'columnGap' ||
		property === 'gap' ||
		property.startsWith('margin') ||
		property.startsWith('padding') ||
		property === 'rowGap'
	);
}

function isSpace(value: string): value is Space {
	return spaceValues.has(value);
}

type RemoveConditionPrefix<Condition extends string> = Condition extends `_${infer Name}`
	? Name
	: never;
