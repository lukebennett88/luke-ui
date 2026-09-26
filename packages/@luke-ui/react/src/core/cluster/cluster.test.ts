import { assertType, test } from 'vite-plus/test';
import type { ClusterProps } from './cluster.js';

test('Cluster rejects the props it does not support', () => {
	// @ts-expect-error — responsive gaps require an initial value
	assertType<ClusterProps>({ gap: { bp768: 'sp16' } });
	// @ts-expect-error — Cluster does not expose Box appearance utilities
	assertType<ClusterProps>({ backgroundColor: 'surface.canvas', gap: 'sp8' });
	// @ts-expect-error — Cluster has no display prop
	assertType<ClusterProps>({ display: 'grid', gap: 'sp8' });
});

test('Cluster accepts flexWrap values and responsive objects', () => {
	assertType<ClusterProps>({ flexWrap: 'nowrap' });
	assertType<ClusterProps>({ flexWrap: 'wrap-reverse' });
	assertType<ClusterProps>({ flexWrap: { bp768: 'nowrap' } });
});
