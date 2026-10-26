/** Names the adaptive interaction tint states and private solid-fill fallback values. */

/** Hover and pressed strengths of the one adaptive tint pair per colour mode. */
export type InteractionTintState = 'hover' | 'pressed';

/** Names the public mode-scoped tint token for CSS recipes. */
export function interactionTintVarName(state: InteractionTintState): string {
	return `--luke-interaction-tint-${state}`;
}

/** Semantic tones whose on-solid text needs an opaque adaptive fallback chip. */
export type SolidStateTone = 'neutral' | 'danger';

/** Names the private opaque chip values used by low Buttons on solid fills. */
export function solidStateFillVarName(tone: SolidStateTone, state: InteractionTintState): string {
	return `--luke-internal-solid-state-fill-${tone}-${state}`;
}

/** Names the foreground paired with a private opaque chip. */
export function solidStateTextVarName(tone: SolidStateTone): string {
	return `--luke-internal-solid-state-text-${tone}`;
}

/** Theme-generated opaque fill used only when adaptive feedback sits over a solid surface. */
export function solidStateGeneratedFillVarName(
	tone: SolidStateTone,
	state: InteractionTintState,
): string {
	return `--luke-internal-generated-solid-state-fill-${tone}-${state}`;
}

/** Theme-generated foreground paired with a solid-state fallback chip. */
export function solidStateGeneratedTextVarName(tone: SolidStateTone): string {
	return `--luke-internal-generated-solid-state-text-${tone}`;
}
