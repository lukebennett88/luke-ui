import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

export const docsRoot = style({
	'@layer': {
		base: {
			vars: { '--docs-text-color': vars.color.text.primary },
		},
	},
});
