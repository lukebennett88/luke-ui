import { defineProperties, defineSprinkles } from '@luke-ui/rainbow-sprinkles';
import { style } from '@vanilla-extract/css';
import type { Properties as CSSProperties } from 'csstype';
import { typedEntries } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import type { Prettify } from '../types/prettify.js';
import { layers } from './layers.css.js';
import { responsiveConditions } from './responsive-conditions.js';
import { spaceTokens } from './space-tokens.js';
import type { SurfaceBackground } from './surface.js';
import { surfaceStyle } from './surface.js';

// Every token-backed scale below derives from the public `vars` contract, so a token removed from
// the contract removes its Box value too.

/** Space steps plus `0`. `'0'` is quoted so declaration emit keeps it a string key. */
const spaceScale = {
	'0': '0',
	...spaceTokens,
} as const;

const marginScale = { ...spaceScale, auto: 'auto' } as const;

/** Border widths offered by the design system. */
const borderWidthScale = { none: '0', thin: '1px', thick: '2px' } as const;

const PROMINENCE_LEVELS = ['subtle', 'solid'] as const;

type SemanticRole = (typeof SEMANTIC_ROLES)[number];
type ProminenceLevel = (typeof PROMINENCE_LEVELS)[number];

/**
 * Resting role fills and the standard surfaces, excluding the translucent backdrop. Hover and
 * pressed fills stay theme tokens for recipes.
 */
type BackgroundColorToken =
	| `${SemanticRole}.${ProminenceLevel}`
	| `surface.${keyof typeof vars.color.surface}`;

/** The resting fill a Box background token paints. */
function restingBackground(token: BackgroundColorToken): SurfaceBackground {
	if (token.startsWith('surface.')) return token as `surface.${keyof typeof vars.color.surface}`;
	return `${token as `${SemanticRole}.${ProminenceLevel}`}.rest`;
}

const backgroundColorTokens: ReadonlyArray<BackgroundColorToken> = [
	...SEMANTIC_ROLES.flatMap((role) => {
		return PROMINENCE_LEVELS.map((prominence): BackgroundColorToken => `${role}.${prominence}`);
	}),
	...Object.keys(vars.color.surface).map((surface) => `surface.${surface}` as BackgroundColorToken),
];

type BreakpointName = keyof typeof responsiveConditions;

/**
 * One utilities-layer class per background and condition. Each pairs the fill with its text colour
 * and foreground context, so a responsive background changes them together. Conditions are the
 * outer loop, so each breakpoint's rules follow the narrower breakpoints' rules and win when both
 * match.
 */
export const backgroundColorClasses = Object.fromEntries(
	typedEntries(responsiveConditions).map(([condition, query]) => {
		return [
			condition,
			Object.fromEntries(
				backgroundColorTokens.map((token) => {
					const rule = surfaceStyle(restingBackground(token));
					const conditionalRule =
						'@container' in query ? { '@container': { [query['@container']]: rule } } : rule;
					return [
						token,
						style(
							{ '@layer': { [layers.utilities]: conditionalRule } },
							`backgroundColor-${token.replace('.', '-')}-${condition}`,
						),
					];
				}),
			),
		];
	}),
) as Record<BreakpointName, Record<BackgroundColorToken, string>>;

/** Property scales shared by the runtime config and the public prop types. */
const dynamicProperties = {
	alignContent: {
		center: 'center',
		end: 'end',
		'flex-end': 'flex-end',
		'flex-start': 'flex-start',
		normal: 'normal',
		'space-around': 'space-around',
		'space-between': 'space-between',
		'space-evenly': 'space-evenly',
		start: 'start',
		stretch: 'stretch',
	},
	alignItems: {
		baseline: 'baseline',
		center: 'center',
		end: 'end',
		'flex-end': 'flex-end',
		'flex-start': 'flex-start',
		normal: 'normal',
		start: 'start',
		stretch: 'stretch',
	},
	alignSelf: {
		auto: 'auto',
		baseline: 'baseline',
		center: 'center',
		'flex-end': 'flex-end',
		'flex-start': 'flex-start',
		normal: 'normal',
		stretch: 'stretch',
	},
	blockSize: true,
	// `control` and `controlHover` are guaranteed 3:1 boundaries; the role borders are decorative.
	borderColor: vars.color.border,
	borderRadius: vars.radius,
	borderStyle: { none: 'none', solid: 'solid', dashed: 'dashed', dotted: 'dotted' },
	borderWidth: borderWidthScale,
	boxShadow: vars.depth,
	columnGap: spaceScale,
	display: {
		block: 'block',
		contents: 'contents',
		flex: 'flex',
		grid: 'grid',
		inline: 'inline',
		'inline-block': 'inline-block',
		'inline-flex': 'inline-flex',
		'inline-grid': 'inline-grid',
		none: 'none',
	},
	flex: true,
	flexBasis: true,
	flexDirection: {
		column: 'column',
		'column-reverse': 'column-reverse',
		row: 'row',
		'row-reverse': 'row-reverse',
	},
	flexGrow: { '0': '0', '1': '1' },
	flexShrink: { '0': '0', '1': '1' },
	flexWrap: { nowrap: 'nowrap', wrap: 'wrap', 'wrap-reverse': 'wrap-reverse' },
	gap: spaceScale,
	gridArea: true,
	gridColumn: true,
	gridColumnEnd: true,
	gridColumnStart: true,
	gridRow: true,
	gridRowEnd: true,
	gridRowStart: true,
	inlineSize: true,
	inset: true,
	insetBlock: true,
	insetBlockEnd: true,
	insetBlockStart: true,
	insetInline: true,
	insetInlineEnd: true,
	insetInlineStart: true,
	justifyContent: {
		center: 'center',
		end: 'end',
		'flex-end': 'flex-end',
		'flex-start': 'flex-start',
		normal: 'normal',
		'space-around': 'space-around',
		'space-between': 'space-between',
		'space-evenly': 'space-evenly',
		start: 'start',
		stretch: 'stretch',
	},
	justifyItems: {
		baseline: 'baseline',
		center: 'center',
		end: 'end',
		normal: 'normal',
		start: 'start',
		stretch: 'stretch',
	},
	justifySelf: {
		auto: 'auto',
		center: 'center',
		end: 'end',
		normal: 'normal',
		start: 'start',
		stretch: 'stretch',
	},
	margin: marginScale,
	marginBlock: marginScale,
	marginBlockEnd: marginScale,
	marginBlockStart: marginScale,
	marginInline: marginScale,
	marginInlineEnd: marginScale,
	marginInlineStart: marginScale,
	maxBlockSize: true,
	maxInlineSize: true,
	minBlockSize: true,
	minInlineSize: true,
	order: true,
	overflow: {
		auto: 'auto',
		clip: 'clip',
		hidden: 'hidden',
		scroll: 'scroll',
		visible: 'visible',
	},
	overflowX: {
		auto: 'auto',
		clip: 'clip',
		hidden: 'hidden',
		scroll: 'scroll',
		visible: 'visible',
	},
	overflowY: {
		auto: 'auto',
		clip: 'clip',
		hidden: 'hidden',
		scroll: 'scroll',
		visible: 'visible',
	},
	padding: spaceScale,
	paddingBlock: spaceScale,
	paddingBlockEnd: spaceScale,
	paddingBlockStart: spaceScale,
	paddingInline: spaceScale,
	paddingInlineEnd: spaceScale,
	paddingInlineStart: spaceScale,
	placeSelf: {
		auto: 'auto',
		center: 'center',
		end: 'end',
		normal: 'normal',
		start: 'start',
		stretch: 'stretch',
	},
	position: {
		absolute: 'absolute',
		fixed: 'fixed',
		relative: 'relative',
		static: 'static',
		sticky: 'sticky',
	},
	rowGap: spaceScale,
} as const;

/**
 * Value accepted by one utility property. Constrained scales use their keys. Unconstrained
 * (`true`) properties keep the previous Rainbow Sprinkles contract: the csstype value for that
 * CSS property name.
 */
type ScaleValue<Property extends PropertyKey, Scale> = Scale extends true
	? Property extends keyof CSSProperties
		? CSSProperties[Property]
		: never
	: Scale extends Record<string, unknown>
		? keyof Scale & string
		: never;

/**
 * Direct value, or a responsive object keyed by breakpoint. A breakpoint that is omitted, `null`,
 * or `undefined` does not provide a new value.
 */
type ResponsiveValue<Value> =
	| Value
	| null
	| {
			[Condition in BreakpointName]?: Value | null;
	  };

type SprinklesPropsShape = {
	[Property in keyof typeof dynamicProperties]?: ResponsiveValue<
		ScaleValue<Property, (typeof dynamicProperties)[Property]>
	>;
} & {
	/**
	 * A standard surface or a role's resting fill. It also sets the text colour that content inside
	 * inherits. Omit it to keep the inherited colour.
	 */
	backgroundColor?: ResponsiveValue<BackgroundColorToken>;
};

/**
 * Layout and appearance props accepted by `createSprinkles` and `Box`. Package-internal so public
 * declarations do not require a styling-engine package for type checking.
 */
export type SprinklesProps = Prettify<SprinklesPropsShape>;

type CreateSprinklesResult<Props extends object> = {
	className: string;
	style: Record<string, string>;
} & Omit<Props, keyof SprinklesProps | 'className' | 'style'>;

/**
 * Package-internal sprinkles contract used by `Box` and layout components. `properties` is
 * read-only in TypeScript; the runtime `Set` is still mutable. Own enumerable string-keyed
 * non-utility props pass through. Generated `className` and `style` replace input keys of those
 * names.
 */
export type CreateSprinkles = {
	<Props extends SprinklesProps>(props: Props): CreateSprinklesResult<Props>;
	readonly properties: ReadonlySet<keyof SprinklesProps>;
};

/** Every utility except `backgroundColor`, which `createSprinkles` adds from its paired classes. */
export const sprinkles = defineSprinkles(
	defineProperties({
		'@layer': layers.utilities,
		conditions: responsiveConditions,
		defaultCondition: 'initial',
		dynamicProperties,
	}),
);
