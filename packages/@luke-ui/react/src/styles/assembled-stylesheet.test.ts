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

	it('re-layers the isolated source recipe output as recipes', () => {
		expect(css).toContain('@layer recipes {\n.recipe-fixture { color: blue; }\n}');
	});

	it('leaves no @layer utilities block from the renamed box source', () => {
		expect(css).not.toContain('@layer utilities');
	});
});
