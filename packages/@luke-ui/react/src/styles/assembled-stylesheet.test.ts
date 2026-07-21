import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';
import { assembleStylesheet, hoistGlobalLayers } from '../../scripts/assemble-stylesheet.js';

/**
 * Concatenate every top-level `@layer <layerName> { ... }` block's inner
 * content, matched with brace-depth counting rather than a positional slice.
 * Real output has several `@layer recipes` / `@layer recipes.slots` blocks
 * (one per Panda recipe file) plus the hoisted global-styles recipes block,
 * so a single `indexOf(...)` pair cannot isolate "the recipes content" — this
 * walks every occurrence instead.
 */
function extractLayerBlocks(css: string, layerName: string): string {
	const pattern = new RegExp(`@layer\\s+${layerName.replace('.', '\\.')}\\s*\\{`, 'g');
	const blocks: Array<string> = [];
	for (const match of css.matchAll(pattern)) {
		const start = (match.index ?? 0) + match[0].length;
		let depth = 1;
		let index = start;
		while (depth > 0 && index < css.length) {
			if (css[index] === '{') depth++;
			else if (css[index] === '}') depth--;
			index++;
		}
		blocks.push(css.slice(start, index - 1));
	}
	return blocks.join('\n\n');
}

describe('hoistGlobalLayers', () => {
	it('hoists nested reset/base/recipes layers to the top level in canonical order', () => {
		const input = `
			@layer base {
				:root { --marker: 1; }
				@layer recipes { .r { color: red; } }
				@layer reset { .s { color: blue; } }
				@layer base { .t { color: green; } }
			}
		`;

		const output = hoistGlobalLayers(input);
		const resetIndex = output.indexOf('@layer reset {');
		const baseIndex = output.indexOf('@layer base {');
		const recipesIndex = output.indexOf('@layer recipes {');

		expect(resetIndex).toBeGreaterThan(-1);
		expect(baseIndex).toBeGreaterThan(resetIndex);
		expect(recipesIndex).toBeGreaterThan(baseIndex);
		// The `:root` marker (a direct, non-@layer child of the wrapper) merges
		// into the top-level base block alongside the nested `@layer base` rule.
		const baseBlock = extractLayerBlocks(output, 'base');
		expect(baseBlock).toContain('--marker: 1');
		expect(baseBlock).toContain('.t { color: green; }');
		// No @layer block should survive nested inside the hoisted output.
		expect(output).not.toMatch(/@layer\s+\w[\w.-]*\s*\{[^{}]*@layer/);
	});

	it('throws when given anything other than exactly one top-level "@layer base" block', () => {
		expect(() => hoistGlobalLayers('.foo { color: red; }')).toThrow(/top-level/);
		expect(() => hoistGlobalLayers('@layer base {} @layer base {}')).toThrow(/top-level/);
		expect(() => hoistGlobalLayers('@layer reset { .x { color: red; } }')).toThrow(
			/Expected global\.css's top-level block to be "@layer base"/,
		);
		expect(() => hoistGlobalLayers('')).toThrow(/top-level/);
	});
});

describe('assembled stylesheet', () => {
	const css = assembleStylesheet({
		pandaStylesDir: fileURLToPath(new URL('./fixtures/panda-styles', import.meta.url)),
	});

	it('starts with the canonical combined layer-order declaration', () => {
		expect(css.split('\n')[0]).toBe('@layer reset, base, tokens, recipes, box, utilities;');
	});

	it('hoists the nested global reset layer into a top-level @layer reset block', () => {
		const resetBlock = extractLayerBlocks(css, 'reset');
		expect(resetBlock).toContain('.reset-fixture');
	});

	it('hoists the wrapper marker and nested global base layer into one top-level @layer base block', () => {
		const baseBlock = extractLayerBlocks(css, 'base');
		expect(baseBlock).toContain(`--made-with-panda: '🐼'`);
		expect(baseBlock).toContain('.theme-root-fixture');
	});

	it('hoists the nested global recipes layer into a top-level @layer recipes block', () => {
		const recipesBlock = extractLayerBlocks(css, 'recipes');
		expect(recipesBlock).toContain('.global-recipe-fixture');
	});

	it('leaves no @layer block nested directly inside the base layer', () => {
		const baseBlock = extractLayerBlocks(css, 'base');
		expect(baseBlock).not.toContain('@layer');
	});

	it('contains a @layer box block with a real token-referencing box rule', () => {
		expect(css).toContain('@layer box {');
		const boxBlock = css.slice(css.indexOf('@layer box {'));
		expect(boxBlock).toContain('var(--spacing-');
	});

	it('includes the config recipe output inside @layer recipes', () => {
		const recipesBlock = extractLayerBlocks(css, 'recipes');
		expect(recipesBlock).toMatch(/\.recipe-fixture\s*\{\s*color:\s*blue;\s*\}/);
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
	const boxStart = css.indexOf('@layer box {');
	const utilitiesStart = css.indexOf('@layer utilities {', boxStart);
	// `recipesBlock` concatenates every top-level `@layer recipes` /
	// `@layer recipes.slots` block (the hoisted global-styles recipes block
	// plus one per Panda recipe file) rather than slicing between the first
	// `@layer recipes {` and `@layer box {`, because that first occurrence is
	// now the hoisted global block near the top of the sheet, well before the
	// config-recipe blocks and the `@layer tokens` block sitting between them.
	const recipesBlock = `${extractLayerBlocks(css, 'recipes')}\n\n${extractLayerBlocks(css, 'recipes.slots')}`;
	const resetBlock = extractLayerBlocks(css, 'reset');
	const baseBlock = extractLayerBlocks(css, 'base');
	const boxBlock = css.slice(boxStart, utilitiesStart);

	it('starts with the canonical combined layer-order declaration', () => {
		expect(css.split('\n')[0]).toBe('@layer reset, base, tokens, recipes, box, utilities;');
	});

	it('orders @layer recipes before @layer box', () => {
		const firstRecipesStart = css.indexOf('@layer recipes {');
		expect(firstRecipesStart).toBeGreaterThan(-1);
		expect(boxStart).toBeGreaterThan(firstRecipesStart);
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

	it('keeps the DS reset contract inside the top-level @layer reset block', () => {
		expect(resetBlock).toContain('.luke-ui-reset :where(h1, h2, h3, h4, h5, h6)');
	});

	it('keeps the theme-root base contract inside the top-level @layer base block', () => {
		expect(baseBlock).toContain('.luke-ui-theme');
	});

	it('keeps loading skeleton masking inside @layer recipes, not @layer base', () => {
		const maskingDeclaration = 'overflow: hidden !important';
		expect(recipesBlock).toContain(maskingDeclaration);
		expect(baseBlock).not.toContain(maskingDeclaration);
	});
});
