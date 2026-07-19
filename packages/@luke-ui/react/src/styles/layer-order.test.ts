import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { lukeLayerOrder } from './layer-order.js';

describe('shipped layer order', () => {
	it('is the first statement in the Panda stylesheet', () => {
		const stylesheetPath = fileURLToPath(new URL('../../dist/stylesheet.css', import.meta.url));
		const firstLine = readFileSync(stylesheetPath, 'utf8').split('\n')[0];

		expect(firstLine).toBe(`@layer ${lukeLayerOrder.join(', ')};`);
	});
});
