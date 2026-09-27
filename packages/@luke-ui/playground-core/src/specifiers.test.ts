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

test('accepts .js, .mjs, and .cjs string targets', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': './dist/a.js',
			'./b': './dist/b.mjs',
			'./c': './dist/c.cjs',
		}),
	).toEqual(['example-ui/a', 'example-ui/b', 'example-ui/c']);
});

test('skips a non-runnable string target', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': './dist/a.css',
			'./b': './dist/b.json',
			'./c': './dist/c.js',
		}),
	).toEqual(['example-ui/c']);
});

test('follows a custom isRunnableTarget', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': './dist/a.js', './b': './dist/b.wasm' },
			{ isRunnableTarget: (target) => target.endsWith('.wasm') },
		),
	).toEqual(['example-ui/b']);
});

test('defaults to the import condition', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': { import: './dist/a.js', require: './dist/a.cjs' },
			'./b': { default: './dist/b.js', types: './dist/b.d.ts' },
			'./c': { require: './dist/c.cjs' },
			'./d': { import: { default: './dist/d.js', types: './dist/d.d.ts' } },
			'./e': { node: './dist/e.js' },
		}),
	).toEqual(['example-ui/a', 'example-ui/b', 'example-ui/d']);
});

test('resolves nested conditions objects', () => {
	expect(
		packageExportSpecifiers('example-ui', {
			'./a': { import: { node: './dist/a.node.mjs', types: './dist/a.d.mts' } },
		}),
	).toEqual([]);
	expect(
		packageExportSpecifiers(
			'example-ui',
			{
				'./a': { import: { node: './dist/a.node.mjs', types: './dist/a.d.mts' } },
			},
			{ conditions: ['import', 'node'] },
		),
	).toEqual(['example-ui/a']);
});

test('resolves the first active key in object order, not conditions list order', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { import: './a.mjs', require: './a.cjs' } },
			{ conditions: ['import', 'require'] },
		),
	).toEqual(['example-ui/a']);
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { require: './a.cjs', import: './a.mjs' } },
			{ conditions: ['import', 'require'] },
		),
	).toEqual(['example-ui/a']);
});

test('falls back to default when no other condition is active', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { node: './a.node.js', default: './a.js' } },
			{ conditions: [] },
		),
	).toEqual(['example-ui/a']);
});

test('resolves nothing when no condition is active', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { node: './a.node.js', worker: './a.worker.js' } },
			{ conditions: [] },
		),
	).toEqual([]);
});

test('continues to a later sibling key when a matched nested object has no active key', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { default: './d.js', import: { browser: './b.mjs' } } },
			{ conditions: ['import'] },
		),
	).toEqual(['example-ui/a']);
});

test('stops at an explicit null target instead of continuing to a sibling key', () => {
	expect(
		packageExportSpecifiers(
			'example-ui',
			{ './a': { import: null, default: './d.js' } },
			{ conditions: ['import'] },
		),
	).toEqual([]);
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

test('maps . to the bare package name', () => {
	expect(packageExportSpecifiers('example-ui', { '.': './dist/index.js' })).toEqual(['example-ui']);
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
