import { describe, expect, it } from 'vite-plus/test';
import { assembleStylesheet } from '../../scripts/assemble-stylesheet.js';

// Reads Panda's split output from disk, so `pnpm run generate:panda` must have
// run first (the turbo/test graphs depend on `generate`).
describe('assembled stylesheet', () => {
	const css = assembleStylesheet();

	it('starts with the canonical combined layer-order declaration', () => {
		expect(css.split('\n')[0]).toBe('@layer reset, base, tokens, recipes, box, utilities;');
	});

	it('contains a @layer box block with a real token-referencing box rule', () => {
		expect(css).toContain('@layer box {');
		const boxBlock = css.slice(css.indexOf('@layer box {'));
		expect(boxBlock).toContain('var(--spacing-');
	});

	it('leaves no @layer utilities block from the renamed box source', () => {
		expect(css).not.toContain('@layer utilities');
	});
});
