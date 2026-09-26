import { expect, test } from 'vite-plus/test';
import { compileComponent, createRequireModule } from './compile.js';
import { renderPlaygroundScopeModule } from './generate-scope.js';

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
	expect(() => requireModule('missing')).toThrow(/Cannot import 'missing'/);
});

test('renderPlaygroundScopeModule emits import map source', () => {
	const source = renderPlaygroundScopeModule(['react', '@luke-ui/react/box']);
	expect(source).toContain("import * as react from 'react';");
	expect(source).toContain("import * as luke_ui_react_box from '@luke-ui/react/box';");
	expect(source).toContain("'react': react,");
	expect(source).toContain("'@luke-ui/react/box': luke_ui_react_box,");
});
