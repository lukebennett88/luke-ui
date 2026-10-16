import type { ReactNode } from 'react';
import { createContext, useEffect, useReducer, useRef } from 'react';
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

	const [load, dispatch] = useReducer(typeDefinitionsLoadReducer, { status: 'idle' });
	const loadRef = useRef(load);

	useEffect(() => {
		loadRef.current = load;
	}, [load]);

	useEffect(() => {
		dispatch({ type: 'reset' });
	}, [resolvedHref]);

	const registeredNames =
		definitionNames === undefined
			? undefined
			: new Set(definitionNames.filter((name) => name.length > 0));

	const definitions = load.status === 'ready' ? load.data : {};

	const ensureLoaded = async (): Promise<void> => {
		if (resolvedHref === undefined) return;
		const href = resolvedHref;
		const current = loadRef.current;
		if (current.status === 'ready' && current.href === href) return;
		if (current.status === 'loading' && current.href === href) return;

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
