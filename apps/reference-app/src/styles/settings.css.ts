import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

const desktopMin = '(min-width: 768px)';
const mobileMax = '(max-width: 767px)';

export const shell = style({
	// Light recessed is pure white (brighter than floating); canvas sits below floating in both modes.
	background: vars.color.surface.canvas,
	blockSize: '100%',
	display: 'flex',
	minBlockSize: '100%',
	overflow: 'hidden',
});

export const sidebar = style({
	background: 'transparent',
	color: vars.color.text.secondary,
	flexShrink: 0,
	inlineSize: '15.5rem',
	minBlockSize: 0,
	overflow: 'hidden',
	// Inline padding lives on the scroller / back link so the scrollbar sits on the column edge.
	paddingBlock: vars.space.sp16,
});

export const sidebarScroll = style({
	flex: 1,
	minBlockSize: 0,
	overflowX: 'hidden',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	paddingInline: vars.space.sp12,
});

export const skipLink = style({
	background: vars.color.surface.floating,
	blockSize: '1px',
	clip: 'rect(1px, 1px, 1px, 1px)',
	clipPath: 'inset(100%)',
	color: vars.color.text.primary,
	inlineSize: '1px',
	overflow: 'hidden',
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
	position: 'absolute',
	selectors: {
		'&:focus, &:focus-visible': {
			blockSize: 'auto',
			clip: 'auto',
			clipPath: 'none',
			inlineSize: 'auto',
			insetBlockStart: vars.space.sp8,
			insetInlineStart: vars.space.sp8,
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
			overflow: 'visible',
		},
	},
	textDecoration: 'none',
	whiteSpace: 'nowrap',
	zIndex: 100,
});

export const backLink = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	color: vars.color.text.secondary,
	cursor: 'pointer',
	display: 'inline-flex',
	// Match `Text typography="caption"` so Track’s inherited line box (centre strut /
	// `firstLine` `1lh`) aligns with the caption, not the shell’s body metrics.
	fontFamily: vars.font.caption.fontFamily,
	fontSize: vars.font.caption.fontSize,
	letterSpacing: vars.font.caption.letterSpacing,
	lineHeight: vars.font.caption.lineHeight,
	// Sidebar no longer has inline padding; keep the back control aligned with nav items.
	marginInline: vars.space.sp12,
	paddingBlock: vars.space.sp4,
	paddingInline: vars.space.sp8,
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&:hover': {
			color: vars.color.text.primary,
		},
	},
	textAlign: 'start',
	textDecoration: 'none',
});

export const sidebarTitle = style({
	color: vars.color.text.secondary,
	letterSpacing: '0.06em',
	opacity: 0.85,
	paddingBlockEnd: vars.space.sp4,
	paddingInline: vars.space.sp8,
	textTransform: 'uppercase',
});

export const navLink = style({
	alignItems: 'center',
	borderRadius: vars.radius.control,
	color: vars.color.text.secondary,
	display: 'flex',
	gap: vars.space.sp8,
	lineHeight: 1.35,
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp8,
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&:hover': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 6%, transparent)`,
			color: vars.color.text.primary,
		},
		'&[aria-current="page"]': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
			color: vars.color.text.primary,
			fontWeight: 550,
		},
	},
	textDecoration: 'none',
});

export const menuNavLink = style([
	navLink,
	{
		borderRadius: vars.radius.control,
		color: vars.color.text.primary,
		paddingBlock: vars.space.sp8,
		paddingInline: vars.space.sp8,
		selectors: {
			'&:hover': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 5%, transparent)`,
			},
			'&[aria-current="page"]': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
				fontWeight: 550,
			},
		},
	},
]);

export const main = style({
	'@media': {
		[desktopMin]: {
			borderRadius: '12px',
			boxShadow: vars.depth.raised,
			marginBlock: vars.space.sp8,
			marginInlineEnd: vars.space.sp8,
		},
	},
	background: vars.color.surface.floating,
	flex: 1,
	minBlockSize: 0,
	minInlineSize: 0,
	overflow: 'hidden',
});

export const mainScroll = style({
	'@media': {
		[desktopMin]: {
			paddingBlock: vars.space.sp32,
			paddingBlockEnd: vars.space.sp64,
			paddingInline: vars.space.sp40,
		},
	},
	blockSize: '100%',
	overflowX: 'hidden',
	overflowY: 'auto',
	overscrollBehavior: 'contain',
	paddingBlock: vars.space.sp16,
	paddingBlockEnd: vars.space.sp48,
	paddingInline: vars.space.sp16,
});

export const mobileHeader = style({
	'@media': {
		[desktopMin]: {
			display: 'none',
		},
	},
	alignItems: 'center',
	color: vars.color.text.secondary,
	display: 'flex',
	marginBlockEnd: vars.space.sp16,
});

export const mobileHeaderLink = style({
	alignItems: 'center',
	color: vars.color.text.secondary,
	display: 'inline-flex',
	gap: vars.space.sp4,
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&:hover': {
			color: vars.color.text.primary,
		},
	},
	textDecoration: 'none',
});

export const panel = style({
	background: vars.color.surface.floating,
	border: `1px solid color-mix(in oklab, ${vars.color.border.decorative} 85%, transparent)`,
	borderRadius: vars.radius.surface,
	overflow: 'hidden',
});

export const dangerPanel = style({
	borderColor: vars.color.border.danger,
});

export const sessionIcon = style({
	alignItems: 'center',
	background: `color-mix(in oklab, ${vars.color.text.primary} 6%, transparent)`,
	borderRadius: vars.radius.control,
	color: vars.color.text.secondary,
	display: 'inline-flex',
	flexShrink: 0,
	justifyContent: 'center',
	padding: vars.space.sp8,
});

export const sessionMeta = style({
	alignItems: 'center',
	display: 'inline-flex',
	flexWrap: 'wrap',
	gap: vars.space.sp4,
});

export const currentDot = style({
	background: vars.color.foreground.success.rest,
	blockSize: '0.4rem',
	borderRadius: vars.radius.full,
	display: 'inline-block',
	inlineSize: '0.4rem',
});

export const subsectionHeader = style({
	alignItems: 'center',
	borderBlockEnd: `1px solid color-mix(in oklab, ${vars.color.border.decorative} 85%, transparent)`,
	display: 'flex',
	gap: vars.space.sp16,
	justifyContent: 'space-between',
	paddingBlock: vars.space.sp12,
	paddingInline: vars.space.sp16,
});

export const settingsRow = style({
	'@media': {
		[mobileMax]: {
			flexWrap: 'wrap',
		},
	},
	borderBlockEnd: `1px solid color-mix(in oklab, ${vars.color.border.decorative} 85%, transparent)`,
	paddingBlock: vars.space.sp12,
	paddingInline: vars.space.sp16,
	selectors: {
		'&:last-child': {
			borderBlockEnd: 'none',
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

export const avatarButton = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	borderRadius: vars.radius.full,
	cursor: 'pointer',
	display: 'inline-flex',
	flexShrink: 0,
	padding: 0,
	selectors: {
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
	},
});

export const menuPopover = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.floating,
	// Portaled outside `rootClassName`, so it cannot inherit theme typography.
	fontFamily: vars.font.family.body,
	minInlineSize: '11rem',
	overflow: 'auto',
	paddingBlock: vars.space.sp4,
	zIndex: 20,
});

export const menu = style({
	outline: 'none',
	padding: 0,
});

export const menuItem = style({
	alignItems: 'center',
	color: vars.color.text.primary,
	cursor: 'default',
	display: 'flex',
	gap: vars.space.sp8,
	outline: 'none',
	paddingBlock: vars.space.sp8,
	paddingInline: vars.space.sp12,
	selectors: {
		'&[data-disabled]': {
			opacity: 0.45,
		},
		'&[data-focused]': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
		},
	},
});

export const valueButton = style({
	'@media': {
		[mobileMax]: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.color.surface.canvas,
	blockSize: vars.controlSize.small,
	border: `1px solid ${vars.color.border.control}`,
	borderRadius: vars.radius.control,
	boxShadow: `inset 0 1px 0 color-mix(in oklab, ${vars.color.text.primary} 3%, transparent)`,
	color: vars.color.text.primary,
	cursor: 'pointer',
	display: 'inline-flex',
	font: 'inherit',
	lineHeight: 1.2,
	maxInlineSize: '100%',
	minInlineSize: '8.5rem',
	overflow: 'hidden',
	paddingInline: vars.space.sp12,
	selectors: {
		'&:hover': {
			borderColor: `color-mix(in oklab, ${vars.color.border.control} 70%, ${vars.color.text.primary})`,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&[data-placeholder]': {
			color: vars.color.text.secondary,
		},
	},
	textAlign: 'start',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const dialogOverlay = style({
	alignItems: 'center',
	background: vars.color.overlay.backdrop,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'fixed',
	zIndex: 40,
});

export const dialogModal = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.overlay,
	// Portaled outside `rootClassName`, so it cannot inherit theme typography.
	fontFamily: vars.font.family.body,
	inlineSize: 'min(24rem, calc(100vw - 2rem))',
	outline: 'none',
});

export const dialog = style({
	display: 'flex',
	flexDirection: 'column',
	gap: vars.space.sp16,
	outline: 'none',
	padding: vars.space.sp24,
});

export const selectTrigger = style({
	'@media': {
		[mobileMax]: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
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
	selectors: {
		'&:hover': {
			borderColor: `color-mix(in oklab, ${vars.color.border.control} 70%, ${vars.color.text.primary})`,
		},
		'&[data-disabled]': {
			opacity: 0.55,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
	},
	textAlign: 'start',
});

export const selectPopover = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.floating,
	// Portaled outside `rootClassName`, so it cannot inherit theme typography.
	fontFamily: vars.font.family.body,
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
			borderRadius: vars.radius.full,
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
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
	selectors: {
		[`${switchRoot}[data-selected] &`]: {
			translate: '1.05rem 0',
		},
	},
	transition: 'translate 120ms ease',
});
