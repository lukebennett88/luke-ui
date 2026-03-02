import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Color from 'colorjs.io';
import { mkdir, writeFile } from 'node:fs/promises';

interface GeneratedColorTokenValue {
	alpha?: number;
	colorSpace: string;
	components: Array<number>;
}

const paletteThemePrimary = {
	base: '#0160ae',
	100: '#e9f3fb',
	200: '#d4e7f7',
	300: '#a9cfef',
	400: '#185281',
	500: '#194c73',
	600: '#1a3f60',
} as const;

const paletteThemeAccent = {
	base: '#ee2925',
	100: '#f9ebeb',
	200: '#f4d8d7',
	300: '#e8b1b0',
	400: '#c63c39',
	500: '#772422',
	600: '#4f1817',
} as const;

const backgroundColorValues = {
	neutral: '#fff',
	neutralHover: '#ededed',
	neutralPressed: '#e4e4e4',
	neutralDisabled: '#ededed',
	neutralSubtle: '#fafafa',
	neutralBold: '#d9d9d9',
	neutralInverted: '#212121',
	input: '#fff',
	inputDisabled: '#fafafa',
	positiveSubtle: '#d5f2bb',
	positiveBold: '#306317',
	informativeSubtle: '#d6e4ff',
	informativeBold: '#1d39c4',
	cautionSubtle: '#faedb5',
	cautionBold: '#d89614',
	criticalSubtle: '#fac8c3',
	criticalBold: '#c0262e',
	criticalBoldHover: '#a61d24',
	criticalBoldPressed: '#791a1f',
} as const;

const borderColorValues = {
	neutralSubtle: '#e4e4e4',
	neutralBold: '#bdbdbd',
	neutralDisabled: '#e4e4e4',
	neutralBoldInverted: '#fff',
	input: '#bdbdbd',
	inputCritical: '#c0262e',
	positive: '#6abe39',
	informative: '#597ef7',
	caution: '#e8b339',
	critical: '#e84749',
} as const;

const foregroundColorValues = {
	neutralSubtle: '#737373',
	neutralBold: '#212121',
	neutralDisabled: '#9e9e9e',
	neutralBoldInverted: '#fff',
	positive: '#3c8618',
	informative: '#1d39c4',
	caution: '#ad7914',
	critical: '#c0262e',
} as const;

const themeColorValues = {
	buttonBackgroundColor: paletteThemePrimary['400'],
	buttonBackgroundColorHover: paletteThemePrimary['500'],
	buttonBackgroundColorActive: paletteThemePrimary['600'],
	buttonBorderColor: paletteThemePrimary['400'],
	buttonBorderColorHover: paletteThemePrimary['500'],
	buttonBorderColorActive: paletteThemePrimary['600'],
	buttonColor: paletteThemePrimary['100'],
	focusRingColor: paletteThemePrimary['300'],
	inputBackgroundColor: backgroundColorValues.neutral,
	inputBackgroundColorHover: paletteThemePrimary['100'],
	inputBackgroundColorActive: paletteThemePrimary['200'],
	inputBorderColor: paletteThemePrimary['300'],
	inputBorderColorHover: paletteThemePrimary['500'],
	inputBorderColorActive: paletteThemePrimary['600'],
	inputColor: paletteThemePrimary['600'],
	linkColor: paletteThemePrimary.base,
	linkColorHover: paletteThemePrimary['600'],
	menuBackgroundColor: paletteThemePrimary['600'],
	menuColor: paletteThemePrimary['100'],
	menuColorHover: backgroundColorValues.neutral,
	menuItemAccent: paletteThemeAccent.base,
	menuItemBackgroundColor: paletteThemePrimary['400'],
	menuItemBackgroundColorHover: paletteThemePrimary['500'],
	menuItemBackgroundColorActive: paletteThemePrimary['600'],
	menuLogoBackgroundColor: backgroundColorValues.neutral,
	paletteThemeAccentBase: paletteThemeAccent.base,
	paletteThemeAccent100: paletteThemeAccent['100'],
	paletteThemeAccent200: paletteThemeAccent['200'],
	paletteThemeAccent300: paletteThemeAccent['300'],
	paletteThemeAccent400: paletteThemeAccent['400'],
	paletteThemeAccent500: paletteThemeAccent['500'],
	paletteThemeAccent600: paletteThemeAccent['600'],
	paletteThemePrimaryBase: paletteThemePrimary.base,
	paletteThemePrimary100: paletteThemePrimary['100'],
	paletteThemePrimary200: paletteThemePrimary['200'],
	paletteThemePrimary300: paletteThemePrimary['300'],
	paletteThemePrimary400: paletteThemePrimary['400'],
	paletteThemePrimary500: paletteThemePrimary['500'],
	paletteThemePrimary600: paletteThemePrimary['600'],
} as const;

const colorGroups = {
	backgroundColorTokenValues: backgroundColorValues,
	borderColorTokenValues: borderColorValues,
	foregroundColorTokenValues: foregroundColorValues,
	themeColorTokenValues: themeColorValues,
} as const;

function roundNumber(value: number): number {
	return Math.round(value * 1_000_000) / 1_000_000;
}

function toDesignTokenColorSpace(colorJsSpaceId: string): string {
	return colorJsSpaceId === 'p3' ? 'display-p3' : colorJsSpaceId;
}

function toColorTokenValue(inputColor: string): GeneratedColorTokenValue {
	const parsedColor = new Color(inputColor);
	const alpha = roundNumber(parsedColor.alpha ?? 1);

	const components = parsedColor.coords.map((component, index) => {
		if (component === null) {
			throw new Error(
				`Color token "${inputColor}" has a missing component at index ${index}`,
			);
		}

		return roundNumber(component);
	});

	return {
		...(alpha === 1 ? {} : { alpha }),
		colorSpace: toDesignTokenColorSpace(parsedColor.spaceId),
		components,
	};
}

function toGeneratedConst(name: string, value: unknown): string {
	return `export const ${name} = ${JSON.stringify(value, null, '\t')} as const;\n`;
}

const generatedGroups = Object.entries(colorGroups).map(([name, values]) => {
	const transformed = Object.fromEntries(
		Object.entries(values).map(([key, inputColor]) => [
			key,
			toColorTokenValue(inputColor),
		]),
	);

	return toGeneratedConst(name, transformed);
});

const output = `// This file is auto-generated by scripts/generate-color-tokens.ts.\n// Do not edit manually.\n\n${generatedGroups.join('\n')}`;

const outputPath = fileURLToPath(
	new URL('../.generated/color-tokens.generated.ts', import.meta.url),
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, 'utf8');
