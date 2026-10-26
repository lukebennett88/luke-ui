import { createGlobalVar } from '@vanilla-extract/css';
import { INTERACTION_STATE_LAYER_PROPERTY } from './interaction-state-layer.js';

/**
 * Registered, non-inheriting state-layer colour. Recipes that paint it must list
 * {@link INTERACTION_STATE_LAYER_PROPERTY} in their `transition-property` list.
 */
export const interactionStateLayer = createGlobalVar(INTERACTION_STATE_LAYER_PROPERTY, {
	inherits: false,
	initialValue: 'transparent',
	syntax: '<color>',
});
