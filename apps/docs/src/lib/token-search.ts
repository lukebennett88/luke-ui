import type { ThemeToken } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';

/** Finds contract tokens by typed path or CSS custom property. */
export function findTokens(query: string): ReadonlyArray<ThemeToken> {
	const term = normalizeTokenQuery(query);
	if (term === '') return [];
	return themeTokens.filter((token) => {
		return token.path.toLowerCase().includes(term) || token.variable.toLowerCase().includes(term);
	});
}

/** Accepts text copied from the catalogue or written for plain CSS. */
function normalizeTokenQuery(query: string): string {
	let term = query.trim().toLowerCase();
	if (term.startsWith('vars.')) term = term.slice(5);
	if (term.startsWith('var(') && term.endsWith(')')) term = term.slice(4, -1).trim();
	return term;
}
