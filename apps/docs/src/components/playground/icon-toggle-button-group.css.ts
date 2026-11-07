import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/**
 * Marks the selected toggle with a control-border ring over the recipe's pressed fill. That fill is
 * a faint tint, about 1.4:1 against its neighbours in dark mode. The ring uses `border.control.rest`,
 * which the theme gates at 3:1, so the cue does not rest on the tint. It replaces Tactile's pressed
 * inset, because `shadow.inset` is `none` in Paper and would void a combined value.
 */
export const selectedToggle = style({
	'@layer': {
		components: {
			selectors: {
				'&[data-selected]': {
					boxShadow: `inset 0 0 0 1px ${vars.color.border.control.rest}`,
				},
			},
		},
	},
});
