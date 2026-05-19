import { describe, expect, it } from 'vitest';
import type { LlmsFullEntry } from '../render-llms-full.js';
import { renderLlmsFull, sortLlmsFullEntries } from '../render-llms-full.js';

const md = (slug: string): string => `# ${slug}\nbody-${slug}`;

describe('sortLlmsFullEntries', () => {
	it('orders atoms → composed → barrels → primitives, each alphabetical by slug', () => {
		const entries: Array<LlmsFullEntry> = [
			// Deliberately mixed and non-alphabetic insertion order.
			{
				slug: 'combobox-field-primitive',
				shape: 'component',
				tier: 'primitive',
				md: md('combobox-field-primitive'),
			},
			{ slug: 'tokens', shape: 'barrel', tier: 'n/a', md: md('tokens') },
			{ slug: 'button', shape: 'component', tier: 'composed', md: md('button') },
			{ slug: 'icon', shape: 'component', tier: 'atom', md: md('icon') },
			{
				slug: 'button-primitive',
				shape: 'component',
				tier: 'primitive',
				md: md('button-primitive'),
			},
			{ slug: 'recipes', shape: 'barrel', tier: 'n/a', md: md('recipes') },
			{ slug: 'avatar', shape: 'component', tier: 'composed', md: md('avatar') },
			{ slug: 'emoji', shape: 'component', tier: 'atom', md: md('emoji') },
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
		const entries: Array<LlmsFullEntry> = [
			{ slug: 'stylesheet', shape: 'asset', tier: 'n/a', md: md('stylesheet') },
			{ slug: 'button', shape: 'component', tier: 'composed', md: md('button') },
			// component with tier 'n/a' should not slip through as composed.
			{ slug: 'mystery', shape: 'component', tier: 'n/a', md: md('mystery') },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['button']);
	});

	it('treats atoms before composed regardless of slug ordering', () => {
		const entries: Array<LlmsFullEntry> = [
			{ slug: 'aardvark', shape: 'component', tier: 'composed', md: md('aardvark') },
			{ slug: 'zebra', shape: 'component', tier: 'atom', md: md('zebra') },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['zebra', 'aardvark']);
	});

	it('places barrels before primitives even when primitive slugs sort earlier', () => {
		const entries: Array<LlmsFullEntry> = [
			{
				slug: 'aardvark-primitive',
				shape: 'component',
				tier: 'primitive',
				md: md('aardvark-primitive'),
			},
			{ slug: 'tokens', shape: 'barrel', tier: 'n/a', md: md('tokens') },
		];
		const sorted = sortLlmsFullEntries(entries).map((e) => e.slug);
		expect(sorted).toEqual(['tokens', 'aardvark-primitive']);
	});

	it('does not mutate the input array', () => {
		const entries: Array<LlmsFullEntry> = [
			{ slug: 'b', shape: 'component', tier: 'composed', md: md('b') },
			{ slug: 'a', shape: 'component', tier: 'composed', md: md('a') },
		];
		const snapshot = entries.map((e) => e.slug);
		sortLlmsFullEntries(entries);
		expect(entries.map((e) => e.slug)).toEqual(snapshot);
	});
});

describe('renderLlmsFull', () => {
	it('concatenates markdown in canonical (atom → composed → barrel → primitive) order', () => {
		// Insertion order is intentionally jumbled.
		const entries: Array<LlmsFullEntry> = [
			{
				slug: 'combobox-field-primitive',
				shape: 'component',
				tier: 'primitive',
				md: md('combobox-field-primitive'),
			},
			{ slug: 'tokens', shape: 'barrel', tier: 'n/a', md: md('tokens') },
			{ slug: 'button', shape: 'component', tier: 'composed', md: md('button') },
			{ slug: 'icon', shape: 'component', tier: 'atom', md: md('icon') },
			{
				slug: 'button-primitive',
				shape: 'component',
				tier: 'primitive',
				md: md('button-primitive'),
			},
			{ slug: 'recipes', shape: 'barrel', tier: 'n/a', md: md('recipes') },
			{ slug: 'avatar', shape: 'component', tier: 'composed', md: md('avatar') },
			{ slug: 'emoji', shape: 'component', tier: 'atom', md: md('emoji') },
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
			{ slug: 'stylesheet', shape: 'asset', tier: 'n/a', md: md('stylesheet') },
		]);
		expect(output).toMatch(/^# Luke UI — full documentation/);
		expect(output).not.toContain('---');
	});
});
