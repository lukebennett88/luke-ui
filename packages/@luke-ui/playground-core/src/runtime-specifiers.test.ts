import { expect, test } from 'vite-plus/test';
import {
	canRunInPlayground,
	importSpecifiersFromSource,
	playgroundRuntimeSpecifierList,
} from './runtime-specifiers.js';

const reactExports = {
	'./box': './dist/box.js',
	'./button': './dist/button.js',
	'./package.json': './package.json',
	'./stylesheet.css': './dist/stylesheet.css',
};

const extraSpecifiers = ['#docs', '@hookform/resolvers/zod', 'zod'] as const;

const specifiers = new Set(
	playgroundRuntimeSpecifierList({
		extraSpecifiers,
		reactExports,
	}),
);

test('derives Luke UI subpaths from react package exports', () => {
	expect(
		playgroundRuntimeSpecifierList({ reactExports }).filter((specifier) =>
			specifier.startsWith('@luke-ui/react/'),
		),
	).toEqual(['@luke-ui/react/box', '@luke-ui/react/button']);
});

test('includes base React specifiers and host extras', () => {
	expect(specifiers.has('react')).toBe(true);
	expect(specifiers.has('react/jsx-runtime')).toBe(true);
	expect(specifiers.has('#docs')).toBe(true);
	expect(specifiers.has('zod')).toBe(true);
});

test('treats a relative import as unresolvable in the playground', () => {
	const source = [
		"import { Box } from '@luke-ui/react/box';",
		"import { DecorativeBox } from './decorative-box.js';",
		'',
	].join('\n');

	expect(importSpecifiersFromSource(source)).toEqual(['@luke-ui/react/box', './decorative-box.js']);
	expect(canRunInPlayground(source, specifiers)).toBe(false);
});

test('treats an example that only imports playground specifiers as runnable', () => {
	const source = [
		"import { Button } from '@luke-ui/react/button';",
		"import { Comparison, ExampleItem } from '#docs';",
		'',
	].join('\n');

	expect(canRunInPlayground(source, specifiers)).toBe(true);
});
