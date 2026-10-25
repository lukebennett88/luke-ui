/**
 * Names the private adaptive interaction tint variables. The theme stylesheet writes them in each
 * mode rule, and the Button state layer reads them. They are not part of the public `vars` contract;
 * #927 decides how consumers get them.
 *
 * This module must keep importing nothing but types, so recipes can use it without pulling in theme
 * generation.
 */

/** Hover and pressed strengths of the one adaptive tint pair per colour mode. */
export type InteractionTintState = 'hover' | 'pressed';

/**
 * Returns the private custom property name for one tint, for example
 * `--luke-internal-interaction-tint-hover`.
 */
export function interactionTintVarName(state: InteractionTintState): string {
	return `--luke-internal-interaction-tint-${state}`;
}
