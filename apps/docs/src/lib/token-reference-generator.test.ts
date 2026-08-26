import { expect, test } from 'vite-plus/test';
import { generateTokenReference } from '../../scripts/generate-token-reference.js';
import { themeTokens } from '../generated/token-reference.generated.js';

test('declares the family union the token entries are keyed by', () => {
	const reference = generateTokenReference();

	expect(reference).toContain('export type ThemeTokenFamily =');
	for (const family of new Set(themeTokens.map((token) => token.family))) {
		expect(reference).toContain(`| '${family}'`);
	}
});
