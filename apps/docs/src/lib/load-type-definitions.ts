import type { TypeDefinitionsPayload } from './type-definition-model.js';
import { parseTypeDefinitionsPayload } from './type-definition-model.js';

const requests = new Map<string, Promise<TypeDefinitionsPayload>>();

/** Fetches one table's type-definition asset. Shares a request per href and forgets failures. */
export function loadTypeDefinitions(href: string): Promise<TypeDefinitionsPayload> {
	const existing = requests.get(href);
	if (existing !== undefined) return existing;

	const request = fetch(href)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to load type definitions from ${href} (${response.status})`);
			}
			return parseTypeDefinitionsPayload(await response.json());
		})
		.catch((error: unknown) => {
			requests.delete(href);
			throw error;
		});

	requests.set(href, request);
	return request;
}
