import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as z from 'zod';

/** Specifiers the playground always resolves, besides `@luke-ui/react/*` subpaths. */
const PLAYGROUND_BASE_SPECIFIERS = [
	'react',
	'react-dom',
	'react-dom/client',
	'react/jsx-runtime',
] as const;

/**
 * Third-party packages that docs examples import directly. Add a package here
 * whenever an example needs to import it in the playground. The Monaco type
 * list in `generate-playground-types.ts` is a different set on purpose.
 */
const PLAYGROUND_THIRD_PARTY_SPECIFIERS = [
	'@hookform/resolvers/zod',
	'@tanstack/react-form',
	'react-hook-form',
	'zod',
] as const;

/** Docs-only helpers that documented examples can import in the playground. */
const PLAYGROUND_DOCS_SPECIFIERS = ['#docs/comparison'] as const;

const packageJsonSchema = z.object({
	exports: z.record(z.string(), z.string()),
});

const reactPackageJsonPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../../../packages/@luke-ui/react/package.json',
);

const IMPORT_SPECIFIER_PATTERN = /\bfrom\s+["']([^"']+)["']/g;
const SIDE_EFFECT_IMPORT_PATTERN = /^import\s+["']([^"']+)["']/gm;

function readLukeUiReactExports(): Record<string, string> {
	return packageJsonSchema.parse(JSON.parse(readFileSync(reactPackageJsonPath, 'utf8'))).exports;
}

/** `@luke-ui/react/*` specifiers the playground can `require` at runtime. */
function lukeUiPlaygroundSpecifiers(
	reactExports: Record<string, string> = readLukeUiReactExports(),
): Array<string> {
	return Object.keys(reactExports)
		.flatMap((key) => {
			const target = reactExports[key];
			if (key === './package.json' || target === undefined || !target.endsWith('.js')) return [];
			return [`@luke-ui/react/${key.slice(2)}`];
		})
		.sort();
}

/** Specifiers `requireModule` in the playground preview can resolve. */
export function playgroundRuntimeSpecifierList(
	reactExports: Record<string, string> = readLukeUiReactExports(),
): Array<string> {
	return [
		...lukeUiPlaygroundSpecifiers(reactExports),
		...PLAYGROUND_BASE_SPECIFIERS,
		...PLAYGROUND_THIRD_PARTY_SPECIFIERS,
		...PLAYGROUND_DOCS_SPECIFIERS,
	];
}

export function importSpecifiersFromSource(source: string): Array<string> {
	const specifiers: Array<string> = [];

	for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	for (const match of source.matchAll(SIDE_EFFECT_IMPORT_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	return specifiers;
}

let defaultSpecifiers: ReadonlySet<string> | undefined;

function defaultPlaygroundSpecifiers(): ReadonlySet<string> {
	defaultSpecifiers ??= new Set(playgroundRuntimeSpecifierList());
	return defaultSpecifiers;
}

export function canRunInPlayground(
	source: string,
	specifiers: ReadonlySet<string> = defaultPlaygroundSpecifiers(),
): boolean {
	return importSpecifiersFromSource(source).every((specifier) => specifiers.has(specifier));
}
