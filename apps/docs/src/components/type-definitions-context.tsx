import type { ReactNode } from 'react';
import { createContext, useReducer } from 'react';
import { withBasePath } from '../lib/base-path.js';
import { loadTypeDefinitions } from '../lib/load-type-definitions.js';
import type { TypeDefinitionsPayload } from '../lib/type-definition-model.js';
import type { TypeDefinitionsLoadState } from '../lib/type-definitions-load-state.js';
import { typeDefinitionsLoadReducer } from '../lib/type-definitions-load-state.js';

export interface TypeDefinitionsContextValue {
	canLink: (typeName: string) => boolean;
	definitions: TypeDefinitionsPayload;
	/** Settles without throwing; failures update `load`. */
	ensureLoaded: () => Promise<void>;
	load: TypeDefinitionsLoadState;
}

/** Absent outside a provider: standalone tables render types as plain text. */
export const TypeDefinitionsContext = createContext<TypeDefinitionsContextValue | null>(null);

/** Loads page-level definition JSON for linked alias popovers. */
export function TypeDefinitionsProvider({
	children,
	definitionNames,
	definitionsHref,
}: {
	children: ReactNode;
	/** Aliases present in the page asset. Required for deferred linking. */
	definitionNames?: ReadonlyArray<string>;
	definitionsHref?: string;
}) {
	const resolvedHref =
		definitionsHref === undefined
			? undefined
			: withBasePath(definitionsHref, import.meta.env.BASE_URL);

	// Remount when the asset URL changes so load state resets without an effect.
	return (
		<TypeDefinitionsLoader
			key={resolvedHref ?? ''}
			definitionNames={definitionNames}
			href={resolvedHref}
		>
			{children}
		</TypeDefinitionsLoader>
	);
}

function TypeDefinitionsLoader({
	children,
	definitionNames,
	href,
}: {
	children: ReactNode;
	definitionNames?: ReadonlyArray<string>;
	href: string | undefined;
}) {
	const [load, dispatch] = useReducer(typeDefinitionsLoadReducer, { status: 'idle' });

	const registeredNames =
		definitionNames === undefined
			? undefined
			: new Set(definitionNames.filter((name) => name.length > 0));

	const definitions = load.status === 'ready' ? load.data : {};

	const ensureLoaded = async (): Promise<void> => {
		if (href === undefined) return;
		if (load.status === 'ready' && load.href === href) return;
		if (load.status === 'loading' && load.href === href) return;

		dispatch({ href, type: 'load-start' });
		try {
			const data = await loadTypeDefinitions(href);
			dispatch({ data, href, type: 'load-success' });
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to load type definitions';
			dispatch({ href, message, type: 'load-error' });
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
