import { describe, expect, it } from 'vite-plus/test';
import { tactileTheme } from './__fixtures__/tactile.js';
import {
	extractValue,
	paperFoundation,
	resolvedColor,
	splitBlocks,
	tactileFoundation,
	testTypography,
} from './__fixtures__/theme-css.js';
import { buildTheme, compileTheme, ThemeContrastError } from './build-theme.js';
import { compositeOver, contrastRatio, parseColor, parseColorWithAlpha } from './color.js';
import { flattenThemeContract } from './contract.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import { validateContrast } from './contrast-validation.js';
import { defineTheme, normalizeTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import type { SemanticColorValues } from './semantic-map.js';

const REST_FOREGROUND_PATTERN = /^color\.foreground\.\w+\.rest$/;
const PRESSED_SUBTLE_BACKGROUND_PATTERN = /^color\.background\.\w+\.subtle\.pressed$/;

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
				candidate.background === 'color.surface.base'
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.surface\.base — \d+\.\d{3}:1 < 3:1/,
		);
	});

	it('rejects a pair that passes before emission but fails after rounding', () => {
		const focus = resolvedColor('oklch(0.658255 0 0)');
		const base = tactileFoundation.light.color.surface.base;
		expect(contrastRatio(focus, base)).toBeGreaterThanOrEqual(UI_RATIO);
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus },
			},
		});
		const ratio = contrastRatio(parseColor('oklch(0.6583 0 0)'), base);
		expect(ratio).toBeLessThan(UI_RATIO);
		expect(error.failures).toContainEqual({
			mode: 'light',
			foreground: 'color.border.focus',
			background: 'color.surface.base',
			ratio,
			required: UI_RATIO,
		});
	});

	it('rejects a dark-mode base the fixed text anchors cannot clear', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: {
					...tactileFoundation.dark.color,
					surface: { base: resolvedColor('oklch(0.9 0 0)') },
				},
			},
			name: 'bad-dark-base',
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
		expect(error.message).toContain('dark: color.text.primary on color.surface.base');
	});

	it('aggregates every failing pair into one error', () => {
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: {
					...tactileFoundation.dark.color,
					surface: { base: resolvedColor('oklch(0.9 0 0)') },
				},
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: resolvedColor('#c5d9ff') },
			},
			name: 'bad-both',
		});
		const foregrounds = new Set(error.failures.map((failure) => failure.foreground));
		// A low-contrast light focus ring and a pathological dark base fail different pairs across both
		// modes; the error collects them all.
		expect(foregrounds.has('color.border.focus')).toBe(true);
		expect(foregrounds.has('color.text.primary')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});

	it('validates an authored surface as written instead of repairing it', () => {
		const field = resolvedColor('oklch(0.6 0 0)');
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: {
					...tactileFoundation.light.color,
					surface: { ...tactileFoundation.light.color.surface, field },
				},
			},
			name: 'bad-field',
		});
		const failingSurfaces = new Set(error.failures.map((failure) => failure.background));
		expect(failingSurfaces.has('color.surface.field')).toBe(true);
		expect(error.failures.every((failure) => failure.mode === 'light')).toBe(true);
	});

	// Forms and links sit on subdued regions too, such as a sidebar search field.
	it('gates role text on an authored subdued surface', () => {
		const subdued = resolvedColor('oklch(0.75 0 0)');
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: {
					...tactileFoundation.light.color,
					surface: { ...tactileFoundation.light.color.surface, subdued },
				},
			},
			name: 'dark-subdued',
		});
		expect(error.failures).toContainEqual(
			expect.objectContaining({
				background: 'color.surface.subdued',
				foreground: 'color.foreground.danger.rest',
				mode: 'light',
			}),
		);
	});
});

describe('contrast validation matrix', () => {
	const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;
	const SURFACES = [
		'color.surface.base',
		'color.surface.subdued',
		'color.surface.field',
		'color.surface.overlay',
	] as const;

	function expectedChecks() {
		const hard: Array<{ background: string; foreground: string; required: number }> = [];
		const advisory: Array<{ background: string; foreground: string; required: number }> = [];
		const subtleBackgrounds = SEMANTIC_ROLES.flatMap((role) => {
			return INTERACTION_STATES.map((state) => `color.background.${role}.subtle.${state}`);
		});
		for (const text of ['color.text.primary', 'color.text.secondary'] as const) {
			for (const surface of [...SURFACES, ...subtleBackgrounds]) {
				hard.push({ background: surface, foreground: text, required: TEXT_RATIO });
			}
		}
		for (const role of SEMANTIC_ROLES) {
			for (const state of INTERACTION_STATES) {
				for (const background of [...SURFACES, ...subtleBackgrounds]) {
					hard.push({
						background,
						foreground: `color.foreground.${role}.${state}`,
						required: TEXT_RATIO,
					});
				}
			}
			for (const hierarchy of ['primary', 'secondary']) {
				for (const state of INTERACTION_STATES) {
					hard.push({
						background: `color.background.${role}.solid.${state}`,
						foreground: `color.foreground.${role}.onSolid.${hierarchy}`,
						required: TEXT_RATIO,
					});
				}
			}
			for (const background of SURFACES) {
				advisory.push({ background, foreground: `color.border.${role}`, required: UI_RATIO });
			}
		}
		for (const background of SURFACES) {
			hard.push({ background, foreground: 'color.border.focus', required: UI_RATIO });
		}
		for (const background of SURFACES) {
			hard.push({ background, foreground: 'color.border.control', required: UI_RATIO });
			hard.push({ background, foreground: 'color.border.controlHover', required: UI_RATIO });
			hard.push({
				background,
				foreground: 'color.background.danger.solid.rest',
				required: UI_RATIO,
			});
		}
		return { advisory, hard };
	}

	for (const foundation of [
		tactileFoundation,
		paperFoundation,
		normalizeTheme({
			name: 'custom-matrix',
			color: {
				accent: '#7c3aed',
				neutral: { light: 'oklch(0.985 0.01 70)', dark: 'oklch(0.2 0.01 70)' },
			},
			typography: testTypography,
		}),
	]) {
		it(`records the complete hard and advisory matrix for ${foundation.name}`, () => {
			const { css, diagnostics } = compileTheme(foundation);
			const blocks = splitBlocks(css);
			const variableNames = new Map<string, string>(flattenThemeContract());
			const expected = expectedChecks();
			const pairKey = (check: { background: string; foreground: string; required: number }) => {
				return `${check.foreground} ${check.background} ${check.required}`;
			};
			for (const mode of ['light', 'dark'] as const) {
				const checks = diagnostics[mode].contrastChecks;
				const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
				const base = extractValue(block, variableNames.get('color.surface.base')!);
				for (const check of checks) {
					const foreground = extractValue(block, variableNames.get(check.foreground)!);
					const background = extractValue(block, variableNames.get(check.background)!);
					expect(check.ratio).toBe(
						contrastRatio(parseColor(foreground), paintedOverBase(background, base)),
					);
				}
				const actualHard = checks.flatMap((check) => {
					if (!check.hard) return [];

					return [
						{
							background: check.background,
							foreground: check.foreground,
							required: check.required,
						},
					];
				});
				const actualAdvisory = checks.flatMap((check) => {
					if (check.hard) return [];

					return [
						{
							background: check.background,
							foreground: check.foreground,
							required: check.required,
						},
					];
				});
				expect([...actualHard].map(pairKey).toSorted()).toEqual(
					[...expected.hard].map(pairKey).toSorted(),
				);
				expect([...actualAdvisory].map(pairKey).toSorted()).toEqual(
					[...expected.advisory].map(pairKey).toSorted(),
				);
			}
		});
	}
});

// Translucent subtle fills are measured as they paint over `surface.base`.
function paintedOverBase(value: string, base: string) {
	const { alpha, color } = parseColorWithAlpha(value);
	return alpha === 1 ? color : compositeOver(parseColor(base), color, alpha);
}

describe('custom-canvas cross-role contrast', () => {
	for (const { mode, base, foreground, background, ratio } of [
		{
			mode: 'light',
			base: 'oklch(0.94 0 30)',
			foreground: 'color.foreground.success.rest',
			background: 'color.background.danger.subtle.pressed',
			ratio: 4.433,
		},
		{
			mode: 'dark',
			base: 'oklch(0.28 0 30)',
			foreground: 'color.foreground.danger.rest',
			background: 'color.background.success.subtle.pressed',
			ratio: 4.38,
		},
	] as const) {
		it(`rejects the Tactile ${mode} custom canvas for cross-role contrast`, () => {
			let caught: unknown;
			try {
				defineTheme({
					extends: tactileTheme,
					name: `tactile-custom-${mode}`,
					color: { surface: { base: { [mode]: base } } },
				});
			} catch (error) {
				caught = error;
			}
			expect(caught).toBeInstanceOf(ThemeContrastError);
			if (!(caught instanceof ThemeContrastError)) throw caught;
			expect(caught.failures).toContainEqual({
				mode,
				foreground,
				background,
				ratio: expect.closeTo(ratio, 3),
				required: TEXT_RATIO,
			});
			// These canvases passed all earlier gates; every failure must be cross-role subtle text.
			for (const failure of caught.failures) {
				expect(failure.mode).toBe(mode);
				expect(failure.foreground).toMatch(REST_FOREGROUND_PATTERN);
				expect(failure.background).toMatch(PRESSED_SUBTLE_BACKGROUND_PATTERN);
				expect(failure.foreground.split('.')[2]).not.toBe(failure.background.split('.')[2]);
				expect(caught.message).toContain(
					`${mode}: ${failure.foreground} on ${failure.background} — ${failure.ratio.toFixed(3)}:1 < 4.5:1`,
				);
			}
			expect(caught.inheritance?.chain).toEqual([`tactile-custom-${mode}`, 'tactile']);
		});
	}
});

describe('independent on-solid hierarchy gates', () => {
	const blocks = splitBlocks(buildTheme(tactileFoundation));
	for (const mode of ['light', 'dark'] as const) {
		for (const hierarchy of ['primary', 'secondary'] as const) {
			it(`rejects only the failing ${hierarchy} leaf across every role and state in ${mode}`, () => {
				const solidStates = ['rest', 'hover', 'pressed'] as const;
				const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
				const colors = Object.fromEntries(
					flattenThemeContract()
						.filter(([path]) => path.startsWith('color.'))
						.map(([path, variable]) => [path, extractValue(block, variable)]),
				) as SemanticColorValues;
				for (const role of SEMANTIC_ROLES) {
					colors[`color.foreground.${role}.onSolid.${hierarchy}`] =
						colors[`color.background.${role}.solid.rest`];
				}
				const { failures } = validateContrast(mode, colors);
				expect(failures).toHaveLength(SEMANTIC_ROLES.length * solidStates.length);
				for (const role of SEMANTIC_ROLES) {
					for (const state of solidStates) {
						expect(failures).toContainEqual({
							mode,
							foreground: `color.foreground.${role}.onSolid.${hierarchy}`,
							background: `color.background.${role}.solid.${state}`,
							ratio: expect.any(Number),
							required: TEXT_RATIO,
						});
					}
				}
			});
		}
	}
});
