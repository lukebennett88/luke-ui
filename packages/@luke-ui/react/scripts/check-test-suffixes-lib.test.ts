import { expect, test } from 'vite-plus/test';
import { findStrayTestFiles, globToRegExp } from './check-test-suffixes-lib.js';

const includeGlobs = [
	'src/**/*.test.ts',
	'scripts/**/*.test.ts',
	'src/**/*.browser.test.{ts,tsx}',
	'src/**/*.visual.test.{ts,tsx}',
];

test('matches files against the real vitest.config.ts include globs', () => {
	expect(
		findStrayTestFiles(
			[
				'src/button/button.test.ts',
				'src/button/button.browser.test.tsx',
				'src/button/button.visual.test.tsx',
				'scripts/build-icons.test.ts',
			],
			includeGlobs,
		),
	).toEqual([]);
});

test('flags a .test.tsx file with no browser or visual suffix', () => {
	expect(findStrayTestFiles(['src/button/button.test.tsx'], includeGlobs)).toEqual([
		'src/button/button.test.tsx',
	]);
});

test('flags a scripts/*.test.tsx file, since the unit project only globs .test.ts there', () => {
	expect(findStrayTestFiles(['scripts/probe.test.tsx'], includeGlobs)).toEqual([
		'scripts/probe.test.tsx',
	]);
});

test('flags a test file outside src/ and scripts/', () => {
	expect(findStrayTestFiles(['test/helpers.test.ts'], includeGlobs)).toEqual([
		'test/helpers.test.ts',
	]);
});

test('matches a double-star glob against a file directly under its root, with no subdirectory', () => {
	expect(findStrayTestFiles(['scripts/probe.test.ts'], includeGlobs)).toEqual([]);
});

test('converts ** followed by a slash into an optional run of directories', () => {
	const matcher = globToRegExp('src/**/*.test.ts');
	expect(matcher.test('src/button.test.ts')).toBe(true);
	expect(matcher.test('src/button/button.test.ts')).toBe(true);
	expect(matcher.test('src/a/b/c.test.ts')).toBe(true);
	expect(matcher.test('src/button/button.test.tsx')).toBe(false);
});

test('expands brace alternation', () => {
	const matcher = globToRegExp('src/**/*.browser.test.{ts,tsx}');
	expect(matcher.test('src/button/button.browser.test.ts')).toBe(true);
	expect(matcher.test('src/button/button.browser.test.tsx')).toBe(true);
	expect(matcher.test('src/button/button.browser.test.jsx')).toBe(false);
});
