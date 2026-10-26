import { interactionState } from '@luke-ui/react/utils';

const hoverState = interactionState('hover');
const interactionStateLayerProperty = Object.keys(hoverState).find((property) =>
	property.startsWith('--'),
);

if (!hoverState.backgroundImage || !interactionStateLayerProperty) {
	throw new Error('Expected interactionState to return its background layer and registered tint.');
}

export const interactionStateBackgroundImage = hoverState.backgroundImage;
export const interactionStateTransitionProperty = interactionStateLayerProperty;
