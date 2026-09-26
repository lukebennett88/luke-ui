/**
 * Docs-host playground runtime allowlist: Luke UI exports plus third-party and
 * `#docs` helpers that documented examples import in the playground.
 *
 * Core stays generic; docs owns the host-specific extras below.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playgroundRuntimeSpecifierList } from '@luke-ui/playground-core';
import * as z from 'zod';

/**
 * Third-party packages that docs examples import directly. Add a package here
 * whenever an example needs to import it in the playground. The Monaco type
 * list in `generate-playground-types.ts` is a different set on purpose.
 */
const DOCS_PLAYGROUND_THIRD_PARTY_SPECIFIERS = [
	'@hookform/resolvers/zod',
	'@tanstack/react-form',
	'react-error-boundary',
	'react-hook-form',
	'zod',
] as const;

/** Docs-only helpers that documented examples can import in the playground. */
const DOCS_PLAYGROUND_DOCS_SPECIFIERS = ['#docs'] as const;

const packageJsonSchema = z.object({
	exports: z.record(z.string(), z.string()),
});

const reactPackageJsonPath = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'../../../../packages/@luke-ui/react/package.json',
);

function readLukeUiReactExports(
	packageJsonPath: string = reactPackageJsonPath,
): Record<string, string> {
	return packageJsonSchema.parse(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).exports;
}

/** Specifiers the docs playground preview can `require` at runtime. */
export function docsPlaygroundRuntimeSpecifierList(
	reactExports: Record<string, string> = readLukeUiReactExports(),
): Array<string> {
	return playgroundRuntimeSpecifierList({
		extraSpecifiers: [
			...DOCS_PLAYGROUND_THIRD_PARTY_SPECIFIERS,
			...DOCS_PLAYGROUND_DOCS_SPECIFIERS,
		],
		reactExports,
	});
}

let cachedSpecifiers: ReadonlySet<string> | undefined;

export function docsPlaygroundSpecifiers(): ReadonlySet<string> {
	cachedSpecifiers ??= new Set(docsPlaygroundRuntimeSpecifierList());
	return cachedSpecifiers;
}
