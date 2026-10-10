/**
 * `validateFont` accepts a family only when the stylesheet `defineTheme` writes around it still
 * parses whole. Chromium parses each compiled stylesheet here, because an escape or a comment that
 * swallows later declarations changes what a browser reads, not what the input looks like.
 */

import { afterEach, expect, it } from 'vite-plus/test';
import { interFont } from './__fixtures__/theme-css.js';
import { defineTheme } from './define-theme.js';
import { codeFontFamilyStack } from './foundation.js';
import { getThemeClassName } from './theme-class-name.js';

const style = document.createElement('style');

afterEach(() => {
	style.remove();
	document.documentElement.className = '';
});

const accepted = [
	"'Inter', system-ui, sans-serif",
	`"Font's Name", 'Other "Quoted" Name', system-ui`,
	"'Slash/Name', Star*Name, sans-serif",
];

for (const family of accepted) {
	it(`keeps every declaration after the family ${JSON.stringify(family)}`, () => {
		const name = 'font-family-probe';
		style.textContent = defineTheme({
			color: { accent: '#3b82f6' },
			name,
			typography: { fonts: { body: { ...interFont, family } } },
		});
		document.head.append(style);
		document.documentElement.className = getThemeClassName(name);

		const computed = getComputedStyle(document.documentElement);
		expect({
			body: computed.getPropertyValue('--luke-font-family-body').trim(),
			code: computed.getPropertyValue('--luke-font-family-code').trim(),
			colorScheme: computed.colorScheme,
		}).toEqual({ body: family, code: codeFontFamilyStack, colorScheme: 'light' });
	});
}
