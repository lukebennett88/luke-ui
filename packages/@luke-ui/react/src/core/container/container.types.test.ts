/**
 * Compile-time guards on the public Container prop contract.
 *
 * `maxInlineSize` being required is the whole point of the component, and a Container fills the
 * inline size it is given rather than taking one.
 */

import { expect, test } from 'vite-plus/test';
import type { ContainerProps } from './container.js';

// @ts-expect-error — Container requires a maximum inline size
const missingMaximum: ContainerProps = {};
// @ts-expect-error — Container fills its available inline size
const rejectedInlineSize: ContainerProps = { inlineSize: '50%', maxInlineSize: 'ct672' };
const rejectedAppearance: ContainerProps = {
	// @ts-expect-error — Container does not expose Box appearance utilities
	backgroundColor: 'surface.resting',
	maxInlineSize: 'ct672',
};
// @ts-expect-error — Container owns its child-layout algorithm
const rejectedLayout: ContainerProps = { display: 'grid', maxInlineSize: 'ct672' };

test('Container rejects the props it does not support', () => {
	expect([missingMaximum, rejectedInlineSize, rejectedAppearance, rejectedLayout]).toHaveLength(4);
});
