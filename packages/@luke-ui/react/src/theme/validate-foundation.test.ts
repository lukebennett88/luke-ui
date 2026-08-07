import { describe, expect, it } from 'vite-plus/test';
import { tactileFoundation } from './__fixtures__/theme-css.js';
import { buildTheme } from './build-theme.js';
import type { ThemeFoundation } from './foundation.js';

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
