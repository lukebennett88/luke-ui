import type { LinkedTypeDefinitions } from './type-definition-model.js';

const requests = new Map<string, Promise<LinkedTypeDefinitions>>();

/** Fetches one table's type-definition asset. Shares a request per href and forgets failures. */
export function loadTypeDefinitions(href: string): Promise<LinkedTypeDefinitions> {
	const existing = requests.get(href);
	if (existing !== undefined) return existing;

	const request = fetch(href)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to load type definitions from ${href} (${response.status})`);
			}
			const data: unknown = await response.json();
			if (!isLinkedTypeDefinitions(data)) throw new Error('Invalid type definitions payload');
			return data;
		})
		.catch((error: unknown) => {
			requests.delete(href);
			throw error;
		});

	requests.set(href, request);
	return request;
}

/**
 * The build validates each asset, so the browser checks only the shape it renders. A stale or
 * corrupt response then shows the popover's error state instead of the wrong text.
 */
function isLinkedTypeDefinitions(value: unknown): value is LinkedTypeDefinitions {
	if (!isRecord(value)) return false;
	return Object.values(value).every(
		(entry) =>
			isRecord(entry) &&
			(entry.definition === undefined || typeof entry.definition === 'string') &&
			(entry.resolved === undefined || typeof entry.resolved === 'string'),
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
