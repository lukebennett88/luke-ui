import { expect, test } from 'vite-plus/test';
import type { ClusterProps } from './cluster.js';

// @ts-expect-error — responsive gaps require an initial value
const responsiveGapWithoutInitial: ClusterProps = { gap: { bp768: 'sp16' } };
// @ts-expect-error — Cluster does not expose Box appearance utilities
const rejectedAppearance: ClusterProps = { backgroundColor: 'surface.resting', gap: 'sp8' };
// @ts-expect-error — Cluster has no display prop
const rejectedLayout: ClusterProps = { display: 'grid', gap: 'sp8' };

test('Cluster rejects the props it does not support', () => {
	expect([responsiveGapWithoutInitial, rejectedAppearance, rejectedLayout]).toHaveLength(3);
});
