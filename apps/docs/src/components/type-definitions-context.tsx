'use client';

import type { ReactNode } from 'react';
import { createContext, useState } from 'react';
import { loadTypeDefinitions } from '../lib/load-type-definitions.js';
import type { TypeDefinitionsPayload } from '../lib/type-definition-model.js';

export interface TypeDefinitionsContextValue {
	/** True when this name should render as a type popover trigger. */
	canLink: (typeName: string) => boolean;
	definitions: TypeDefinitionsPayload;
	ensureLoaded: () => Promise<TypeDefinitionsPayload>;
}

export const TypeDefinitionsContext = createContext<TypeDefinitionsContextValue>({
	canLink: () => false,
	definitions: {},
	ensureLoaded: async () => ({}),
});

/**
 * Provides source-backed type definitions for linked alias popovers.
 * Prefer a page-level `definitionsHref` asset; sync `definitions` is for tests and story fixtures.
 */
export function TypeDefinitionsProvider({
	children,
	definitions: syncDefinitions,
	definitionsHref,
}: {
	children: ReactNode;
	definitions?: TypeDefinitionsPayload;
	definitionsHref?: string;
}) {
	const [fetched, setFetched] = useState<{
		data: TypeDefinitionsPayload;
		href: string;
	} | null>(null);

	const definitions =
		syncDefinitions ?? (fetched !== null && fetched.href === definitionsHref ? fetched.data : {});

	const ensureLoaded = async (): Promise<TypeDefinitionsPayload> => {
		if (syncDefinitions !== undefined) return syncDefinitions;
		if (fetched !== null && fetched.href === definitionsHref) return fetched.data;
		if (definitionsHref === undefined) return {};
		const data = await loadTypeDefinitions(definitionsHref);
		setFetched({ data, href: definitionsHref });
		return data;
	};

	const canLink = (typeName: string): boolean => {
		if (definitions[typeName] !== undefined) return true;
		// Build-time `typeHref` is only set when a definition was collected; the page asset holds it.
		return definitionsHref !== undefined;
	};

	return (
		<TypeDefinitionsContext.Provider value={{ canLink, definitions, ensureLoaded }}>
			{children}
		</TypeDefinitionsContext.Provider>
	);
}
