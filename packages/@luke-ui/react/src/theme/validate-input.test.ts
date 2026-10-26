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
	// One case per rejection-message class, plus one representative per UNSAFE_FAMILY_PATTERN arm.
	const rejected = [
		["'Inter'; color: red", 'must not contain'],
		// An open comment hides every declaration after it, so the theme loses all its tokens.
		['Inter/*', 'must not contain'],
		// A backslash escapes the `;` or closing quote after it, so later declarations are lost.
		['Inter\\', 'must not contain'],
		['Inter\nsans-serif', 'must not contain'],
		// A browser drops an invalid `font-family` list whole, so the stack's fallbacks are lost too.
		["'Inter, sans-serif", 'must be a comma-separated list'],
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

	it('accepts unquoted multiword family names, including ones that end with a keyword', () => {
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

		expect(issuesOf(first)).toEqual([
			{ theme: 'first', path: 'extends', message: expect.stringContaining('cyclic extends chain') },
		]);
	});
});

describe('authored theme validation', () => {
	const base: ThemeInput = {
		color: { accent: '#3b82f6' },
		name: 'base',
		typography: testTypography,
	};

	it('aggregates child errors and overridden base errors with input-relative paths', () => {
		const invalidBase = {
			...base,
			color: { accent: { light: 'not-a-colour' }, neutralStyle: 'hot' },
			depth: { dark: { overlay: 'none; color: red' } },
			name: 'Invalid Base',
			radius: { control: -1 },
		} as unknown as ThemeInput;
		const child: ExtendingThemeInput = {
			color: { accent: '#3b82f6', neutralStyle: 'warm', backdrop: { dark: ' ' } },
			controlFinish: { light: { raised: 'none}' } },
			depth: { dark: { overlay: 'none' } },
			extends: invalidBase,
			name: 'child',
			radius: { control: 8, detail: Number.NaN },
		};

		expect(issuesOf(child)).toEqual([
			{
				theme: 'child',
				path: 'color.backdrop.dark',
				message: expect.stringContaining('non-empty CSS colour'),
			},
			{
				theme: 'child',
				path: 'controlFinish.light.raised',
				message: expect.stringContaining('background-image value without'),
			},
			{
				theme: 'child',
				path: 'radius.detail',
				message: expect.stringContaining('pixels, 0 or greater'),
			},
			{ theme: 'Invalid Base', path: 'name', message: expect.stringContaining('kebab-case') },
			{
				theme: 'Invalid Base',
				path: 'color.accent.light',
				message: expect.stringContaining('cannot parse colour'),
			},
			{
				theme: 'Invalid Base',
				path: 'color.neutralStyle',
				message: expect.stringContaining('cool, neutral, or warm'),
			},
			{
				theme: 'Invalid Base',
				path: 'depth.dark.overlay',
				message: expect.stringContaining('box-shadow value without'),
			},
			{
				theme: 'Invalid Base',
				path: 'radius.control',
				message: expect.stringContaining('pixels, 0 or greater'),
			},
		]);
	});

	const malformed = [
		['color', { color: null }, 'must be an object'],
		['color.accent', { color: { accent: {} } }, 'at least one of light or dark'],
		['color.neutral', { color: { neutral: [] } }, 'colour string or a light/dark object'],
		['color.focus.light', { color: { focus: { light: 42 } } }, 'must be a colour string'],
		['color.surface', { color: { surface: 'white' } }, 'must be an object'],
		[
			'color.surface.base',
			{ color: { surface: { base: false } } },
			'colour string or a light/dark object',
		],
		[
			'color.surface.subdued',
			{ color: { surface: { subdued: '#fff' } } },
			'must be a light/dark object',
		],
		[
			'color.surface.field',
			{ color: { surface: { field: '#fff' } } },
			'must be a light/dark object',
		],
		[
			'color.surface.raised',
			{ color: { surface: { raised: '#fff' } } },
			'must be a light/dark object',
		],
		['depth', { depth: [] }, 'must be an object'],
		['depth.dark', { depth: { dark: 'none' } }, 'must be an object'],
		['controlFinish', { controlFinish: false }, 'must be an object'],
		['controlFinish.light', { controlFinish: { light: null } }, 'must be an object'],
		['radius', { radius: 4 }, 'must be an object'],
	] as const;

	for (const [path, overrides, message] of malformed) {
		it(`rejects the malformed shape at ${path}`, () => {
			const input = {
				extends: base,
				name: 'child',
				...overrides,
			} as unknown as ExtendingThemeInput;
			expect(issuesOf(input)).toEqual([
				{ theme: 'child', path, message: expect.stringContaining(message) },
			]);
		});
	}

	const invalidValues = [
		[
			'color.accent.light',
			{ color: { accent: { light: 'oklch(1.5 0.1 200)' } } },
			'lightness must be 0-1',
		],
		[
			'color.neutral',
			{ color: { neutral: `oklch(0.5 ${'9'.repeat(400)} 200)` } },
			'channels must be finite',
		],
		[
			'color.success.dark',
			{ color: { success: { dark: `oklch(0.5 0.1 ${'9'.repeat(400)})` } } },
			'channels must be finite',
		],
		[
			'color.surface.field.dark',
			{ color: { surface: { field: { dark: 'red' } } } },
			'cannot parse colour',
		],
		['color.info', { color: { info: 'oklch(0.5 -0.1 200)' } }, 'cannot parse colour'],
		['color.backdrop', { color: { backdrop: 'none{' } }, 'CSS colour value without'],
		['depth.light.resting', { depth: { light: { resting: '' } } }, 'non-empty CSS box-shadow'],
		[
			'controlFinish.dark.recessed',
			{ controlFinish: { dark: { recessed: 42 } } },
			'non-empty CSS background-image',
		],
		['radius.overlay', { radius: { overlay: Number.POSITIVE_INFINITY } }, 'pixels, 0 or greater'],
		['radius.surface', { radius: { surface: '8' } }, 'pixels, 0 or greater'],
	] as const;

	for (const [path, overrides, message] of invalidValues) {
		it(`rejects an invalid authored value at ${path} before foundation generation`, () => {
			const input = {
				extends: base,
				name: 'child',
				...overrides,
			} as unknown as ExtendingThemeInput;
			expect(issuesOf(input)).toEqual([
				{ theme: 'child', path, message: expect.stringContaining(message) },
			]);
		});
	}

	it('reports a missing accent against the outermost input', () => {
		const noAccent = { ...base, color: undefined } as unknown as ThemeInput;
		expect(issuesOf({ extends: noAccent, name: 'child', color: { accent: undefined } })).toEqual([
			{
				theme: 'child',
				path: 'color.accent',
				message: 'is required. Set it on this theme or on a theme it extends.',
			},
		]);
	});

	it('accepts an accent supplied by a child when the base has no color section', () => {
		const noColor = { ...base, color: undefined } as unknown as ThemeInput;
		expect(defineTheme({ extends: noColor, name: 'child', color: { accent: '#3b82f6' } })).toBe(
			defineTheme({ ...base, name: 'child' }),
		);
	});

	for (const name of [undefined, null, 42]) {
		it(`rejects a non-string name of ${String(name)}`, () => {
			expect(issuesOf({ ...base, name } as unknown as ThemeInput)).toEqual([
				{ theme: String(name), path: 'name', message: 'must be a kebab-case string' },
			]);
		});
	}

	it('treats undefined sections, roles, modes, and rungs as omitted across a chain', () => {
		const authoredBase: ThemeInput = {
			...base,
			color: {
				...base.color,
				neutralStyle: 'warm',
				backdrop: 'rgb(0 0 0 / 20%)',
				info: { light: 'oklch(0.5 0.13 150)', dark: 'oklch(0.74 0.13 150)' },
			},
			depth: { light: { overlay: 'none' } },
			controlFinish: { dark: { resting: 'linear-gradient(red, blue)' } },
			radius: { control: 10 },
		};
		const undefinedOverrides: ExtendingThemeInput = {
			color: {
				accent: undefined,
				neutral: undefined,
				neutralStyle: undefined,
				backdrop: undefined,
				info: undefined,
			},
			controlFinish: { light: undefined, dark: { resting: undefined } },
			depth: { dark: undefined, light: { overlay: undefined } },
			extends: {
				extends: authoredBase,
				name: 'middle',
				color: undefined,
				depth: undefined,
				controlFinish: undefined,
				radius: undefined,
				typography: undefined,
			},
			name: 'child',
			radius: { control: undefined },
		};
		expect(defineTheme(undefinedOverrides)).toBe(defineTheme({ ...authoredBase, name: 'child' }));
	});

	it('replaces an inherited colour role with defaults when both authored sides are undefined', () => {
		const authoredBase: ThemeInput = {
			...base,
			color: {
				...base.color,
				info: { light: 'oklch(0.5 0.13 150)', dark: 'oklch(0.74 0.13 150)' },
			},
		};
		const defaultCss = defineTheme({ ...base, name: 'child' });
		expect(defineTheme({ ...authoredBase, name: 'child' })).not.toBe(defaultCss);
		expect(
			defineTheme({
				extends: authoredBase,
				name: 'child',
				color: { info: { light: undefined, dark: undefined } },
			}),
		).toBe(defaultCss);
	});

	it('emits an alpha backdrop verbatim and accepts safe material CSS and zero radii', () => {
		const css = defineTheme({
			...base,
			color: { ...base.color, backdrop: 'rgb(0 0 0 / 20%)' },
			depth: { light: { resting: 'none' } },
			controlFinish: { dark: { raised: 'linear-gradient(red, blue)' } },
			radius: { detail: 0 },
		});
		expect(css).toContain('--luke-color-overlay-backdrop: rgb(0 0 0 / 20%);');
		expect(css).toContain('--luke-control-finish-raised: linear-gradient(red, blue);');
		expect(css).toContain('--luke-radius-detail: 0rem;');
	});
});
