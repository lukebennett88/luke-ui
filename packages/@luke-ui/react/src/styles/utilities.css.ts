import type { SprinklesFn } from '@luke-ui/rainbow-sprinkles';
import { defineProperties, defineSprinkles } from '@luke-ui/rainbow-sprinkles';
import type { TokenName } from '../tokens/index.js';
import { tokenKeys, tokens } from '../tokens/index.js';
import { layers } from './layers.css.js';
import { vars } from './vars.css.js';

// Builds a { [tokenKey]: cssVar } record while preserving the literal key type union.
function tokenScale<TGroup extends { $type: string }>(
	group: TGroup,
	varRecord: { readonly [K in TokenName<TGroup>]: string },
): { [K in TokenName<TGroup>]: string } {
	const scale = {} as { [K in TokenName<TGroup>]: string };
	for (const key of tokenKeys(group)) {
		scale[key] = varRecord[key];
	}
	return scale;
}

const breakpointNames = tokenKeys(tokens.breakpoints);
const layerName = layers.utilities;

const responsiveConditions = {
	xsmall: {},
	...Object.fromEntries(
		breakpointNames.map((bp) => [
			bp,
			{
				'@media': `screen and (width >= ${tokens.breakpoints[bp].$value.value}${tokens.breakpoints[bp].$value.unit})`,
			},
		]),
	),
};

const spaceScale = tokenScale(tokens.space, vars.space);

const responsiveProperties = defineProperties({
	'@layer': layerName,
	conditions: responsiveConditions,
	defaultCondition: 'xsmall',
	dynamicProperties: {
		columnGap: spaceScale,
		gap: spaceScale,
		padding: spaceScale,
		paddingBlock: spaceScale,
		paddingBlockEnd: spaceScale,
		paddingBlockStart: spaceScale,
		paddingInline: spaceScale,
		paddingInlineEnd: spaceScale,
		paddingInlineStart: spaceScale,
		rowGap: spaceScale,
	},
	shorthands: {
		p: ['padding'],
		px: ['paddingInlineStart', 'paddingInlineEnd'],
		py: ['paddingBlockStart', 'paddingBlockEnd'],
	},
	staticProperties: {
		alignItems: ['flex-start', 'center', 'flex-end', 'baseline', 'stretch'],
		blockSize: ['auto', '100%', 'fit-content', 'min-content', 'max-content'],
		display: ['flex', 'block', 'inline', 'inline-flex', 'none'],
		flexBasis: ['auto', '0'],
		flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
		flexGrow: ['0', '1'],
		flexShrink: ['0', '1'],
		inlineSize: ['auto', '100%', 'fit-content', 'min-content', 'max-content'],
		justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'],
		maxBlockSize: ['100%', 'none', '20rem', '40rem'],
		maxInlineSize: ['100%', 'none', '20rem', '40rem'],
		minBlockSize: ['0', '100%'],
		minInlineSize: ['0', '100%'],
		overflow: ['visible', 'hidden', 'auto', 'scroll', 'clip'],
		overflowX: ['visible', 'hidden', 'auto', 'scroll', 'clip'],
		overflowY: ['visible', 'hidden', 'auto', 'scroll', 'clip'],
		textOverflow: ['ellipsis', 'clip'],
	},
});

const pseudoProperties = defineProperties({
	'@layer': layerName,
	conditions: {
		default: {},
		focusVisible: { selector: '&:focus-visible' },
		hover: { selector: '&:hover' },
	},
	defaultCondition: 'default',
	staticProperties: {
		backgroundColor: tokenScale(tokens.backgroundColor, vars.backgroundColor),
	},
});

export const createSprinkles: SprinklesFn<[typeof responsiveProperties, typeof pseudoProperties]> =
	defineSprinkles(responsiveProperties, pseudoProperties);

export type SprinklesProps = Parameters<typeof createSprinkles>[0];
