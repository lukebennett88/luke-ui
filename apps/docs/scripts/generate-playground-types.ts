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
 * Runs via the `generate:playground` script (wired into `docs#generate` in
 * turbo.json). Requires @luke-ui/react to be built first (dist/*.d.ts).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsPackageJsonPath = resolve(scriptDir, '../package.json');
const reactPackageDir = resolve(scriptDir, '../../../packages/@luke-ui/react');
const outputPath = resolve(scriptDir, '../src/generated/playground-types.generated.json');

const files: Record<string, string> = {};

function virtualPath(packageName: string, relativePath: string): string {
	return `file:///node_modules/${packageName}/${relativePath.split(sep).join('/')}`;
}

function addFile(packageName: string, packageDir: string, filePath: string): void {
	files[virtualPath(packageName, relative(packageDir, filePath))] = readFileSync(filePath, 'utf8');
}

function walk(dir: string, visit: (filePath: string) => void): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules') continue;
		const entryPath = join(dir, entry.name);
		if (entry.isDirectory()) walk(entryPath, visit);
		else if (entry.isFile()) visit(entryPath);
	}
}

/**
 * Resolves an installed package's directory from a dependent package.json.
 * Falls back to resolving the main entry and walking up, because some
 * packages (e.g. @internationalized/date) do not export ./package.json.
 */
function resolvePackageDir(fromPackageJson: string, packageName: string): string {
	const require = createRequire(fromPackageJson);
	try {
		return dirname(require.resolve(`${packageName}/package.json`));
	} catch {
		let dir = dirname(require.resolve(packageName));
		while (dir !== dirname(dir)) {
			const packageJsonPath = join(dir, 'package.json');
			if (existsSync(packageJsonPath)) {
				const { name } = z
					.object({ name: z.string().optional() })
					.parse(JSON.parse(readFileSync(packageJsonPath, 'utf8')));
				if (name === packageName) return dir;
			}
			dir = dirname(dir);
		}
		throw new Error(`Could not locate package directory for ${packageName}`);
	}
}

function addTypesPackage(packageName: string, packageDir: string): void {
	walk(packageDir, (filePath) => {
		if (!filePath.endsWith('.d.ts')) return;
		addFile(packageName, packageDir, filePath);
	});
	addFile(packageName, packageDir, join(packageDir, 'package.json'));
}

// @luke-ui/react — dist .d.ts files plus a package.json stub so Monaco's
// bundler-mode resolution can follow the subpath exports map.
const reactPackageJsonSchema = z.object({
	name: z.string(),
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
walk(reactDistDir, (filePath) => {
	if (!filePath.endsWith('.d.ts')) return;
	addFile('@luke-ui/react', reactPackageDir, filePath);
});
files[virtualPath('@luke-ui/react', 'package.json')] = JSON.stringify({
	exports: reactPackageJson.exports,
	name: reactPackageJson.name,
});

// External type dependencies reachable from @luke-ui/react's public types.
// Resolution starts from the package that actually depends on each one, so
// pnpm's strict node_modules layout resolves the correct versions.
const typesReactDir = resolvePackageDir(docsPackageJsonPath, '@types/react');
const recipesDir = resolvePackageDir(docsPackageJsonPath, '@vanilla-extract/recipes');
const racDir = resolvePackageDir(docsPackageJsonPath, 'react-aria-components');
const racPackageJsonPath = join(racDir, 'package.json');
const externalTypePackages: Array<[string, string]> = [
	['@types/react', typesReactDir],
	['@types/react-dom', resolvePackageDir(docsPackageJsonPath, '@types/react-dom')],
	['csstype', resolvePackageDir(join(typesReactDir, 'package.json'), 'csstype')],
	['@vanilla-extract/recipes', recipesDir],
	[
		'@vanilla-extract/css',
		resolvePackageDir(join(recipesDir, 'package.json'), '@vanilla-extract/css'),
	],
	['react-aria-components', racDir],
	['react-aria', resolvePackageDir(racPackageJsonPath, 'react-aria')],
	['react-stately', resolvePackageDir(racPackageJsonPath, 'react-stately')],
	['@react-types/shared', resolvePackageDir(racPackageJsonPath, '@react-types/shared')],
	['@internationalized/date', resolvePackageDir(racPackageJsonPath, '@internationalized/date')],
	['@internationalized/number', resolvePackageDir(racPackageJsonPath, '@internationalized/number')],
	['@internationalized/string', resolvePackageDir(racPackageJsonPath, '@internationalized/string')],
];
for (const [packageName, packageDir] of externalTypePackages) {
	addTypesPackage(packageName, packageDir);
}

const output = JSON.stringify(files);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
// oxlint-disable-next-line no-console
console.log(
	`generate-playground-types: wrote ${Object.keys(files).length} files (${(output.length / 1024 / 1024).toFixed(1)}MB raw) to src/generated/playground-types.generated.json`,
);
