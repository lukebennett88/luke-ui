import { expectTypeOf, test } from 'vite-plus/test';
import type { ClusterProps } from './cluster.js';

test('Cluster requires gap and accepts the zero spacing key', () => {
	const withGap: ClusterProps = { gap: 'sp16' };
	const withZeroGap: ClusterProps = { gap: '0' };
	const withResponsiveGap: ClusterProps = { gap: { initial: 'sp8', bp768: 'sp16' } };
	const withSparseResponsiveAlignment: ClusterProps = {
		alignItems: { bp768: 'stretch' },
		gap: 'sp8',
		justifyContent: { bp768: 'space-between' },
	};
	const withRootLayout: ClusterProps = {
		gap: 'sp8',
		gridColumn: '1 / -1',
		maxInlineSize: '40rem',
		overflow: 'hidden',
		paddingBlock: 'sp16',
	};
	expectTypeOf<typeof withGap>().toExtend<ClusterProps>();
	expectTypeOf<typeof withZeroGap>().toExtend<ClusterProps>();
	expectTypeOf<typeof withResponsiveGap>().toExtend<ClusterProps>();
	expectTypeOf<typeof withSparseResponsiveAlignment>().toExtend<ClusterProps>();
	expectTypeOf<typeof withRootLayout>().toExtend<ClusterProps>();

	// @ts-expect-error — gap is required
	const missingGap: ClusterProps = {};
	// @ts-expect-error — gap cannot be undefined
	const undefinedGap: ClusterProps = { gap: undefined };
	// @ts-expect-error — responsive gaps require an initial value
	const responsiveGapWithoutInitial: ClusterProps = { gap: { bp768: 'sp16' } };
	// @ts-expect-error — Cluster does not expose Box appearance utilities
	const rejectedAppearance: ClusterProps = { backgroundColor: 'surface.resting', gap: 'sp8' };
	// @ts-expect-error — Cluster owns its child-layout algorithm
	const rejectedLayout: ClusterProps = { display: 'grid', gap: 'sp8' };

	void withGap;
	void withZeroGap;
	void missingGap;
	void undefinedGap;
	void responsiveGapWithoutInitial;
	void rejectedAppearance;
	void rejectedLayout;
});
