import { defineProperties, defineSprinkles } from '@luke-ui/rainbow-sprinkles';
import { style } from '@vanilla-extract/css';
import type { Properties as CSSProperties } from 'csstype';
import { typedEntries } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import type { Prettify } from '../types/prettify.js';
import { containerMaxInlineSizeTokens } from './container-tokens.js';
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

/** Insets share margin's scale: space tokens, `0`, and `auto`. No lengths, percentages, or negatives. */
const insetScale = marginScale;

/**
 * Keyword sizes every sizing property accepts. There is no length scale: one-off dimensions use
 * `style`, and responsive ones use `className` with an authored `@container` query.
 */
const sizeKeywordScale = {
	'0': '0',
	'100%': '100%',
	'fit-content': 'fit-content',
	'max-content': 'max-content',
	'min-content': 'min-content',
} as const;

/** `inlineSize`, `blockSize`, and the minimum sizes. */
const sizeScale = { ...sizeKeywordScale, auto: 'auto' } as const;

/** Maximum sizes replace `auto` with `none`. */
const maxSizeScale = { ...sizeKeywordScale, none: 'none' } as const;

/** Only `maxInlineSize` also accepts the `container.*` presets. */
const maxInlineSizeScale = { ...maxSizeScale, ...containerMaxInlineSizeTokens } as const;

/** `flexBasis` takes the base sizes plus `content`. */
const flexBasisScale = { ...sizeScale, content: 'content' } as const;

/** Border widths offered by the design system. */
const borderWidthScale = { none: '0', thin: '1px', thick: '2px' } as const;

type SemanticRole = (typeof SEMANTIC_ROLES)[number];

/**
 * Resting role fills and the standard surfaces, excluding the translucent backdrop. Box values are
 * state-free: `accent.solid` paints `vars.color.background.accent.solid.rest`. Hover and pressed
 * fills stay theme tokens for recipes.
 */
type BackgroundColorToken =
	| `${SemanticRole}.subtle`
	| `${SemanticRole}.solid`
	| `surface.${keyof typeof vars.color.background.surface}`;

type BorderColorToken = `${SemanticRole}.strong` | 'control' | 'decorative';

const backgroundColors = [
	...SEMANTIC_ROLES.flatMap((role) => {
		return [
			[`${role}.subtle`, `${role}.subtle`],
			[`${role}.solid`, `${role}.solid.rest`],
		] as const;
	}),
	...typedEntries(vars.color.background.surface).map(([surface]) => {
		return [`surface.${surface}`, `surface.${surface}`] as const;
	}),
] satisfies ReadonlyArray<readonly [BackgroundColorToken, SurfaceBackground]>;

const backgroundColorTokens = backgroundColors.map(([token]) => token);

type BreakpointName = keyof typeof responsiveConditions;

/**
 * One utilities-layer class per background and condition. Each pairs the fill with its text colour
 * and foreground context. Conditions are the outer loop, so each breakpoint's rules follow the
 * narrower breakpoints' rules and win when both match. `initial` comes first, so its class is each
 * token's default.
 */
const backgroundColorValues: Partial<
	Record<
		BackgroundColorToken,
		{ default: string; conditions: Partial<Record<BreakpointName, string>> }
	>
> = {};
for (const [condition, query] of typedEntries(responsiveConditions)) {
	for (const [token, background] of backgroundColors) {
		const rule = surfaceStyle(background);
		const conditionalRule =
			'@container' in query ? { '@container': { [query['@container']]: rule } } : rule;
		const className = style(
			{ '@layer': { [layers.utilities]: conditionalRule } },
			`backgroundColor-${token.replace('.', '-')}-${condition}`,
		);
		const value = (backgroundColorValues[token] ??= { default: className, conditions: {} });
		value.conditions[condition] = className;
	}
}

/**
 * Border colours: the structural borders plus each role's `strong` border, keyed as `<role>.strong`
 * like the role backgrounds. `*.strong` and `control` are guaranteed 3:1 boundaries. `decorative`
 * is a separator.
 */
const borderColorScale = {
	control: vars.color.border.control.rest,
	decorative: vars.color.border.decorative,
	...Object.fromEntries(
		SEMANTIC_ROLES.flatMap((role) => {
			return [[`${role}.strong`, vars.color.border[role].strong]] as const;
		}),
	),
} as { [Token in BorderColorToken]: string };

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
	blockSize: sizeScale,
	// `control` and every `<role>.strong` are guaranteed 3:1 boundaries. `decorative` is not.
	borderColor: borderColorScale,
	borderRadius: vars.radius,
	borderStyle: { none: 'none', solid: 'solid', dashed: 'dashed', dotted: 'dotted' },
	borderWidth: borderWidthScale,
	boxShadow: vars.shadow,
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
	flexBasis: flexBasisScale,
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
	inlineSize: sizeScale,
	inset: insetScale,
	insetBlock: insetScale,
	insetBlockEnd: insetScale,
	insetBlockStart: insetScale,
	insetInline: insetScale,
	insetInlineEnd: insetScale,
	insetInlineStart: insetScale,
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
	maxBlockSize: maxSizeScale,
	maxInlineSize: maxInlineSizeScale,
	minBlockSize: sizeScale,
	minInlineSize: sizeScale,
	// Typed as `number` below. csstype's `order` also accepts any string.
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
 * Placement utilities. They are registered with the others, but kept out of `UtilityScales` so Box
 * and the layout components do not expose them. Only `GridItem` passes them to `createSprinkles`.
 */
const gridPlacementProperties = {
	gridArea: true,
	gridColumn: true,
	gridColumnEnd: true,
	gridColumnStart: true,
	gridRow: true,
	gridRowEnd: true,
	gridRowStart: true,
} as const;

type GridPlacementProperty = keyof typeof gridPlacementProperties;

/** Properties whose public value type is narrower than their csstype value. */
type ValueOverrides = {
	order: number;
};

/**
 * Value accepted by one utility property. Constrained scales use their keys. `ValueOverrides`
 * narrow unconstrained (`true`) properties. Other unconstrained properties keep the previous
 * Rainbow Sprinkles contract: the csstype value for that CSS property name.
 */
type ScaleValue<Property extends PropertyKey, Scale> = Property extends keyof ValueOverrides
	? ValueOverrides[Property]
	: Scale extends true
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

/**
 * Every utility's scale. Background values select paired classes. Keep their token keys here
 * so public declarations and docs do not depend on the styling engine's config.
 */
type UtilityScales = typeof dynamicProperties &
	Record<'backgroundColor', Record<(typeof backgroundColorTokens)[number], string>>;

type SprinklesPropsShape = {
	[Property in keyof UtilityScales]?: ResponsiveValue<
		ScaleValue<Property, UtilityScales[Property]>
	>;
};

/** Placement props that only `GridItem` passes to `createSprinkles`. */
export type GridPlacementSprinklesProps = {
	[Property in GridPlacementProperty]?: ResponsiveValue<ScaleValue<Property, true>>;
};

/**
 * Layout and appearance props accepted by `createSprinkles` and `Box`. Package-internal so public
 * declarations do not require a styling-engine package for type checking.
 */
export type SprinklesProps = Prettify<SprinklesPropsShape>;

type CreateSprinklesResult<Props extends object> = {
	className: string;
	style: Record<string, string>;
} & Omit<Props, keyof SprinklesProps | GridPlacementProperty | 'className' | 'style'>;

/**
 * Package-internal sprinkles contract used by `Box` and layout components. `properties` is
 * read-only in TypeScript; the runtime `Set` is still mutable. Own enumerable string-keyed
 * non-utility props pass through. Generated `className` and `style` replace input keys of those
 * names.
 */
type CreateSprinkles = {
	<Props extends SprinklesProps & GridPlacementSprinklesProps>(
		props: Props,
	): CreateSprinklesResult<Props>;
	readonly properties: ReadonlySet<keyof SprinklesProps | GridPlacementProperty>;
};

/** Package-internal utilities, including paired background classes. */
export const createSprinkles: CreateSprinkles = defineSprinkles(
	defineProperties({
		'@layer': layers.utilities,
		conditions: responsiveConditions,
		defaultCondition: 'initial',
		dynamicProperties: { ...dynamicProperties, ...gridPlacementProperties },
	}),
	{
		config: {
			backgroundColor: {
				name: 'backgroundColor',
				staticScale: backgroundColorTokens,
				values: backgroundColorValues,
			},
		},
	},
);
