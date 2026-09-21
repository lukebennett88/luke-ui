import { expect, test } from 'vite-plus/test';
import type { ContainerProps } from './container.js';

// @ts-expect-error — Container requires a maximum inline size
const missingMaximum: ContainerProps = {};
// @ts-expect-error — Container has no inlineSize prop
const rejectedInlineSize: ContainerProps = { inlineSize: '50%', maxInlineSize: 'ct672' };
const rejectedAppearance: ContainerProps = {
	// @ts-expect-error — Container does not expose Box appearance utilities
	backgroundColor: 'surface.resting',
	maxInlineSize: 'ct672',
};
// @ts-expect-error — Container has no display prop
const rejectedLayout: ContainerProps = { display: 'grid', maxInlineSize: 'ct672' };

test('Container rejects the props it does not support', () => {
	expect([missingMaximum, rejectedInlineSize, rejectedAppearance, rejectedLayout]).toHaveLength(4);
});
