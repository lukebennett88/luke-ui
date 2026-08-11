import { describe, expect, it } from 'vite-plus/test';
import { themeClassName as paperThemeClassName } from '../themes/paper/index.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';
import {
	extractValue,
	paperFoundation,
	splitBlocks,
	tactileFoundation,
} from './__fixtures__/theme-css.js';
import { buildTheme } from './build-theme.js';
import { flattenThemeContract, spaceScale } from './contract.js';
import type { ThemeFoundation } from './foundation.js';
import { defaultFontWeights, defaultRadius, defaultSourceColors } from './foundation.js';

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

function countOccurrences(text: string, needle: string): number {
	return text.split(needle).length - 1;
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
			expect(css).toContain(`:where(:root[data-color-mode='${mode}']),`);
			expect(css).toContain(`:where(:root) :where([data-color-mode='${mode}']),`);
			expect(css).toContain(`.luke-ui-theme-tactile[data-color-mode='${mode}'],`);
			expect(css).toContain(`.luke-ui-theme-tactile [data-color-mode='${mode}'],`);
			expect(css).toContain(`[data-color-mode='${mode}'] .luke-ui-theme-tactile {`);
		}
	});

	it('pairs every rule block with a zero-specificity `:where(:root)` fallback', () => {
		for (const block of [
			blocks.identity,
			blocks.baseLight,
			blocks.mediaDark,
			blocks.explicitLight,
			blocks.explicitDark,
		]) {
			expect(block).toContain(':where(:root');
		}
	});

	it('never emits a bare `:root` selector outside of `:where()`', () => {
		const rootIndexes = [...css.matchAll(/:root/g)].map((match) => match.index);
		expect(rootIndexes.length).toBeGreaterThan(0);
		for (const index of rootIndexes) {
			expect(css.slice(index - ':where('.length, index)).toBe(':where(');
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
		expect(css).toContain('--luke-font-100-font-size:');
		expect(css).toContain('--luke-font-300-line-height:');
		expect(css).toContain('--luke-font-900-letter-spacing:');
		expect(css).toContain('--luke-icon-size-xsmall:');
		expect(css).toContain('--luke-icon-size-large:');
	});

	it('emits the public spacing scale in every built-in theme', () => {
		for (const foundation of [tactileFoundation, paperFoundation]) {
			const { identity } = splitBlocks(buildTheme(foundation));
			expect(
				spaceScale.map(([step]) => [step, extractValue(identity, `--luke-space-${step}`)]),
			).toEqual(spaceScale);
		}
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
			const tactileResting = extractValue(tactileBlock, '--luke-depth-resting');

			expect(paperResting).not.toBe(tactileResting);
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

	it('emits Capsize trim variables for every curated font family and type style', () => {
		const fontFamilies = ['apple-system', 'dm-sans', 'inter'] as const;
		const styles = [
			'caption',
			'label',
			'body',
			'lead',
			'heading4',
			'heading3',
			'heading2',
			'heading1',
			'display',
		] as const;

		for (const fontFamily of fontFamilies) {
			const css = buildTheme({
				...minimalFoundation,
				typography: { fontFamily },
			});
			const identity = splitBlocks(css).identity;

			for (const style of styles) {
				expect(identity).toContain(`--luke-font-${style}-cap-height-trim:`);
				expect(identity).toContain(`--luke-font-${style}-baseline-trim:`);
				expect(identity).toContain(`--luke-font-${style}-font-weight:`);
				expect(identity).toContain(`--luke-font-${style}-font-family:`);
			}
		}
	});
});

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
});
