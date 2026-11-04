import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const frame = style({
	'@layer': {
		components: {
			blockSize: '12rem',
			position: 'relative',
		},
	},
});

export const iframe = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.base,
			border: 0,
			blockSize: '100%',
			display: 'block',
			inlineSize: '100%',
		},
	},
});

export const error = style({
	'@layer': {
		components: {
			backgroundColor: vars.color.background.surface.base,
			color: vars.color.foreground.danger.rest,
			fontFamily: vars.font.family.code,
			fontSize: vars.font.caption.fontSize,
			inset: 0,
			lineHeight: vars.font.caption.lineHeight,
			overflow: 'auto',
			padding: vars.space['16'],
			position: 'absolute',
			whiteSpace: 'pre-wrap',
		},
	},
});
