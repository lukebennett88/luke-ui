import { transform } from 'sucrase';

export type PlaygroundScope = Record<string, unknown>;

/**
 * Creates a compiler that returns compiled source's default export. It only
 * rejects a missing default export (`undefined` or `null`); validating the
 * result as a component type is up to the host, because `memo`, `forwardRef`,
 * and `lazy` all produce objects, not functions.
 */
export function createPlaygroundCompiler(scope: PlaygroundScope): {
	compileComponent: (code: string) => unknown;
} {
	// Interop wrappers are cached so repeated requires return stable module objects.
	const moduleCache = new Map<string, Record<string, unknown>>();

	function requireModule(specifier: string): Record<string, unknown> {
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
	}

	function compileComponent(code: string): unknown {
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
		if (component === undefined || component === null) {
			throw new Error('Playground code must default-export a React component.');
		}
		return component;
	}

	return { compileComponent };
}
