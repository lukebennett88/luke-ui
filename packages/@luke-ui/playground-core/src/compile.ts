import type { ComponentType } from 'react';
import { transform } from 'sucrase';

export type PlaygroundScope = Record<string, unknown>;

/** Builds a `require` function that resolves modules from the host-supplied scope. */
export function createRequireModule(
	scope: PlaygroundScope,
): (specifier: string) => Record<string, unknown> {
	// Interop wrappers are cached so repeated requires return stable module objects.
	const moduleCache = new Map<string, Record<string, unknown>>();

	return function requireModule(specifier: string): Record<string, unknown> {
		const cached = moduleCache.get(specifier);
		if (cached) return cached;

		const namespace = scope[specifier];
		if (namespace === undefined) {
			throw new Error(`Cannot import '${specifier}': module is not in the playground scope.`);
		}

		// Mark as an ES module so sucrase's interop resolves default imports correctly.
		const module = { ...(namespace as Record<string, unknown>), __esModule: true };
		moduleCache.set(specifier, module);
		return module;
	};
}

export function compileComponent(
	code: string,
	requireModule: (specifier: string) => Record<string, unknown>,
): ComponentType {
	const compiled = transform(code, {
		jsxRuntime: 'automatic',
		production: true,
		transforms: ['typescript', 'jsx', 'imports'],
	}).code;

	const module: { exports: { default?: unknown } } = { exports: {} };
	// The playground executes code from its editor or URL hash.
	// oxlint-disable-next-line typescript/no-implied-eval
	new Function('require', 'module', 'exports', compiled)(requireModule, module, module.exports);

	const component = module.exports.default;
	if (typeof component !== 'function') {
		throw new Error('Playground code must default-export a React component.');
	}
	return component as ComponentType;
}

/** Creates a compiler that resolves imports from the host-supplied scope. */
export function createPlaygroundCompiler(scope: PlaygroundScope) {
	const requireModule = createRequireModule(scope);
	return {
		compileComponent: (code: string) => compileComponent(code, requireModule),
		requireModule,
	};
}
