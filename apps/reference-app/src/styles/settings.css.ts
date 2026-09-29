import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

const desktopMin = '(min-width: 768px)';
const mobileMax = '(max-width: 767px)';

export const shell = style({
	background: vars.color.surface.canvas,
	display: 'flex',
	minBlockSize: '100dvh',
});

export const sidebar = style({
	background: `color-mix(in oklab, ${vars.color.surface.recessed} 78%, ${vars.color.text.primary} 22%)`,
	borderInlineEnd: `1px solid color-mix(in oklab, ${vars.color.border.decorative} 70%, ${vars.color.text.primary} 30%)`,
	color: vars.color.text.secondary,
	flexShrink: 0,
	inlineSize: '15.5rem',
	paddingBlock: vars.space.sp24,
	paddingInline: vars.space.sp12,
});

export const sidebarTitle = style({
	color: vars.color.text.secondary,
	letterSpacing: '0.06em',
	opacity: 0.85,
	paddingBlockEnd: vars.space.sp12,
	paddingInline: vars.space.sp8,
	textTransform: 'uppercase',
});

export const navLink = style({
	borderRadius: vars.radius.control,
	color: vars.color.text.secondary,
	display: 'block',
	lineHeight: 1.35,
	paddingBlock: vars.space.sp4,
	paddingInline: vars.space.sp8,
	textDecoration: 'none',
	selectors: {
		'&:hover': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 7%, transparent)`,
			color: vars.color.text.primary,
		},
		'&[aria-current="page"]': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 10%, transparent)`,
			color: vars.color.text.primary,
			fontWeight: 550,
		},
	},
});

export const menuNavLink = style([
	navLink,
	{
		borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
		borderRadius: 0,
		color: vars.color.text.primary,
		paddingBlock: vars.space.sp12,
		paddingInline: vars.space.sp16,
		selectors: {
			'&:last-child': {
				borderBlockEnd: 'none',
			},
			'&:hover': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 5%, transparent)`,
			},
			'&[aria-current="page"]': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 5%, transparent)`,
			},
		},
	},
]);

export const main = style({
	background: vars.color.surface.canvas,
	flex: 1,
	minInlineSize: 0,
	paddingBlock: vars.space.sp16,
	paddingInline: vars.space.sp16,
	paddingBlockEnd: vars.space.sp48,
	'@media': {
		[desktopMin]: {
			paddingBlock: vars.space.sp32,
			paddingInline: vars.space.sp40,
			paddingBlockEnd: vars.space.sp64,
		},
	},
});

export const content = style({
	maxInlineSize: '40rem',
});

export const mobileHeader = style({
	color: vars.color.text.secondary,
	marginBlockEnd: vars.space.sp16,
});

export const mobileHeaderLink = style({
	color: vars.color.text.secondary,
	textDecoration: 'none',
	selectors: {
		'&:hover': {
			color: vars.color.text.primary,
		},
	},
});

export const panel = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	overflow: 'hidden',
});

export const dangerPanel = style({
	background: `color-mix(in oklab, ${vars.color.background.danger.subtle.rest} 70%, ${vars.color.surface.floating})`,
	borderColor: vars.color.border.danger,
});

export const settingsRow = style({
	borderBlockEnd: `1px solid ${vars.color.border.decorative}`,
	paddingBlock: vars.space.sp12,
	paddingInline: vars.space.sp16,
	selectors: {
		'&:last-child': {
			borderBlockEnd: 'none',
		},
	},
	'@media': {
		[mobileMax]: {
			flexWrap: 'wrap',
		},
	},
});

export const rowControl = style({
	'@media': {
		[mobileMax]: {
			flex: '1 1 100%',
		},
	},
});

export const avatar = style({
	background: `color-mix(in oklab, ${vars.color.text.primary} 10%, transparent)`,
	blockSize: '3.5rem',
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.full,
	flexShrink: 0,
	inlineSize: '3.5rem',
	objectFit: 'cover',
});

export const selectTrigger = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.color.surface.canvas,
	backgroundImage: `linear-gradient(45deg, transparent 50%, ${vars.color.text.secondary} 50%), linear-gradient(135deg, ${vars.color.text.secondary} 50%, transparent 50%)`,
	backgroundPosition: 'calc(100% - 11px) calc(50% - 1.5px), calc(100% - 6px) calc(50% - 1.5px)',
	backgroundRepeat: 'no-repeat',
	backgroundSize: '5px 5px, 5px 5px',
	blockSize: vars.controlSize.small,
	border: `1px solid ${vars.color.border.control}`,
	borderRadius: vars.radius.control,
	boxShadow: `inset 0 1px 0 color-mix(in oklab, ${vars.color.text.primary} 3%, transparent)`,
	color: vars.color.text.primary,
	display: 'inline-flex',
	font: 'inherit',
	gap: vars.space.sp8,
	justifyContent: 'space-between',
	lineHeight: 1.2,
	maxInlineSize: '100%',
	minInlineSize: '8.5rem',
	paddingInlineEnd: '1.85rem',
	paddingInlineStart: vars.space.sp12,
	textAlign: 'start',
	selectors: {
		'&:hover': {
			borderColor: `color-mix(in oklab, ${vars.color.border.control} 70%, ${vars.color.text.primary})`,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&[data-disabled]': {
			opacity: 0.55,
		},
	},
	'@media': {
		[mobileMax]: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
});

export const selectPopover = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.floating,
	maxBlockSize: '16rem',
	minInlineSize: 'var(--trigger-width)',
	overflow: 'auto',
	paddingBlock: vars.space.sp4,
	zIndex: 20,
});

export const selectList = style({
	listStyle: 'none',
	margin: 0,
	outline: 'none',
	padding: 0,
});

export const selectItem = style({
	color: vars.color.text.primary,
	cursor: 'default',
	outline: 'none',
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
	selectors: {
		'&[data-focused]': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
		},
		'&[data-selected]': {
			fontWeight: 550,
		},
	},
});

export const switchRoot = style({
	alignItems: 'center',
	display: 'inline-flex',
	selectors: {
		'&[data-disabled]': {
			opacity: 0.55,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
			borderRadius: vars.radius.full,
		},
	},
});

export const switchTrack = style({
	background: `color-mix(in oklab, ${vars.color.text.primary} 16%, transparent)`,
	blockSize: '1.35rem',
	borderRadius: vars.radius.full,
	display: 'inline-block',
	flexShrink: 0,
	inlineSize: '2.4rem',
	pointerEvents: 'none',
	position: 'relative',
	selectors: {
		[`${switchRoot}[data-selected] &`]: {
			background: vars.color.background.accent.solid.rest,
		},
	},
});

export const switchThumb = style({
	background: 'white',
	blockSize: '1.05rem',
	borderRadius: vars.radius.full,
	boxShadow: '0 1px 2px rgb(0 0 0 / 0.18)',
	inlineSize: '1.05rem',
	insetBlockStart: '0.15rem',
	insetInlineStart: '0.15rem',
	pointerEvents: 'none',
	position: 'absolute',
	transition: 'translate 120ms ease',
	selectors: {
		[`${switchRoot}[data-selected] &`]: {
			translate: '1.05rem 0',
		},
	},
});
