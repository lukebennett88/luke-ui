/**
 * Compile-time guards on the public Button prop contract.
 *
 * Only rejections live here. That a valid prop combination compiles is already proven by
 * `check:types` over the source and the examples; that an invalid one is *rejected* is not — widen
 * `tone` to `string` and normal compilation still succeeds while the guarantee disappears. Each
 * `@ts-expect-error` below fails the typecheck the moment its contract stops holding.
 */

import { expect, test } from 'vite-plus/test';
import type { ButtonProps } from './button.js';

// @ts-expect-error — text Buttons wrap and do not use control sizing
const textButtonSize: ButtonProps = { appearance: 'text', size: 'small' };
// @ts-expect-error — accent is not a consumer-selectable tone
const accentLowButton: ButtonProps = { tone: 'accent', prominence: 'low' };
// @ts-expect-error — critical text Buttons do not have high prominence
const criticalHighText: ButtonProps = {
	appearance: 'text',
	tone: 'critical',
	prominence: 'high',
};

test('Button rejects the prop combinations it does not support', () => {
	// The assertions are the `@ts-expect-error` comments above, checked by `check:types`.
	expect([textButtonSize, accentLowButton, criticalHighText]).toHaveLength(3);
});
