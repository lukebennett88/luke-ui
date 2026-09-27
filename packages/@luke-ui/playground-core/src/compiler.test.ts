import * as React from 'react';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import { expect, test } from 'vite-plus/test';
import { createPlaygroundCompiler } from './compiler.js';

const reactScope = {
	react: React,
	'react/jsx-runtime': ReactJsxRuntime,
};

test('compileComponent default-exports a function component from scope', () => {
	const { compileComponent } = createPlaygroundCompiler({
		react: { createElement: () => null },
	});
	const Component = compileComponent(`export default function Demo() { return null; }`);
	expect(typeof Component).toBe('function');
});

test.each([
	[
		'memo',
		[
			"import { memo } from 'react';",
			'function Demo() { return null; }',
			'export default memo(Demo);',
		].join('\n'),
	],
	[
		'forwardRef',
		[
			"import { forwardRef } from 'react';",
			'function Demo(_props, ref) { return null; }',
			'export default forwardRef(Demo);',
		].join('\n'),
	],
	[
		'lazy',
		[
			"import { lazy } from 'react';",
			'export default lazy(() => Promise.resolve({ default: () => null }));',
		].join('\n'),
	],
])('compileComponent accepts a %s component', (_name, code) => {
	const { compileComponent } = createPlaygroundCompiler(reactScope);
	const Component = compileComponent(code);
	expect(Component).not.toBeNull();
	expect(typeof Component).toBe('object');
});

test.each([
	['no default export', 'export const value = 1;'],
	['a default export of null', 'export default null;'],
])('compileComponent rejects %s', (_name, code) => {
	const { compileComponent } = createPlaygroundCompiler({});
	expect(() => compileComponent(code)).toThrow(/default-export a React component/);
});

test('createPlaygroundCompiler throws for unknown specifiers', () => {
	const { compileComponent } = createPlaygroundCompiler({ react: {} });
	expect(() =>
		compileComponent(
			"import { missing } from 'missing';\nexport default function Demo() { return missing; };",
		),
	).toThrow("Cannot import 'missing': module is not in the playground scope.");
});

test('createPlaygroundCompiler resolves imports from its scope', () => {
	const { compileComponent } = createPlaygroundCompiler({
		'example-ui/greeting': { greeting: 'hello' },
	});
	const Component = compileComponent(
		"import { greeting } from 'example-ui/greeting';\nexport default function Demo() { return greeting; }",
	);
	expect((Component as () => string)()).toBe('hello');
});
