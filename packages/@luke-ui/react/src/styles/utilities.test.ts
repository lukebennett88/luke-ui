import { expect, test } from 'vite-plus/test';
import { createSprinkles } from './utilities.css.js';

test('exposes the responsive layout-only property surface', () => {
	expect(createSprinkles.properties).toContain('display');
	expect(createSprinkles.properties).toContain('gridColumn');
	expect(createSprinkles.properties).not.toContain('color');
	expect(createSprinkles.properties).not.toContain('backgroundColor');
	expect(createSprinkles.properties).not.toContain('fontSize');
});
