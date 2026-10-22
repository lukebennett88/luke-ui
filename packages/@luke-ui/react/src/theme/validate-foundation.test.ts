import { describe, expect, it } from 'vite-plus/test';
import { tactileFoundation } from './__fixtures__/theme-css.js';
import { buildTheme } from './build-theme.js';
import type { ThemeFoundation } from './foundation.js';

describe('buildTheme foundation validation', () => {
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

	it('rejects an unsafe backdrop value with a message naming the field', () => {
		const unsafeBackdrop: ThemeFoundation = {
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: { ...tactileFoundation.light.color, backdrop: 'oklch(0 0 0 / 0.2); } .evil {' },
			},
			name: 'unsafe-backdrop',
		};

		expect(() => buildTheme(unsafeBackdrop)).toThrow(
			'light.color.backdrop: must be a non-empty CSS colour value',
		);
	});

	it('rejects a source colour that is not a well-formed OKLCH value', () => {
		const invalidAccent: ThemeFoundation = {
			...tactileFoundation,
			light: {
				...tactileFoundation.light,
				color: {
					...tactileFoundation.light.color,
					accent: { l: 1.5, c: 0.1, h: 200 },
				},
			},
			name: 'invalid-accent',
		};

		expect(() => buildTheme(invalidAccent)).toThrow(
			'light.color.accent: must be an OKLCH colour with lightness 0-1',
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

	describe('label weight', () => {
		function withWeights(fontWeight: { body?: number; label?: number }): ThemeFoundation {
			return {
				...tactileFoundation,
				name: 'weights',
				typography: { ...tactileFoundation.typography, fontWeight },
			};
		}

		it('accepts a label exactly 100 heavier than body, and the defaults', () => {
			expect(() => buildTheme(withWeights({ body: 300, label: 400 }))).not.toThrow();
			expect(() => buildTheme(withWeights({}))).not.toThrow();
		});

		it('rejects a label 99 heavier than body', () => {
			expect(() => buildTheme(withWeights({ body: 400, label: 499 }))).toThrow(
				'typography.fontWeight.label: must be at least 100 heavier than typography.fontWeight.body (label is 499, body is 400)',
			);
		});

		it('rejects a label equal to or lighter than body', () => {
			expect(() => buildTheme(withWeights({ body: 500, label: 500 }))).toThrow(
				'(label is 500, body is 500)',
			);
			expect(() => buildTheme(withWeights({ body: 600, label: 400 }))).toThrow(
				'(label is 400, body is 600)',
			);
		});

		it('checks against the default for an unset role', () => {
			expect(() => buildTheme(withWeights({ body: 450 }))).toThrow('(label is 500, body is 450)');
			expect(() => buildTheme(withWeights({ label: 450 }))).toThrow('(label is 450, body is 400)');
		});
	});
});
