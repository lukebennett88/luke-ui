import { breakpoints } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

// Box limits `maxInlineSize` to fixed keywords and container tokens, so the home page's install
// command caps its width here. An unnamed `@container` query measures the root, like Box's own
// breakpoints.
export const installCommand = style({
	'@layer': {
		components: {
			maxInlineSize: '100%',
			'@container': {
				[`(inline-size >= ${breakpoints.bp768}px)`]: {
					maxInlineSize: '28rem',
				},
			},
		},
	},
});
