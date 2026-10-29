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
import { contrastRatio, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { SEMANTIC_ROLES, TEXT_RATIO, UI_RATIO } from './contrast-policy.js';
import { validateContrast } from './contrast-validation.js';
import { controlBorderStateColor } from './control-border.js';
import { defineTheme, normalizeTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import { ThemeInteractionTintError } from './interaction-tints.js';
import type { SemanticColorValues } from './semantic-map.js';

const ROLE_FOREGROUND_PATTERN = /^color\.foreground\.\w+\.(rest|hover|pressed)$/;
const TINT_CONTRAST_BACKGROUND_PATTERN =
	/^color\.background\.(surface\.(base|subdued|raised)|\w+\.subtle)$/;

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
				candidate.background === 'color.background.surface.base'
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.background\.surface\.base — \d+\.\d{3}:1 < 3:1/,
		);
	});

	it('accepts pale and deep accents whose solids may fail 3:1 against raised', () => {
		// The active option's focus chrome is an inset outline on the solid fill, gated against that
		// fill (and already covered at 4.5:1 by the on-solid text gates), not against the list surface.
		for (const [name, accent] of [
			['pale-accent', resolvedColor('#fde68a')],
			['deep-accent', resolvedColor('oklch(0.48 0.11 250)')],
		] as const) {
			const { diagnostics } = compileTheme({
				...tactileFoundation,
				dark: {
					...tactileFoundation.dark,
					color: { ...tactileFoundation.dark.color, accent },
				},
				light: {
					...tactileFoundation.light,
					color: { ...tactileFoundation.light.color, accent },
				},
				name,
			});
			for (const mode of ['light', 'dark'] as const) {
				const outlineChecks = diagnostics[mode].contrastChecks.filter((check) => {
					return (
						check.foreground === 'color.foreground.accent.onSolid' &&
						(check.background === 'color.background.accent.solid.rest' ||
							check.background === 'color.background.accent.solid.pressed') &&
						check.required === UI_RATIO
					);
				});
				expect(outlineChecks).toHaveLength(2);
				for (const check of outlineChecks) {
					expect(check.hard).toBe(true);
					expect(check.passes).toBe(true);
					expect(check.ratio).toBeGreaterThanOrEqual(UI_RATIO);
				}
				expect(
					diagnostics[mode].contrastChecks.some(
						(check) =>
							check.background === 'color.background.surface.raised' &&
							check.foreground.startsWith('color.background.accent.solid.'),
					),
				).toBe(false);
			}
		}
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
			background: 'color.background.surface.base',
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
				candidate.foreground === 'color.foreground.primary' &&
				candidate.background.startsWith('color.background.surface.')
			);
		});
		expect(failure).toBeDefined();
		expect(failure?.required).toBe(4.5);
		expect(error.message).toContain(
			'dark: color.foreground.primary on color.background.surface.base',
		);
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
		expect(foregrounds.has('color.foreground.primary')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});

	it('validates an authored surface as written instead of repairing it', () => {
		const raised = resolvedColor('oklch(0.6 0 0)');
		const error = buildFailures({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: {
					...tactileFoundation.light.color,
					surface: { ...tactileFoundation.light.color.surface, raised },
				},
			},
			name: 'bad-raised',
		});
		const failingSurfaces = new Set(error.failures.map((failure) => failure.background));
		expect(failingSurfaces.has('color.background.surface.raised')).toBe(true);
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
				background: 'color.background.surface.subdued',
				foreground: 'color.foreground.danger.rest',
				mode: 'light',
			}),
		);
	});
});

describe('contrast validation matrix', () => {
	const INTERACTION_STATES = ['rest', 'hover', 'pressed'] as const;
	const SURFACES = [
		'color.background.surface.base',
		'color.background.surface.subdued',
		'color.background.surface.raised',
	] as const;

	function expectedChecks() {
		const hard: Array<{ background: string; foreground: string; required: number }> = [];
		const advisory: Array<{ background: string; foreground: string; required: number }> = [];
		const subtleBackgrounds = SEMANTIC_ROLES.map((role) => {
			return `color.background.${role}.subtle`;
		});
		for (const text of ['color.foreground.primary', 'color.foreground.secondary'] as const) {
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
			for (const state of INTERACTION_STATES) {
				hard.push({
					background: `color.background.${role}.solid.${state}`,
					foreground: `color.foreground.${role}.onSolid`,
					required: TEXT_RATIO,
				});
			}
			for (const background of [...SURFACES, `color.background.${role}.subtle`]) {
				hard.push({ background, foreground: `color.border.${role}.strong`, required: UI_RATIO });
			}
		}
		for (const background of SURFACES) {
			hard.push({ background, foreground: 'color.border.focus', required: UI_RATIO });
		}
		for (const background of SURFACES) {
			hard.push({ background, foreground: 'color.border.control', required: UI_RATIO });
			for (const state of ['hover', 'pressed'] as const) {
				hard.push({
					background,
					foreground: `interaction.border.${state}`,
					required: UI_RATIO,
				});
			}
		}
		for (const state of ['rest', 'pressed']) {
			hard.push({
				background: `color.background.accent.solid.${state}`,
				foreground: 'color.foreground.accent.onSolid',
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
				surface: {
					base: { light: 'oklch(0.99 0.01 70)', dark: 'oklch(0.18 0.01 70)' },
				},
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
				for (const check of checks) {
					const foreground = check.foreground.startsWith('interaction.border.')
						? controlBorderStateColor(
								parseColor(extractValue(block, variableNames.get('color.border.control')!)),
								parseColor(extractValue(block, variableNames.get('color.foreground.primary')!)),
								check.foreground.endsWith('.hover') ? 'hover' : 'pressed',
							)
						: extractValue(block, variableNames.get(check.foreground)!);
					const background = extractValue(block, variableNames.get(check.background)!);
					expect(check.ratio).toBe(contrastRatio(parseColor(foreground), parseColor(background)));
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

describe('custom-canvas interaction tint contrast', () => {
	for (const { mode, base } of [
		{ mode: 'light', base: 'oklch(0.94 0 30)' },
		{ mode: 'dark', base: 'oklch(0.31 0 30)' },
	] as const) {
		it(`rejects the Tactile ${mode} custom canvas when interaction tints cannot preserve AA`, () => {
			let caught: unknown;
			try {
				defineTheme({
					...tactileTheme,
					name: `tactile-custom-${mode}`,
					color: {
						...tactileTheme.color,
						surface: { ...tactileTheme.color.surface, base: { [mode]: base } },
					},
				});
			} catch (error) {
				caught = error;
			}
			expect(caught).toBeInstanceOf(ThemeInteractionTintError);
			if (!(caught instanceof ThemeInteractionTintError)) throw caught;
			expect(caught.mode).toBe(mode);
			expect(caught.limitingMiss).not.toBeNull();
			if (caught.limitingMiss === null) throw caught;
			expect(caught.limitingMiss.background).toMatch(TINT_CONTRAST_BACKGROUND_PATTERN);
			expect(caught.limitingMiss.foreground).toMatch(ROLE_FOREGROUND_PATTERN);
			expect(caught.limitingMiss.ratio).toBeLessThan(TEXT_RATIO);
			expect(caught.message).toContain('visibility floors');
		});
	}
});

describe('functional semantic borders', () => {
	const mismatchedHues = normalizeTheme({
		name: 'mismatched-neutral-and-canvas',
		color: {
			accent: '#7c3aed',
			neutral: { light: 'oklch(0.985 0.01 70)', dark: 'oklch(0.2 0.01 70)' },
			surface: {
				base: { light: 'oklch(0.97 0.03 250)', dark: 'oklch(0.16 0.03 150)' },
			},
		},
		typography: testTypography,
	});
	for (const foundation of [tactileFoundation, paperFoundation, mismatchedHues]) {
		it(`separates deep custom danger fills from the strong border for ${foundation.name}`, () => {
			const custom = normalizeTheme({
				name: `custom-${foundation.name}`,
				color: {
					accent: '#7c3aed',
					danger: { light: 'oklch(0.52 0.16 25)', dark: 'oklch(0.48 0.16 25)' },
				},
				typography: testTypography,
			});
			const { css, diagnostics } = compileTheme({
				...foundation,
				light: {
					...foundation.light,
					color: { ...foundation.light.color, danger: custom.light.color.danger },
				},
				dark: {
					...foundation.dark,
					color: { ...foundation.dark.color, danger: custom.dark.color.danger },
				},
			});
			const blocks = splitBlocks(css);
			expect(
				contrastRatio(
					parseColor(extractValue(blocks.mediaDark, '--luke-color-background-danger-solid-rest')),
					parseColor(extractValue(blocks.mediaDark, '--luke-color-background-surface-raised')),
				),
			).toBeLessThan(UI_RATIO);
			for (const mode of ['light', 'dark'] as const) {
				const checks = diagnostics[mode].contrastChecks.filter(
					(check) => check.foreground === 'color.border.danger.strong',
				);
				expect(checks).toHaveLength(4);
				for (const check of checks) {
					expect(check.hard).toBe(true);
					expect(check.ratio).toBeGreaterThanOrEqual(UI_RATIO + 0.04);
				}
				const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;

				const colors = Object.fromEntries(
					flattenThemeContract()
						.filter(([path]) => path.startsWith('color.'))
						.map(([path, variable]) => [path, extractValue(block, variable)]),
				) as SemanticColorValues;
				colors['color.border.danger.strong'] = colors['color.background.surface.base'];
				const { failures } = validateContrast(mode, colors);
				expect(failures).toContainEqual(
					expect.objectContaining({
						foreground: 'color.border.danger.strong',
						background: 'color.background.surface.base',
						mode,
						required: UI_RATIO,
					}),
				);
				expect(new ThemeContrastError(failures).message).toContain(
					`${mode}: color.border.danger.strong on color.background.surface.base`,
				);
			}
		});

		it(`clears 3:1 for every role's strong border on all surfaces and its subtle fill for ${foundation.name}`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				for (const role of SEMANTIC_ROLES) {
					const strong = parseColor(extractValue(block, `--luke-color-border-${role}-strong`));
					for (const background of [
						'surface-base',
						'surface-subdued',
						'surface-raised',
						`${role}-subtle`,
					]) {
						const fill = parseColor(extractValue(block, `--luke-color-background-${background}`));
						expect(contrastRatio(strong, fill)).toBeGreaterThanOrEqual(UI_RATIO);
					}
				}
			}
		});

		it(`chooses near-white dark on-solid text for ${foundation.name}`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			{
				const text = parseColor(
					extractValue(blocks.mediaDark, '--luke-color-foreground-danger-on-solid'),
				);
				expect(text.l).toBeGreaterThan(0.9);
				for (const state of ['rest', 'hover', 'pressed']) {
					const fill = parseColor(
						extractValue(blocks.mediaDark, `--luke-color-background-danger-solid-${state}`),
					);
					expect(fill.l).toBeLessThan(0.6);
					expect(contrastRatio(text, fill)).toBeGreaterThanOrEqual(TEXT_RATIO);
				}
			}
		});
	}
});

describe('on-solid contrast gates', () => {
	const blocks = splitBlocks(buildTheme(tactileFoundation));
	const solidStates = ['rest', 'hover', 'pressed'] as const;

	function modeColors(mode: 'light' | 'dark'): SemanticColorValues {
		const block = mode === 'light' ? blocks.baseLight : blocks.mediaDark;
		return Object.fromEntries(
			flattenThemeContract()
				.filter(([path]) => path.startsWith('color.'))
				.map(([path, variable]) => [path, extractValue(block, variable)]),
		) as SemanticColorValues;
	}

	for (const mode of ['light', 'dark'] as const) {
		it(`rejects a failing on-solid colour across every role and state in ${mode}`, () => {
			const colors = modeColors(mode);
			for (const role of SEMANTIC_ROLES) {
				colors[`color.foreground.${role}.onSolid`] = colors[`color.background.${role}.solid.rest`];
			}
			const { failures } = validateContrast(mode, colors);
			// Accent on-solid is also gated at 3:1 for the dropdown inset outline.
			expect(failures).toHaveLength(SEMANTIC_ROLES.length * solidStates.length + 2);
			for (const role of SEMANTIC_ROLES) {
				for (const state of solidStates) {
					expect(failures).toContainEqual({
						mode,
						foreground: `color.foreground.${role}.onSolid`,
						background: `color.background.${role}.solid.${state}`,
						ratio: expect.any(Number),
						required: TEXT_RATIO,
					});
				}
			}
			for (const state of ['rest', 'pressed'] as const) {
				expect(failures).toContainEqual({
					mode,
					foreground: 'color.foreground.accent.onSolid',
					background: `color.background.accent.solid.${state}`,
					ratio: expect.any(Number),
					required: UI_RATIO,
				});
			}
		});
	}
});
