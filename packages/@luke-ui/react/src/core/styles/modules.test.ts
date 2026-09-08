import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';

const modulesSource = new URL('./modules.css.ts', import.meta.url);

describe('modules.css.ts import order', () => {
	it('keeps text/recipe.css before kbd/recipe.css and code/recipe.css', async () => {
		// `text` must precede `kbd` and `code`, or equal-specificity `inherit` wins. Alphabetical
		// sorting would break that order.
		const source = await readFile(modulesSource, 'utf8');

		const textIndex = source.indexOf("'../text/recipe.css.js'");
		const kbdIndex = source.indexOf("'../kbd/recipe.css.js'");
		const codeIndex = source.indexOf("'../code/recipe.css.js'");

		expect(textIndex).toBeGreaterThanOrEqual(0);
		expect(kbdIndex).toBeGreaterThanOrEqual(0);
		expect(codeIndex).toBeGreaterThanOrEqual(0);
		expect(textIndex).toBeLessThan(kbdIndex);
		expect(textIndex).toBeLessThan(codeIndex);
	});
});
