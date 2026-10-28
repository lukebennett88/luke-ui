import { describe, expect, it } from 'vite-plus/test';
import { interFont, loraFont, testTypography } from './__fixtures__/theme-css.js';
import type { ThemeInput } from './define-theme.js';
import { defineTheme } from './define-theme.js';
import { ThemeValidationError } from './validate-input.js';

function issuesOf(input: ThemeInput) {
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

describe('authored theme validation', () => {
	const base: ThemeInput = {
		color: { accent: '#3b82f6' },
		name: 'base',
		typography: testTypography,
	};

	it('aggregates actionable issues from one input', () => {
		const input = { ...base, color: { accent: 'bad' }, radius: { control: -1 } } as ThemeInput;
		expect(issuesOf(input)).toEqual([
			{
				theme: 'base',
				path: 'color.accent',
				message: expect.stringContaining('cannot parse colour'),
			},
			{
				theme: 'base',
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
			const color = 'color' in overrides ? overrides.color : {};
			const input = {
				...base,
				name: 'child',
				...overrides,
				color: color === null ? null : { ...base.color, ...color },
			} as unknown as ThemeInput;
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
			'color.surface.subdued.dark',
			{ color: { surface: { subdued: { dark: 'red' } } } },
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
			const color = 'color' in overrides ? overrides.color : {};
			const input = {
				...base,
				name: 'child',
				...overrides,
				color: color === null ? null : { ...base.color, ...color },
			} as unknown as ThemeInput;
			expect(issuesOf(input)).toEqual([
				{ theme: 'child', path, message: expect.stringContaining(message) },
			]);
		});
	}

	it('reports missing required fields', () => {
		const input = { name: 'missing' } as ThemeInput;
		expect(issuesOf(input)).toEqual([
			{ theme: 'missing', path: 'color.accent', message: 'is required' },
			{ theme: 'missing', path: 'typography.fonts.body', message: 'is required' },
		]);
	});

	for (const name of [undefined, null, 42]) {
		it(`rejects a non-string name of ${String(name)}`, () => {
			expect(issuesOf({ ...base, name } as unknown as ThemeInput)).toEqual([
				{ theme: String(name), path: 'name', message: 'must be a kebab-case string' },
			]);
		});
	}

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

describe('removed field surface', () => {
	for (const value of [undefined, '#fff', { light: '#fff', dark: '#111' }]) {
		it(`rejects ${JSON.stringify(value)} on the authored theme`, () => {
			const input = {
				color: { accent: '#3b82f6', surface: { field: value } },
				name: 'removed-field',
				typography: testTypography,
			} as unknown as ThemeInput;
			expect(issuesOf(input)).toEqual([
				{
					message: expect.stringContaining('unsupported surface'),
					path: 'color.surface.field',
					theme: 'removed-field',
				},
			]);
		});
	}
});
