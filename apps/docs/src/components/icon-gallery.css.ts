import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';
import {
	interactionStateBackgroundImage,
	interactionStateTransitionProperty,
} from './interaction-state';

/** Collapsed grid cell borders; Stack/Grid own the internal layout. */
export const cell = style({
	'@layer': {
		components: {
			borderBlockEndColor: vars.color.border.decorative,
			borderBlockEndStyle: 'solid',
			borderBlockEndWidth: '1px',
			borderInlineEndColor: vars.color.border.decorative,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
			marginBlockEnd: '-1px',
			marginInlineEnd: '-1px',
		},
	},
});

/** Top rule only; Grid owns the two-column copy footer. */
export const copyRow = style({
	'@layer': {
		components: {
			borderBlockStartColor: vars.color.border.decorative,
			borderBlockStartStyle: 'solid',
			borderBlockStartWidth: '1px',
		},
	},
});

/**
 * RAC/browser button reset for the copy footer. Layout (flex, gap, min sizes) lives on Box.
 * DS gap: Luke `Button` always draws control chrome; hover/focus fills need state selectors.
 */
export const copyButton = style({
	'@layer': {
		components: {
			backgroundColor: 'transparent',
			backgroundImage: interactionStateBackgroundImage,
			borderStyle: 'none',
			color: vars.color.foreground.secondary,
			transition: `${interactionStateTransitionProperty} ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}, color ${vars.motion.feedback.duration} ${vars.motion.feedback.easing}`,
			whiteSpace: 'nowrap',
			selectors: {
				'&:hover, &:focus-visible': {
					...interactionState('hover'),
					color: vars.color.foreground.primary,
				},
				'&:focus-visible': {
					outline: `2px solid ${vars.color.focus}`,
					outlineOffset: '-2px',
				},
			},
			'@media': {
				'(prefers-reduced-motion: reduce)': {
					transition: 'none',
				},
			},
		},
	},
});

export const copyButtonDivider = style({
	'@layer': {
		components: {
			borderInlineEndColor: vars.color.border.decorative,
			borderInlineEndStyle: 'solid',
			borderInlineEndWidth: '1px',
		},
	},
});
