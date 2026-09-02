import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import packageJson from '../../../package.json' with { type: 'json' };

const absentExportPaths = [
	'./button/primitive',
	'./checkbox/primitive',
	'./combobox-field/primitive',
	'./field/primitive',
	'./text-field/primitive',
	'./recipes',
	'./heading-context',
	'./icon-size-context',
	'./styles/recipe-engine',
	'./stylesheet',
	'./primitives',
	'./tokens',
] as const;

const presentExportPaths = {
	'./box': './dist/box.js',
	'./theme': './dist/theme.js',
	'./themes/tactile': './dist/themes/tactile.js',
	'./themes/paper': './dist/themes/paper.js',
	'./styles': './dist/styles.js',
	'./stylesheet.css': './dist/stylesheet.css',
	'./primitives/button': './dist/primitives/button.js',
	'./primitives/checkbox': './dist/primitives/checkbox.js',
	'./primitives/combobox': './dist/primitives/combobox.js',
	'./primitives/field': './dist/primitives/field.js',
	'./primitives/input-group': './dist/primitives/input-group.js',
} as const;

test('publishes only the final styling entrypoints', () => {
	for (const exportPath of absentExportPaths) {
		expect(exportPath in packageJson.exports).toBe(false);
	}

	for (const [exportPath, target] of Object.entries(presentExportPaths) as Array<
		[keyof typeof presentExportPaths, (typeof presentExportPaths)[keyof typeof presentExportPaths]]
	>) {
		expect(packageJson.exports[exportPath]).toBe(target);
	}

	expect('imports' in packageJson).toBe(false);
});

test('bundles StyleX recipes as string wrappers without a package recipe-engine import', async () => {
	const source = await readFile(new URL('../../../dist/blockquote.js', import.meta.url), 'utf8');
	expect(source).not.toContain('#recipe-engine');
	expect(source).toMatch(/from ["']\.\/stylex-recipe-/);
	expect(source).toMatch(/const \[blockquoteRecipe, resolveBlockquoteRecipeStyles\]/);
	expect(source).toMatch(/export \{ Blockquote, blockquoteRecipe \}/);
	expect(source).not.toMatch(/export \{[^}]*resolveBlockquoteRecipeStyles/);
	expect(source).not.toMatch(/export \{[^}]*resolveStyles/);
});

test('requires react-aria-components as a peer dependency', () => {
	expect('react-aria-components' in packageJson.peerDependencies).toBe(true);
	expect('react-aria-components' in (packageJson.dependencies ?? {})).toBe(false);
});

test('does not expose the private combobox styling recipe from the primitive entrypoint', async () => {
	const combobox = await import('@luke-ui/react/primitives/combobox');
	expect('comboboxRecipe' in combobox).toBe(false);
});
