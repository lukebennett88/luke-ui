import type { SprinklesFn } from '@luke-ui/rainbow-sprinkles';
import { defineProperties, defineSprinkles } from '@luke-ui/rainbow-sprinkles';
import { vars } from '../theme/contract.css.js';
import { layers } from './layers.css.js';

const responsiveConditions = {
	xsmall: {},
	small: { '@media': 'screen and (width >= 640px)' },
	medium: { '@media': 'screen and (width >= 768px)' },
	large: { '@media': 'screen and (width >= 1024px)' },
	xlarge: { '@media': 'screen and (width >= 1280px)' },
	xxlarge: { '@media': 'screen and (width >= 1536px)' },
} as const;

const spaceScale = {
	'0': '0',
	'100': vars.space[100],
	'200': vars.space[200],
	'300': vars.space[300],
	'400': vars.space[400],
	'600': vars.space[600],
	'800': vars.space[800],
	'1000': vars.space[1000],
	'1200': vars.space[1200],
	'1600': vars.space[1600],
} as const;

const marginScale = { ...spaceScale, auto: 'auto' } as const;

const responsiveProperties = defineProperties({
	'@layer': layers.utilities,
	conditions: responsiveConditions,
	defaultCondition: 'xsmall',
	dynamicProperties: {
		blockSize: true,
		flex: true,
		flexBasis: true,
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
		maxBlockSize: true,
		maxInlineSize: true,
		minBlockSize: true,
		minInlineSize: true,
		order: true,
	},
	staticProperties: {
		alignContent: [
			'normal',
			'flex-start',
			'center',
			'flex-end',
			'space-between',
			'space-around',
			'stretch',
		],
		alignItems: ['normal', 'flex-start', 'center', 'flex-end', 'baseline', 'stretch'],
		alignSelf: ['auto', 'normal', 'flex-start', 'center', 'flex-end', 'baseline', 'stretch'],
		columnGap: spaceScale,
		display: [
			'none',
			'inline',
			'inline-block',
			'block',
			'flex',
			'inline-flex',
			'grid',
			'inline-grid',
			'contents',
		],
		flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
		flexGrow: ['0', '1'],
		flexShrink: ['0', '1'],
		flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
		gap: spaceScale,
		justifyContent: [
			'normal',
			'flex-start',
			'center',
			'flex-end',
			'space-between',
			'space-around',
			'space-evenly',
			'stretch',
		],
		justifySelf: ['auto', 'normal', 'start', 'center', 'end', 'stretch'],
		margin: marginScale,
		marginBlock: marginScale,
		marginBlockEnd: marginScale,
		marginBlockStart: marginScale,
		marginInline: marginScale,
		marginInlineEnd: marginScale,
		marginInlineStart: marginScale,
		overflow: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
		overflowX: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
		overflowY: ['visible', 'hidden', 'clip', 'scroll', 'auto'],
		padding: spaceScale,
		paddingBlock: spaceScale,
		paddingBlockEnd: spaceScale,
		paddingBlockStart: spaceScale,
		paddingInline: spaceScale,
		paddingInlineEnd: spaceScale,
		paddingInlineStart: spaceScale,
		placeSelf: ['auto', 'normal', 'start', 'center', 'end', 'stretch'],
		position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
		rowGap: spaceScale,
	},
});

export const createSprinkles: SprinklesFn<[typeof responsiveProperties]> =
	defineSprinkles(responsiveProperties);

export type SprinklesProps = Parameters<typeof createSprinkles>[0];
