import { describe, expect, it } from 'vite-plus/test';
import type { PackageDocsCatalogMetadata } from './package-docs-catalog.js';
import { renderLlmsFull, sortLlmsFullEntries } from './render-llms-full.js';

type LlmsFullFixture = Pick<PackageDocsCatalogMetadata, 'slug' | 'shape' | 'tier'> & {
	md: string;
};

const md = (slug: string): string => `# ${slug}\nbody-${slug}`;

describe('sortLlmsFullEntries', () => {
	it('orders atoms → composed → barrels → primitives, each alphabetical by slug', () => {
		const entries: Array<LlmsFullFixture> = [
			// Deliberately mixed and non-alphabetic insertion order.
			{
				md: md('combobox-field-primitive'),
				shape: 'component',
				slug: 'combobox-field-primitive',
				tier: 'primitive',
			},
			{ md: md('tokens'), shape: 'barrel', slug: 'tokens', tier: 'n/a' },
			{ md: md('button'), shape: 'component', slug: 'button', tier: 'composed' },
			{ md: md('icon'), shape: 'component', slug: 'icon', tier: 'atom' },
			{
				md: md('button-primitive'),
				shape: 'component',
				slug: 'button-primitive',
				tier: 'primitive',
			},
			{ md: md('recipes'), shape: 'barrel', slug: 'recipes', tier: 'n/a' },
			{ md: md('avatar'), shape: 'component', slug: 'avatar', tier: 'composed' },
			{ md: md('emoji'), shape: 'component', slug: 'emoji', tier: 'atom' },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual([
			// atoms
			'emoji',
			'icon',
			// composed
			'avatar',
			'button',
			// barrels
			'recipes',
			'tokens',
			// primitives
			'button-primitive',
			'combobox-field-primitive',
		]);
	});

	it('drops entries that do not belong to a bucket (assets, unknown tiers)', () => {
		const entries: Array<LlmsFullFixture> = [
			{ md: md('stylesheet'), shape: 'asset', slug: 'stylesheet', tier: 'n/a' },
			{ md: md('button'), shape: 'component', slug: 'button', tier: 'composed' },
			// component with tier 'n/a' should not slip through as composed.
			{ md: md('mystery'), shape: 'component', slug: 'mystery', tier: 'n/a' },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['button']);
	});

	it('treats atoms before composed regardless of slug ordering', () => {
		const entries: Array<LlmsFullFixture> = [
			{ md: md('aardvark'), shape: 'component', slug: 'aardvark', tier: 'composed' },
			{ md: md('zebra'), shape: 'component', slug: 'zebra', tier: 'atom' },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['zebra', 'aardvark']);
	});

	it('places barrels before primitives even when primitive slugs sort earlier', () => {
		const entries: Array<LlmsFullFixture> = [
			{
				md: md('aardvark-primitive'),
				shape: 'component',
				slug: 'aardvark-primitive',
				tier: 'primitive',
			},
			{ md: md('tokens'), shape: 'barrel', slug: 'tokens', tier: 'n/a' },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['tokens', 'aardvark-primitive']);
	});

	it('does not mutate the input array', () => {
		const entries: Array<LlmsFullFixture> = [
			{ md: md('b'), shape: 'component', slug: 'b', tier: 'composed' },
			{ md: md('a'), shape: 'component', slug: 'a', tier: 'composed' },
		];
		const snapshot = entries.map((e) => e.slug);
		sortLlmsFullEntries(entries);
		expect(entries.map((e) => e.slug)).toEqual(snapshot);
	});
});

describe('renderLlmsFull', () => {
	it('concatenates markdown in canonical (atom → composed → barrel → primitive) order', () => {
		// Insertion order is intentionally jumbled.
		const entries: Array<LlmsFullFixture> = [
			{
				md: md('combobox-field-primitive'),
				shape: 'component',
				slug: 'combobox-field-primitive',
				tier: 'primitive',
			},
			{ md: md('tokens'), shape: 'barrel', slug: 'tokens', tier: 'n/a' },
			{ md: md('button'), shape: 'component', slug: 'button', tier: 'composed' },
			{ md: md('icon'), shape: 'component', slug: 'icon', tier: 'atom' },
			{
				md: md('button-primitive'),
				shape: 'component',
				slug: 'button-primitive',
				tier: 'primitive',
			},
			{ md: md('recipes'), shape: 'barrel', slug: 'recipes', tier: 'n/a' },
			{ md: md('avatar'), shape: 'component', slug: 'avatar', tier: 'composed' },
			{ md: md('emoji'), shape: 'component', slug: 'emoji', tier: 'atom' },
		];

		const output = renderLlmsFull(entries);

		const positions = [
			'# emoji',
			'# icon',
			'# avatar',
			'# button',
			'# recipes',
			'# tokens',
			'# button-primitive',
			'# combobox-field-primitive',
		].map((needle) => output.indexOf(needle));

		expect(positions.every((p) => p > -1)).toBe(true);
		for (let i = 1; i < positions.length; i++) {
			expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
		}

		expect(output).toMatch(/^# Luke UI — full documentation/);
	});

	it('emits only the header when no entries fall into a bucket', () => {
		const output = renderLlmsFull([
			{ md: md('stylesheet'), shape: 'asset', slug: 'stylesheet', tier: 'n/a' },
		]);
		expect(output).toMatch(/^# Luke UI — full documentation/);
		expect(output).not.toContain('---');
	});
});
