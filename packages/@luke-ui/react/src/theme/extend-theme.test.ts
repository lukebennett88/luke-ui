import { describe, expect, it } from 'vite-plus/test';
import { tactileTheme } from './__fixtures__/tactile.js';
import {
	interFont,
	loraFont,
	playfairFont,
	splitBlocks,
	testTypography,
} from './__fixtures__/theme-css.js';
import { ThemeContrastError } from './build-theme.js';
import { gamutMapOklch, parseColor } from './color.js';
import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';
import { defaultDepth, defineTheme, normalizeTheme } from './define-theme.js';
import { resolveThemeInput } from './extend-theme.js';

function foundationOf(input: ThemeInput | ExtendingThemeInput) {
	return normalizeTheme(resolveThemeInput(input).input);
}

/** Every `--luke-*` declaration in a stylesheet, keyed by rule block and variable name. */
function declarations(css: string): Array<[string, string]> {
	return Object.entries(splitBlocks(css)).flatMap(([blockName, block]) => {
		return [...block.matchAll(/(--luke-[a-z0-9-]+): ([^;]+);/g)].map((match): [string, string] => [
			`${blockName} ${match[1] ?? ''}`,
			match[2] ?? '',
		]);
	});
}

describe('theme inheritance', () => {
	it('emits the base stylesheet byte for byte when a theme extends it with no overrides', () => {
		// The extending theme repeats the base's own name on purpose, so the comparison covers the
		// whole stylesheet including the identity class.
		expect(defineTheme({ extends: tactileTheme, name: 'tactile' })).toBe(defineTheme(tactileTheme));
	});

	it('overrides the accent without touching another token, under the extending name', () => {
		const reference = defineTheme({ ...tactileTheme, name: 'product' });
		const subject = defineTheme({
			color: { accent: '#3b82f6' },
			extends: tactileTheme,
			name: 'product',
		});
		const withoutAccent = (css: string) => {
			return declarations(css).filter(([name]) => !name.includes('accent'));
		};
		const accentOnly = (css: string) => {
			return declarations(css).filter(([name]) => name.includes('accent'));
		};

		expect(withoutAccent(subject)).toEqual(withoutAccent(reference));
		expect(accentOnly(subject)).not.toEqual(accentOnly(reference));

		expect(splitBlocks(subject).themeWide).toContain('.luke-ui-theme-product');
		expect(splitBlocks(subject).themeWide).not.toContain('luke-ui-theme-tactile');
	});

	it('inherits every colour role a base authors', () => {
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				danger: { dark: 'oklch(0.72 0.16 25)', light: 'oklch(0.52 0.18 27)' },
				focus: { dark: 'oklch(0.72 0.13 255)', light: 'oklch(0.55 0.17 255)' },
				info: { dark: 'oklch(0.72 0.13 255)', light: 'oklch(0.52 0.16 255)' },
				neutral: 'oklch(0.5 0.01 260)',
				neutralStyle: 'cool',
				backdrop: 'oklch(0 0 0 / 0.3)',
				success: { dark: 'oklch(0.74 0.13 150)', light: 'oklch(0.5 0.13 150)' },
				surface: {
					base: 'oklch(0.6 0.02 260)',
					field: { light: 'oklch(0.99 0.01 260)' },
					overlay: { dark: 'oklch(0.3 0.01 260)' },
					subdued: { dark: 'oklch(0.18 0.01 260)', light: 'oklch(0.96 0.01 260)' },
				},
				warning: { dark: 'oklch(0.78 0.13 80)', light: 'oklch(0.72 0.14 75)' },
			},
			name: 'all-roles',
			typography: testTypography,
		};

		expect(defineTheme({ extends: base, name: 'all-roles' })).toBe(defineTheme(base));
	});

	it('replaces a colour role whole rather than merging it per mode', () => {
		const base: ThemeInput = {
			color: { accent: { dark: 'oklch(0.75 0.1 200)', light: 'oklch(0.52 0.11 200)' } },
			name: 'pair-accent',
			typography: testTypography,
		};
		const foundation = foundationOf({
			color: { accent: 'oklch(0.6 0.15 30)' },
			extends: base,
			name: 'string-accent',
		});

		expect(foundation.light.color.accent).not.toEqual(
			gamutMapOklch(parseColor('oklch(0.52 0.11 200)')),
		);
		expect(foundation.dark.color.accent).not.toEqual(
			gamutMapOklch(parseColor('oklch(0.75 0.1 200)')),
		);

		const light = foundation.light.color.accent;
		const dark = foundation.dark.color.accent;
		expect(light.h).toBeCloseTo(30, 0);
		expect(dark.h).toBeCloseTo(30, 0);
		expect(light.l).toBeCloseTo(0.5, 1);
		expect(dark.l).toBeCloseTo(0.72, 1);
	});

	it('merges surfaces role by role, replacing each authored role whole', () => {
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				surface: {
					field: { dark: 'oklch(0.2 0 0)', light: 'oklch(0.97 0 0)' },
					subdued: { dark: 'oklch(0.18 0 0)', light: 'oklch(0.95 0 0)' },
				},
			},
			name: 'surface-base',
			typography: testTypography,
		};
		const foundation = foundationOf({
			color: { surface: { field: { light: 'oklch(0.99 0 0)' } } },
			extends: base,
			name: 'surface-child',
		});

		// The child's field replaces the base's field whole, so the dark side falls back to generation.
		expect(foundation.light.color.surface.field).toEqual(
			gamutMapOklch(parseColor('oklch(0.99 0 0)')),
		);
		expect(foundation.dark.color.surface.field).toBeUndefined();
		// A surface the child leaves out is inherited from the base.
		expect(foundation.light.color.surface.subdued).toEqual(
			gamutMapOklch(parseColor('oklch(0.95 0 0)')),
		);
	});

	it('treats the neutral character as one decision', () => {
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'pair-neutral',
			typography: testTypography,
		};
		const baseFoundation = foundationOf(base);
		const foundation = foundationOf({
			color: { neutralStyle: 'warm' },
			extends: base,
			name: 'warm-neutral',
		});

		// The extending theme's `neutralStyle` decides the canvas, so the inherited raw `neutral` went
		// with it rather than shadowing the style.
		expect(foundation.light.color.neutral).not.toEqual(baseFoundation.light.color.neutral);
		expect(foundation.light.color.neutral.h).toBeCloseTo(70, 0);
	});

	it('inherits materials per rung and radius per step', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			depth: {
				dark: { overlay: 'base-dark-overlay' },
				light: { overlay: 'base-light-overlay', resting: 'base-light-resting' },
			},
			name: 'material-base',
			typography: testTypography,
			radius: { control: 10, surface: 14 },
		};
		const foundation = foundationOf({
			depth: { light: { overlay: 'own-light-overlay', resting: undefined } },
			extends: base,
			name: 'material-child',
			radius: { detail: 2, surface: undefined },
		});

		expect(foundation.light.depth.overlay).toBe('own-light-overlay');
		// A rung authored as `undefined` reads as omitted, so it inherits rather than resetting.
		expect(foundation.light.depth.resting).toBe('base-light-resting');
		// A rung neither theme sets still falls back to the curated default.
		expect(foundation.light.depth.floating).toBe(defaultDepth.light.floating);
		// Dark is untouched by a light-only override.
		expect(foundation.dark.depth.overlay).toBe('base-dark-overlay');

		// The base's radii survive, a step authored as `undefined` inherits, and the child adds its own.
		expect(foundation.radius).toEqual({ control: 10, detail: 2, surface: 14 });
	});

	it('replaces each font role whole and merges the font weights', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'type-base',
			typography: {
				fonts: { body: interFont, display: loraFont },
				fontWeight: { body: 300, heading: 800 },
			},
		};
		const foundation = foundationOf({
			extends: base,
			name: 'type-child',
			typography: { fonts: { body: playfairFont }, fontWeight: { body: 400 } },
		});

		expect(foundation.typography).toEqual({
			fonts: { body: playfairFont, display: loraFont },
			fontWeight: { body: 400, heading: 800 },
		});
	});

	it('keeps a null display font through a chain of three and resolves it after the merge', () => {
		const root: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'root',
			typography: { fonts: { body: interFont, display: loraFont } },
		};
		const middle: ExtendingThemeInput = {
			extends: root,
			name: 'middle',
			typography: { fonts: { display: null } },
		};
		// The leaf omits `display`, so it inherits the middle theme's `null`, not the root's font.
		const foundation = foundationOf({
			extends: middle,
			name: 'leaf',
			typography: { fonts: { body: playfairFont } },
		});

		expect(foundation.typography.fonts).toEqual({ body: playfairFont });
	});

	it('resolves a chain of three, and throws when a chain forms a cycle', () => {
		const root: ThemeInput = {
			color: {
				accent: '#3b82f6',
				success: { dark: 'oklch(0.8 0.12 150)', light: 'oklch(0.45 0.12 150)' },
			},
			name: 'root',
			typography: testTypography,
		};
		const middle: ExtendingThemeInput = {
			color: { accent: '#ef4444' },
			extends: root,
			name: 'middle',
		};
		const foundation = foundationOf({ extends: middle, name: 'leaf' });

		// A role only the innermost base sets reaches the outermost theme through the middle theme.
		expect(foundation.light.color.success).toEqual(
			gamutMapOklch(parseColor('oklch(0.45 0.12 150)')),
		);
		expect(foundation.dark.color.success).toEqual(gamutMapOklch(parseColor('oklch(0.8 0.12 150)')));

		const first: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'first',
			typography: testTypography,
		};
		const second: ExtendingThemeInput = { extends: first, name: 'second' };
		first.extends = second;
		expect(() => defineTheme(first)).toThrow(/"first".*"second"/);
	});

	it('names the colour provenance on a contrast failure', () => {
		// A near-white focus ring misses the hard 3:1 gate for `color.border.focus` against Tactile's
		// light canvas.
		let thrown: unknown = null;
		try {
			defineTheme({
				color: { focus: 'oklch(0.99 0 0)' },
				extends: tactileTheme,
				name: 'low-contrast-focus',
				typography: testTypography,
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeContrastError);
		if (!(thrown instanceof ThemeContrastError)) return;
		expect(thrown.failures.map((failure) => failure.foreground)).toContain('color.border.focus');
		expect(thrown.inheritance?.chain).toEqual(['low-contrast-focus', 'tactile']);
		expect(thrown.inheritance?.ownColors).toContain('color.focus');
		expect(thrown.inheritance?.inheritedColors).toContain('color.accent');
		expect(thrown.inheritance?.inheritedColors).toContain('color.neutral');
	});

	it('names surface provenance role by role on a contrast failure', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6', surface: { overlay: { light: 'oklch(1 0 0)' } } },
			name: 'surface-provenance-base',
			typography: testTypography,
		};
		let thrown: unknown = null;
		try {
			defineTheme({
				color: { surface: { field: { light: 'oklch(0.6 0 0)' } } },
				extends: base,
				name: 'surface-provenance',
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeContrastError);
		if (!(thrown instanceof ThemeContrastError)) return;
		expect(thrown.inheritance?.ownColors).toEqual(['color.surface.field']);
		expect(thrown.inheritance?.inheritedColors).toContain('color.surface.overlay');
		expect(thrown.inheritance?.inheritedColors).not.toContain('color.surface.base');
		expect(thrown.message).toContain('Own colours: color.surface.field.');
	});

	it('does not report a colour a later theme in the chain discarded', () => {
		const root: ThemeInput = {
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'root',
			typography: testTypography,
		};
		const middle: ExtendingThemeInput = {
			color: { focus: 'oklch(0.99 0 0)', neutralStyle: 'warm' },
			extends: root,
			name: 'middle',
		};
		let thrown: unknown = null;
		try {
			defineTheme({ extends: middle, name: 'leaf' });
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeContrastError);
		if (!(thrown instanceof ThemeContrastError)) return;
		// middle's neutralStyle discards root's neutral, so the merge carries no neutral to inherit.
		expect(thrown.inheritance?.chain).toEqual(['leaf', 'middle', 'root']);
		expect(thrown.inheritance?.ownColors).toEqual([]);
		expect(thrown.inheritance?.inheritedColors).toContain('color.accent');
		expect(thrown.inheritance?.inheritedColors).toContain('color.neutralStyle');
		expect(thrown.inheritance?.inheritedColors).not.toContain('color.neutral');
	});
});
