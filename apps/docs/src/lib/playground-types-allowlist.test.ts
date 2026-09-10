import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vite-plus/test';

const scriptPath = resolve(import.meta.dirname, '../../scripts/generate-playground-types.ts');

test('Monaco playground types omit styling-engine packages from the allowlist', () => {
	const source = readFileSync(scriptPath, 'utf8');

	expect(source).not.toContain("'@vanilla-extract/recipes'");
	expect(source).not.toContain("'@vanilla-extract/css'");
	expect(source).not.toContain("'@luke-ui/rainbow-sprinkles'");
	expect(source).toContain('Styling-engine packages stay out of this list');
});
