import { precomputeValues } from '@capsizecss/core';
import { describe, expect, it } from 'vite-plus/test';
import { tactileTheme } from './__fixtures__/tactile.js';
import {
	extractValue,
	interFont,
	loraFont,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
	testTypography,
} from './__fixtures__/theme-css.js';
import { findTokenCompatibilityProblems } from './__fixtures__/token-compatibility.js';
import { buildTheme } from './build-theme.js';
import { capsizeTrimVarName } from './capsize-trim-vars.js';
import { flattenThemeContract, spaceScale } from './contract.js';
import type { ThemeInput } from './define-theme.js';
import { defineTheme } from './define-theme.js';
import { FONT_METRIC_SCALE } from './font-metric-scale.js';
import type { ThemeFoundation } from './foundation.js';
import { defaultFontWeights, defaultRadius } from './foundation.js';
import { typeStyleFontRole, typeStyleMetricStep, typeStyles } from './type-styles.js';

const pairs = flattenThemeContract();

describe('buildTheme output', () => {
	const css = buildTheme(tactileFoundation);
	const blocks = splitBlocks(css);

	it('scopes every rule to the identity class on `<html>`', () => {
		const identity = ':where(html).luke-ui-theme-tactile';
		expect(blocks.themeWide.split('\n')[0]).toBe(`${identity} {`);
		expect(blocks.baseLight.split('\n')[0]).toBe(`${identity} {`);
		expect(blocks.mediaDark.split('\n').slice(0, 2)).toEqual([
			'@media (prefers-color-scheme: dark) {',
			`\t${identity} {`,
		]);
		for (const mode of ['light', 'dark'] as const) {
			const block = mode === 'light' ? blocks.explicitLight : blocks.explicitDark;
			expect(block.split('\n').slice(0, 2)).toEqual([
				`${identity}[data-color-mode='${mode}'],`,
				`${identity} [data-color-mode='${mode}'] {`,
			]);
		}
		expect(blocks.baseLight).toContain('color-scheme: light;');
		expect(blocks.mediaDark).toContain('color-scheme: dark;');
		expect(blocks.explicitLight).toContain('color-scheme: light;');
		expect(blocks.explicitDark).toContain('color-scheme: dark;');
	});

	it('emits no `:root` fallback, no nested identity, and no containment', () => {
		expect(css).not.toContain(':root');
		expect(css).not.toContain('] .luke-ui-theme-');
		expect(css).not.toContain('container-type');
	});

	// Both fixtures, because the contract inventory is what every consumer resolves against: a leaf
	// the map forgets for one theme's palette is a `var()` that silently falls back at runtime.
	for (const foundation of [tactileFoundation, paperFoundation]) {
		it(`declares every ${foundation.name} token once in each rule, with no token references`, () => {
			expect(findTokenCompatibilityProblems(buildTheme(foundation), foundation.name)).toEqual([]);
		});
	}

	it('emits every colour value in OKLCH', () => {
		const colorVarNames = pairs.flatMap(([path, varName]) => {
			if (!path.startsWith('color.')) return [];

			return [varName];
		});
		for (const block of [blocks.baseLight, blocks.mediaDark]) {
			const nonOklch = colorVarNames.filter(
				(varName) => !extractValue(block, varName).startsWith('oklch('),
			);
			expect(nonOklch).toEqual([]);
		}
	});

	it('emits the public spacing scale in every fixture theme', () => {
		for (const foundation of [tactileFoundation, paperFoundation]) {
			const { themeWide } = splitBlocks(buildTheme(foundation));
			expect(
				spaceScale.map(([step]) => [step, extractValue(themeWide, `--luke-space-${step}`)]),
			).toEqual(spaceScale);
		}
	});

	it('emits authored depth as written', () => {
		expect(extractValue(blocks.baseLight, '--luke-depth-resting')).toBe(
			tactileFoundation.light.depth.resting,
		);
		expect(extractValue(blocks.mediaDark, '--luke-depth-raised')).toBe(
			tactileFoundation.dark.depth.raised,
		);
	});

	it('compiles the same input to identical bytes', () => {
		expect(defineTheme(tactileTheme)).toBe(defineTheme(tactileTheme));
	});
});

describe('buildTheme defaults', () => {
	const minimalFoundation: ThemeFoundation = {
		dark: tactileFoundation.dark,
		light: tactileFoundation.light,
		name: 'minimal-check',
		typography: testTypography,
	};

	it('fills omitted optional fields with the documented defaults', () => {
		const explicitFoundation: ThemeFoundation = {
			dark: minimalFoundation.dark,
			light: minimalFoundation.light,
			name: 'minimal-check',
			radius: { ...defaultRadius },
			typography: { ...testTypography, fontWeight: { ...defaultFontWeights } },
		};
		expect(buildTheme(minimalFoundation)).toBe(buildTheme(explicitFoundation));
	});
});

describe('theme fonts', () => {
	function themeWideOf(typography: ThemeInput['typography']) {
		return splitBlocks(
			defineTheme({ color: { accent: '#3b82f6' }, name: 'font-check', typography }),
		).themeWide;
	}

	/** The trims Capsize computes for one type style in one font, as the stylesheet emits them. */
	function expectedTrims(style: (typeof typeStyles)[number], metrics: typeof interFont.metrics) {
		const fontSize = typeStyleMetricStep[style];
		const leading = Number.parseFloat(FONT_METRIC_SCALE[fontSize].lineHeight) * 16;
		const { baselineTrim, capHeightTrim } = precomputeValues({
			fontMetrics: metrics,
			fontSize,
			leading,
		});
		return [baselineTrim, capHeightTrim];
	}

	function emittedTrims(themeWide: string, style: (typeof typeStyles)[number]) {
		return [
			extractValue(themeWide, capsizeTrimVarName(style, 'baselineTrim')),
			extractValue(themeWide, capsizeTrimVarName(style, 'capHeightTrim')),
		];
	}

	it('sets body styles from the body font and display styles from the display font', () => {
		const themeWide = themeWideOf({ fonts: { body: interFont, display: loraFont } });

		for (const style of typeStyles) {
			const font = typeStyleFontRole[style] === 'display' ? loraFont : interFont;
			expect(extractValue(themeWide, `--luke-font-${style}-font-family`)).toBe(font.family);
			expect(emittedTrims(themeWide, style)).toEqual(expectedTrims(style, font.metrics));
		}
		expect(extractValue(themeWide, '--luke-font-family-body')).toBe(interFont.family);
		expect(extractValue(themeWide, '--luke-font-family-display')).toBe(loraFont.family);
	});

	it('uses the body font for display styles when there is no display font', () => {
		const themeWide = themeWideOf({ fonts: { body: interFont } });

		for (const style of typeStyles) {
			expect(extractValue(themeWide, `--luke-font-${style}-font-family`)).toBe(interFont.family);
			expect(emittedTrims(themeWide, style)).toEqual(expectedTrims(style, interFont.metrics));
		}
		// A literal copy of the body family, never a reference to the body token.
		expect(extractValue(themeWide, '--luke-font-family-display')).toBe(interFont.family);
	});

	it('compiles a null display font exactly like an omitted one', () => {
		expect(themeWideOf({ fonts: { body: interFont, display: null } })).toBe(
			themeWideOf({ fonts: { body: interFont } }),
		);
	});

	it('keeps the code family on the system monospace stack', () => {
		const themeWide = themeWideOf({ fonts: { body: interFont, display: loraFont } });
		expect(extractValue(themeWide, '--luke-font-family-code')).toContain('monospace');
	});
});

describe('extending themes', () => {
	it('compiles an extending theme to a standalone stylesheet with every token', () => {
		const css = defineTheme({ extends: tactileTheme, name: 'product' });

		expect(findTokenCompatibilityProblems(css, 'product')).toEqual([]);
		expect(css).not.toContain('luke-ui-theme-tactile');
	});
});
