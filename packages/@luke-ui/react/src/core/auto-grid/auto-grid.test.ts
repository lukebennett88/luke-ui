import { assertType, test } from 'vite-plus/test';
import type { AutoGridProps } from './auto-grid.js';

test('AutoGrid rejects the props it does not support', () => {
	// @ts-expect-error — responsive minColumnInlineSize requires an initial value
	assertType<AutoGridProps>({ minColumnInlineSize: { bp768: '12rem' } });
	// @ts-expect-error — AutoGrid does not expose Box appearance utilities
	assertType<AutoGridProps>({
		backgroundColor: 'surface.canvas',
		minColumnInlineSize: '12rem',
	});
	// @ts-expect-error — AutoGrid has no display prop
	assertType<AutoGridProps>({ display: 'flex', minColumnInlineSize: '12rem' });
});
