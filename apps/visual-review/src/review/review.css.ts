import { vars } from '@luke-ui/react/theme';
import { globalStyle, style } from '@vanilla-extract/css';

const hairline = `${vars.borderWidth.thin} solid ${vars.color.border.decorative}`;
const focusRing = { outline: `2px solid ${vars.color.focus}`, outlineOffset: '-2px' };

export const layout = style({
	display: 'grid',
	flexGrow: 1,
	gridTemplateColumns: 'minmax(16rem, 20rem) minmax(0, 1fr)',
	minBlockSize: 0,
});

export const sidebar = style({
	background: vars.color.background.surface.base,
	borderInlineEnd: hairline,
	display: 'flex',
	flexDirection: 'column',
	minBlockSize: 0,
});

export const sidebarSection = style({
	borderBlockEnd: hairline,
	padding: vars.space['12'],
});

export const captureScroll = style({
	flexGrow: 1,
	minBlockSize: 0,
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	padding: vars.space['8'],
});

export const captureGroup = style({
	listStyle: 'none',
	margin: 0,
	padding: 0,
});

export const captureGroupHeading = style({
	paddingBlock: vars.space['8'],
	paddingInline: vars.space['8'],
});

export const captureLink = style({
	alignItems: 'baseline',
	borderRadius: vars.radius.control,
	color: vars.color.foreground.secondary,
	display: 'flex',
	gap: vars.space['8'],
	justifyContent: 'space-between',
	paddingBlock: vars.space['8'],
	paddingInline: vars.space['8'],
	scrollMarginBlock: vars.space['32'],
	selectors: {
		'&:focus-visible': focusRing,
		'&:hover': {
			background: `color-mix(in oklab, ${vars.color.foreground.primary} 6%, transparent)`,
			color: vars.color.foreground.primary,
		},
		'&[aria-current="true"]': {
			background: vars.color.background.accent.subtle,
			color: vars.color.foreground.primary,
		},
	},
	textDecoration: 'none',
});

export const captureStatus = style({
	flexShrink: 0,
});

export const shortcuts = style({
	borderBlockStart: hairline,
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space['8'],
	padding: vars.space['12'],
});

export const viewer = style({
	display: 'flex',
	flexDirection: 'column',
	minBlockSize: 0,
	minInlineSize: 0,
});

export const toolbar = style({
	alignItems: 'end',
	background: vars.color.background.surface.base,
	borderBlockEnd: hairline,
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space['16'],
	justifyContent: 'space-between',
	paddingBlock: vars.space['12'],
	paddingInline: vars.space['16'],
});

export const zoomField = style({
	inlineSize: '7rem',
});

export const opacityField = style({
	alignItems: 'center',
	display: 'flex',
	gap: vars.space['8'],
});

export const opacityInput = style({
	accentColor: vars.color.background.accent.solid.rest,
	inlineSize: '10rem',
	selectors: {
		'&:focus-visible': { ...focusRing, outlineOffset: '2px' },
	},
});

export const stage = style({
	flexGrow: 1,
	minBlockSize: 0,
	overflow: 'auto',
	padding: vars.space['16'],
	selectors: {
		'&:focus-visible': focusRing,
	},
});

export const sideBySide = style({
	alignItems: 'start',
	display: 'grid',
	gap: vars.space['16'],
	gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
});

/** At a fixed zoom each column takes its image's size and the stage scrolls. */
export const sideBySideFixed = style({
	gridTemplateColumns: 'repeat(2, max-content)',
});

export const sideBySideStacked = style({
	gridTemplateColumns: 'minmax(0, 1fr)',
});

export const figure = style({
	display: 'grid',
	gap: vars.space['8'],
	justifyItems: 'start',
	margin: 0,
	minInlineSize: 0,
});

/** Stacks the expected and actual images in one cell so they share an origin. */
export const overlay = style({
	display: 'grid',
	justifyItems: 'start',
});

globalStyle(`${overlay} > *`, {
	gridArea: '1 / 1',
});

/** Sizes to its image so region outlines can be placed as a share of it. */
export const imageFrame = style({
	inlineSize: 'fit-content',
	maxInlineSize: '100%',
	position: 'relative',
});

export const region = style({
	borderRadius: vars.radius.detail,
	boxShadow: `0 0 0 1px ${vars.color.background.surface.base}`,
	outline: `2px solid ${vars.color.foreground.danger.rest}`,
	pointerEvents: 'none',
	position: 'absolute',
	scrollMargin: vars.space['48'],
});

export const image = style({
	background: vars.color.background.surface.base,
	display: 'block',
	outline: hairline,
});

export const imageFit = style({
	blockSize: 'auto',
	maxInlineSize: '100%',
});

/** Keeps pixel edges crisp when an image is scaled up to inspect a small difference. */
export const imagePixelated = style({
	imageRendering: 'pixelated',
});

export const message = style({
	marginInline: 'auto',
	maxInlineSize: '36rem',
	padding: vars.space['32'],
});
