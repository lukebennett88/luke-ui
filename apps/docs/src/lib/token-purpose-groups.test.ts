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

test('shows samples only when a purpose group has one coherent preview treatment', () => {
	const sampleVisibility = Object.fromEntries(
		buildTokenPurposeGroups().map((group) => [group.id, group.showSamples]),
	);

	expect(sampleVisibility).toEqual({
		borders: true,
		content: true,
		depth: false,
		interaction: true,
		motion: true,
		radius: true,
		roles: true,
		sizing: true,
		spacing: true,
		surfaces: true,
		typography: false,
	});
});

test('splits the colour family across the purposes it serves', () => {
	const purposeOf = new Map(
		buildTokenPurposeGroups().flatMap((group) => {
			return group.tokens.map((token) => [token.path, group.id] as const);
		}),
	);

	expect(purposeOf.get('color.surface.canvas')).toBe('surfaces');
	expect(purposeOf.get('color.overlay.backdrop')).toBe('surfaces');
	expect(purposeOf.get('color.overlay.hover')).toBe('interaction');
	expect(purposeOf.get('color.overlay.pressed')).toBe('interaction');
	expect(purposeOf.get('color.text.secondary')).toBe('content');
	expect(purposeOf.get('color.loadingSkeleton')).toBe('content');
	expect(purposeOf.get('color.border.focus')).toBe('borders');
	expect(purposeOf.get('color.border.danger')).toBe('roles');
	expect(purposeOf.get('color.background.accent.solid.hover')).toBe('roles');
	expect(purposeOf.get('color.foreground.warning.onSolid')).toBe('roles');
	expect(purposeOf.get('actionControlFinish.raised')).toBe('depth');
	expect(purposeOf.get('iconSize.large')).toBe('sizing');
});
