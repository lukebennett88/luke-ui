import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { assembleStylesheet } from '../../scripts/assemble-stylesheet.js';

describe('assembled stylesheet', () => {
	const css = assembleStylesheet({
		pandaStylesDir: fileURLToPath(new URL('./fixtures/panda-styles', import.meta.url)),
	});

	it('starts with the canonical combined layer-order declaration', () => {
		expect(css.split('\n')[0]).toBe('@layer reset, base, tokens, recipes, box, utilities;');
	});

	it('contains a @layer box block with a real token-referencing box rule', () => {
		expect(css).toContain('@layer box {');
		const boxBlock = css.slice(css.indexOf('@layer box {'));
		expect(boxBlock).toContain('var(--spacing-');
	});

	it('includes the config recipe output inside @layer recipes', () => {
		expect(css).toMatch(/@layer recipes\s*\{[\s\S]*?\.recipe-fixture\s*\{\s*color:\s*blue;\s*\}/);
	});

	it('includes the token alias bridge inside @layer tokens', () => {
		expect(css).toMatch(
			/@layer tokens\s*\{[\s\S]*?\.token-fixture\s*\{\s*--colors-fixture:\s*var\(--luke-fixture\);\s*\}/,
		);
	});

	it('leaves no @layer utilities block from the renamed box source', () => {
		expect(css).not.toContain('@layer utilities');
	});
});
