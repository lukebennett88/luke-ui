import type { SprinklesFn } from '@luke-ui/rainbow-sprinkles';
import { defineProperties, defineSprinkles } from '@luke-ui/rainbow-sprinkles';
import { typedEntries } from '../../shared/utils/utils.js';
import { breakpoints } from '../../theme/breakpoints.js';
import { vars } from '../../theme/contract.css.js';
import type { SpaceStep } from '../../theme/contract.js';
import { SEMANTIC_ROLES } from '../../theme/contrast-policy.js';
import { layers } from './layers.css.js';

function fromBreakpoint(minimumInlineSize: number) {
	return { '@container': `(inline-size >= ${minimumInlineSize}px)` };
}

const responsiveConditions = {
	initial: {},
	bp640: fromBreakpoint(breakpoints.bp640),
	bp768: fromBreakpoint(breakpoints.bp768),
	bp1024: fromBreakpoint(breakpoints.bp1024),
	bp1280: fromBreakpoint(breakpoints.bp1280),
	bp1536: fromBreakpoint(breakpoints.bp1536),
} as const;

/** Space steps plus `0`. `'0'` is quoted so declaration emit keeps it a string key. */
const spaceScale = {
	'0': '0',
	sp4: vars.space.sp4,
	sp8: vars.space.sp8,
	sp12: vars.space.sp12,
	sp16: vars.space.sp16,
	sp24: vars.space.sp24,
	sp32: vars.space.sp32,
	sp40: vars.space.sp40,
	sp48: vars.space.sp48,
	sp64: vars.space.sp64,
} as const satisfies Record<SpaceStep | '0', string>;

const marginScale = { ...spaceScale, auto: 'auto' } as const;

/** Border widths offered by the design system. */
const borderWidthScale = { none: '0', thin: '1px', thick: '2px' } as const;

const PROMINENCE_LEVELS = ['subtle', 'solid'] as const;
const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;

type SemanticRole = (typeof SEMANTIC_ROLES)[number];
type ProminenceLevel = (typeof PROMINENCE_LEVELS)[number];
type InteractionState = (typeof INTERACTION_STATES)[number];

/** Background tokens, excluding the translucent backdrop. */
type BackgroundColorToken =
	| `${SemanticRole}.${ProminenceLevel}.${InteractionState}`
	| `surface.${keyof typeof vars.color.surface}`;

/** Background tokens for semantic roles and elevation surfaces. */
const backgroundColorScale = Object.fromEntries([
	...SEMANTIC_ROLES.flatMap((role) => {
		return PROMINENCE_LEVELS.flatMap((prominence) => {
			return INTERACTION_STATES.map((state): [BackgroundColorToken, string] => {
				return [`${role}.${prominence}.${state}`, vars.color.background[role][prominence][state]];
			});
		});
	}),
	...typedEntries(vars.color.surface).map(([surface, value]): [BackgroundColorToken, string] => {
		return [`surface.${surface}`, value];
	}),
]) as Record<BackgroundColorToken, string>;

const responsiveProperties = defineProperties({
	'@layer': layers.utilities,
	conditions: responsiveConditions,
	defaultCondition: 'initial',
	dynamicProperties: {
		alignContent: {
			center: 'center',
			'flex-end': 'flex-end',
			'flex-start': 'flex-start',
			normal: 'normal',
			'space-around': 'space-around',
			'space-between': 'space-between',
			stretch: 'stretch',
		},
		alignItems: {
			baseline: 'baseline',
			center: 'center',
			'flex-end': 'flex-end',
			'flex-start': 'flex-start',
			normal: 'normal',
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
		backgroundColor: backgroundColorScale,
		blockSize: true,
		borderColor: vars.color.border,
		borderRadius: {
			detail: vars.radius.detail,
			control: vars.radius.control,
			surface: vars.radius.surface,
			overlay: vars.radius.overlay,
			full: vars.radius.full,
		},
		borderStyle: { none: 'none', solid: 'solid', dashed: 'dashed', dotted: 'dotted' },
		borderWidth: borderWidthScale,
		boxShadow: {
			recessed: vars.depth.recessed,
			resting: vars.depth.resting,
			raised: vars.depth.raised,
			floating: vars.depth.floating,
			overlay: vars.depth.overlay,
		},
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
			'flex-end': 'flex-end',
			'flex-start': 'flex-start',
			normal: 'normal',
			'space-around': 'space-around',
			'space-between': 'space-between',
			'space-evenly': 'space-evenly',
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
	},
});

type CreateSprinkles = SprinklesFn<[typeof responsiveProperties]>;

export const createSprinkles: CreateSprinkles = defineSprinkles(responsiveProperties);

export type SprinklesProps = Parameters<typeof createSprinkles>[0];
