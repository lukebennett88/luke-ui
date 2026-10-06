import { breakpoints, vars } from '@luke-ui/react/theme';
import { pxToRem } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';

const settingsShellContainer = 'settings-shell';
const shellBp768Up = `${settingsShellContainer} (inline-size >= ${breakpoints.bp768}px)`;
const shellBelowBp768 = `${settingsShellContainer} (inline-size < ${breakpoints.bp768}px)`;
const avatarSize = pxToRem(34);

export const shell = style({
	containerName: settingsShellContainer,
	containerType: 'inline-size',
});

export const sidebarHeader = style({
	paddingInline: vars.space.sp12,
});

export const sidebarScroll = style({
	flexGrow: 1,
	minBlockSize: 0,
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
			fontWeight: vars.font.weight.label,
		},
	},
	textDecoration: 'none',
});

export const menuNavLink = style([
	navLink,
	{
		borderRadius: vars.radius.control,
		color: vars.color.text.primary,
		minBlockSize: '44px',
		paddingBlock: vars.space.sp8,
		paddingInline: vars.space.sp8,
		selectors: {
			'&:hover': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 5%, transparent)`,
			},
			'&[aria-current="page"]': {
				background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
				fontWeight: vars.font.weight.label,
			},
		},
	},
]);

export const main = style({
	'@container': {
		[shellBp768Up]: {
			borderRadius: '12px',
		},
	},
});

export const mainScroll = style({
	overscrollBehavior: 'contain',
});

export const mobileHeaderLink = style({
	alignItems: 'center',
	color: vars.color.text.secondary,
	display: 'inline-flex',
	gap: vars.space.sp4,
	minBlockSize: '44px',
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

export const settingsRow = style({
	'@container': {
		[shellBelowBp768]: {
			flexWrap: 'wrap',
		},
	},
	borderBlockEnd: `1px solid color-mix(in oklab, ${vars.color.border.decorative} 85%, transparent)`,
	selectors: {
		'&:last-child': {
			borderBlockEnd: 'none',
		},
	},
});

export const rowControl = style({
	'@container': {
		[shellBelowBp768]: {
			flexBasis: '100%',
			flexGrow: 1,
			flexShrink: 1,
			justifyContent: 'flex-start',
		},
	},
});

export const avatar = style({
	alignItems: 'center',
	background: `color-mix(in oklab, ${vars.color.text.primary} 10%, transparent)`,
	blockSize: avatarSize,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.full,
	display: 'inline-flex',
	flexShrink: 0,
	inlineSize: avatarSize,
	justifyContent: 'center',
	objectFit: 'cover',
});

export const avatarButton = style({
	appearance: 'none',
	background: 'none',
	blockSize: avatarSize,
	border: 'none',
	borderRadius: vars.radius.full,
	cursor: 'pointer',
	display: 'inline-flex',
	flexShrink: 0,
	inlineSize: avatarSize,
	minBlockSize: 0,
	minInlineSize: 0,
	overflow: 'hidden',
	padding: 0,
	paddingBlock: 0,
	paddingInline: 0,
	position: 'relative',
	transform: 'none',
	selectors: {
		'&:hover': {
			boxShadow: 'none',
			transform: 'none',
		},
		'&[data-hovered]': {
			boxShadow: 'none',
			transform: 'none',
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&[data-pressed]': {
			boxShadow: 'none',
			transform: 'none',
		},
	},
});

export const avatarOverlay = style({
	alignItems: 'center',
	background: 'color-mix(in oklab, black 45%, transparent)',
	borderRadius: vars.radius.full,
	color: vars.color.foreground.neutral.onSolid,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	opacity: 0,
	pointerEvents: 'none',
	position: 'absolute',
	transition: `opacity ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	selectors: {
		[`${avatarButton}:hover &`]: {
			opacity: 1,
		},
		[`${avatarButton}[data-hovered] &`]: {
			opacity: 1,
		},
		[`${avatarButton}[data-focus-visible] &`]: {
			opacity: 1,
		},
		[`${avatarButton}[data-pending] &`]: {
			opacity: 0,
		},
	},
});

export const menuPopover = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.floating,
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
			opacity: vars.interaction.disabledOpacity,
		},
		'&[data-focused]': {
			background: `color-mix(in oklab, ${vars.color.text.primary} 8%, transparent)`,
		},
	},
});

export const emailEditButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: vars.color.surface.canvas,
	blockSize: '1.75rem',
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.full,
	color: vars.color.text.secondary,
	cursor: 'pointer',
	display: 'inline-flex',
	flexShrink: 0,
	inlineSize: '1.75rem',
	justifyContent: 'center',
	padding: 0,
	selectors: {
		'&:hover': {
			borderColor: `color-mix(in oklab, ${vars.color.border.decorative} 70%, ${vars.color.text.primary})`,
			boxShadow: 'none',
			transform: 'none',
		},
		'&[data-disabled]': {
			opacity: vars.interaction.disabledOpacity,
		},
		'&[data-focus-visible]': {
			outline: `2px solid ${vars.color.border.focus}`,
			outlineOffset: '2px',
		},
		'&[data-hovered]': {
			borderColor: `color-mix(in oklab, ${vars.color.border.decorative} 70%, ${vars.color.text.primary})`,
			boxShadow: 'none',
			transform: 'none',
		},
	},
});

export const profileTextField = style({
	'@container': {
		[shellBelowBp768]: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
	minInlineSize: '8.5rem',
});

export const profileFieldShell = style({
	'@container': {
		[shellBelowBp768]: {
			flexWrap: 'wrap',
		},
	},
	alignItems: 'center',
	display: 'flex',
	gap: vars.space.sp12,
	inlineSize: '100%',
	minInlineSize: 0,
});

export const profileTextFieldControl = style({
	'@container': {
		[shellBelowBp768]: {
			inlineSize: '100%',
		},
	},
});

export const dialogOverlay = style({
	alignItems: 'center',
	background: vars.color.overlay.backdrop,
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	overflowY: 'auto',
	padding: vars.space.sp16,
	position: 'fixed',
	zIndex: 40,
});

export const dialogModal = style({
	background: vars.color.surface.floating,
	border: `1px solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	boxShadow: vars.depth.overlay,
	fontFamily: vars.font.family.body,
	inlineSize: 'min(28rem, 100%)',
	maxBlockSize: 'calc(100dvh - 2rem)',
	outline: 'none',
	overflowY: 'auto',
});

export const dialog = style({
	outline: 'none',
	padding: vars.space.sp24,
});

export const settingsSelect = style({
	'@container': {
		[shellBelowBp768]: {
			inlineSize: '100%',
			minInlineSize: 0,
		},
	},
	maxInlineSize: '100%',
	minInlineSize: '8.5rem',
});

export const switchField = style({
	alignItems: 'center',
	display: 'inline-flex',
	flexShrink: 0,
});

export const switchRoot = style({
	alignItems: 'center',
	display: 'inline-flex',
	selectors: {
		'&[data-disabled]': {
			opacity: vars.interaction.disabledOpacity,
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
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
		},
	},
	background: vars.color.foreground.accent.onSolid,
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
	transition: `translate ${vars.motion.duration.feedback} ${vars.motion.easing.standard}`,
});
