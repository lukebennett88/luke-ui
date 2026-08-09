/**
 * Converts a small subset of glob syntax (`**`, `*`, `{a,b}`) to a regular
 * expression that matches a forward-slash relative path exactly.
 *
 * Only the constructs used by `vitest.config.ts`'s `test.include` globs are
 * supported: a double-star directory segment as an optional run of
 * directories, a bare `*` as a single path segment, and `{a,b}` alternation.
 */
export function globToRegExp(glob: string): RegExp {
	let pattern = '';
	let index = 0;
	while (index < glob.length) {
		const char = glob[index];
		if (char === '*' && glob[index + 1] === '*' && glob[index + 2] === '/') {
			pattern += '(?:.*/)?';
			index += 3;
			continue;
		}
		if (char === '*' && glob[index + 1] === '*') {
			pattern += '.*';
			index += 2;
			continue;
		}
		if (char === '*') {
			pattern += '[^/]*';
			index += 1;
			continue;
		}
		if (char === '{') {
			const end = glob.indexOf('}', index);
			const options = glob.slice(index + 1, end).split(',');
			pattern += `(?:${options.join('|')})`;
			index = end + 1;
			continue;
		}
		if (char !== undefined && '.+^$()|[]\\'.includes(char)) {
			pattern += `\\${char}`;
			index += 1;
			continue;
		}
		pattern += char;
		index += 1;
	}
	return new RegExp(`^${pattern}$`);
}

/**
 * Returns the entries of `testFiles` (forward-slash relative paths) that do
 * not match any of `includeGlobs`. Those files use a suffix that no Vitest
 * project's `test.include` glob recognizes, so Vitest silently never runs
 * them.
 */
export function findStrayTestFiles(
	testFiles: Array<string>,
	includeGlobs: Array<string>,
): Array<string> {
	const matchers = includeGlobs.map(globToRegExp);
	return testFiles.filter((file) => !matchers.some((matcher) => matcher.test(file)));
}
