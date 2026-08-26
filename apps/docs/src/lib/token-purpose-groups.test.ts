import { expect, test } from 'vite-plus/test';
import { themeTokens } from '../generated/token-reference.generated.js';
import { buildTokenPurposeGroups } from './token-purpose-groups.js';

test('every generated token belongs to exactly one purpose group', () => {
	const groups = buildTokenPurposeGroups();
	const grouped = groups.flatMap((group) => group.tokens.map((token) => token.path));

	expect([...grouped].sort()).toEqual(themeTokens.map((token) => token.path).sort());
	expect(new Set(grouped).size).toBe(grouped.length);
});

test('no purpose group is empty', () => {
	for (const group of buildTokenPurposeGroups()) {
		expect(group.tokens.length, `${group.id} has no tokens`).toBeGreaterThan(0);
	}
});
