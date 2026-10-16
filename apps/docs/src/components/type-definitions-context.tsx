import type { ReactNode } from 'react';
import { createContext, useEffect, useReducer } from 'react';
import { withBasePath } from '../lib/base-path.js';
import { loadTypeDefinitions } from '../lib/load-type-definitions.js';
import type { TypeDefinitionsPayload } from '../lib/type-definition-model.js';

export type TypeDefinitionsLoadState =
	| { status: 'idle' }
	| { status: 'loading'; href: string }
	| { status: 'ready'; data: TypeDefinitionsPayload; href?: string }
	| { status: 'error'; href: string; message: string };

export interface TypeDefinitionsContextValue {
	/** True when this name should render as a type popover trigger. */
	canLink: (typeName: string) => boolean;
	definitions: TypeDefinitionsPayload;
	/**
	 * Loads the page-level definition asset when needed. Settles without throwing so callers can
	 * fire-and-forget; failures land in `load`.
	 */
	ensureLoaded: () => Promise<void>;
	load: TypeDefinitionsLoadState;
}

/** Absent outside a provider: standalone tables render types as plain text. */
export const TypeDefinitionsContext = createContext<TypeDefinitionsContextValue | null>(null);

/**
 * Provides source-backed type definitions for linked alias popovers.
 * Prefer a page-level `definitionsHref` asset; sync `definitions` is for tests and story fixtures.
 */
export function TypeDefinitionsProvider({
	children,
	definitionNames,
	definitions: syncDefinitions,
	definitionsHref,
}: {
	children: ReactNode;
	/**
	 * Build-time list of aliases present in the page asset. Required for deferred linking so
	 * `canLink` does not treat every name as loadable whenever `definitionsHref` is set.
	 */
	definitionNames?: ReadonlyArray<string>;
	definitions?: TypeDefinitionsPayload;
	definitionsHref?: string;
}) {
	if (syncDefinitions !== undefined) {
		return (
			<TypeDefinitionsContext.Provider
				value={{
					canLink: (typeName) => syncDefinitions[typeName] !== undefined,
					definitions: syncDefinitions,
					ensureLoaded: async () => {},
					load: { data: syncDefinitions, status: 'ready' },
				}}
			>
				{children}
			</TypeDefinitionsContext.Provider>
		);
	}

	return (
		<DeferredTypeDefinitionsProvider
			definitionNames={definitionNames}
			definitionsHref={definitionsHref}
		>
			{children}
		</DeferredTypeDefinitionsProvider>
	);
}

function DeferredTypeDefinitionsProvider({
	children,
	definitionNames,
	definitionsHref,
}: {
	children: ReactNode;
	definitionNames?: ReadonlyArray<string>;
	definitionsHref?: string;
}) {
	// Root-relative assets from MDX must respect Vite's base when docs deploy under a subpath.
	const resolvedHref =
		definitionsHref === undefined
			? undefined
			: withBasePath(definitionsHref, import.meta.env.BASE_URL);

	const [load, dispatch] = useReducer(deferredLoadReducer, { status: 'idle' } as const);

	useEffect(() => {
		dispatch({ type: 'reset' });
	}, [resolvedHref]);

	const registeredNames = (() => {
		if (definitionNames === undefined) return undefined;
		return new Set(definitionNames.filter((name) => name.length > 0));
	})();

	const definitions = load.status === 'ready' ? load.data : {};

	const ensureLoaded = async (): Promise<void> => {
		if (resolvedHref === undefined) return;
		if (load.status === 'ready' && load.href === resolvedHref) return;

		dispatch({ href: resolvedHref, type: 'load-start' });
		try {
			const data = await loadTypeDefinitions(resolvedHref);
			dispatch({ data, href: resolvedHref, type: 'load-success' });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to load type definitions';
			dispatch({ href: resolvedHref, message, type: 'load-error' });
		}
	};

	const canLink = (typeName: string): boolean => {
		if (definitions[typeName] !== undefined) return true;
		return registeredNames !== undefined && registeredNames.has(typeName);
	};

	return (
		<TypeDefinitionsContext.Provider value={{ canLink, definitions, ensureLoaded, load }}>
			{children}
		</TypeDefinitionsContext.Provider>
	);
}

type DeferredLoadAction =
	| { href: string; type: 'load-start' }
	| { data: TypeDefinitionsPayload; href: string; type: 'load-success' }
	| { href: string; message: string; type: 'load-error' }
	| { type: 'reset' };

function deferredLoadReducer(
	state: TypeDefinitionsLoadState,
	action: DeferredLoadAction,
): TypeDefinitionsLoadState {
	switch (action.type) {
		case 'reset':
			return { status: 'idle' };
		case 'load-start':
			return { href: action.href, status: 'loading' };
		case 'load-success':
			if (state.status === 'loading' && state.href !== action.href) return state;
			return { data: action.data, href: action.href, status: 'ready' };
		case 'load-error':
			if (state.status === 'loading' && state.href !== action.href) return state;
			return { href: action.href, message: action.message, status: 'error' };
	}
}
