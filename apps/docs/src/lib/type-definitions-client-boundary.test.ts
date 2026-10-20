import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ts } from 'ts-morph';
import { expect, test } from 'vite-plus/test';

const docsSrcDir = fileURLToPath(new URL('..', import.meta.url));
const JS_EXTENSION_PATTERN = /\.js$/;

/** The API table component pages render, which loads and shows the type definitions. */
const CLIENT_ENTRY = resolve(docsSrcDir, 'components/component-props-table.tsx');

/** Packages the type-definition generator needs at build time and the browser must not load. */
const BUILD_ONLY_PACKAGES = ['fumadocs-typescript', 'ts-morph', 'typescript', 'zod'];

/** Generator modules that analyse TypeScript or write assets at build time. */
const BUILD_ONLY_MODULES = new Set([
	'lib/collect-type-definitions.ts',
	'lib/component-prop-analysis.ts',
	'lib/enrich-generated-doc-types.ts',
	'lib/remark-attach-type-definitions.ts',
	'lib/stringify-component-props-table.ts',
]);

test('the API table loads type definitions without build-time dependencies', () => {
	const { localModules, packages } = valueImportGraph(CLIENT_ENTRY);

	expect(localModules).toContain('lib/load-type-definitions.ts');
	expect(localModules.filter((path) => BUILD_ONLY_MODULES.has(path))).toEqual([]);
	expect(
		packages.filter(
			(name) => name.startsWith('node:') || BUILD_ONLY_PACKAGES.some((pkg) => name === pkg),
		),
	).toEqual([]);
});

/**
 * Follows the value imports of local modules from `entry`. Type-only imports are erased from the
 * bundle, so they are skipped.
 */
function valueImportGraph(entry: string) {
	const localModules = new Set<string>();
	const packages = new Set<string>();
	const pending = [entry];

	while (pending.length > 0) {
		const file = pending.pop()!;
		const path = relative(docsSrcDir, file);
		if (localModules.has(path)) continue;
		localModules.add(path);

		for (const specifier of valueImportSpecifiers(file)) {
			if (!specifier.startsWith('.')) {
				packages.add(
					specifier
						.split('/')
						.slice(0, specifier.startsWith('@') ? 2 : 1)
						.join('/'),
				);
				continue;
			}
			const local = resolveLocalModule(dirname(file), specifier);
			if (local !== undefined) pending.push(local);
		}
	}

	return { localModules: [...localModules].toSorted(), packages: [...packages].toSorted() };
}

function valueImportSpecifiers(file: string): Array<string> {
	const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
	return sourceFile.statements.flatMap((statement) => {
		if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) return [];
		if (statement.moduleSpecifier === undefined) return [];
		if (!ts.isStringLiteral(statement.moduleSpecifier)) return [];
		if (ts.isExportDeclaration(statement) ? statement.isTypeOnly : isTypeOnlyImport(statement)) {
			return [];
		}
		return [statement.moduleSpecifier.text];
	});
}

function isTypeOnlyImport(statement: ts.ImportDeclaration): boolean {
	const clause = statement.importClause;
	if (clause === undefined) return false;
	if (clause.isTypeOnly) return true;
	if (clause.name !== undefined) return false;
	const bindings = clause.namedBindings;
	return (
		bindings !== undefined &&
		ts.isNamedImports(bindings) &&
		bindings.elements.length > 0 &&
		bindings.elements.every((element) => element.isTypeOnly)
	);
}

/** Resolves `./x.js` to its `.ts` or `.tsx` source. Asset imports such as `?url` are skipped. */
function resolveLocalModule(fromDir: string, specifier: string): string | undefined {
	if (specifier.includes('?')) return;
	const base = resolve(fromDir, specifier).replace(JS_EXTENSION_PATTERN, '');
	return ['.ts', '.tsx'].map((extension) => `${base}${extension}`).find((path) => existsSync(path));
}
