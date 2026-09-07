import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';

const modulesSource = new URL('./modules.css.ts', import.meta.url);

describe('modules.css.ts import order', () => {
	it('keeps text/recipe.css before kbd/recipe.css and code/recipe.css', async () => {
		// `textRecipe`'s `shouldInheritFont` variant sets `fontFamily`/`fontSize`/`fontWeight` to
		// `inherit`, while `kbdRecipe`'s and `codeRecipe`'s base styles set those same properties to
		// concrete values. Both land in the `recipes` layer at equal specificity, so the tie is
		// broken by stylesheet source order: `text` must be imported first or `kbd`/`code` lose the
		// values they set to `text`'s `inherit`. Sorting this file's imports alphabetically would
		// put `code` before `text` and silently break that.
		const source = await readFile(modulesSource, 'utf8');

		// Matches the literal import specifiers, not the doc comment above them (which names the
		// same paths in prose), so this only ever reflects the real import order.
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
