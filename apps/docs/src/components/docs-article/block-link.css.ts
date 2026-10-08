import { vars } from '@luke-ui/react/theme';
import { style } from '@vanilla-extract/css';

/** Bordered, whole-surface link shared by MDX cards and the previous/next pager. */
export const blockLink = style({
	'@layer': {
		recipes: {
			backgroundColor: vars.color.surface.canvas,
			border: `1px solid ${vars.color.border.decorative}`,
			borderRadius: vars.radius.surface,
			color: vars.color.text.primary,
			display: 'block',
			padding: vars.space.sp16,
			textDecoration: 'none',
			selectors: {
				'&:hover': {
					backgroundColor: vars.color.background.neutral.subtle.hover,
					borderColor: vars.color.border.control,
				},
			},
		},
	},
});
