'use client';

import type { ReactNode } from 'react';
import { createContext, useState } from 'react';
import { withBasePath } from '../lib/base-path.js';
import { loadTypeDefinitions } from '../lib/load-type-definitions.js';
import type { TypeDefinitionsPayload } from '../lib/type-definition-model.js';

export type TypeDefinitionsLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface TypeDefinitionsContextValue {
	/** True when this name should render as a type popover trigger. */
	canLink: (typeName: string) => boolean;
	definitions: TypeDefinitionsPayload;
	/**
	 * Loads the page-level definition asset when needed. Settles without throwing so callers can
	 * `void ensureLoaded()` safely; failures update `loadStatus` / `loadError` instead.
	 */
	ensureLoaded: () => Promise<TypeDefinitionsPayload>;
	loadError: string | null;
	loadStatus: TypeDefinitionsLoadStatus;
}

export const TypeDefinitionsContext = createContext<TypeDefinitionsContextValue>({
	canLink: () => false,
	definitions: {},
	ensureLoaded: async () => ({}),
	loadError: null,
	loadStatus: 'idle',
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
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loadStatus, setLoadStatus] = useState<TypeDefinitionsLoadStatus>(() =>
		syncDefinitions !== undefined ? 'ready' : 'idle',
	);

	// Root-relative assets from MDX must respect Vite's base when docs deploy under a subpath.
	const resolvedHref =
		definitionsHref === undefined
			? undefined
			: withBasePath(definitionsHref, import.meta.env.BASE_URL);

	const definitions =
		syncDefinitions ?? (fetched !== null && fetched.href === resolvedHref ? fetched.data : {});

	const ensureLoaded = async (): Promise<TypeDefinitionsPayload> => {
		if (syncDefinitions !== undefined) return syncDefinitions;
		if (resolvedHref === undefined) return {};
		if (fetched !== null && fetched.href === resolvedHref) {
			setLoadStatus('ready');
			setLoadError(null);
			return fetched.data;
		}

		setLoadStatus('loading');
		setLoadError(null);
		try {
			const data = await loadTypeDefinitions(resolvedHref);
			setFetched({ data, href: resolvedHref });
			setLoadStatus('ready');
			setLoadError(null);
			return data;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to load type definitions';
			setLoadError(message);
			setLoadStatus('error');
			return {};
		}
	};

	const canLink = (typeName: string): boolean => {
		if (definitions[typeName] !== undefined) return true;
		// Build-time `typeHref` is only set when a definition was collected; the page asset holds it.
		return definitionsHref !== undefined;
	};

	return (
		<TypeDefinitionsContext.Provider
			value={{ canLink, definitions, ensureLoaded, loadError, loadStatus }}
		>
			{children}
		</TypeDefinitionsContext.Provider>
	);
}
