import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const page = style({
	blockSize: '100%',
	overflowY: 'auto',
});

export const list = style({
	display: 'grid',
	gap: vars.space['8'],
	listStyle: 'none',
	margin: 0,
	padding: 0,
});

export const row = style({
	alignItems: 'center',
	background: vars.color.background.surface.base,
	border: `${vars.borderWidth.thin} solid ${vars.color.border.decorative}`,
	borderRadius: vars.radius.surface,
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space['16'],
	justifyContent: 'space-between',
	padding: vars.space['16'],
});
