import { describe, expect, it } from 'vite-plus/test';
import type { Oklch } from './color.js';
import { generateSurfaces } from './surfaces.js';

const lightBase: Oklch = { l: 0.985, c: 0.006, h: 90 };
const darkBase: Oklch = { l: 0.18, c: 0.01, h: 260 };

describe('generateSurfaces', () => {
	it('passes the base through exactly, in both modes', () => {
		expect(generateSurfaces({ mode: 'light', surface: { base: lightBase } }).base).toEqual(
			lightBase,
		);
		expect(generateSurfaces({ mode: 'dark', surface: { base: darkBase } }).base).toEqual(darkBase);
	});

	it('emits exactly the three surface roles', () => {
		const surfaces = generateSurfaces({ mode: 'light', surface: { base: lightBase } });
		expect(Object.keys(surfaces).toSorted()).toEqual(['base', 'raised', 'subdued']);
	});

	describe('dark mode', () => {
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });

		it('sinks subdued below the base', () => {
			expect(surfaces.subdued.l).toBeLessThan(darkBase.l);
		});

		it('lifts raised above the base', () => {
			expect(surfaces.raised.l).toBeGreaterThan(darkBase.l);
		});
	});

	describe('light mode', () => {
		const surfaces = generateSurfaces({ mode: 'light', surface: { base: lightBase } });

		it('sinks subdued below the base', () => {
			expect(surfaces.subdued.l).toBeLessThan(lightBase.l);
		});

		it('lifts raised above the base only slightly', () => {
			expect(surfaces.raised.l).toBeGreaterThan(lightBase.l);
			expect(surfaces.raised.l - lightBase.l).toBeLessThan(0.05);
		});
	});

	it('derives each generated surface from the base, keeping its hue and chroma', () => {
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });
		for (const role of ['subdued', 'raised'] as const) {
			expect(surfaces[role].h).toBeCloseTo(darkBase.h, 5);
			expect(surfaces[role].c).toBeCloseTo(darkBase.c, 5);
		}
	});

	it('uses an authored surface as written and generates only the missing ones', () => {
		const subdued: Oklch = { l: 0.5, c: 0.02, h: 30 };
		const authored = generateSurfaces({ mode: 'light', surface: { base: lightBase, subdued } });
		const generated = generateSurfaces({ mode: 'light', surface: { base: lightBase } });

		expect(authored.subdued).toEqual(subdued);
		expect(authored.base).toEqual(generated.base);
		expect(authored.raised).toEqual(generated.raised);
	});

	it('generates a surface from the base, not from an authored sibling', () => {
		const subdued: Oklch = { l: 0.4, c: 0, h: 0 };
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase, subdued } });
		const generated = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });

		expect(surfaces.raised).toEqual(generated.raised);
	});
});
