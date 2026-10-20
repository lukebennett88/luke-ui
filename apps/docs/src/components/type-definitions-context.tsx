import type { ReactNode } from 'react';
import { createContext, useCallback, useMemo, useReducer } from 'react';
import { loadTypeDefinitions } from '../lib/load-type-definitions.js';
import type { TypeDefinitionsLoadState } from '../lib/type-definitions-load-state.js';
import { typeDefinitionsLoadReducer } from '../lib/type-definitions-load-state.js';

export interface TypeDefinitionsContextValue {
	/** Starts loading the definitions unless they are loading or loaded. Never rejects. */
	ensureLoaded: () => Promise<void>;
	load: TypeDefinitionsLoadState;
	/** Aliases the definitions asset holds, known before it loads. */
	names: ReadonlySet<string>;
}

/** Absent outside a provider, where tables render types as plain text. */
export const TypeDefinitionsContext = createContext<TypeDefinitionsContextValue | null>(null);

/** Loads a props table's definitions asset for its linked type popovers. */
export function TypeDefinitionsProvider({
	children,
	definitionNames,
	definitionsHref,
}: {
	children: ReactNode;
	definitionNames: ReadonlyArray<string>;
	definitionsHref: string;
}) {
	// A new asset, such as after a dev rebuild, remounts the loader so its state starts over.
	return (
		<TypeDefinitionsLoader href={definitionsHref} key={definitionsHref} names={definitionNames}>
			{children}
		</TypeDefinitionsLoader>
	);
}

function TypeDefinitionsLoader({
	children,
	href,
	names,
}: {
	children: ReactNode;
	href: string;
	names: ReadonlyArray<string>;
}) {
	const [load, dispatch] = useReducer(typeDefinitionsLoadReducer, { status: 'idle' });

	const ensureLoaded = useCallback(async () => {
		if (load.status === 'loading' || load.status === 'ready') return;

		dispatch({ type: 'load-start' });
		try {
			dispatch({ data: await loadTypeDefinitions(href), type: 'load-success' });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to load type definitions';
			dispatch({ message, type: 'load-error' });
		}
	}, [href, load.status]);

	const nameSet = useMemo(() => new Set(names), [names]);
	const value = useMemo(
		() => ({ ensureLoaded, load, names: nameSet }),
		[ensureLoaded, load, nameSet],
	);

	return (
		<TypeDefinitionsContext.Provider value={value}>{children}</TypeDefinitionsContext.Provider>
	);
}
