import { describe, expect, it } from 'vite-plus/test';
import { splitBlocks } from './__fixtures__/theme-css.js';
import { ThemeContrastError } from './build-theme.js';
import { parseColor } from './color.js';
import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';
import { defaultDepth, defineTheme, normalizeTheme } from './define-theme.js';
import { tactileTheme } from './foundations/tactile.js';

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
		const withoutAccent = (css: string) =>
			declarations(css).filter(([name]) => !name.includes('accent'));
		const accentOnly = (css: string) =>
			declarations(css).filter(([name]) => name.includes('accent'));

		// Overriding one role changes that role's variables and nothing else.
		expect(withoutAccent(subject)).toEqual(withoutAccent(reference));
		expect(accentOnly(subject)).not.toEqual(accentOnly(reference));

		// The identity is the extending theme's, never the base's.
		expect(splitBlocks(subject).identity).toContain('.luke-ui-theme-product');
		expect(splitBlocks(subject).identity).not.toContain('luke-ui-theme-tactile');
	});

	it('inherits every colour role a base authors', () => {
		// Guards against a role being left out of the merge: the base sets all ten colour keys, and the
		// extending theme overrides none of them.
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				background: 'oklch(0.6 0.02 260)',
				danger: { dark: 'oklch(0.72 0.16 25)', light: 'oklch(0.52 0.18 27)' },
				focus: { dark: 'oklch(0.72 0.13 255)', light: 'oklch(0.55 0.17 255)' },
				info: { dark: 'oklch(0.72 0.13 255)', light: 'oklch(0.52 0.16 255)' },
				neutral: 'oklch(0.5 0.01 260)',
				neutralStyle: 'cool',
				scrim: 'oklch(0 0 0 / 0.3)',
				success: { dark: 'oklch(0.74 0.13 150)', light: 'oklch(0.5 0.13 150)' },
				warning: { dark: 'oklch(0.78 0.13 80)', light: 'oklch(0.72 0.14 75)' },
			},
			name: 'all-roles',
		};

		expect(defineTheme({ extends: base, name: 'all-roles' })).toBe(defineTheme(base));
	});

	it('replaces a colour role whole rather than merging it per mode', () => {
		const base: ThemeInput = {
			color: { accent: { dark: 'oklch(0.75 0.1 200)', light: 'oklch(0.52 0.11 200)' } },
			name: 'pair-accent',
		};
		const foundation = normalizeTheme({
			color: { accent: 'oklch(0.6 0.15 30)' },
			extends: base,
			name: 'string-accent',
		});

		// Neither mode keeps the base's verbatim side.
		expect(foundation.light.color.accent).not.toBe('oklch(0.52 0.11 200)');
		expect(foundation.dark.color.accent).not.toBe('oklch(0.75 0.1 200)');

		// Both modes adapt the extending theme's single string: its hue, each mode's own lightness.
		const light = parseColor(foundation.light.color.accent);
		const dark = parseColor(foundation.dark.color.accent);
		expect(light.h).toBeCloseTo(30, 0);
		expect(dark.h).toBeCloseTo(30, 0);
		expect(light.l).toBeCloseTo(0.5, 1);
		expect(dark.l).toBeCloseTo(0.72, 1);
	});

	it('treats the neutral character as one decision', () => {
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'pair-neutral',
		};
		const baseFoundation = normalizeTheme(base);
		const foundation = normalizeTheme({
			color: { neutralStyle: 'warm' },
			extends: base,
			name: 'warm-neutral',
		});

		// The extending theme's `neutralStyle` decides the canvas, so the inherited raw `neutral` went
		// with it rather than shadowing the style.
		expect(foundation.light.color.neutral).not.toBe(baseFoundation.light.color.neutral);
		expect(parseColor(foundation.light.color.neutral).h).toBeCloseTo(70, 0);
	});

	it('inherits materials per rung and radius per step', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			depth: {
				dark: { overlay: 'base-dark-overlay' },
				light: { overlay: 'base-light-overlay', resting: 'base-light-resting' },
			},
			name: 'material-base',
			radius: { base: 4, control: 10 },
		};
		const foundation = normalizeTheme({
			depth: { light: { overlay: 'own-light-overlay', resting: undefined } },
			extends: base,
			name: 'material-child',
			radius: { base: 8 },
		});

		// The overridden rung wins, and the base's other light rung survives instead of falling back to
		// the curated default.
		expect(foundation.light.depth.overlay).toBe('own-light-overlay');
		// A rung authored as `undefined` reads as omitted, so it inherits rather than resetting.
		expect(foundation.light.depth.resting).toBe('base-light-resting');
		// A rung neither theme sets still falls back to the curated default.
		expect(foundation.light.depth.floating).toBe(defaultDepth.light.floating);
		// Dark is untouched by a light-only override.
		expect(foundation.dark.depth.overlay).toBe('base-dark-overlay');

		// The base's pinned `control` survives, and every other step regenerates from the new base.
		expect(foundation.radius).toEqual({ control: 10, detail: 8, overlay: 32, surface: 24 });
	});

	it('replaces the font family and merges the font weights', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'type-base',
			typography: { fontFamily: 'dm-sans', fontWeight: { body: 300, heading: 800 } },
		};
		const foundation = normalizeTheme({
			extends: base,
			name: 'type-child',
			typography: { fontFamily: 'apple-system', fontWeight: { body: 400 } },
		});

		expect(foundation.typography).toEqual({
			fontFamily: 'apple-system',
			fontWeight: { body: 400, heading: 800 },
		});
	});

	it('resolves a chain of three, and throws when a chain forms a cycle', () => {
		const root: ThemeInput = {
			color: {
				accent: '#3b82f6',
				success: { dark: 'oklch(0.8 0.12 150)', light: 'oklch(0.45 0.12 150)' },
			},
			name: 'root',
		};
		const middle: ExtendingThemeInput = {
			color: { accent: '#ef4444' },
			extends: root,
			name: 'middle',
		};
		const foundation = normalizeTheme({ extends: middle, name: 'leaf' });

		// A role only the innermost base sets reaches the outermost theme through the middle theme.
		expect(foundation.light.color.success).toBe('oklch(0.45 0.12 150)');
		expect(foundation.dark.color.success).toBe('oklch(0.8 0.12 150)');

		// Naming both themes is the only observable outcome of a cycle, so assert the message here.
		const first: ThemeInput = { color: { accent: '#3b82f6' }, name: 'first' };
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
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeContrastError);
		if (!(thrown instanceof ThemeContrastError)) return;
		expect(thrown.failures.map((failure) => failure.foreground)).toContain('color.border.focus');
		// The provenance traces the failing colour back to the theme that supplied it.
		expect(thrown.inheritance?.chain).toEqual(['low-contrast-focus', 'tactile']);
		expect(thrown.inheritance?.ownColors).toContain('color.focus');
		expect(thrown.inheritance?.inheritedColors).toContain('color.accent');
		expect(thrown.inheritance?.inheritedColors).toContain('color.neutral');
	});

	it('does not credit a base with a neutral the merge already dropped', () => {
		// The base authors an explicit `neutral` pair, and the extending theme authors only
		// `neutralStyle`, which discards the inherited `neutral` per `inheritColor`'s neutral coupling.
		const base: ThemeInput = {
			color: {
				accent: '#3b82f6',
				neutral: { dark: 'oklch(0.25 0.02 210)', light: 'oklch(0.98 0 0)' },
			},
			name: 'neutral-base',
		};
		let thrown: unknown = null;
		try {
			defineTheme({
				color: { focus: 'oklch(0.99 0 0)', neutralStyle: 'warm' },
				extends: base,
				name: 'neutral-style-child',
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeContrastError);
		if (!(thrown instanceof ThemeContrastError)) return;
		expect(thrown.inheritance?.ownColors).toContain('color.neutralStyle');
		expect(thrown.inheritance?.ownColors).toContain('color.focus');
		expect(thrown.inheritance?.inheritedColors).toContain('color.accent');
		// The child authors `neutralStyle`, so the merge drops the base's `neutral`. The merged input
		// carries no value for `color.neutral`, so it belongs in neither list.
		expect(thrown.inheritance?.inheritedColors).not.toContain('color.neutral');
		expect(thrown.inheritance?.ownColors).not.toContain('color.neutral');
	});
});
