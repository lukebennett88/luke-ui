import type { ComponentType } from 'react';
import { transform } from 'sucrase';

export type PlaygroundScope = Record<string, unknown>;

/**
 * Builds a CommonJS-style `require` that resolves against a host-supplied scope
 * map (for example the docs-generated `playgroundScope`).
 */
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
			throw new Error(
				`Cannot import '${specifier}' — only react and @luke-ui/react/* modules are available in the playground.`,
			);
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
	// Evaluating user code is the point of the playground; it only ever comes
	// from the user's own editor or URL hash (same trust model as the
	// TypeScript playground).
	// oxlint-disable-next-line typescript/no-implied-eval
	new Function('require', 'module', 'exports', compiled)(requireModule, module, module.exports);

	const component = module.exports.default;
	if (typeof component !== 'function') {
		throw new Error('Playground code must default-export a React component.');
	}
	return component as ComponentType;
}

/** Host-supplied scope map → compile helper that resolves imports against it. */
export function createPlaygroundCompiler(scope: PlaygroundScope) {
	const requireModule = createRequireModule(scope);
	return {
		compileComponent: (code: string) => compileComponent(code, requireModule),
		requireModule,
	};
}
