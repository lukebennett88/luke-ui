import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Flat group separator; disclosure trigger/chevron styles live in `docs-disclosure.css.ts`. */
export const group = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			selectors: {
				'&:last-child': {
					borderBlockEndWidth: 0,
				},
			},
		},
	},
});
