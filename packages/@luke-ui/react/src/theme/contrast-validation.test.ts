import { describe, expect, it } from 'vite-plus/test';
import { resolvedColor, tactileFoundation } from './__fixtures__/theme-css.js';
import { buildTheme, compileTheme, ThemeContrastError } from './build-theme.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme contrast failures', () => {
	function buildFailures(foundation: ThemeFoundation): ThemeContrastError {
		const caught = (() => {
			try {
				buildTheme(foundation);
				return null;
			} catch (error) {
				return error;
			}
		})();
		if (caught instanceof ThemeContrastError) return caught;
		throw new Error('expected buildTheme to throw ThemeContrastError');
	}

	it('rejects a low-contrast focus colour, naming mode, pair, and required ratio', () => {
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: resolvedColor('#c5d9ff') },
			},
			name: 'bad-focus',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.foreground === 'color.border.focus' &&
				candidate.background === 'color.surface.canvas'
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.surface\.canvas — \d+\.\d\d:1 < 3:1/,
		);
	});

	it('rejects a dark-mode canvas the fixed text anchors cannot clear', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: resolvedColor('oklch(0.9 0 0)') },
			},
			name: 'bad-dark-canvas',
		});
		const failure = error.failures.find((candidate) => {
			return (
				candidate.mode === 'dark' &&
				candidate.foreground === 'color.text.primary' &&
				candidate.background.startsWith('color.surface.')
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.required).toBe(4.5);
		expect(error.message).toContain('dark: color.text.primary on color.surface.canvas');
	});

	it('aggregates every failing pair into one error', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: resolvedColor('oklch(0.9 0 0)') },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: resolvedColor('#c5d9ff') },
			},
			name: 'bad-both',
		});
		const foregrounds = new Set(error.failures.map((failure) => failure.foreground));
		// A low-contrast light focus ring and a pathological dark canvas fail different pairs across both
		// modes; the error collects them all.
		expect(foregrounds.has('color.border.focus')).toBe(true);
		expect(foregrounds.has('color.text.primary')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});
});

describe('contrast validation matrix', () => {
	const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;
	const BASE_SURFACES = ['color.surface.canvas', 'color.surface.recessed'] as const;
	const ELEVATION_SURFACES = [
		...BASE_SURFACES,
		'color.surface.floating',
		'color.surface.overlay',
	] as const;

	function expectedChecks() {
		const hard: Array<{ background: string; foreground: string; required: number }> = [];
		const advisory: Array<{ background: string; foreground: string; required: number }> = [];
		for (const text of ['color.text.primary', 'color.text.secondary'] as const) {
			for (const surface of ELEVATION_SURFACES) {
				hard.push({ background: surface, foreground: text, required: TEXT_RATIO });
			}
		}
		for (const role of SEMANTIC_ROLES) {
			const subtleBackgrounds = INTERACTION_STATES.map((state) => {
				return `color.background.${role}.subtle.${state}`;
			});
			for (const state of INTERACTION_STATES) {
				for (const background of [...BASE_SURFACES, ...subtleBackgrounds]) {
					hard.push({
						background,
						foreground: `color.foreground.${role}.${state}`,
						required: TEXT_RATIO,
					});
				}
			}
			for (const state of INTERACTION_STATES) {
				hard.push({
					background: `color.background.${role}.solid.${state}`,
					foreground: `color.foreground.${role}.onSolid`,
					required: TEXT_RATIO,
				});
			}
			for (const background of BASE_SURFACES) {
				advisory.push({ background, foreground: `color.border.${role}`, required: UI_RATIO });
			}
		}
		for (const background of BASE_SURFACES) {
			hard.push({ background, foreground: 'color.border.focus', required: UI_RATIO });
			hard.push({ background, foreground: 'color.border.control', required: UI_RATIO });
			hard.push({
				background,
				foreground: 'color.background.danger.solid.rest',
				required: UI_RATIO,
			});
		}
		return { advisory, hard };
	}

	it('records the semantic hard and advisory pairs', () => {
		const { diagnostics } = compileTheme(tactileFoundation);
		const expected = expectedChecks();
		const pairKey = (check: { background: string; foreground: string; required: number }) => {
			return `${check.foreground} ${check.background} ${check.required}`;
		};
		for (const mode of ['light', 'dark'] as const) {
			const checks = diagnostics[mode].contrastChecks;
			const actualHard = checks.flatMap((check) =>
				check.hard
					? [
							{
								background: check.background,
								foreground: check.foreground,
								required: check.required,
							},
						]
					: [],
			);
			const actualAdvisory = checks.flatMap((check) =>
				!check.hard
					? [
							{
								background: check.background,
								foreground: check.foreground,
								required: check.required,
							},
						]
					: [],
			);
			expect([...actualHard].map(pairKey).sort()).toEqual([...expected.hard].map(pairKey).sort());
			expect([...actualAdvisory].map(pairKey).sort()).toEqual(
				[...expected.advisory].map(pairKey).sort(),
			);
		}
	});
});
