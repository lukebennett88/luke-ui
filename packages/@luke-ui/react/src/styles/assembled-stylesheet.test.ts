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
	const utilitiesStart = css.indexOf('@layer utilities {', boxStart);
	const recipesBlock = css.slice(recipesStart, boxStart);
	const boxBlock = css.slice(boxStart, utilitiesStart);

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

	it('keeps migrated recipe declarations inside @layer recipes', () => {
		for (const declaration of [
			'text-decoration-color: currentColor',
			'block-size: var(--sizes-icon-size-medium)',
			'font-size: var(--font-sizes-300)',
		]) {
			expect(recipesBlock).toContain(declaration);
			expect(boxBlock).not.toContain(declaration);
		}
	});

	it('keeps loading skeleton masking globals inside @layer recipes', () => {
		const maskingDeclaration = 'overflow: hidden !important';
		expect(recipesBlock).toContain(maskingDeclaration);
		expect(boxBlock).not.toContain(maskingDeclaration);
	});

	it('keeps the recipe compound-variant atomics inside @layer box', () => {
		// The solid/neutral compound variant is the only source of this
		// declaration; its atomic class rides Panda's `utilities` output into
		// `@layer box`. Assert on the declaration, not the derived class name.
		const compoundDeclaration = 'background-color: var(--colors-intent-neutral-surface-solid)';
		expect(boxBlock).toContain(compoundDeclaration);
		expect(recipesBlock).not.toContain(compoundDeclaration);
	});

	it('keeps curated Box utilities inside @layer box', () => {
		expect(boxBlock).toContain('padding: var(--luke-space-400)');
		expect(boxBlock).toContain('display: flex');
		expect(boxBlock).toContain('padding: var(--box-padding-small)');
	});

	it('keeps the public stylesheet within the Box migration budget', () => {
		expect(Buffer.byteLength(css)).toBeLessThan(135_000);
	});

	it('leaves the final utilities layer free of design-system authored rules', () => {
		// Panda utility output is re-layered as `box`; Vanilla Extract no longer
		// emits the retired Sprinkles surface. Consumers own this final layer.
		expect(utilitiesStart).toBe(-1);
	});

	it('keeps Capsize trim compound-variant atomics inside @layer box', () => {
		const compoundDeclaration = 'margin-bottom: var(--luke-font-300-cap-height-trim)';
		expect(boxBlock).toContain(compoundDeclaration);
		expect(recipesBlock).not.toContain(compoundDeclaration);
	});
});
