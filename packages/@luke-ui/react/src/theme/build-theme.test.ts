import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { paperThemeClassName, tactileThemeClassName } from '../themes/index.js';
import {
	buildTheme,
	compileTheme,
	ThemeContrastError,
	ThemeGenerationError,
	themeClassName,
} from './build-theme.js';
import { contrastRatio, parseColor } from './color.js';
import { flattenThemeContract } from './contract.js';
import { SEMANTIC_ROLES } from './contrast-policy.js';
import { normalizeTheme } from './define-theme.js';
import type { ThemeFoundation } from './foundation.js';
import {
	defaultFontWeights,
	defaultRadius,
	defaultSourceColors,
	deriveConcentricRadius,
	deriveNestedRadius,
} from './foundation.js';
import { paperTheme, tactileTheme } from './foundations.js';

// The bundled themes are authored as `defineTheme` inputs; these engine tests exercise the raw
// `buildTheme` pipeline directly, so resolve each input into the foundation `buildTheme` consumes.
const tactileFoundation = normalizeTheme(tactileTheme);
const paperFoundation = normalizeTheme(paperTheme);

const pairs = flattenThemeContract();
const isModePath = (path: string) => {
	return (
		path.startsWith('actionControlFinish.') ||
		path.startsWith('color.') ||
		path.startsWith('depth.')
	);
};
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
	const css = buildTheme(tactileFoundation);
	const blocks = splitBlocks(css);

	it('emits the identity class, colour schemes, and all mode scoping rules', () => {
		expect(css).toContain('.luke-ui-theme-tactile {');
		expect(css).toContain('@media (prefers-color-scheme: dark) {');
		expect(blocks.baseLight).toContain('color-scheme: light;');
		expect(blocks.mediaDark).toContain('color-scheme: dark;');
		for (const mode of ['light', 'dark']) {
			expect(css).toContain(`.luke-ui-theme-tactile[data-color-mode='${mode}'],`);
			expect(css).toContain(`.luke-ui-theme-tactile [data-color-mode='${mode}'],`);
			expect(css).toContain(`[data-color-mode='${mode}'] .luke-ui-theme-tactile {`);
		}
	});

	it('declares every identity variable exactly once in the identity block', () => {
		const counts = identityVarNames.map((varName) => {
			return [varName, countOccurrences(blocks.identity, `${varName}: `)];
		});
		expect(counts).toEqual(identityVarNames.map((varName) => [varName, 1]));
		const modeCounts = modeVarNames.map((varName) => {
			return countOccurrences(blocks.identity, `${varName}: `);
		});
		expect(modeCounts).toEqual(modeVarNames.map(() => 0));
	});

	// Both bundled themes, because the contract inventory is what every consumer resolves against: a
	// leaf the map forgets for one theme's palette is a `var()` that silently falls back at runtime.
	for (const foundation of [tactileFoundation, paperFoundation]) {
		it(`declares every ${foundation.name} colour and depth variable exactly once per mode block`, () => {
			const themeBlocks = splitBlocks(buildTheme(foundation));
			const modeBlocks = [
				themeBlocks.baseLight,
				themeBlocks.mediaDark,
				themeBlocks.explicitLight,
				themeBlocks.explicitDark,
			];
			for (const block of modeBlocks) {
				const counts = modeVarNames.map((varName) => [
					varName,
					countOccurrences(block, `${varName}: `),
				]);
				expect(counts).toEqual(modeVarNames.map((varName) => [varName, 1]));
				const identityCounts = identityVarNames.map((varName) => {
					return countOccurrences(block, `${varName}: `);
				});
				expect(identityCounts).toEqual(identityVarNames.map(() => 0));
			}
		});
	}

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
		expect(css).toContain('--luke-color-background-danger-solid-hover');
		expect(css).toContain('--luke-color-foreground-danger-on-solid');
		expect(css).toContain('--luke-color-border-danger');
		expect(css).toContain('--luke-color-loading-skeleton');
		expect(css).toContain('--luke-color-scrim');
		expect(css).toContain('--luke-color-text-disabled');
		expect(css).toContain('--luke-color-foreground-accent-hover');
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

	it('emits authored semantic depth while keeping only Paper light flat', () => {
		expect(extractValue(blocks.baseLight, '--luke-depth-resting')).toBe(
			tactileFoundation.light.depth.resting,
		);
		expect(extractValue(blocks.mediaDark, '--luke-depth-raised')).toBe(
			tactileFoundation.dark.depth.raised,
		);
		for (const foundation of [tactileFoundation, paperFoundation]) {
			for (const mode of ['light', 'dark'] as const) {
				expect(foundation[mode].depth.resting).not.toContain('inset');
				expect(foundation[mode].depth.raised).not.toContain('inset');
				expect(foundation[mode].depth.resting.split(', ')).toHaveLength(2);
				expect(foundation[mode].depth.raised.split(', ')).toHaveLength(2);
			}
		}
		expect(paperFoundation.light.depth.recessed).toBe('none');
		for (const recessed of [
			tactileFoundation.light.depth.recessed,
			tactileFoundation.dark.depth.recessed,
			paperFoundation.dark.depth.recessed,
		]) {
			expect(recessed).not.toBe('none');
			expect(recessed.split(', ').every((layer) => layer.startsWith('inset '))).toBe(true);
		}
	});

	it('keeps Paper softer than Tactile while retaining finish and state depth', () => {
		const paperBlocks = splitBlocks(buildTheme(paperFoundation));
		expect(extractValue(paperBlocks.identity, '--luke-radius-control')).toBe('4px');
		expect(extractValue(paperBlocks.baseLight, '--luke-depth-recessed')).toBe('none');
		expect(extractValue(blocks.baseLight, '--luke-depth-recessed').split(', ')).toHaveLength(2);

		const paperDarkRecessed = extractValue(paperBlocks.mediaDark, '--luke-depth-recessed');
		const tactileDarkRecessed = extractValue(blocks.mediaDark, '--luke-depth-recessed');
		expect(paperDarkRecessed.split(', ')).toHaveLength(1);
		expect(tactileDarkRecessed.split(', ')).toHaveLength(2);
		expect(Math.max(...extractShadowOpacities(tactileDarkRecessed))).toBeGreaterThan(
			Math.max(...extractShadowOpacities(paperDarkRecessed)),
		);

		for (const [paperBlock, tactileBlock] of [
			[paperBlocks.baseLight, blocks.baseLight],
			[paperBlocks.mediaDark, blocks.mediaDark],
		] as const) {
			const paperResting = extractValue(paperBlock, '--luke-depth-resting');
			const paperRaised = extractValue(paperBlock, '--luke-depth-raised');
			const paperFinish = extractValue(paperBlock, '--luke-action-control-finish-resting');

			expect(extractValue(tactileBlock, '--luke-depth-resting')).toContain('0 2px 0');
			expect(paperResting).not.toContain('0 2px 0');
			expect(paperRaised).not.toContain('0 3px 0');
			expect(paperResting.split(', ')).toHaveLength(2);
			expect(paperRaised.split(', ')).toHaveLength(2);
			expect(paperRaised).not.toBe(paperResting);
			expect(paperFinish).toContain('radial-gradient');
			expect(paperFinish).not.toBe(
				extractValue(tactileBlock, '--luke-action-control-finish-resting'),
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

	it('derives the inner radius from semantic outer-radius and gap values', () => {
		expect(deriveNestedRadius('var(--luke-radius-surface)', 'var(--luke-space-300)')).toBe(
			'max(0px, calc(var(--luke-radius-surface) - var(--luke-space-300)))',
		);
	});
});

describe('buildTheme defaults', () => {
	const minimalFoundation: ThemeFoundation = {
		dark: tactileFoundation.dark,
		light: tactileFoundation.light,
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

	it('preserves every Capsize trim for each curated font family and size', () => {
		const expectedTrims = {
			'apple-system': {
				'100': { baselineTrim: '-0.2887em', capHeightTrim: '-0.34em' },
				'200': { baselineTrim: '-0.3364em', capHeightTrim: '-0.3876em' },
				'300': { baselineTrim: '-0.3721em', capHeightTrim: '-0.4233em' },
				'400': { baselineTrim: '-0.3443em', capHeightTrim: '-0.3956em' },
				'500': { baselineTrim: '-0.3221em', capHeightTrim: '-0.3733em' },
				'600': { baselineTrim: '-0.2471em', capHeightTrim: '-0.2983em' },
				'700': { baselineTrim: '-0.2649em', capHeightTrim: '-0.3162em' },
				'800': { baselineTrim: '-0.1935em', capHeightTrim: '-0.2448em' },
				'900': { baselineTrim: '-0.1221em', capHeightTrim: '-0.1733em' },
			},
			'dm-sans': {
				'100': { baselineTrim: '-0.3257em', capHeightTrim: '-0.3077em' },
				'200': { baselineTrim: '-0.3733em', capHeightTrim: '-0.3553em' },
				'300': { baselineTrim: '-0.409em', capHeightTrim: '-0.391em' },
				'400': { baselineTrim: '-0.3812em', capHeightTrim: '-0.3632em' },
				'500': { baselineTrim: '-0.359em', capHeightTrim: '-0.341em' },
				'600': { baselineTrim: '-0.284em', capHeightTrim: '-0.266em' },
				'700': { baselineTrim: '-0.3019em', capHeightTrim: '-0.2839em' },
				'800': { baselineTrim: '-0.2304em', capHeightTrim: '-0.2124em' },
				'900': { baselineTrim: '-0.159em', capHeightTrim: '-0.141em' },
			},
			inter: {
				'100': { baselineTrim: '-0.3029em', capHeightTrim: '-0.3029em' },
				'200': { baselineTrim: '-0.3505em', capHeightTrim: '-0.3505em' },
				'300': { baselineTrim: '-0.3862em', capHeightTrim: '-0.3862em' },
				'400': { baselineTrim: '-0.3585em', capHeightTrim: '-0.3585em' },
				'500': { baselineTrim: '-0.3362em', capHeightTrim: '-0.3362em' },
				'600': { baselineTrim: '-0.2612em', capHeightTrim: '-0.2612em' },
				'700': { baselineTrim: '-0.2791em', capHeightTrim: '-0.2791em' },
				'800': { baselineTrim: '-0.2077em', capHeightTrim: '-0.2077em' },
				'900': { baselineTrim: '-0.1362em', capHeightTrim: '-0.1362em' },
			},
		} as const;

		for (const [fontFamily, trims] of Object.entries(expectedTrims)) {
			const css = buildTheme({
				...minimalFoundation,
				typography: { fontFamily: fontFamily as keyof typeof expectedTrims },
			});
			const identity = splitBlocks(css).identity;

			for (const [size, expected] of Object.entries(trims)) {
				expect(extractValue(identity, `--luke-font-${size}-cap-height-trim`)).toBe(
					expected.capHeightTrim,
				);
				expect(extractValue(identity, `--luke-font-${size}-baseline-trim`)).toBe(
					expected.baselineTrim,
				);
			}
		}
	});
});

describe('buildTheme foundation validation', () => {
	it('does not accept the code stack as a curated Capsize font family', () => {
		const codeFontFoundation = {
			...tactileFoundation,
			typography: { fontFamily: 'code' },
		} as unknown as ThemeFoundation;

		expect(() => buildTheme(codeFontFoundation)).toThrow(
			'typography.fontFamily: "code" is not a curated font-family choice',
		);
	});

	it('rejects empty or stylesheet-breaking depth values', () => {
		const emptyDepth: ThemeFoundation = {
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				depth: { ...tactileFoundation.light.depth, resting: ' ' },
			},
			name: 'empty-depth',
		};
		const unsafeDepth: ThemeFoundation = {
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				depth: { ...tactileFoundation.dark.depth, overlay: 'none; color: red' },
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

	it('rejects an unsafe scrim value with a message naming the field', () => {
		const unsafeScrim: ThemeFoundation = {
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, scrim: 'oklch(0 0 0 / 0.2); } .evil {' },
			},
			name: 'unsafe-scrim',
		};

		expect(() => buildTheme(unsafeScrim)).toThrow(
			'light.color.scrim: must be a non-empty CSS colour value',
		);
	});

	it("produces the validator's message rather than a TypeError for a shadow rung set to undefined", () => {
		// `defineTheme` now filters `undefined` rungs before merging (define-theme.test.ts covers that
		// fallback), but `buildTheme` is also called directly with a raw foundation (tests, tooling,
		// or any future composition that does not go through `defineTheme`). The validator's guard must
		// stay robust to that shape regardless of caller, rather than crash inside `.trim()`.
		const undefinedDepthRung = {
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				depth: { ...tactileFoundation.dark.depth, resting: undefined },
			},
			name: 'undefined-depth-rung',
		} as unknown as ThemeFoundation;

		expect(() => buildTheme(undefinedDepthRung)).toThrow(
			'dark.depth.resting: must be a non-empty CSS box-shadow value',
		);
	});
});

describe('buildTheme independent modes', () => {
	it('derives each mode from its own sources rather than inverting light', () => {
		const greenPurpleFoundation: ThemeFoundation = {
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, accent: 'oklch(0.75 0.12 300)' },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, accent: 'oklch(0.5 0.13 150)' },
			},
			name: 'green-purple',
		};
		const blocks = splitBlocks(buildTheme(greenPurpleFoundation));
		const solidVar = '--luke-color-background-accent-solid-rest';
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
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: '#c5d9ff' },
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

	it('rejects a pathological dark-mode canvas the fixed text anchors cannot clear', () => {
		// v2 pins text lightness (neutral steps 11/12) per mode, so an unworkable neutral character no
		// longer produces low-contrast text; the honest failure mode is instead a canvas whose lightness
		// leaves the fixed text anchors below AA. A near-white dark canvas does exactly that.
		const error = buildFailures({
			...tactileFoundation,
			dark: {
				...tactileFoundation.dark,
				color: { ...tactileFoundation.dark.color, background: 'oklch(0.9 0 0)' },
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
				color: { ...tactileFoundation.dark.color, background: 'oklch(0.9 0 0)' },
			},
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, focus: '#c5d9ff' },
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

describe('buildTheme generation failures', () => {
	function buildGenerationError(foundation: ThemeFoundation): ThemeGenerationError {
		const caught = (() => {
			try {
				buildTheme(foundation);
				return null;
			} catch (error) {
				return error;
			}
		})();
		if (caught instanceof ThemeGenerationError) return caught;
		throw new Error('expected buildTheme to throw ThemeGenerationError');
	}

	// Every semantic role now publishes a solid, so every role must reach an accessible solid/on-solid
	// pair — a status source in an on-solid dead zone is a build failure rather than the silently
	// unguaranteed solid the old feedback-only kit left unemitted. Status sources are used verbatim (only
	// a single-value accent is pre-conditioned into an accessible band), so an authored one reaches the
	// generator exactly as written.
	it('throws ThemeGenerationError naming the role, mode, and achieved ratio for a dead-zone warning', () => {
		const error = buildGenerationError({
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, warning: 'oklch(0.62 0.19 27)' },
			},
			name: 'bad-warning',
		});

		expect(error.role).toBe('warning');
		expect(error.mode).toBe('light');
		expect(error.bestAttempt.step).toBe(9);
		expect(error.bestAttempt.onSolidRatio).toBeLessThan(4.5);
		expect(error.message).toContain('Cannot generate the light "warning" family');
		expect(error.message).toContain(`${error.bestAttempt.onSolidRatio.toFixed(2)}:1`);
		// Warning is generated fifth, so the four roles before it are reported and the last one is not.
		expect(Object.keys(error.diagnostics.completedFamilies)).toEqual([
			'neutral',
			'accent',
			'info',
			'success',
		]);
	});

	it('throws ThemeGenerationError for an accent no on-solid text can sit on', () => {
		const caught = (() => {
			try {
				// A mid-lightness tone whose whole solid window is an on-solid dead zone: neither near-white
				// nor near-black on-solid text clears AA anywhere the search can reach.
				buildTheme({
					...tactileFoundation,
					light: {
						...tactileFoundation.light,
						color: { ...tactileFoundation.light.color, accent: 'oklch(0.62 0.19 27)' },
					},
					name: 'bad-accent',
				});
				return null;
			} catch (error) {
				return error;
			}
		})();
		expect(caught).toBeInstanceOf(ThemeGenerationError);
		const error = caught as ThemeGenerationError;
		expect(error.role).toBe('accent');
		expect(error.mode).toBe('light');
		expect(error.bestAttempt.step).toBe(9);
		expect(error.bestAttempt.onSolidRatio).toBeLessThan(4.5);
		// The partial diagnostics carry the failing role/mode and the families resolved before it.
		expect(error.diagnostics.role).toBe('accent');
		expect(error.diagnostics.mode).toBe('light');
		expect(error.diagnostics.completedFamilies.neutral).toBeDefined();
		expect(error.diagnostics.completedFamilies.accent).toBeUndefined();
	});
});

describe('compileTheme diagnostics', () => {
	it('returns the emitted CSS plus complete per-mode diagnostics for a valid theme', () => {
		const { css, diagnostics } = compileTheme(tactileFoundation);
		expect(css).toBe(buildTheme(tactileFoundation));
		for (const mode of ['light', 'dark'] as const) {
			const modeDiagnostics = diagnostics[mode];
			expect(modeDiagnostics.mode).toBe(mode);
			// A family diagnostic per role, and every scale role generated.
			expect(Object.keys(modeDiagnostics.families).sort()).toEqual(
				['accent', 'danger', 'info', 'neutral', 'success', 'warning'].sort(),
			);
			expect(modeDiagnostics.families.accent.solidAnchor.satisfied).toBe(true);
			// The canvas surface equals the resolved background anchor.
			expect(modeDiagnostics.surfaces.canvas).toBeDefined();
			// The diagnostics data model records every hard-gated text check, not just failures, so
			// tooling (the "Theme/Diagnostics" story) can display the full matrix. Asserting `passes` on
			// each would be dead: `compileTheme` above already throws `ThemeContrastError` before
			// returning if any hard check failed, so every recorded hard check necessarily passed already.
			const hardTextChecks = modeDiagnostics.contrastChecks.filter(
				(check) => check.required === 4.5,
			);
			expect(hardTextChecks.length).toBeGreaterThan(0);
		}
	});

	// The matrix is role-uniform by construction, so its size and its per-role shape together pin it:
	// 8 functional text pairs + 6 roles x (2 foregrounds x 5 backgrounds + 3 on-solid) + the 4 solved
	// boundaries + 2 for `danger.solid.rest` (not per-role, see `validateContrast`) = 92 hard checks,
	// and 6 semantic borders x 2 base surfaces = 12 advisory ones.
	for (const foundation of [tactileFoundation, paperFoundation]) {
		it(`measures 92 hard and 12 advisory checks per mode for ${foundation.name}, the same for every role`, () => {
			// `compileTheme` returns only once every hard gate passed, so reaching these assertions is
			// itself the proof that all 92 hard checks pass for the bundled theme.
			const { diagnostics } = compileTheme(foundation);
			const summary = (['light', 'dark'] as const).map((mode) => {
				const checks = diagnostics[mode].contrastChecks;
				const countFor = (foreground: string, hard: boolean) => {
					return checks.filter((check) => check.hard === hard && check.foreground === foreground)
						.length;
				};
				return {
					advisory: checks.filter((check) => !check.hard).length,
					hard: checks.filter((check) => check.hard).length,
					mode,
					perRole: SEMANTIC_ROLES.map((role) => ({
						advisoryBorder: countFor(`color.border.${role}`, false),
						hardHover: countFor(`color.foreground.${role}.hover`, true),
						hardOnSolid: countFor(`color.foreground.${role}.onSolid`, true),
						hardRest: countFor(`color.foreground.${role}.rest`, true),
						role,
					})),
				};
			});
			expect(summary).toEqual(
				(['light', 'dark'] as const).map((mode) => ({
					advisory: 12,
					hard: 92,
					mode,
					perRole: SEMANTIC_ROLES.map((role) => ({
						advisoryBorder: 2,
						hardHover: 5,
						hardOnSolid: 3,
						hardRest: 5,
						role,
					})),
				})),
			);
		});
	}

	it('records on each check whether missing its ratio fails the build', () => {
		// Every text pair is a hard gate, and so are the two solved boundaries `border.focus` and
		// `border.control`, plus `danger.solid.rest` vs the base surfaces (the only role fill gated —
		// see `validateContrast` for why the other five roles are not). The six semantic borders are the
		// only advisory checks. `color.border.decorative` is not measured. The "Theme/Diagnostics"
		// inspector uses this flag instead of matching token paths.
		const { diagnostics } = compileTheme(tactileFoundation);
		const advisoryBorders = SEMANTIC_ROLES.map((role) => `color.border.${role}`);
		const summary = (['light', 'dark'] as const).map((mode) => {
			const checks = diagnostics[mode].contrastChecks;
			const advisory = checks.filter((check) => !check.hard);
			const hard = checks.filter((check) => check.hard);
			return {
				advisoryForegrounds: [...new Set(advisory.map((check) => check.foreground))].sort(),
				// A hard gate that missed its ratio would throw before `compileTheme` returns. A recorded
				// hard check that does not pass means the flag disagrees with the compiler.
				everyHardGatePasses: hard.every((check) => check.passes),
				hardBoundaryForegrounds: [
					...new Set(hard.filter((check) => check.required === 3).map((check) => check.foreground)),
				].sort(),
				hardRatios: [...new Set(hard.map((check) => check.required))].sort((a, b) => a - b),
				mode,
				partitionsEveryCheck: hard.length + advisory.length === checks.length,
			};
		});
		expect(summary).toEqual(
			(['light', 'dark'] as const).map((mode) => ({
				advisoryForegrounds: [...advisoryBorders].sort(),
				everyHardGatePasses: true,
				hardBoundaryForegrounds: [
					'color.background.danger.solid.rest',
					'color.border.control',
					'color.border.focus',
				].sort(),
				hardRatios: [3, 4.5],
				mode,
				partitionsEveryCheck: true,
			})),
		);
	});
});

describe('bundled themes meet WCAG 2.2 AA', () => {
	for (const foundation of [tactileFoundation, paperFoundation]) {
		// `validateContrast` in build-theme.ts already hard-gates text-vs-surface contrast (>=4.5:1,
		// every surface) and border.control-vs-surface contrast (>=3:1, canvas and recessed) for every
		// mode, throwing `ThemeContrastError` on any miss (exercised directly in "buildTheme contrast
		// failures" below). Recomputing those exact ratios from the emitted CSS here can never fail: if
		// either gate had missed, `buildTheme` would already have thrown before this assertion ran. The
		// honest statement of the same property is that building the bundled theme does not throw.
		it(`${foundation.name} compiles without a WCAG hard-gate failure`, () => {
			expect(() => buildTheme(foundation)).not.toThrow();
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
			expect(lightRecessed).toEqual({ l: 1, c: 0, h: 0 });
			expect(darkCanvas.l - darkRecessed.l).toBeGreaterThanOrEqual(0.02);
		});

		it(`${foundation.name} keeps dark accent subtle-hover legible for primary text`, () => {
			// The subtle component surfaces (scale steps 3-5) ramp from the canvas independently of the
			// elevation surfaces, so v2 no longer pins them apart from `floating`; what still matters is
			// that primary text stays legible on the hovered subtle surface. The neutral subtle hover is
			// excluded here because that exact colour pair is already hard-gated under different names:
			// `color.text.primary` and `color.foreground.neutral.hover` both alias neutral step 12, and
			// `validateContrast` gates the latter against all three neutral subtle states at >=4.5:1.
			// No hard-gated pair covers primary text on the *accent* subtle ramp, so that is the pair
			// worth recomputing.
			const { mediaDark } = splitBlocks(buildTheme(foundation));
			const textPrimary = parseColor(extractValue(mediaDark, '--luke-color-text-primary'));
			const subtleHover = parseColor(
				extractValue(mediaDark, '--luke-color-background-accent-subtle-hover'),
			);
			expect(contrastRatio(textPrimary, subtleHover)).toBeGreaterThanOrEqual(4.5);
		});

		it(`${foundation.name} generates subtle, distinct semantic borders`, () => {
			const blocks = splitBlocks(buildTheme(foundation));
			for (const block of [blocks.baseLight, blocks.mediaDark]) {
				const surfaces = ['canvas', 'recessed'].map((surface) => {
					return parseColor(extractValue(block, `--luke-color-surface-${surface}`));
				});
				// The functional borders are excluded: `border.control` is a solved contrast boundary,
				// hard-gated at >=3:1 by `validateContrast`, and `border.decorative` keeps its own policy.
				// Driven off `SEMANTIC_ROLES` so a role added there is covered here without a second list.
				const borderVarNames = SEMANTIC_ROLES.map((role) => `--luke-color-border-${role}`);

				for (const varName of borderVarNames) {
					const border = parseColor(extractValue(block, varName));
					const minimumContrast = Math.min(
						...surfaces.map((surface) => contrastRatio(border, surface)),
					);
					// The semantic borders alias the scale's step 7 (subtle UI border). They stay visibly
					// distinct from the base surfaces but sit below the 3:1 non-text gate the old bespoke
					// solver targeted — a deliberate move to the reference scale's softer separators.
					expect(minimumContrast).toBeGreaterThan(1.2);
					expect(minimumContrast).toBeLessThan(3);
				}
			}
		});
	}
});

// The loading-skeleton contrast gate lives in `loading-skeleton.browser.test.ts` ("keeps the
// pulse's dimmest frame perceptible against every bundled theme's canvas"), which samples the real
// animated pulse and requires >=1.4:1 at both its brightest and dimmest frame. That subsumes and is
// stricter than a static "skeleton !== canvas and contrastRatio > 1" check would ever be — the
// latter is a tautology once the two colours are already known to differ, so it added no coverage.

describe('bundled theme identity', () => {
	it('exports class-name constants that match the emitted identity classes', () => {
		expect(tactileThemeClassName).toBe('luke-ui-theme-tactile');
		expect(paperThemeClassName).toBe('luke-ui-theme-paper');
		expect(buildTheme(tactileFoundation)).toContain(`.${tactileThemeClassName} {`);
		expect(buildTheme(paperFoundation)).toContain(`.${paperThemeClassName} {`);
	});

	it('keeps the bundled themes isolated from each other', () => {
		expect(buildTheme(paperFoundation)).not.toContain(tactileThemeClassName);
		expect(buildTheme(tactileFoundation)).not.toContain(paperThemeClassName);
	});

	it('rejects theme names that are not kebab-case', () => {
		expect(() => themeClassName('Tactile')).toThrow(/kebab-case/);
		expect(() => themeClassName('-leading')).toThrow(/kebab-case/);
		expect(() => themeClassName('double--hyphen')).toThrow(/kebab-case/);
		expect(() => themeClassName('9lives')).toThrow(/kebab-case/);
		expect(themeClassName('tactile')).toBe('luke-ui-theme-tactile');
	});
});

// v2 regression goldens: the exact `buildTheme` output for the bundled themes under the wired-in
// scale/elevation/semantic-map pipeline (#238). Asserted byte-identical so any later generator
// change is a reviewed, deliberate diff.
describe('v2 regression goldens', () => {
	const v2Goldens = {
		paper: new URL('./__fixtures__/v2-goldens/paper.v2.css', import.meta.url),
		tactile: new URL('./__fixtures__/v2-goldens/tactile.v2.css', import.meta.url),
	} as const;

	it('keeps every generated token byte-identical to the v2 baseline', async () => {
		const goldenTactile = await readFile(v2Goldens.tactile, 'utf8');
		const goldenPaper = await readFile(v2Goldens.paper, 'utf8');

		expect(buildTheme(tactileFoundation)).toBe(goldenTactile);
		expect(buildTheme(paperFoundation)).toBe(goldenPaper);
	});
});
