import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { fontSizeSteps } from '../theme/contract.js';
import { tactileFoundation } from '../theme/foundations.js';
import { buildTheme, themeClassName, themeRootClassName } from '../theme/index.js';
import { tactileThemeClassName } from '../themes/index.js';
import { text } from './text.js';

let mounted: Array<HTMLElement> = [];
let styles: Array<HTMLStyleElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted = [];
	for (const style of styles) style.remove();
	styles = [];
});

test('clamps one line from a boolean and multiple lines from a number', () => {
	const singleLine = getComputedStyle(mountText({ lineClamp: true }));
	const multiLine = getComputedStyle(mountText({ lineClamp: 3 }));

	expect(singleLine.display).toBe('block');
	expect(singleLine.overflowX).toBe('clip');
	expect(singleLine.textOverflow).toBe('ellipsis');
	expect(singleLine.whiteSpace).toBe('nowrap');
	expect(multiLine.webkitLineClamp).toBe('3');
	expect(multiLine.overflow).toBe('hidden');
});

test("defaults to size '300', body weight, and primary colour", () => {
	const defaultText = mountText();
	const explicitText = mountText({ color: 'primary', fontWeight: 'body', size: '300' });
	const style = getComputedStyle(defaultText);
	const explicitStyle = getComputedStyle(explicitText);

	expect(style.fontFamily).toBe(explicitStyle.fontFamily);
	expect(style.fontSize).toBe('16px');
	expect(style.fontWeight).toBe('400');
	expect(style.lineHeight).toBe('24px');
	expect(style.color).toBe(explicitStyle.color);
});

test('size composes font size, line height, and letter spacing', () => {
	const style = getComputedStyle(mountText({ size: '600' }));

	expect(style.fontSize).toBe('24px');
	expect(style.lineHeight).toBe('30px');
	expect(style.letterSpacing).toBe('-0.15px');
});

test('semantic colour and weight roles resolve through the active theme', () => {
	const primary = getComputedStyle(mountText());
	const dangerEmphasis = getComputedStyle(mountText({ color: 'danger', fontWeight: 'emphasis' }));

	expect(dangerEmphasis.color).not.toBe(primary.color);
	expect(dangerEmphasis.fontWeight).toBe('700');
});

test('trim is rendered by default and can be disabled', () => {
	const trimmed = mountText();
	const untrimmed = mountText({ shouldDisableTrim: true });

	expect(getComputedStyle(trimmed, '::before').content).toBe('""');
	expect(getComputedStyle(trimmed, '::after').content).toBe('""');
	expect(getComputedStyle(untrimmed, '::before').content).toBe('none');
	expect(getComputedStyle(untrimmed, '::after').content).toBe('none');
});

test('font inheritance also preserves surrounding currentColor', () => {
	const root = mountRoot();
	root.style.color = 'rgb(1, 2, 3)';
	root.style.font = 'italic 500 18px / 22px serif';
	const element = root.appendChild(document.createElement('span'));
	element.className = text({ shouldDisableTrim: true, shouldInheritFont: true });
	const style = getComputedStyle(element);

	expect(style.color).toBe('rgb(1, 2, 3)');
	expect(style.fontFamily).toBe('serif');
	expect(style.fontSize).toBe('18px');
	expect(style.fontWeight).toBe('500');
});

test('an explicit semantic colour overrides inherited currentColor', () => {
	const root = mountRoot();
	root.style.color = 'rgb(1, 2, 3)';
	const element = root.appendChild(document.createElement('span'));
	element.className = text({ color: 'danger', shouldDisableTrim: true, shouldInheritFont: true });

	expect(getComputedStyle(element).color).not.toBe('rgb(1, 2, 3)');
});

test('an explicit numeric variant survives font inheritance', () => {
	const root = mountRoot();
	root.style.fontVariantNumeric = 'normal';
	const element = root.appendChild(document.createElement('span'));
	element.className = text({
		fontVariantNumeric: 'tabular-nums',
		shouldDisableTrim: true,
		shouldInheritFont: true,
	});

	expect(getComputedStyle(element).fontVariantNumeric).toContain('tabular-nums');
});

test('all size steps use the generated Capsize trims for every curated font', () => {
	const families = ['inter', 'apple-system', 'dm-sans'] as const;
	const representativeTrims = new Set<string>();

	for (const fontFamily of families) {
		const className = installTheme(fontFamily);
		const root = mountRoot(className);
		const rootStyle = getComputedStyle(root);
		const authoredFontFamily = normalizeFontFamily(
			rootStyle.getPropertyValue('--luke-font-family'),
		);
		expect(authoredFontFamily).toContain(curatedFamilyIdentity[fontFamily]);

		for (const size of fontSizeSteps) {
			const element = root.appendChild(document.createElement('span'));
			element.className = text({ size });
			element.textContent = `${fontFamily} ${size}`;
			const style = getComputedStyle(element);
			const before = getComputedStyle(element, '::before');
			const after = getComputedStyle(element, '::after');
			const capHeightTrim = rootStyle.getPropertyValue(`--luke-font-${size}-cap-height-trim`);
			const baselineTrim = rootStyle.getPropertyValue(`--luke-font-${size}-baseline-trim`);
			const fontSize = Number.parseFloat(style.fontSize);

			const computedFontFamily = normalizeFontFamily(style.fontFamily);
			expect(computedFontFamily).toContain(computedFamilyIdentity[fontFamily]);
			expect(before.content).toBe('""');
			expect(after.content).toBe('""');
			expect(Number.parseFloat(before.marginBottom)).toBeCloseTo(
				Number.parseFloat(capHeightTrim) * fontSize,
				2,
			);
			expect(Number.parseFloat(after.marginTop)).toBeCloseTo(
				Number.parseFloat(baselineTrim) * fontSize,
				2,
			);

			if (size === '300') representativeTrims.add(`${capHeightTrim}:${baselineTrim}`);
		}
	}

	expect(representativeTrims.size).toBe(3);
});

function mountText(options: Parameters<typeof text>[0] = {}) {
	const element = mountRoot().appendChild(document.createElement('span'));
	element.className = text(options);
	element.textContent = 'Text';
	return element;
}

function mountRoot(themeClass = tactileThemeClassName) {
	const root = document.body.appendChild(document.createElement('div'));
	root.className = `${themeRootClassName} ${themeClass}`;
	root.dataset.colorMode = 'light';
	mounted.push(root);
	return root;
}

function installTheme(fontFamily: 'inter' | 'apple-system' | 'dm-sans') {
	const name = `capsize-${fontFamily}`;
	const style = document.head.appendChild(document.createElement('style'));
	style.textContent = buildTheme({
		...tactileFoundation,
		name,
		typography: { fontFamily },
	});
	styles.push(style);
	return themeClassName(name);
}

const curatedFamilyIdentity = {
	'apple-system': '-apple-system',
	'dm-sans': 'DM Sans',
	inter: 'Inter',
} as const;

const computedFamilyIdentity = {
	'apple-system': 'system-ui',
	'dm-sans': 'DM Sans',
	inter: 'Inter',
} as const;

function normalizeFontFamily(fontFamily: string) {
	return fontFamily.replaceAll(/["']/g, '').trim();
}
