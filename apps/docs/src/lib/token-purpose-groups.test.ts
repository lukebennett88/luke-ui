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

const COLOR_PURPOSE_ROUTES = [
	['color.surface.canvas', 'surfaces'],
	['color.overlay.backdrop', 'surfaces'],
	['color.text.secondary', 'content'],
	['color.loadingSkeleton', 'content'],
	['color.border.focus', 'borders'],
	['color.border.danger', 'roles'],
	['color.background.accent.solid.hover', 'roles'],
	['color.foreground.warning.onSolid', 'roles'],
] as const;

test('routes colour families across surfaces, content, borders, and roles', () => {
	const purposeOf = new Map(
		buildTokenPurposeGroups().flatMap((group) => {
			return group.tokens.map((token) => [token.path, group.id] as const);
		}),
	);

	for (const [path, purpose] of COLOR_PURPOSE_ROUTES) {
		expect(purposeOf.get(path), path).toBe(purpose);
	}
});
