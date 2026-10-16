import type { TypeDefinitionsPayload } from './type-definition-model.js';

const cache = new Map<string, Promise<TypeDefinitionsPayload>>();

/** Clears the in-memory fetch cache. Used by tests between deferred-load cases. */
export function clearTypeDefinitionsCache(): void {
	cache.clear();
}

/** Fetches one page-level type-definition asset, caching the in-flight/completed result. */
export function loadTypeDefinitions(href: string): Promise<TypeDefinitionsPayload> {
	const cached = cache.get(href);
	if (cached !== undefined) return cached;

	const request = fetch(href)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to load type definitions from ${href} (${response.status})`);
			}
			const parsed: unknown = await response.json();
			if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
				return {};
			}
			return parsed as TypeDefinitionsPayload;
		})
		.catch((error: unknown) => {
			cache.delete(href);
			throw error;
		});

	cache.set(href, request);
	return request;
}
