import { typedEntries } from '../../shared/utils/utils.js';
import { vars } from '../../theme/contract.css.js';
import type { SpaceStep } from '../../theme/contract.js';

/** Public spacing tokens backed by the fixed variable scale. */
export type SpaceToken = `space.${SpaceStep}`;

/** Maps public spacing tokens to their CSS variable references. Zero is not a space token. */
export const spaceTokens = {} as Record<SpaceToken, string>;
for (const [step, variable] of typedEntries(vars.space)) {
	spaceTokens[`space.${step}`] = variable;
}

export function isSpaceToken(value: string | number): value is SpaceToken {
	return Object.hasOwn(spaceTokens, value);
}
