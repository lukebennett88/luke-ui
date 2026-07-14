import { describe, expect, it } from 'vite-plus/test';
import { elmoThemeClassName, machinedEdgeThemeClassName } from '../themes/index.js';
import { buildTheme, ThemeContrastError, themeClassName } from './build-theme.js';
import { contrastRatio, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import type { ThemeFoundation } from './foundation.js';
import {
	defaultFontWeights,
	defaultRadius,
	defaultSourceColors,
	deriveConcentricRadius,
} from './foundation.js';
import { elmoFoundation, machinedEdgeFoundation } from './foundations.js';

const pairs = flattenThemeContract();
const isModePath = (path: string) =>
	path.startsWith('actionControlFinish.') || path.startsWith('color.') || path.startsWith('depth.');
const modeVarNames = pairs.filter(([path]) => isModePath(path)).map(([, varName]) => varName);
const identityVarNames = pairs.filter(([path]) => !isModePath(path)).map(([, varName]) => varName);

/**
 * Splits the generated stylesheet into its five rule blocks: identity, base light, media-query
 * dark, explicit light, and explicit dark.
 */
function splitBlocks(css: string) {
	const blocks = css.split('\n\n').filter((block) => block.trim() !== '');
	if (blocks.length !== 5) throw new Error(`expected 5 rule blocks, found ${blocks.length}`);
	const [identity, baseLight, mediaDark, explicitLight, explicitDark] = blocks;
	if (
		identity === undefined ||
		baseLight === undefined ||
		mediaDark === undefined ||
		explicitLight === undefined ||
		explicitDark === undefined
	) {
		throw new Error('expected every generated theme rule block to be defined');
	}
	return { baseLight, explicitDark, explicitLight, identity, mediaDark };
}

function countOccurrences(text: string, needle: string): number {
	return text.split(needle).length - 1;
}

function extractValue(block: string, varName: string): string {
	const match = new RegExp(`${varName}: ([^;]+);`).exec(block);
	if (match === null || match[1] === undefined) {
		throw new Error(`missing ${varName} in block`);
	}
	return match[1];
}

function extractShadowOpacities(shadow: string): Array<number> {
	return [...shadow.matchAll(/\/ ([\d.]+)\)/g)].map((match) => Number(match[1]));
}

describe('buildTheme output', () => {
	const css = buildTheme(machinedEdgeFoundation);
	const blocks = splitBlocks(css);

	it('emits the identity class, colour schemes, and all mode scoping rules', () => {
		expect(css).toContain('.luke-ui-theme-machined-edge {');
		expect(css).toContain('@media (prefers-color-scheme: dark) {');
		expect(blocks.baseLight).toContain('color-scheme: light;');
		expect(blocks.mediaDark).toContain('color-scheme: dark;');
		for (const mode of ['light', 'dark']) {
			expect(css).toContain(`.luke-ui-theme-machined-edge[data-color-mode='${mode}'],`);
			expect(css).toContain(`.luke-ui-theme-machined-edge [data-color-mode='${mode}'],`);
			expect(css).toContain(`[data-color-mode='${mode}'] .luke-ui-theme-machined-edge {`);
		}
	});

	it('declares every identity variable exactly once in the identity block', () => {
		const counts = identityVarNames.map((varName) => [
			varName,
			countOccurrences(blocks.identity, `${varName}: `),
		]);
		expect(counts).toEqual(identityVarNames.map((varName) => [varName, 1]));
		const modeCounts = modeVarNames.map((varName) =>
			countOccurrences(blocks.identity, `${varName}: `),
		);
		expect(modeCounts).toEqual(modeVarNames.map(() => 0));
	});

	it('declares every colour and depth variable exactly once per mode block', () => {
		const modeBlocks = [
			blocks.baseLight,
			blocks.mediaDark,
			blocks.explicitLight,
			blocks.explicitDark,
		];
		for (const block of modeBlocks) {
			const counts = modeVarNames.map((varName) => [
				varName,
				countOccurrences(block, `${varName}: `),
			]);
			expect(counts).toEqual(modeVarNames.map((varName) => [varName, 1]));
			const identityCounts = identityVarNames.map((varName) =>
				countOccurrences(block, `${varName}: `),
			);
			expect(identityCounts).toEqual(identityVarNames.map(() => 0));
		}
	});

	it('emits every colour value in OKLCH', () => {
		const colorVarNames = pairs
			.filter(([path]) => path.startsWith('color.'))
			.map(([, varName]) => varName);
		for (const block of [blocks.baseLight, blocks.mediaDark]) {
			const nonOklch = colorVarNames.filter(
				(varName) => !extractValue(block, varName).startsWith('oklch('),
			);
			expect(nonOklch).toEqual([]);
		}
	});

	it('uses the stable kebab-case variable names', () => {
		expect(css).toContain('--luke-color-intent-danger-surface-solid-hover');
		expect(css).toContain('--luke-color-surface-disabled');
		expect(css).toContain('--luke-color-intent-accent-text-hover');
		expect(css).toContain('--luke-depth-raised');
		expect(css).toContain('--luke-action-control-finish-resting');
		expect(css).toContain('--luke-space-100:');
		expect(css).toContain('--luke-control-size-small');
		expect(css).toContain('--luke-motion-easing-standard');
		expect(css).toContain('--luke-font-weight-body');
		expect(css).toContain('--luke-font-100-font-size: 12px');
		expect(css).toContain('--luke-font-300-line-height: 24px');
		expect(css).toContain('--luke-font-900-letter-spacing: -0.025em');
		expect(css).toContain('--luke-icon-size-xsmall: 16px');
		expect(css).toContain('--luke-icon-size-large: 32px');
	});

	it('emits authored semantic depth while keeping only ELMO light flat', () => {
		expect(extractValue(blocks.baseLight, '--luke-depth-resting')).toBe(
			machinedEdgeFoundation.light.depth.resting,
		);
		expect(extractValue(blocks.mediaDark, '--luke-depth-raised')).toBe(
			machinedEdgeFoundation.dark.depth.raised,
		);
		for (const foundation of [machinedEdgeFoundation, elmoFoundation]) {
			for (const mode of ['light', 'dark'] as const) {
				expect(foundation[mode].depth.resting).not.toContain('inset');
				expect(foundation[mode].depth.raised).not.toContain('inset');
				expect(foundation[mode].depth.resting.split(', ')).toHaveLength(2);
				expect(foundation[mode].depth.raised.split(', ')).toHaveLength(2);
			}
		}
		expect(elmoFoundation.light.depth.recessed).toBe('none');
		for (const recessed of [
			machinedEdgeFoundation.light.depth.recessed,
			machinedEdgeFoundation.dark.depth.recessed,
			elmoFoundation.dark.depth.recessed,
		]) {
			expect(recessed).not.toBe('none');
			expect(recessed.split(', ').every((layer) => layer.startsWith('inset '))).toBe(true);
		}
	});

	it('keeps ELMO softer than Machined edge while retaining finish and state depth', () => {
		const elmoBlocks = splitBlocks(buildTheme(elmoFoundation));
		expect(extractValue(elmoBlocks.identity, '--luke-radius-control')).toBe('4px');
		expect(extractValue(elmoBlocks.baseLight, '--luke-depth-recessed')).toBe('none');
		expect(extractValue(blocks.baseLight, '--luke-depth-recessed').split(', ')).toHaveLength(2);

		const elmoDarkRecessed = extractValue(elmoBlocks.mediaDark, '--luke-depth-recessed');
		const machinedDarkRecessed = extractValue(blocks.mediaDark, '--luke-depth-recessed');
		expect(elmoDarkRecessed.split(', ')).toHaveLength(1);
		expect(machinedDarkRecessed.split(', ')).toHaveLength(2);
		expect(Math.max(...extractShadowOpacities(machinedDarkRecessed))).toBeGreaterThan(
			Math.max(...extractShadowOpacities(elmoDarkRecessed)),
		);

		for (const [elmoBlock, machinedBlock] of [
			[elmoBlocks.baseLight, blocks.baseLight],
			[elmoBlocks.mediaDark, blocks.mediaDark],
		] as const) {
			const elmoResting = extractValue(elmoBlock, '--luke-depth-resting');
			const elmoRaised = extractValue(elmoBlock, '--luke-depth-raised');
			const elmoFinish = extractValue(elmoBlock, '--luke-action-control-finish-resting');

			expect(extractValue(machinedBlock, '--luke-depth-resting')).toContain('0 2px 0');
			expect(elmoResting).not.toContain('0 2px 0');
			expect(elmoRaised).not.toContain('0 3px 0');
			expect(elmoResting.split(', ')).toHaveLength(2);
			expect(elmoRaised.split(', ')).toHaveLength(2);
			expect(elmoRaised).not.toBe(elmoResting);
			expect(elmoFinish).toContain('radial-gradient');
			expect(elmoFinish).not.toBe(
				extractValue(machinedBlock, '--luke-action-control-finish-resting'),
			);
		}
	});
});

describe('concentric corners', () => {
	it('derives the outer radius from semantic inner-radius and gap values', () => {
		expect(deriveConcentricRadius('var(--luke-radius-control)', 'var(--luke-space-200)')).toBe(
			'calc(var(--luke-radius-control) + var(--luke-space-200))',
		);
	});
});

describe('buildTheme defaults', () => {
	const minimalFoundation: ThemeFoundation = {
		dark: machinedEdgeFoundation.dark,
		light: machinedEdgeFoundation.light,
		name: 'minimal-check',
	};

	it('fills omitted optional fields with the documented defaults', () => {
		const explicitFoundation: ThemeFoundation = {
			dark: {
				actionControlFinish: minimalFoundation.dark.actionControlFinish,
				color: { ...minimalFoundation.dark.color, ...defaultSourceColors.dark },
				depth: minimalFoundation.dark.depth,
			},
			light: {
				actionControlFinish: minimalFoundation.light.actionControlFinish,
				color: { ...minimalFoundation.light.color, ...defaultSourceColors.light },
				depth: minimalFoundation.light.depth,
			},
			name: 'minimal-check',
			radius: { ...defaultRadius },
			typography: { fontFamily: 'inter', fontWeight: { ...defaultFontWeights } },
		};
		const css = buildTheme(minimalFoundation);
		expect(css).toBe(buildTheme(explicitFoundation));
		for (const varName of modeVarNames) {
			expect(css).toContain(`${varName}: `);
		}
		expect(css).toContain('--luke-color-border-focus: oklch(');
	});

	it('emits Capsize trim values for each curated font family', () => {
		const trimValues = (fontFamily: 'inter' | 'apple-system' | 'dm-sans') => {
			const css = buildTheme({ ...minimalFoundation, typography: { fontFamily } });
			const identity = splitBlocks(css).identity;
			return {
				baseline: extractValue(identity, '--luke-font-300-baseline-trim'),
				capHeight: extractValue(identity, '--luke-font-300-cap-height-trim'),
			};
		};

		const values = [trimValues('inter'), trimValues('apple-system'), trimValues('dm-sans')];
		expect(new Set(values.map(({ baseline }) => baseline)).size).toBe(3);
		expect(new Set(values.map(({ capHeight }) => capHeight)).size).toBe(3);
	});
});

describe('buildTheme foundation validation', () => {
	it('rejects empty or stylesheet-breaking depth values', () => {
		const emptyDepth: ThemeFoundation = {
			...machinedEdgeFoundation,
			light: {
				...machinedEdgeFoundation.light,
				depth: { ...machinedEdgeFoundation.light.depth, resting: ' ' },
			},
			name: 'empty-depth',
		};
		const unsafeDepth: ThemeFoundation = {
			...machinedEdgeFoundation,
			dark: {
				...machinedEdgeFoundation.dark,
				depth: { ...machinedEdgeFoundation.dark.depth, overlay: 'none; color: red' },
			},
			name: 'unsafe-depth',
		};

		expect(() => buildTheme(emptyDepth)).toThrow(
			'light.depth.resting: must be a non-empty CSS box-shadow value',
		);
		expect(() => buildTheme(unsafeDepth)).toThrow(
			'dark.depth.overlay: must be a non-empty CSS box-shadow value',
		);
	});
});

describe('buildTheme independent modes', () => {
	it('derives each mode from its own sources rather than inverting light', () => {
		const greenPurpleFoundation: ThemeFoundation = {
			dark: {
				...machinedEdgeFoundation.dark,
				color: { ...machinedEdgeFoundation.dark.color, accent: 'oklch(0.75 0.12 300)' },
			},
			light: {
				...machinedEdgeFoundation.light,
				color: { ...machinedEdgeFoundation.light.color, accent: 'oklch(0.5 0.13 150)' },
			},
			name: 'green-purple',
		};
		const blocks = splitBlocks(buildTheme(greenPurpleFoundation));
		const solidVar = '--luke-color-intent-accent-surface-solid';
		const lightSolid = parseColor(extractValue(blocks.baseLight, solidVar));
		const darkSolid = parseColor(extractValue(blocks.mediaDark, solidVar));
		expect(lightSolid.h).toBeCloseTo(150, 0);
		expect(darkSolid.h).toBeCloseTo(300, 0);
		expect(extractValue(blocks.baseLight, solidVar)).not.toBe(
			extractValue(blocks.mediaDark, solidVar),
		);
	});
});

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
			...machinedEdgeFoundation,
			light: {
				...machinedEdgeFoundation.light,
				color: { ...machinedEdgeFoundation.light.color, focus: '#c5d9ff' },
			},
			name: 'bad-focus',
		});
		const failure = error.failures.find(
			(candidate) =>
				candidate.foreground === 'color.border.focus' &&
				candidate.background === 'color.surface.canvas',
		);
		expect(failure).toBeDefined();
		expect(failure?.mode).toBe('light');
		expect(failure?.required).toBe(3);
		expect(failure?.ratio).toBeLessThan(3);
		expect(error.message).toMatch(
			/light: color\.border\.focus on color\.surface\.canvas — \d+\.\d\d:1 < 3:1/,
		);
	});

	it('rejects a light dark-mode neutral through the text lightness windows', () => {
		const error = buildFailures({
			...machinedEdgeFoundation,
			dark: {
				...machinedEdgeFoundation.dark,
				color: { ...machinedEdgeFoundation.dark.color, neutral: '#9a9a9a' },
			},
			name: 'bad-dark-neutral',
		});
		const failure = error.failures.find(
			(candidate) =>
				candidate.mode === 'dark' &&
				candidate.foreground === 'color.text.primary' &&
				candidate.background.startsWith('color.surface.'),
		);
		expect(failure).toBeDefined();
		expect(failure?.required).toBe(4.5);
		expect(error.message).toContain('dark: color.text.primary on color.surface.canvas');
	});

	it('rejects a mid-lightness accent that no onSolid colour can sit on', () => {
		const error = buildFailures({
			...machinedEdgeFoundation,
			light: {
				...machinedEdgeFoundation.light,
				color: { ...machinedEdgeFoundation.light.color, accent: '#7a7a7a' },
			},
			name: 'bad-accent',
		});
		const onSolidFailures = error.failures.filter(
			(candidate) => candidate.foreground === 'color.intent.accent.onSolid',
		);
		expect(onSolidFailures.length).toBeGreaterThan(0);
		expect(onSolidFailures[0]?.background).toMatch(/^color\.intent\.accent\.surface\.solid/);
		expect(error.message).toContain('light: color.intent.accent.onSolid');
	});

	it('aggregates every failing pair into one error', () => {
		const error = buildFailures({
			...machinedEdgeFoundation,
			light: {
				...machinedEdgeFoundation.light,
				color: {
					...machinedEdgeFoundation.light.color,
					accent: '#7a7a7a',
					focus: '#c5d9ff',
				},
			},
			name: 'bad-both',
		});
		const foregrounds = new Set(error.failures.map((failure) => failure.foreground));
		expect(foregrounds.has('color.border.focus')).toBe(true);
		expect(foregrounds.has('color.intent.accent.onSolid')).toBe(true);
		expect(error.failures.length).toBeGreaterThan(2);
		expect(error.message.split('\n').length).toBe(error.failures.length + 1);
	});
});

describe('bundled themes meet WCAG 2.2 AA', () => {
	const surfaceVarNames = [
		'--luke-color-surface-canvas',
		'--luke-color-surface-resting',
		'--luke-color-surface-recessed',
		'--luke-color-surface-floating',
		'--luke-color-surface-overlay',
	];

	for (const foundation of [machinedEdgeFoundation, elmoFoundation]) {
		it(`${foundation.name} passes recomputed text and border contrast in both modes`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				const textPrimary = parseColor(extractValue(block, '--luke-color-text-primary'));
				const borderControl = parseColor(extractValue(block, '--luke-color-border-control'));
				const canvas = parseColor(extractValue(block, '--luke-color-surface-canvas'));
				for (const varName of surfaceVarNames) {
					const surface = parseColor(extractValue(block, varName));
					expect(contrastRatio(textPrimary, surface)).toBeGreaterThanOrEqual(4.5);
				}
				expect(contrastRatio(borderControl, canvas)).toBeGreaterThanOrEqual(3);
			}
		});

		it(`${foundation.name} keeps light canvas neutral, recessed surfaces white, and dark wells distinct`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			const lightCanvas = parseColor(extractValue(blocks.baseLight, '--luke-color-surface-canvas'));
			const lightRecessed = parseColor(
				extractValue(blocks.baseLight, '--luke-color-surface-recessed'),
			);
			const darkCanvas = parseColor(extractValue(blocks.mediaDark, '--luke-color-surface-canvas'));
			const darkRecessed = parseColor(
				extractValue(blocks.mediaDark, '--luke-color-surface-recessed'),
			);

			expect(lightCanvas.c).toBe(0);
			expect(lightRecessed).toEqual({ c: 0, h: 0, l: 1 });
			expect(darkCanvas.l - darkRecessed.l).toBeGreaterThanOrEqual(0.02);
		});

		it(`${foundation.name} keeps dark subtle hover states distinct and legible`, () => {
			const { mediaDark } = splitBlocks(buildTheme(foundation));
			const floating = parseColor(extractValue(mediaDark, '--luke-color-surface-floating'));
			const textPrimary = parseColor(extractValue(mediaDark, '--luke-color-text-primary'));
			for (const intent of ['neutral', 'accent']) {
				const subtleHover = parseColor(
					extractValue(mediaDark, `--luke-color-intent-${intent}-surface-subtle-hover`),
				);
				expect(contrastRatio(subtleHover, floating)).toBeGreaterThanOrEqual(1.4);
				expect(contrastRatio(textPrimary, subtleHover)).toBeGreaterThanOrEqual(4.5);
			}
		});

		it(`${foundation.name} generates the least-contrasting passing control borders`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				const surfaces = ['canvas', 'resting', 'recessed'].map((surface) =>
					parseColor(extractValue(block, `--luke-color-surface-${surface}`)),
				);
				const borderVarNames = [
					'--luke-color-border-control',
					...['accent', 'info', 'success', 'warning', 'danger'].map(
						(intent) => `--luke-color-intent-${intent}-border`,
					),
				];

				for (const varName of borderVarNames) {
					const border = parseColor(extractValue(block, varName));
					const minimumContrast = Math.min(
						...surfaces.map((surface) => contrastRatio(border, surface)),
					);
					expect(minimumContrast).toBeGreaterThanOrEqual(3);
					expect(minimumContrast).toBeLessThan(3.15);
				}
			}
		});
	}
});

describe('bundled theme identity', () => {
	it('exports class-name constants that match the emitted identity classes', () => {
		expect(machinedEdgeThemeClassName).toBe('luke-ui-theme-machined-edge');
		expect(elmoThemeClassName).toBe('luke-ui-theme-elmo');
		expect(buildTheme(machinedEdgeFoundation)).toContain(`.${machinedEdgeThemeClassName} {`);
		expect(buildTheme(elmoFoundation)).toContain(`.${elmoThemeClassName} {`);
	});

	it('keeps the bundled themes isolated from each other', () => {
		expect(buildTheme(elmoFoundation)).not.toContain(machinedEdgeThemeClassName);
		expect(buildTheme(machinedEdgeFoundation)).not.toContain(elmoThemeClassName);
	});

	it('rejects theme names that are not kebab-case', () => {
		expect(() => themeClassName('Machined Edge')).toThrow(/kebab-case/);
		expect(() => themeClassName('-leading')).toThrow(/kebab-case/);
		expect(() => themeClassName('double--hyphen')).toThrow(/kebab-case/);
		expect(() => themeClassName('9lives')).toThrow(/kebab-case/);
		expect(themeClassName('machined-edge')).toBe('luke-ui-theme-machined-edge');
	});
});
