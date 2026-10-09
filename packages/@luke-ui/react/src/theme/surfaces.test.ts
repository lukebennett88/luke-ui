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

	it('emits exactly the four surface roles', () => {
		const surfaces = generateSurfaces({ mode: 'light', surface: { base: lightBase } });
		expect(Object.keys(surfaces).sort()).toEqual(['base', 'field', 'overlay', 'subdued']);
	});

	describe('dark mode', () => {
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });

		it('sinks subdued and field below the base', () => {
			expect(surfaces.subdued.l).toBeLessThan(darkBase.l);
			expect(surfaces.field.l).toBeLessThan(darkBase.l);
		});

		it('lifts overlay above the base', () => {
			expect(surfaces.overlay.l).toBeGreaterThan(darkBase.l);
		});
	});

	describe('light mode', () => {
		const surfaces = generateSurfaces({ mode: 'light', surface: { base: lightBase } });

		it('keeps the field on the base and sinks subdued below it', () => {
			expect(surfaces.field).toEqual(lightBase);
			expect(surfaces.subdued.l).toBeLessThan(lightBase.l);
		});

		it('lifts overlay above the base only slightly', () => {
			expect(surfaces.overlay.l).toBeGreaterThan(lightBase.l);
			expect(surfaces.overlay.l - lightBase.l).toBeLessThan(0.05);
		});
	});

	it('derives each generated surface from the base, keeping its hue and chroma', () => {
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });
		for (const role of ['subdued', 'field', 'overlay'] as const) {
			expect(surfaces[role].h).toBeCloseTo(darkBase.h, 5);
			expect(surfaces[role].c).toBeCloseTo(darkBase.c, 5);
		}
	});

	it('uses an authored surface as written and generates only the missing ones', () => {
		const field: Oklch = { l: 0.5, c: 0.02, h: 30 };
		const authored = generateSurfaces({ mode: 'light', surface: { base: lightBase, field } });
		const generated = generateSurfaces({ mode: 'light', surface: { base: lightBase } });

		expect(authored.field).toEqual(field);
		expect(authored.subdued).toEqual(generated.subdued);
		expect(authored.overlay).toEqual(generated.overlay);
	});

	it('generates a surface from the base, not from an authored sibling', () => {
		const subdued: Oklch = { l: 0.4, c: 0, h: 0 };
		const surfaces = generateSurfaces({ mode: 'dark', surface: { base: darkBase, subdued } });
		const generated = generateSurfaces({ mode: 'dark', surface: { base: darkBase } });

		expect(surfaces.field).toEqual(generated.field);
	});
});
