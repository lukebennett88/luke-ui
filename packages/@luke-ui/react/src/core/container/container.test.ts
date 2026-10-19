import { assertType, test } from 'vite-plus/test';
import type { ContainerProps } from './container.js';

test('Container rejects the props it does not support', () => {
	// @ts-expect-error — Container requires a maximum inline size
	assertType<ContainerProps>({});
	// @ts-expect-error — Container has no inlineSize prop
	assertType<ContainerProps>({ inlineSize: '50%', maxInlineSize: 'container.672' });
	assertType<ContainerProps>({
		// @ts-expect-error — Container does not expose Box appearance utilities
		backgroundColor: 'surface.base',
		maxInlineSize: 'container.672',
	});
	// @ts-expect-error — Container has no display prop
	assertType<ContainerProps>({ display: 'grid', maxInlineSize: 'container.672' });
});

test('Container accepts only approved presets while style accepts custom widths', () => {
	assertType<ContainerProps>({ maxInlineSize: 'container.448', style: { maxInlineSize: '80ch' } });
	// @ts-expect-error — arbitrary lengths belong in style
	assertType<ContainerProps>({ maxInlineSize: '80ch' });
	// @ts-expect-error — physical keys are not container presets
	assertType<ContainerProps>({ maxInlineSize: 'px672' });
});
