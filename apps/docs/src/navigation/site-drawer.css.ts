import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { createVar, style } from '@vanilla-extract/css';
import { overlayMotion } from '../lib/overlay-motion.js';
import { navLinkMinBlockSize } from './docs-shell.css.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

// `translate` is physical, so the sign flips in RTL.
const drawerOffset = createVar();

// The scrim is a pseudo-element so its fade does not multiply into the panel's opacity. React Aria
// cannot see pseudo-element animations, so the panel's exit must last as long as the scrim's fade to
// keep the overlay mounted.
export const overlay = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { opacity: 0 },
				properties: ['opacity'],
				pseudo: '::before',
				rule: {
					inset: 0,
					position: 'fixed',
					zIndex: 100,
					selectors: {
						'&[data-exiting]': { pointerEvents: 'none' },
						'&::before': {
							backgroundColor: vars.color.background.backdrop,
							content: '""',
							inset: 0,
							position: 'absolute',
						},
					},
				},
			}),
		},
	},
});

export const modal = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { translate: `${drawerOffset} 0` },
				properties: ['translate'],
				rule: {
					backgroundColor: vars.color.background.surface.raised,
					blockSize: '100%',
					boxShadow: vars.shadow.overlay,
					inlineSize: 'min(22rem, 90vw)',
					marginInlineStart: 'auto',
					position: 'relative',
					translate: 'none',
					vars: { [drawerOffset]: '100%' },
					selectors: {
						'&:dir(rtl)': {
							vars: { [drawerOffset]: '-100%' },
						},
					},
				},
			}),
		},
	},
});

export const dialog = style({
	'@layer': {
		components: {
			blockSize: '100%',
			display: 'flex',
			flexDirection: 'column',
			minBlockSize: 0,
			overflow: 'hidden',
		},
	},
});

/** Matches the site header row, so the close button lands where Menu was. */
export const header = style({
	'@layer': {
		components: {
			alignItems: 'center',
			display: 'flex',
			flexShrink: 0,
			justifyContent: 'space-between',
			minBlockSize: SITE_HEADER_BLOCK_SIZE,
			paddingInline: vars.space['16'],
		},
	},
});

export const title = style({
	'@layer': {
		components: {
			fontSize: vars.font.label.fontSize,
			fontWeight: vars.font.weight.emphasis,
			lineHeight: vars.font.label.lineHeight,
		},
	},
});

/** No gap: the tree's sections carry their own block padding. Rows grow to touch-target size. */
export const body = style({
	'@layer': {
		components: {
			display: 'flex',
			flex: '1 1 auto',
			flexDirection: 'column',
			minBlockSize: 0,
			overflowY: 'auto',
			overscrollBehavior: 'contain',
			paddingBlockEnd: vars.space['16'],
			paddingInline: vars.space['16'],
			vars: { [navLinkMinBlockSize]: '2.75rem' },
		},
	},
});

export const group = style({
	'@layer': {
		components: {
			display: 'flex',
			flexDirection: 'column',
			gap: vars.space['4'],
		},
	},
});

export const footer = style({
	'@layer': {
		components: {
			borderBlockStart: `1px solid ${vars.color.border.decorative}`,
			paddingBlockStart: vars.space['16'],
		},
	},
});

/** The border keeps the track visible where its surface matches the drawer's. */
export const switcher = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.subdued,
			border: `1px solid ${vars.color.border.decorative}`,
			borderRadius: vars.radius.control,
			display: 'grid',
			gap: vars.space['4'],
			gridAutoFlow: 'column',
			gridAutoColumns: '1fr',
			padding: vars.space['4'],
		},
	},
});

export const segment = style({
	'@layer': {
		components: {
			alignItems: 'center',
			borderRadius: vars.radius.control,
			color: vars.color.foreground.secondary,
			display: 'flex',
			fontSize: vars.font.label.fontSize,
			justifyContent: 'center',
			lineHeight: vars.font.label.lineHeight,
			minBlockSize: '2.75rem',
			paddingInline: vars.space['8'],
			textAlign: 'center',
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					...interactionState('hover'),
					color: vars.color.foreground.primary,
				},
				'&:focus-visible': {
					outlineOffset: '-2px',
				},
				'&[aria-current="page"]': {
					...interactionState('pressed'),
					color: vars.color.foreground.primary,
					fontWeight: vars.font.weight.emphasis,
				},
			},
		},
	},
});
