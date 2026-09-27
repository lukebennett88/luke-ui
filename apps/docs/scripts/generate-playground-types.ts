/**
 * Generates src/generated/playground-types.generated.json — a map of virtual
 * `file:///node_modules/...` paths to `.d.ts` contents, fed to Monaco's
 * TypeScript worker via `addExtraLib` so the playground editor gets real
 * IntelliSense for @luke-ui/react and its type dependencies.
 *
 * The payload is a few MB raw (loaded lazily, only on /playground). If a
 * type-dependency package is dropped from the allowlist below, imports from
 * it degrade to `any` in hovers — no user-visible errors.
 *
 * The walk, virtual paths, and package resolution come from
 * `@luke-ui/playground-core/generate`. This script owns the Luke UI package,
 * the type-dependency allowlist, and the docs helpers file.
 *
 * Runs via the `generate:playground` script (wired into `docs#generate` in
 * turbo.json). Requires @luke-ui/react to be built first (dist/*.d.ts).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createPlaygroundTypeMap, resolvePackageDir } from '@luke-ui/playground-core/generate';
import * as z from 'zod';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsPackageJsonPath = resolve(scriptDir, '../package.json');
const docsExamplesDir = resolve(scriptDir, '../src/examples');
const reactPackageDir = resolve(scriptDir, '../../../packages/@luke-ui/react');
const outputPath = resolve(scriptDir, '../src/generated/playground-types.generated.json');
const docsHelpersVirtualPath = 'file:///docs/docs.tsx';

const typeMap = createPlaygroundTypeMap();

// @luke-ui/react — dist .d.ts files plus a package.json stub so Monaco's
// bundler-mode resolution can follow the subpath exports map.
const reactPackageJsonSchema = z.object({
	exports: z.record(z.string(), z.string()),
});

const reactPackageJson = reactPackageJsonSchema.parse(
	JSON.parse(readFileSync(join(reactPackageDir, 'package.json'), 'utf8')),
);
const reactDistDir = join(reactPackageDir, 'dist');
if (!existsSync(reactDistDir)) {
	// oxlint-disable-next-line no-console
	console.error(
		'generate-playground-types: packages/@luke-ui/react/dist is missing — build it first',
	);
	process.exit(1);
}
typeMap.addPackage('@luke-ui/react', reactPackageDir, {
	packageJson: { exports: reactPackageJson.exports, name: '@luke-ui/react' },
	typesDir: 'dist',
});

// External type dependencies reachable from @luke-ui/react's public types.
// Resolution starts from the package that actually depends on each one, so
// pnpm's strict node_modules layout resolves the correct versions.
// Styling-engine packages stay out of this list: public Luke UI declarations no
// longer require them for type checking. Vite optimizeDeps still prebundles the
// runtime copies separately.
const typesReactDir = resolvePackageDir(docsPackageJsonPath, '@types/react');
const racDir = resolvePackageDir(docsPackageJsonPath, 'react-aria-components');
const racPackageJsonPath = join(racDir, 'package.json');
const reactFormDir = resolvePackageDir(docsPackageJsonPath, '@tanstack/react-form');
const reactFormPackageJsonPath = join(reactFormDir, 'package.json');
const externalTypePackages: Array<[string, string]> = [
	['@types/react', typesReactDir],
	['@types/react-dom', resolvePackageDir(docsPackageJsonPath, '@types/react-dom')],
	['csstype', resolvePackageDir(join(typesReactDir, 'package.json'), 'csstype')],
	['react-aria-components', racDir],
	['react-aria', resolvePackageDir(racPackageJsonPath, 'react-aria')],
	['react-stately', resolvePackageDir(racPackageJsonPath, 'react-stately')],
	['@react-types/shared', resolvePackageDir(racPackageJsonPath, '@react-types/shared')],
	['@internationalized/date', resolvePackageDir(racPackageJsonPath, '@internationalized/date')],
	['@internationalized/number', resolvePackageDir(racPackageJsonPath, '@internationalized/number')],
	['@internationalized/string', resolvePackageDir(racPackageJsonPath, '@internationalized/string')],
	['react-hook-form', resolvePackageDir(docsPackageJsonPath, 'react-hook-form')],
	['@hookform/resolvers', resolvePackageDir(docsPackageJsonPath, '@hookform/resolvers')],
	['@tanstack/react-form', reactFormDir],
	['@tanstack/form-core', resolvePackageDir(reactFormPackageJsonPath, '@tanstack/form-core')],
	['@tanstack/react-store', resolvePackageDir(reactFormPackageJsonPath, '@tanstack/react-store')],
	['@tanstack/store', resolvePackageDir(reactFormPackageJsonPath, '@tanstack/store')],
	['zod', resolvePackageDir(docsPackageJsonPath, 'zod')],
];
for (const [packageName, packageDir] of externalTypePackages) {
	typeMap.addPackage(packageName, packageDir);
}

typeMap.addFile(docsHelpersVirtualPath, readFileSync(join(docsExamplesDir, 'docs.tsx'), 'utf8'));

const files = typeMap.files();
const output = JSON.stringify(files);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
// oxlint-disable-next-line no-console
console.log(
	`generate-playground-types: wrote ${Object.keys(files).length} files (${(output.length / 1024 / 1024).toFixed(1)}MB raw) to src/generated/playground-types.generated.json`,
);
