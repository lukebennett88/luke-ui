import { readFileSync } from 'node:fs';
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

test('bundles recipe runtime through a relative chunk, not a package import', async () => {
	const source = await readFile(new URL('../../../dist/blockquote.js', import.meta.url), 'utf8');
	expect(source).not.toContain('#recipe-engine');
	expect(source).toMatch(/createSingleRecipe[\s\S]*from ["']\.\//);
});

test('requires react-aria-components as a peer dependency', () => {
	expect('react-aria-components' in packageJson.peerDependencies).toBe(true);
	expect('react-aria-components' in (packageJson.dependencies ?? {})).toBe(false);
});

test('public JS/TS export declaration closures do not import styling engines', async () => {
	const entryDeclarations = publicTypeEntryDeclarations(packageJson.exports);
	expect(entryDeclarations.length).toBeGreaterThan(0);

	const results = await Promise.all(
		entryDeclarations.map(async (fileName) => {
			const source = await readFile(new URL(`../../../dist/${fileName}`, import.meta.url), 'utf8');
			const closure = collectDeclarationClosure(fileName);
			return { closure, fileName, source };
		}),
	);

	for (const { closure, fileName, source } of results) {
		expect({
			fileName,
			hasRainbowSprinklesImport: /from ["']@luke-ui\/rainbow-sprinkles["']/.test(closure),
			hasVanillaExtractImport: /from ["']@vanilla-extract\//.test(closure),
			sourceLength: source.length,
		}).toEqual({
			fileName,
			hasRainbowSprinklesImport: false,
			hasVanillaExtractImport: false,
			sourceLength: expect.any(Number),
		});
		expect(source.length).toBeGreaterThan(0);
	}
});

test('does not expose the private combobox styling recipe from the primitive entrypoint', async () => {
	const combobox = await import('@luke-ui/react/primitives/combobox');
	expect('comboboxRecipe' in combobox).toBe(false);
});

/** JS package exports that publish TypeScript declarations beside the runtime file. */
function publicTypeEntryDeclarations(exportsMap: Record<string, string>): Array<string> {
	const entries: Array<string> = [];

	for (const target of Object.values(exportsMap)) {
		// Asset and package metadata exports have no declaration graph to police.
		if (!target.endsWith('.js')) continue;
		if (!target.startsWith('./dist/')) {
			throw new Error(`Expected a dist JS export target, received ${target}`);
		}
		entries.push(`${target.slice('./dist/'.length, -'.js'.length)}.d.ts`);
	}

	return entries;
}

function collectDeclarationClosure(entryFile: string): string {
	const distUrl = new URL('../../../dist/', import.meta.url);
	const visited = new Set<string>();
	const queue = [entryFile];
	const parts: Array<string> = [];

	while (queue.length > 0) {
		const fileName = queue.pop();
		if (fileName === undefined || visited.has(fileName)) continue;
		visited.add(fileName);

		const source = readFileSync(new URL(fileName, distUrl), 'utf8');
		parts.push(source);

		for (const match of source.matchAll(/from ["']\.\/([^"']+)["']/g)) {
			const specifier = match[1];
			if (specifier === undefined) continue;
			const next = specifier.endsWith('.js')
				? `${specifier.slice(0, -3)}.d.ts`
				: `${specifier}.d.ts`;
			queue.push(next);
		}
	}

	return parts.join('\n');
}
