import { vars } from '@luke-ui/react/theme';
import { createVar, style } from '@vanilla-extract/css';
import { docsSidebarMinInlineSize, docsTocMinInlineSize } from '../lib/docs-container-queries.js';
import { overlayMotion } from '../lib/overlay-motion.js';
import { SITE_HEADER_BLOCK_SIZE } from './site-header-size.js';

export const shell = style({
	'@layer': {
		components: {
			// `DocsArticle` places the article in `main` and the desktop table of contents in `toc`.
			backgroundColor: vars.color.surface.base,
			display: 'grid',
			gridTemplateAreas: '"header" "main"',
			gridTemplateColumns: 'minmax(0, 1fr)',
			gridTemplateRows: 'auto minmax(0, 1fr)',
			minBlockSize: '100dvh',
			minInlineSize: 0,
			'@container': {
				[docsSidebarMinInlineSize]: {
					gridTemplateAreas: '"header header" "sidebar main"',
					gridTemplateColumns: '16rem minmax(0, 1fr)',
				},
				[docsTocMinInlineSize]: {
					gridTemplateAreas: '"header header header" "sidebar main toc"',
					gridTemplateColumns: '16rem minmax(0, 1fr) 16rem',
				},
			},
		},
	},
});

export const header = style({
	'@layer': {
		components: {
			gridArea: 'header',
			insetBlockStart: 0,
			position: 'sticky',
			zIndex: 10,
		},
	},
});

export const sidebar = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.surface.base,
			borderInlineEnd: `1px solid ${vars.color.border.decorative}`,
			display: 'none',
			gridArea: 'sidebar',
			insetBlockStart: SITE_HEADER_BLOCK_SIZE,
			maxBlockSize: `calc(100dvh - ${SITE_HEADER_BLOCK_SIZE})`,
			overflow: 'auto',
			position: 'sticky',
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'block',
				},
			},
		},
	},
});

/** Hover, current, and focus styles for docs nav links. Layout lives on Box. */
export const navLink = style({
	'@layer': {
		components: {
			color: vars.color.text.secondary,
			fontSize: vars.font.label.fontSize,
			lineHeight: vars.font.label.lineHeight,
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
					color: vars.color.text.primary,
				},
				// Inset the global ring so the scrolling sidebar doesn't clip it.
				'&:focus-visible': {
					outlineOffset: '-2px',
				},
				'&[aria-current="page"]': {
					backgroundColor: vars.color.background.accent.subtle.rest,
					color: vars.color.text.primary,
				},
			},
		},
	},
});

export const mobileTrigger = style({
	'@layer': {
		components: {
			'@container': {
				[docsSidebarMinInlineSize]: {
					display: 'none',
				},
			},
		},
	},
});

// Off-screen toward the inline-end edge. Physical `translate` needs the sign flipped in RTL.
const drawerOffset = createVar();

// The scrim is a pseudo-element because the panel is the overlay's child. Fading the overlay itself
// would multiply into the panel's opacity. The overlay element has no transition of its own, so
// React Aria keeps it mounted during exit only because the panel's `translate` exit lasts as long
// as the scrim's fade. Its exit detection reads `getAnimations()` on the overlay and modal elements,
// not on pseudo-elements.
export const drawerOverlay = style({
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
							backgroundColor: vars.color.overlay.backdrop,
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

export const drawerModal = style({
	'@layer': {
		components: {
			...overlayMotion({
				hidden: { translate: `${drawerOffset} 0` },
				properties: ['translate'],
				rule: {
					backgroundColor: vars.color.surface.overlay,
					blockSize: '100%',
					boxShadow: vars.depth.overlay,
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

export const drawerDialog = style({
	'@layer': {
		components: {
			blockSize: '100%',
			overflowY: 'auto',
		},
	},
});
