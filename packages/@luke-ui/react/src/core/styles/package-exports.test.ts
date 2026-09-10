import { readFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
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
			...stylingEngineReferences(closure),
			sourceLength: source.length,
		}).toEqual({
			fileName,
			hasRainbowSprinkles: false,
			hasVanillaExtract: false,
			sourceLength: expect.any(Number),
		});
		expect(source.length).toBeGreaterThan(0);
	}
});

test('detects styling-engine packages in from and inline import() forms', () => {
	expect(stylingEngineReferences(`import type { StyleRule } from '@vanilla-extract/css';`)).toEqual(
		{ hasRainbowSprinkles: false, hasVanillaExtract: true },
	);
	expect(
		stylingEngineReferences(`type StyleRule = import('@vanilla-extract/css').StyleRule;`),
	).toEqual({ hasRainbowSprinkles: false, hasVanillaExtract: true });
	expect(
		stylingEngineReferences(`type Sprinkles = import('@luke-ui/rainbow-sprinkles').SprinklesFn;`),
	).toEqual({ hasRainbowSprinkles: true, hasVanillaExtract: false });
	expect(stylingEngineReferences(`type Local = import('./local.js').Local;`)).toEqual({
		hasRainbowSprinkles: false,
		hasVanillaExtract: false,
	});
});

test('collects relative specifiers from from and inline import() forms', () => {
	expect(
		relativeDeclarationSpecifiers(`
			export type { ThemeInput } from './define-theme.js';
			type Nested = import('../themes/paper.js').ThemeInput;
			import type { BoxProps } from './box.js';
		`),
	).toEqual(['./define-theme.js', '../themes/paper.js', './box.js']);
});

test('ignores relative import() mentions inside JSDoc {@link} tags', () => {
	expect(
		relativeDeclarationSpecifiers(
			`/** Attached to {@link import('./build-theme.js').ThemeGenerationError}. */\nexport type Ok = true;`,
		),
	).toEqual([]);
	expect(
		relativeDeclarationSpecifiers(
			`/** See {@link import('./build-theme.js').ThemeGenerationError}. */\ntype Nested = import('./real.js').Nested;`,
		),
	).toEqual(['./real.js']);
});

test('resolves nested and parent-relative declaration imports from the importing file', () => {
	expect(resolveDeclarationImport('themes/paper.d.ts', '../define-theme.js')).toBe(
		'define-theme.d.ts',
	);
	expect(resolveDeclarationImport('styles.d.ts', './utilities.css.js')).toBe('utilities.css.d.ts');
	expect(resolveDeclarationImport('themes/paper.d.ts', './tokens.js')).toBe('themes/tokens.d.ts');
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

/**
 * Module specifiers after `from '…'` / `from "…"` or inside `import('…')` / `import("…")`.
 * Covers ordinary import/export declarations and inline TypeScript import types.
 */
const MODULE_SPECIFIER = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;

/** Drop `{@link …}` tags so JSDoc `import('…')` mentions are not treated as graph edges. */
function withoutJsDocLinks(source: string): string {
	return source.replaceAll(/\{@link\b[^}]*\}/g, '');
}

function moduleSpecifiers(source: string): Array<string> {
	const specifiers: Array<string> = [];
	for (const match of withoutJsDocLinks(source).matchAll(MODULE_SPECIFIER)) {
		const specifier = match[1];
		if (specifier === undefined) continue;
		specifiers.push(specifier);
	}
	return specifiers;
}

function relativeDeclarationSpecifiers(source: string): Array<string> {
	return moduleSpecifiers(source).filter(
		(specifier) => specifier.startsWith('./') || specifier.startsWith('../'),
	);
}

function stylingEngineReferences(source: string): {
	hasRainbowSprinkles: boolean;
	hasVanillaExtract: boolean;
} {
	let hasRainbowSprinkles = false;
	let hasVanillaExtract = false;

	for (const specifier of moduleSpecifiers(source)) {
		if (specifier === '@luke-ui/rainbow-sprinkles') hasRainbowSprinkles = true;
		if (specifier.startsWith('@vanilla-extract/')) hasVanillaExtract = true;
	}

	return { hasRainbowSprinkles, hasVanillaExtract };
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

		for (const specifier of relativeDeclarationSpecifiers(source)) {
			queue.push(resolveDeclarationImport(fileName, specifier));
		}
	}

	return parts.join('\n');
}

/** Resolve `./` and `../` declaration imports against the importing file's directory. */
function resolveDeclarationImport(fromFile: string, specifier: string): string {
	const declarationSpecifier = specifier.endsWith('.js')
		? `${specifier.slice(0, -3)}.d.ts`
		: `${specifier}.d.ts`;
	const next = posix.normalize(posix.join(dirname(fromFile), declarationSpecifier));
	if (next.startsWith('..')) {
		throw new Error(`Declaration import escaped dist: ${specifier} from ${fromFile}`);
	}
	return next;
}
