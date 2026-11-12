import { breakpoints } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

// The unnamed query measures the nearest size container, like responsive Box values.
export const sidebar = style({
	inlineSize: '100%',
	'@container': {
		[`(inline-size >= ${breakpoints.bp768}px)`]: {
			inlineSize: '15.25rem',
		},
	},
});
