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

test('publishes a component entrypoint with only its public exports', async () => {
	const blockquote = await import('@luke-ui/react/blockquote');

	expect(Object.keys(blockquote).sort()).toEqual(['Blockquote', 'blockquoteRecipe']);
	expect(typeof blockquote.Blockquote).toBe('function');
	expect(typeof blockquote.blockquoteRecipe).toBe('function');
});

test('requires react-aria-components as a peer dependency', () => {
	expect('react-aria-components' in packageJson.peerDependencies).toBe(true);
	expect('react-aria-components' in (packageJson.dependencies ?? {})).toBe(false);
});

test('does not expose the private combobox styling recipe from the primitive entrypoint', async () => {
	const combobox = await import('@luke-ui/react/primitives/combobox');
	expect('comboboxRecipe' in combobox).toBe(false);
});

test('rejects the private recipe engine package path', async () => {
	const privatePath: string = '@luke-ui/react/styles/recipe-engine';

	await expect(import(privatePath)).rejects.toThrow(/exports|package subpath/i);
});
