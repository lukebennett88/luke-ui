/**
 * `defineTheme` accepts a family only when a browser reads it as a `font-family` list. A custom
 * property keeps any value, so these tests apply the generated token to a real `font-family`
 * declaration and compare computed stacks — not `style.fontFamily` vs `getComputedStyle`, which
 * Chromium can serialise differently for the same list.
 */

import { afterEach, describe, expect, it } from 'vite-plus/test';
import { extractValue, interFont, splitBlocks } from './__fixtures__/theme-css.js';
import { defineTheme } from './define-theme.js';
import { codeFontFamilyStack } from './foundation.js';
import { getThemeClassName } from './theme-class-name.js';
import { ThemeValidationError } from './validate-input.js';

const name = 'font-family-probe';
const style = document.createElement('style');
const probe = document.createElement('span');

afterEach(() => {
	style.remove();
	probe.remove();
	document.documentElement.className = '';
});

function compile(family: string): string {
	return defineTheme({
		color: { accent: '#3b82f6' },
		name,
		typography: { fonts: { body: { ...interFont, family } } },
	});
}

function familyIssues(family: string) {
	try {
		compile(family);
	} catch (error) {
		if (error instanceof ThemeValidationError) return error.issues;
		throw error;
	}
	return [];
}

/** How the browser serialises `family` as a `font-family` value, or `''` when it drops it. */
function browserReading(family: string): string {
	const reference = document.createElement('span');
	reference.style.fontFamily = family;
	return reference.style.fontFamily;
}

/** Computed `font-family` after setting `family` inline, or `''` when the browser drops it. */
function browserComputedFamily(family: string): string {
	const reference = document.createElement('span');
	reference.style.fontFamily = family;
	document.body.append(reference);
	const value = getComputedStyle(reference).fontFamily;
	reference.remove();
	return value;
}

describe('an accepted family', () => {
	const accepted = [
		"'Inter', system-ui, sans-serif",
		`"Font's Name", 'Other "Quoted" Name', system-ui`,
		`'Slash/Name', 'Star*Name', "Font, Inc", serif`,
		'-apple-system, BlinkMacSystemFont, Noto Sans CJK JP, sans-serif',
		// CSS whitespace around quoted names, between words, and around commas.
		"  'Inter'  ,  Noto   Sans  ,  sans-serif  ",
		// Unicode spaces and letters inside quotes are part of the name.
		"'Noto\u00A0Sans', 'Ünïcödé\u2003Sans', 'ヒラギノ角ゴ ProN', sans-serif",
		// CSS identifiers may contain non-ASCII letters.
		'Ünïcödé Sans, ヒラギノ角ゴ, sans-serif',
	];

	for (const family of accepted) {
		it(`sets font-family to ${JSON.stringify(family)} and keeps the declarations after it`, () => {
			const css = compile(family);
			// Assert the generated declaration, not `getPropertyValue`, which trims CSS whitespace.
			expect(extractValue(splitBlocks(css).themeWide, '--luke-font-family-body')).toBe(family);

			style.textContent = `${css}\nspan { font-family: var(--luke-font-family-body); }`;
			document.head.append(style);
			document.documentElement.className = getThemeClassName(name);
			document.body.append(probe);

			const root = getComputedStyle(document.documentElement);
			expect(browserReading(family)).not.toBe('');
			// Code stack stays the production default; assert generated CSS and the live custom property.
			expect(extractValue(splitBlocks(css).themeWide, '--luke-font-family-code')).toBe(
				codeFontFamilyStack,
			);
			expect(root.getPropertyValue('--luke-font-family-code').trim()).toBe(codeFontFamilyStack);
			// Computed body stacks must match on the same API across Chromium builds.
			expect({
				colorScheme: root.colorScheme,
				fontFamily: getComputedStyle(probe).fontFamily,
			}).toEqual({
				colorScheme: 'light',
				fontFamily: browserComputedFamily(family),
			});
		});
	}
});

describe('a rejected family', () => {
	// A browser drops each of these whole when it substitutes the token, so text would fall back to
	// the parent's font instead of any font in the stack.
	const invalid = [
		"'Slash/Name', Star*Name, sans-serif",
		'Inter, , sans-serif',
		'Font Name 2, serif',
		'serif Pro, sans-serif',
		"'Inter' Sans, sans-serif",
	];

	for (const family of invalid) {
		it(`fails to compile ${JSON.stringify(family)}, which the browser drops`, () => {
			expect(browserReading(family)).toBe('');
			expect(familyIssues(family)).toEqual([
				expect.objectContaining({ path: 'typography.fonts.body.family', theme: name }),
			]);
		});
	}

	// CSS whitespace is only space, tab, and line breaks. Next to a quoted name, U+00A0 or U+2003 is
	// stray text the browser rejects, not padding to trim.
	const unicodeSpaces = [
		['U+00A0 after a quoted name', "'Inter'\u00A0, sans-serif"],
		['U+00A0 before a quoted name', "\u00A0'Inter', sans-serif"],
		['U+00A0 after a comma, before a quoted name', "'Inter',\u00A0'Lora', serif"],
		['U+2003 after a quoted name', "'Inter'\u2003, sans-serif"],
		['U+2003 before a quoted name', "\u2003'Inter', sans-serif"],
		['U+2003 after a comma, before a quoted name', "'Inter',\u2003'Lora', serif"],
	] as const;

	for (const [label, family] of unicodeSpaces) {
		it(`fails to compile a stack with ${label}, which the browser drops`, () => {
			expect(browserReading(family)).toBe('');
			expect(familyIssues(family)).toEqual([
				expect.objectContaining({ path: 'typography.fonts.body.family', theme: name }),
			]);
		});
	}

	it('fails to compile a CSS-wide keyword, which the browser accepts but which names no font', () => {
		expect(browserReading('inherit')).toBe('inherit');
		expect(familyIssues('inherit')).toEqual([
			expect.objectContaining({ path: 'typography.fonts.body.family', theme: name }),
		]);
	});

	// An open comment or an escape would hide the declarations after the family in the stylesheet.
	for (const family of ['Inter/*', "'Inter\\', sans-serif"]) {
		it(`fails to compile ${JSON.stringify(family)}, which would hide later declarations`, () => {
			expect(familyIssues(family)).toEqual([
				expect.objectContaining({ path: 'typography.fonts.body.family', theme: name }),
			]);
		});
	}
});

it('switches the code family with the theme identity', () => {
	const family = "'Fira Code', ui-monospace, monospace";
	const custom = defineTheme({
		color: { accent: '#3b82f6' },
		name: 'custom-code',
		typography: { fonts: { body: interFont, code: family } },
	});
	const fallback = compile(interFont.family);
	style.textContent = `${custom}\n${fallback}\nspan { font-family: var(--luke-font-family-code); }`;
	document.head.append(style);
	document.body.append(probe);
	document.documentElement.className = getThemeClassName('custom-code');
	expect(getComputedStyle(probe).fontFamily).toBe(browserComputedFamily(family));
	document.documentElement.className = getThemeClassName(name);
	expect(getComputedStyle(probe).fontFamily).toBe(browserComputedFamily(codeFontFamilyStack));
});
