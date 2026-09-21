import { assertType, test } from 'vite-plus/test';
import type { StackProps } from './stack.js';

test('Stack rejects the props it does not support', () => {
	// @ts-expect-error — responsive gaps require an initial value
	assertType<StackProps>({ gap: { bp768: 'sp16' } });
	// @ts-expect-error — Stack does not expose Box appearance utilities
	assertType<StackProps>({ backgroundColor: 'surface.canvas' });
	// @ts-expect-error — Stack has no display prop
	assertType<StackProps>({ display: 'grid' });
});
