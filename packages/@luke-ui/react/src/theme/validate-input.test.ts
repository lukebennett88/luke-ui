import { describe, expect, it } from 'vite-plus/test';
import { interFont, loraFont, testTypography } from './__fixtures__/theme-css.js';
import type { ExtendingThemeInput, ThemeInput } from './define-theme.js';
import { defineTheme } from './define-theme.js';
import { ThemeValidationError } from './validate-input.js';

function issuesOf(input: ThemeInput | ExtendingThemeInput) {
	try {
		defineTheme(input);
	} catch (error) {
		if (error instanceof ThemeValidationError) return error.issues;
		throw error;
	}
	throw new Error('expected defineTheme to throw ThemeValidationError');
}

/** A fresh theme whose typography is cast, so a test can author a value the type rejects. */
function themeWithTypography(typography: unknown): ThemeInput {
	return {
		color: { accent: '#3b82f6' },
		name: 'invalid-fonts',
		typography: typography as ThemeInput['typography'],
	};
}

describe('font family validation', () => {
	const rejected = [
		["'Inter'; color: red", 'must not contain'],
		["'Inter' } html {", 'must not contain'],
		['Inter, <script>', 'must not contain'],
		['Inter\nsans-serif', 'must not contain'],
		// An open comment hides every declaration after it, so the theme loses all its tokens.
		['Inter/*', 'must not contain'],
		['Inter */ sans-serif', 'must not contain'],
		// A backslash escapes the `;` or closing quote after it, so later declarations are lost.
		['Inter\\', 'must not contain'],
		["'Inter\\', sans-serif", 'must not contain'],
		// A browser drops an invalid `font-family` list whole, so the stack's fallbacks are lost too.
		["'Inter, sans-serif", 'must be a comma-separated list'],
		['"Inter\', sans-serif', 'must be a comma-separated list'],
		["'Slash/Name', Star*Name, sans-serif", 'must be a comma-separated list'],
		['Inter, , sans-serif', 'must be a comma-separated list'],
		['Font Name 2, serif', 'must be a comma-separated list'],
		['serif Pro, sans-serif', 'must be a comma-separated list'],
		["'Inter' Sans, sans-serif", 'must be a comma-separated list'],
		['inherit', 'must be a comma-separated list'],
		['  ', 'must be a non-empty CSS font-family stack'],
	] as const;

	for (const [family, message] of rejected) {
		it(`rejects ${JSON.stringify(family)}`, () => {
			const issues = issuesOf(themeWithTypography({ fonts: { body: { ...interFont, family } } }));
			expect(issues).toEqual([
				{
					message: expect.stringContaining(message),
					path: 'typography.fonts.body.family',
					theme: 'invalid-fonts',
				},
			]);
		});
	}

	it('accepts quoted names with punctuation, generic families, and a quote of the other kind inside a name', () => {
		const family = `"Font's Name", 'Other "Quoted" Name', "Font, Inc", 'Star*Name', system-ui, sans-serif`;
		expect(() =>
			defineTheme(themeWithTypography({ fonts: { body: { ...interFont, family } } })),
		).not.toThrow();
	});

	it('accepts unquoted names of several words, including ones that end with a keyword', () => {
		const family = '-apple-system, BlinkMacSystemFont, Noto Sans CJK JP, Pro Serif, sans-serif';
		expect(() =>
			defineTheme(themeWithTypography({ fonts: { body: { ...interFont, family } } })),
		).not.toThrow();
	});
});

describe('font metric validation', () => {
	const rejected = [
		['unitsPerEm', 0, 'must be greater than 0'],
		['unitsPerEm', Number.NaN, 'must be a finite number'],
		['capHeight', -1, 'must be greater than 0'],
		['ascent', 0, 'must be greater than 0'],
		['descent', 10, 'must be 0 or less'],
		['lineGap', -1, 'must be 0 or greater'],
		['lineGap', Number.POSITIVE_INFINITY, 'must be a finite number'],
		['xHeight', Number.NaN, 'must be a finite number when set'],
		['xWidthAvg', 'wide', 'must be a finite number when set'],
	] as const;

	for (const [field, value, message] of rejected) {
		it(`rejects ${field} of ${String(value)}`, () => {
			const metrics = { ...interFont.metrics, [field]: value };
			const issues = issuesOf(
				themeWithTypography({ fonts: { body: interFont, display: { ...interFont, metrics } } }),
			);
			expect(issues).toEqual([
				{
					message: expect.stringContaining(message),
					path: `typography.fonts.display.metrics.${field}`,
					theme: 'invalid-fonts',
				},
			]);
		});
	}

	for (const familyName of [undefined, '', '  ', 42]) {
		it(`rejects a familyName of ${JSON.stringify(familyName)}`, () => {
			const metrics = { ...interFont.metrics, familyName };
			expect(issuesOf(themeWithTypography({ fonts: { body: { ...interFont, metrics } } }))).toEqual(
				[
					{
						message: 'must be a non-empty string',
						path: 'typography.fonts.body.metrics.familyName',
						theme: 'invalid-fonts',
					},
				],
			);
		});
	}

	it('accepts a cap height taller than the em and metrics with only the required fields', () => {
		const { ascent, descent, familyName, lineGap, unitsPerEm } = loraFont.metrics;
		const metrics = {
			ascent,
			capHeight: unitsPerEm * 1.2,
			descent,
			familyName,
			lineGap,
			unitsPerEm,
		};
		expect(() =>
			defineTheme(themeWithTypography({ fonts: { body: { ...loraFont, metrics } } })),
		).not.toThrow();
	});

	it('rejects a null body font', () => {
		expect(issuesOf(themeWithTypography({ fonts: { body: null } }))).toEqual([
			{ message: 'cannot be null', path: 'typography.fonts.body', theme: 'invalid-fonts' },
		]);
	});
});

describe('font weight validation', () => {
	for (const value of [0, 1001, Number.NaN]) {
		it(`rejects a weight of ${value}`, () => {
			const input = themeWithTypography({ ...testTypography, fontWeight: { heading: value } });
			expect(issuesOf(input)).toEqual([
				{
					message: 'must be a number from 1 to 1000',
					path: 'typography.fontWeight.heading',
					theme: 'invalid-fonts',
				},
			]);
		});
	}

	it('accepts any finite weight from 1 to 1000', () => {
		const fontWeight = { body: 1, emphasis: 1000, heading: 450.5, label: 500 };
		expect(() => defineTheme(themeWithTypography({ ...testTypography, fontWeight }))).not.toThrow();
	});
});

describe('validation across an extends chain', () => {
	it('validates each input on its own and reports every issue at once', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'base',
			typography: {
				fonts: { body: { ...interFont, metrics: { ...interFont.metrics, unitsPerEm: -1 } } },
			},
		};
		const child: ExtendingThemeInput = {
			extends: base,
			name: 'child',
			// The child replaces the base's invalid body font, and the base still fails on its own.
			typography: { fonts: { body: interFont }, fontWeight: { body: 2000 } },
		};

		let thrown: unknown = null;
		try {
			defineTheme(child);
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(ThemeValidationError);
		const error = thrown as ThemeValidationError;
		expect(error.issues).toEqual([
			{
				message: 'must be a number from 1 to 1000',
				path: 'typography.fontWeight.body',
				theme: 'child',
			},
			{
				message: 'must be greater than 0',
				path: 'typography.fonts.body.metrics.unitsPerEm',
				theme: 'base',
			},
		]);
		expect(error.message).toBe(
			[
				'Invalid theme input:',
				'Theme "child", typography.fontWeight.body: must be a number from 1 to 1000',
				'Theme "base", typography.fonts.body.metrics.unitsPerEm: must be greater than 0',
			].join('\n'),
		);
	});

	it('reports a missing body font against the outermost theme', () => {
		const base = { color: { accent: '#3b82f6' }, name: 'no-fonts' } as unknown as ThemeInput;
		const issues = issuesOf({ extends: base, name: 'outer' });

		expect(issues).toEqual([
			{
				message: 'is required. Set it on this theme or on a theme it extends.',
				path: 'typography.fonts.body',
				theme: 'outer',
			},
		]);
	});

	it('reports a base without typography instead of failing the merge', () => {
		// A base from an older theme package can lack a field a newer compiler requires.
		const base = { color: { accent: '#3b82f6' }, name: 'older-base' } as unknown as ThemeInput;
		const issues = issuesOf({
			extends: base,
			name: 'outer',
			typography: { fonts: { display: loraFont }, fontWeight: { heading: 700 } },
		});

		expect(issues).toEqual([
			{
				message: 'is required. Set it on this theme or on a theme it extends.',
				path: 'typography.fonts.body',
				theme: 'outer',
			},
		]);
	});

	it('reports malformed typography instead of failing the merge', () => {
		const base: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'base',
			typography: testTypography,
		};
		const child = {
			extends: base,
			name: 'child',
			typography: { fonts: null },
		} as unknown as ExtendingThemeInput;

		expect(issuesOf(child)).toEqual([
			{ message: 'must be an object', path: 'typography.fonts', theme: 'child' },
		]);
	});

	it('keeps detecting a cyclic chain before validating it', () => {
		const first: ThemeInput = {
			color: { accent: '#3b82f6' },
			name: 'first',
			typography: testTypography,
		};
		first.extends = { extends: first, name: 'second' };

		expect(() => defineTheme(first)).toThrow(/cyclic extends chain/);
	});
});
