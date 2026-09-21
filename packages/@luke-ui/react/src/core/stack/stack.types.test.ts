/**
 * Compile-time guards on the public Stack prop contract.
 *
 * Stack is a layout primitive that deliberately withholds most of Box: no appearance utilities, and
 * no way to override the child-layout algorithm it owns.
 */

import { expect, test } from 'vite-plus/test';
import type { StackProps } from './stack.js';

// @ts-expect-error — responsive gaps require an initial value
const responsiveGapWithoutInitial: StackProps = { gap: { bp768: 'sp16' } };
// @ts-expect-error — Stack does not expose Box appearance utilities
const rejectedAppearance: StackProps = { backgroundColor: 'surface.resting' };
// @ts-expect-error — Stack owns its child-layout algorithm
const rejectedLayout: StackProps = { display: 'grid' };

test('Stack rejects the props it does not support', () => {
	expect([responsiveGapWithoutInitial, rejectedAppearance, rejectedLayout]).toHaveLength(3);
});
