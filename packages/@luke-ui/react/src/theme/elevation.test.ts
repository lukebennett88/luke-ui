import { describe, expect, it } from 'vite-plus/test';
import type { Oklch } from './color.js';
import { generateSurfaces } from './elevation.js';

const lightBackground: Oklch = { l: 0.985, c: 0.006, h: 90 };
const darkBackground: Oklch = { l: 0.18, c: 0.01, h: 260 };

describe('generateSurfaces', () => {
	it('sets canvas to exactly the background input, in both modes', () => {
		const light = generateSurfaces({ background: lightBackground, mode: 'light' });
		expect(light.canvas).toEqual(lightBackground);

		const dark = generateSurfaces({ background: darkBackground, mode: 'dark' });
		expect(dark.canvas).toEqual(darkBackground);
	});

	it('does not produce a resting surface', () => {
		const surfaces = generateSurfaces({ background: lightBackground, mode: 'light' });
		expect(Object.keys(surfaces).sort()).toEqual(['canvas', 'floating', 'overlay', 'recessed']);
		expect('resting' in surfaces).toBe(false);
	});

	describe('dark mode', () => {
		const surfaces = generateSurfaces({ background: darkBackground, mode: 'dark' });

		it('sinks recessed below the canvas', () => {
			expect(surfaces.recessed.l).toBeLessThan(surfaces.canvas.l);
		});

		it('lifts floating and overlay above the canvas, with overlay the most separated', () => {
			expect(surfaces.floating.l).toBeGreaterThan(surfaces.canvas.l);
			expect(surfaces.overlay.l).toBeGreaterThan(surfaces.canvas.l);
			expect(surfaces.overlay.l).toBeGreaterThan(surfaces.floating.l);
		});
	});

	describe('light mode', () => {
		const surfaces = generateSurfaces({ background: lightBackground, mode: 'light' });

		it('pins recessed to neutral white', () => {
			expect(surfaces.recessed).toEqual({ l: 1, c: 0, h: 0 });
		});

		it('separates floating and overlay from the canvas only slightly, with overlay further', () => {
			expect(surfaces.floating.l).toBeGreaterThan(surfaces.canvas.l);
			expect(surfaces.overlay.l).toBeGreaterThan(surfaces.canvas.l);
			expect(surfaces.overlay.l).toBeGreaterThan(surfaces.floating.l);
			expect(surfaces.overlay.l - surfaces.canvas.l).toBeLessThan(0.05);
		});
	});

	it('keeps hue and chroma from the background on the mode-derived surfaces', () => {
		const surfaces = generateSurfaces({ background: darkBackground, mode: 'dark' });
		expect(surfaces.floating.h).toBeCloseTo(darkBackground.h, 5);
		expect(surfaces.overlay.h).toBeCloseTo(darkBackground.h, 5);
	});
});
