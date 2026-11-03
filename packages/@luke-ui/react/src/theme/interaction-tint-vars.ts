/** Names the adaptive interaction tint states. */

/** Hover and pressed strengths of the one adaptive tint pair per colour mode. */
export type InteractionTintState = 'hover' | 'pressed';

/** Names the public mode-scoped tint token for CSS recipes. */
export function interactionTintVarName(state: InteractionTintState): string {
	return `--luke-interaction-tint-${state}`;
}
