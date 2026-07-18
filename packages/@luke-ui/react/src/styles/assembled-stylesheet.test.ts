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

// Pins the compound-atomics layer contract (see the header of
// scripts/assemble-stylesheet.ts) against Panda's real generated output, so it
// requires `pnpm generate` to have run first, as the turbo `test` task does.
describe('assembled stylesheet (generated output)', () => {
	const css = assembleStylesheet();
	const recipesStart = css.indexOf('@layer recipes {');
	const boxStart = css.indexOf('@layer box {');
	const recipesBlock = css.slice(recipesStart, boxStart);
	const boxBlock = css.slice(boxStart);

	it('starts with the canonical combined layer-order declaration', () => {
		expect(css.split('\n')[0]).toBe('@layer reset, base, tokens, recipes, box, utilities;');
	});

	it('orders @layer recipes before @layer box', () => {
		expect(recipesStart).toBeGreaterThan(-1);
		expect(boxStart).toBeGreaterThan(recipesStart);
	});

	it('keeps the button recipe base and variant rules inside @layer recipes', () => {
		expect(recipesBlock).toMatch(/\.button\s*\{/);
		expect(recipesBlock).toContain('.button--size_medium');
	});

	it('keeps the recipe compound-variant atomics inside @layer box', () => {
		// The solid/neutral compound variant is the only source of this
		// declaration; its atomic class rides Panda's `utilities` output into
		// `@layer box`. Assert on the declaration, not the derived class name.
		const compoundDeclaration = 'background-color: var(--colors-intent-neutral-surface-solid)';
		expect(boxBlock).toContain(compoundDeclaration);
		expect(recipesBlock).not.toContain(compoundDeclaration);
	});
});
