import type { CSSProperties } from 'react';
import { vars } from '../theme/contract.css.js';

export { mergeProps } from '../shared/utils/merge-props.js';
export { cx, pxToRem } from '../shared/utils/utils.js';

/**
 * Returns a theme-aware hover or pressed background layer for application-owned controls. Spread
 * the result into the state rule's style, and retain the element's resting `backgroundColor` so the
 * tint composes over transparent and opaque fills.
 */
export function interactionState(state: 'hover' | 'pressed'): CSSProperties {
	return {
		backgroundImage:
			'linear-gradient(var(--luke-interaction-state-layer), var(--luke-interaction-state-layer))',
		'--luke-interaction-state-layer': vars.interaction.tint[state],
	} as CSSProperties;
}
