import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';
import { topBar } from './styles/top-bar.css.js';

export const header = style([
	topBar,
	{
		paddingInline: `${vars.space['16']} ${vars.space['12']}`,
	},
]);
