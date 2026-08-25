/** Guards IconButton's public props against accepting full-width layout. */

import { expectTypeOf, test } from 'vite-plus/test';
import type { IconButtonProps } from './icon-button.js';

test('IconButtonProps does not accept isBlock', () => {
	expectTypeOf<IconButtonProps>().not.toHaveProperty('isBlock');
	expectTypeOf<IconButtonProps>().toHaveProperty('appearance');
	expectTypeOf<IconButtonProps>().toHaveProperty('tone');
});
