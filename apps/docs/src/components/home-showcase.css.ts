import { vars } from '@luke-ui/react/theme';
import type { StyleRule } from '@vanilla-extract/css';
import { style } from '@vanilla-extract/css';
import type { ThemeIdentity } from '../lib/theme-prefs-shared.js';
import { THEME_IDENTITY_CLASS_NAMES } from '../lib/theme-prefs-shared.js';

// A small cluster of controls, annotated like a printed type specimen. Below `NARROW` the
// annotations drop under their controls and lose their leaders.

const CONTAINER = 'home-showcase';
// Wide, each side column holds a 20-character token on one line and a leader.
const NARROW = `${CONTAINER} (inline-size < 37rem)`;

function layer(rule: StyleRule) {
	return style({ '@layer': { components: rule } });
}

export const root = layer({
	containerName: CONTAINER,
	containerType: 'inline-size',
});

export const masthead = layer({
	alignItems: 'center',
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
	columnGap: vars.space['16'],
	display: 'flex',
	flexWrap: 'wrap',
	justifyContent: 'space-between',
	paddingBlockEnd: vars.space['12'],
	rowGap: vars.space['8'],
});

/**
 * The class name of the theme on `<html>`. Both names share one grid cell, so the box keeps the
 * longer name's width and nothing moves when the theme changes.
 */
export const edition = layer({
	color: vars.color.text.secondary,
	display: 'grid',
	fontFamily: vars.font.family.code,
	fontSize: vars.font.caption.fontSize,
	justifyItems: 'end',
	lineHeight: vars.font.caption.lineHeight,
	marginInlineStart: 'auto',
});

/**
 * Each name shows only while its class is on `<html>`. The head script sets the class before
 * paint, so the name is right from the first frame and needs no hydration.
 */
export const editionName = Object.fromEntries(
	Object.entries(THEME_IDENTITY_CLASS_NAMES).map(([identity, className]) => [
		identity,
		layer({
			gridArea: '1 / 1',
			visibility: 'hidden',
			selectors: { [`:root.${className} &`]: { visibility: 'visible' } },
		}),
	]),
) as Record<ThemeIdentity, string>;

export const plate = layer({
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
	columnGap: 0,
	display: 'grid',
	gridTemplateAreas: `
		"aName name bName"
		"aSize size bSize"
		"aActions actions bActions"
	`,
	gridTemplateColumns: 'minmax(0, 1fr) 13rem minmax(0, 1fr)',
	paddingBlockEnd: vars.space['48'],
	paddingBlockStart: vars.space['32'],
	rowGap: vars.space['32'],
	'@container': {
		[NARROW]: {
			columnGap: vars.space['16'],
			gridTemplateAreas: `
				"name name"
				"aName bName"
				"size size"
				"aSize bSize"
				"actions actions"
				"aActions bActions"
			`,
			gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
			paddingBlockEnd: vars.space['24'],
			paddingBlockStart: vars.space['24'],
			rowGap: vars.space['12'],
		},
	},
});

export const area = {
	name: layer({ gridArea: 'name' }),
	size: layer({ gridArea: 'size' }),
	actions: layer({
		display: 'grid',
		gap: vars.space['8'],
		gridArea: 'actions',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
	}),
	aName: layer({ gridArea: 'aName' }),
	bName: layer({ gridArea: 'bName' }),
	aSize: layer({ gridArea: 'aSize' }),
	bSize: layer({ gridArea: 'bSize' }),
	aActions: layer({ gridArea: 'aActions' }),
	bActions: layer({ gridArea: 'bActions' }),
};

/**
 * One annotation, level with its control's box: the token and its leader share the control's
 * height, and the note hangs below without adding to the row.
 */
export const annotation = layer({
	alignItems: 'center',
	alignSelf: 'end',
	blockSize: vars.controlSize.px32,
	display: 'flex',
	minInlineSize: 0,
	position: 'relative',
	'@container': {
		[NARROW]: {
			alignItems: 'flex-start',
			alignSelf: 'start',
			blockSize: 'auto',
			marginBlockEnd: vars.space['12'],
		},
	},
});

/** Annotations in the end column hold the outer margin too, so their leader comes first. */
export const annotationEnd = layer({
	flexDirection: 'row-reverse',
	textAlign: 'end',
	'@container': {
		[NARROW]: { flexDirection: 'row', textAlign: 'start' },
	},
});

/** The token with its note hanging below it. */
export const label = layer({
	flex: '0 0 auto',
	minInlineSize: 0,
	position: 'relative',
	'@container': {
		[NARROW]: { flexShrink: 1 },
	},
});

/**
 * A token breaks only after a dot, and only past 20 characters, so a long token takes two short
 * lines and leaves its leader room.
 */
export const token = layer({
	color: vars.color.text.primary,
	display: 'block',
	fontFamily: vars.font.family.code,
	fontSize: vars.font.caption.fontSize,
	lineHeight: vars.font.caption.lineHeight,
	maxInlineSize: '21ch',
});

export const note = layer({
	color: vars.color.text.secondary,
	display: 'block',
	fontSize: vars.font.caption.fontSize,
	insetBlockStart: `calc(100% + ${vars.space['4']})`,
	insetInlineStart: 0,
	lineHeight: vars.font.caption.lineHeight,
	position: 'absolute',
	whiteSpace: 'nowrap',
	'@container': {
		[NARROW]: { marginBlockStart: vars.space['4'], position: 'static', whiteSpace: 'normal' },
	},
});

/** Notes in the end column hang from the outer margin. */
export const noteEnd = layer({
	insetInlineEnd: 0,
	insetInlineStart: 'auto',
});

/** The leader stops a small gap short of the control and of the token. */
export const leader = layer({
	backgroundColor: vars.color.border.control,
	blockSize: '1px',
	flex: '1 1 0',
	marginInline: vars.space['8'],
	minInlineSize: vars.space['16'],
	'@container': {
		[NARROW]: { display: 'none' },
	},
});
