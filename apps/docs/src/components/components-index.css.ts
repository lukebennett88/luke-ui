import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const subsequentGroup = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
			paddingBlockStart: vars.space.sp40,
		},
	},
});
