import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';
import { parseSync } from 'oxc-parser';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));

/**
 * Resolves each relative import in a generated file against the repo tree and reports the ones
 * that don't exist. Imports from the generated file's own directory (`./index.js`, `./recipe.css.js`,
 * and similar) are skipped since the plan writes those files together; every other relative import
 * must already resolve to a real file on disk.
 */
export async function findUnresolvedImports(file: {
	contents: string;
	path: string;
}): Promise<Array<string>> {
	if (!/\.tsx?$/.test(file.path)) return [];

	const generatedDirectory = path.dirname(path.join(repoRoot, file.path));
	const lang = file.path.endsWith('.tsx') ? 'tsx' : 'ts';
	const parsed = parseSync(file.path, file.contents, { lang });
	const specifiers = parsed.module.staticImports.flatMap((staticImport) => {
		const specifier = staticImport.moduleRequest.value;
		if (!specifier.startsWith('.')) return [];

		return [specifier];
	});

	const resolutions = await Promise.all(
		specifiers.map(async (specifier) => {
			if (specifier.startsWith('./')) return undefined;

			const target = path.resolve(generatedDirectory, specifier);
			const candidates = [target, target.replace(/\.js$/, '.ts'), target.replace(/\.js$/, '.tsx')];
			const found = await Promise.all(
				candidates.map(async (candidate) => {
					try {
						await access(candidate);
						return true;
					} catch {
						return false;
					}
				}),
			);
			if (found.some(Boolean)) return undefined;
			return `${file.path} -> ${specifier}`;
		}),
	);

	return resolutions.filter((resolution): resolution is string => resolution !== undefined);
}
