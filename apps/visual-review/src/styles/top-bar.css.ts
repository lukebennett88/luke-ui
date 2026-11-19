import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { appVars } from './app-tokens.css.js';

/**
 * The bar across the top of every page. It shares the section headers' tone, and one hairline keeps
 * it apart from a header stuck beneath it.
 */
export const topBar = style({
	alignItems: 'center',
	background: vars.color.background.surface.subdued,
	blockSize: appVars.topBarHeight,
	boxShadow: `0 ${vars.borderWidth.thin} 0 ${vars.color.border.decorative}`,
	boxSizing: 'border-box',
	gap: vars.space['16'],
	insetBlockStart: 0,
	paddingInline: `${vars.space['8']} ${vars.space['12']}`,
	position: 'sticky',
	zIndex: 30,
});
