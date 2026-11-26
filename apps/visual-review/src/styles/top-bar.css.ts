import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { appVars } from './app-tokens.css.js';

/** The sticky chrome above the inset page surface. */
export const topBar = style({
	alignItems: 'center',
	background: vars.color.background.surface.subdued,
	blockSize: appVars.topBarHeight,
	boxSizing: 'border-box',
	gap: vars.space['16'],
	insetBlockStart: 0,
	paddingInline: `${vars.space['8']} ${vars.space['12']}`,
	position: 'sticky',
	zIndex: 30,
});
