import { expect, test } from 'vite-plus/test';
import {
	canRunInPlayground,
	importSpecifiersFromSource,
	packageExportSpecifiers,
} from './specifiers.js';

const exportsMap = {
	'./button': './dist/button.js',
	'./box': './dist/box.js',
	'./package.json': './package.json',
	'./stylesheet.css': './dist/stylesheet.css',
};

const specifiers = new Set([
	...packageExportSpecifiers('example-ui', exportsMap),
	'react',
	'#local',
]);

test('maps JavaScript subpath exports to sorted package specifiers', () => {
	expect(packageExportSpecifiers('example-ui', exportsMap)).toEqual([
		'example-ui/box',
		'example-ui/button',
	]);
});

test('maps the root export to the package name', () => {
	expect(
		packageExportSpecifiers('@scope/ui', {
			'.': './dist/index.js',
			'./deep/path': './dist/deep.js',
		}),
	).toEqual(['@scope/ui', '@scope/ui/deep/path']);
});

test('follows import, then default, conditions by default', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': { import: './dist/a.js', require: './dist/a.cjs' },
			'./b': { default: './dist/b.js', types: './dist/b.d.ts' },
			'./c': { require: './dist/c.cjs' },
			'./d': { import: { types: './dist/d.d.ts', default: './dist/d.js' } },
			'./e': { node: './dist/e.js' },
		}),
	).toEqual(['example-ui/a', 'example-ui/b', 'example-ui/d']);
});

test('follows host-supplied conditions in priority order', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{
				'./a': { browser: './dist/a.browser.js', import: './dist/a.mjs' },
				'./b': { import: './dist/b.mjs' },
			},
			{ conditions: ['browser', 'import'] },
		),
	).toEqual(['example-ui/a']);
});

test('skips null targets, fallback arrays, and patterns', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': null,
			'./b': ['./dist/b.js'],
			'./c/*': './dist/c/*.js',
			'./d': './dist/d.js',
		}),
	).toEqual(['example-ui/d']);
});

test('treats a relative import as unresolvable in the playground', () => {
	const source = [
		"import { Box } from 'example-ui/box';",
		"import { DecorativeBox } from './decorative-box.js';",
		'',
	].join('\n');

	expect(importSpecifiersFromSource(source)).toEqual(['example-ui/box', './decorative-box.js']);
	expect(canRunInPlayground(source, specifiers)).toBe(false);
});

test('treats a source that only imports known specifiers as runnable', () => {
	const source = [
		"import { Button } from 'example-ui/button';",
		"import { Helper } from '#local';",
		"import 'react';",
		'',
	].join('\n');

	expect(canRunInPlayground(source, specifiers)).toBe(true);
});
