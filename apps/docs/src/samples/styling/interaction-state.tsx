import { vars } from '@luke-ui/react/theme';
import { interactionState } from '@luke-ui/react/utils';
import { style } from '@vanilla-extract/css';

const interactionButton = style({
	backgroundColor: vars.color.background.neutral.subtle,
	color: vars.color.foreground.primary,
	selectors: {
		'&:hover': interactionState('hover'),
		'&:active': interactionState('pressed'),
	},
});

export function InteractionStateExample() {
	return <button className={interactionButton}>Hover state</button>;
}
