import { breakpoints, vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const statusLine = style({
	color: vars.color.foreground.secondary,
	margin: 0,
});

export const note = style({
	display: 'grid',
	gap: '6px',
});

export const noteLabel = style({
	display: 'flex',
	fontWeight: vars.font.weight.label,
	gap: vars.space['8'],
	justifyContent: 'space-between',
});

export const noteHint = style({
	color: vars.color.foreground.secondary,
	fontWeight: vars.font.weight.body,
});

/** Luke UI has no multi-line field, so the note is a React Aria text area styled like its fields. */
export const textArea = style({
	background: vars.color.background.surface.base,
	border: `${vars.borderWidth.thin} solid ${vars.color.border.control.rest}`,
	borderRadius: vars.radius.control,
	boxSizing: 'border-box',
	color: vars.color.foreground.primary,
	font: 'inherit',
	inlineSize: '100%',
	lineHeight: 1.45,
	minBlockSize: '104px',
	paddingBlock: '10px',
	paddingInline: vars.space['12'],
	resize: 'vertical',
	selectors: {
		'&::placeholder': {
			color: vars.color.foreground.secondary,
		},
		'&[data-hovered]': {
			borderColor: vars.color.border.control.hover,
		},
		'&[data-focused]': {
			outline: `2px solid ${vars.color.focus}`,
			outlineOffset: '-1px',
		},
		'&[aria-invalid="true"]': {
			borderColor: vars.color.border.danger.strong,
		},
		'&[data-disabled]': {
			opacity: vars.interaction.disabledOpacity,
		},
	},
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			// 16px keeps iOS from zooming into the field.
			fontSize: vars.font.body.fontSize,
			minBlockSize: '168px',
		},
	},
});

export const noteMeta = style({
	color: vars.color.foreground.secondary,
	minBlockSize: '20px',
});

export const error = style({
	color: vars.color.foreground.danger.rest,
});

export const actions = style({
	'@container': {
		[`(inline-size < ${breakpoints.bp768}px)`]: {
			display: 'grid',
			gridTemplateColumns: '1fr',
		},
	},
});

export const notes = style({
	margin: 0,
	paddingInlineStart: 0,
	listStyle: 'none',
});
