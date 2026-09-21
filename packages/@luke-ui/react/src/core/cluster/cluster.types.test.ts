/**
 * Compile-time guards on the public Cluster prop contract.
 *
 * The same fence Stack keeps: appearance utilities stay out, the child-layout algorithm is the
 * component's, and a responsive gap needs an `initial` value.
 */

import { expect, test } from 'vite-plus/test';
import type { ClusterProps } from './cluster.js';

// @ts-expect-error — responsive gaps require an initial value
const responsiveGapWithoutInitial: ClusterProps = { gap: { bp768: 'sp16' } };
// @ts-expect-error — Cluster does not expose Box appearance utilities
const rejectedAppearance: ClusterProps = { backgroundColor: 'surface.resting', gap: 'sp8' };
// @ts-expect-error — Cluster owns its child-layout algorithm
const rejectedLayout: ClusterProps = { display: 'grid', gap: 'sp8' };

test('Cluster rejects the props it does not support', () => {
	expect([responsiveGapWithoutInitial, rejectedAppearance, rejectedLayout]).toHaveLength(3);
});
