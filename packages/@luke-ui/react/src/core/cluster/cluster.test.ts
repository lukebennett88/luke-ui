import { assertType, test } from 'vite-plus/test';
import type { ClusterProps } from './cluster.js';

test('Cluster rejects the props it does not support', () => {
	// @ts-expect-error — responsive gaps require an initial value
	assertType<ClusterProps>({ gap: { bp768: 'space.16' } });
	// @ts-expect-error — Cluster does not expose Box appearance utilities
	assertType<ClusterProps>({ backgroundColor: 'surface.base', gap: 'space.8' });
	// @ts-expect-error — Cluster has no display prop
	assertType<ClusterProps>({ display: 'grid', gap: 'space.8' });
});

test('Cluster does not accept listStyle', () => {
	// @ts-expect-error — listStyle is only available on Box and Stack
	assertType<ClusterProps>({ listStyle: 'none', gap: 'space.8' });
});
