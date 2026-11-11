import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

// DS gap: Box fills cannot follow a state selector, and `backgroundColor` props lose to the
// disclosure trigger's reset. The trigger supplies the hover fill, so the expanded fill skips it.
export const groupButtonExpanded = style({
	'@layer': {
		components: {
			selectors: {
				'&[aria-expanded="true"]:not(:hover)': {
					backgroundColor: vars.color.background.surface.subdued,
				},
			},
		},
	},
});
