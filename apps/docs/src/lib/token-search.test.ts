import { expect, test } from 'vite-plus/test';
import { themeTokens } from '../generated/token-reference.generated.js';
import { findTokens } from './token-search.js';

test('a copied vars expression finds its token', () => {
	for (const token of themeTokens) {
		expect(findTokens(`vars.${token.path}`)).toContainEqual(token);
	}
});

test('CSS variable forms find the same token', () => {
	const token = themeTokens.find(({ path }) => path === 'color.border.warning');
	expect(token).toBeDefined();
	if (token === undefined) return;
	expect(findTokens(token.variable)).toContainEqual(token);
	expect(findTokens(`var(${token.variable})`)).toContainEqual(token);
});

test('an unmatched query returns no results', () => {
	expect(findTokens('not-a-luke-token')).toEqual([]);
});
