import { style } from '@vanilla-extract/css';

/**
 * UA list markers and indent. Cluster and Grid have no `listStyle` prop, and some app code still
 * styles lists directly, so this class resets them. Box and Stack use `listStyle="none"`.
 */
export const plainList = style({
	'@layer': {
		components: {
			listStyle: 'none',
		},
	},
});
