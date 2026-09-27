import * as React from 'react';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import { expect, test } from 'vite-plus/test';
import { compileComponent, createPlaygroundCompiler, createRequireModule } from './compiler.js';

const reactScope = {
	react: React,
	'react/jsx-runtime': ReactJsxRuntime,
};

test('compileComponent default-exports a function component from scope', () => {
	const requireModule = createRequireModule({
		react: { createElement: () => null },
	});
	const Component = compileComponent(
		`export default function Demo() { return null; }`,
		requireModule,
	);
	expect(typeof Component).toBe('function');
});

test('compileComponent rejects a module with no default export', () => {
	const requireModule = createRequireModule({});
	expect(() => compileComponent('export const value = 1;', requireModule)).toThrow(
		/default-export a React component/,
	);
});

test('compileComponent rejects a default export of null', () => {
	const requireModule = createRequireModule({});
	expect(() => compileComponent('export default null;', requireModule)).toThrow(
		/default-export a React component/,
	);
});

test('compileComponent accepts a memo component', () => {
	const requireModule = createRequireModule(reactScope);
	const Component = compileComponent(
		[
			"import { memo } from 'react';",
			'function Demo() { return null; }',
			'export default memo(Demo);',
		].join('\n'),
		requireModule,
	);
	expect(Component).not.toBeNull();
	expect(typeof Component).toBe('object');
});

test('compileComponent accepts a forwardRef component', () => {
	const requireModule = createRequireModule(reactScope);
	const Component = compileComponent(
		[
			"import { forwardRef } from 'react';",
			'function Demo(_props, ref) { return null; }',
			'export default forwardRef(Demo);',
		].join('\n'),
		requireModule,
	);
	expect(Component).not.toBeNull();
	expect(typeof Component).toBe('object');
});

test('compileComponent accepts a lazy component', () => {
	const requireModule = createRequireModule(reactScope);
	const Component = compileComponent(
		[
			"import { lazy } from 'react';",
			'export default lazy(() => Promise.resolve({ default: () => null }));',
		].join('\n'),
		requireModule,
	);
	expect(Component).not.toBeNull();
	expect(typeof Component).toBe('object');
});

test('createRequireModule throws for unknown specifiers', () => {
	const requireModule = createRequireModule({ react: {} });
	expect(() => requireModule('missing')).toThrow(
		"Cannot import 'missing': module is not in the playground scope.",
	);
});

test('createPlaygroundCompiler resolves imports from its scope', () => {
	const { compileComponent: compile } = createPlaygroundCompiler({
		'example-ui/greeting': { greeting: 'hello' },
	});
	const Component = compile(
		"import { greeting } from 'example-ui/greeting';\nexport default function Demo() { return greeting; }",
	);
	expect((Component as () => string)()).toBe('hello');
});
