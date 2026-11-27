import type { RouterOptions } from '@tanstack/react-router';

type SearchOptions = Pick<RouterOptions<never, never>, 'parseSearch' | 'stringifySearch'>;

/**
 * Keeps every search value a plain string. The router's default JSON parsing would turn `?pr=12`
 * into a number and re-encode strings, but the app reads the query string itself, and pull request
 * comments link to it, so it must round-trip unchanged.
 */
export const searchOptions = {
	parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
	stringifySearch: (search) => {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(search)) {
			if (typeof value === 'string') params.set(key, value);
		}
		const query = params.toString();
		return query ? `?${query}` : '';
	},
} satisfies SearchOptions;
