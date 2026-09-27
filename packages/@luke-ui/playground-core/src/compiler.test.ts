import { expect, test } from 'vite-plus/test';
import { compileComponent, createPlaygroundCompiler, createRequireModule } from './compiler.js';

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

test('compileComponent rejects modules without a default export function', () => {
	const requireModule = createRequireModule({});
	expect(() => compileComponent('export const value = 1;', requireModule)).toThrow(
		/default-export a React component/,
	);
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
