import { expect, test } from 'vite-plus/test';
import { ICON_SIZES } from './icon-sizing.js';

test('icon sizes keep their current rem dimensions', () => {
	expect(ICON_SIZES).toEqual({ xsmall: '1rem', small: '1.25rem', medium: '1.5rem', large: '2rem' });
});
