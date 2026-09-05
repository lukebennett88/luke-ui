import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { generateFontMetricConsts } from './generate-font-metric-consts.js';

test('the committed font-metric-scale.stylex.ts matches what the generator produces', async () => {
	const committed = await readFile(
		new URL('../src/theme/font-metric-scale.stylex.ts', import.meta.url),
		'utf8',
	);

	expect(committed).toBe(generateFontMetricConsts());
});
