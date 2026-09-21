import { assertType, test } from 'vite-plus/test';
import type { ContainerProps } from './container.js';

test('Container rejects the props it does not support', () => {
	// @ts-expect-error — Container requires a maximum inline size
	assertType<ContainerProps>({});
	// @ts-expect-error — Container has no inlineSize prop
	assertType<ContainerProps>({ inlineSize: '50%', maxInlineSize: 'ct672' });
	assertType<ContainerProps>({
		// @ts-expect-error — Container does not expose Box appearance utilities
		backgroundColor: 'surface.canvas',
		maxInlineSize: 'ct672',
	});
	// @ts-expect-error — Container has no display prop
	assertType<ContainerProps>({ display: 'grid', maxInlineSize: 'ct672' });
});
