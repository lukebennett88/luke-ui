/**
 * Pins the generated theme cascade from `stylesheet.ts` together with the shared stylesheet's
 * scope rules: one identity class on `<html>`, the document following `prefers-color-scheme` until
 * `data-color-mode` overrides it, and explicit scopes nesting below `<html>` with the nearest one
 * winning.
 */

import { rootClassName } from '@luke-ui/react/theme';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { emulateColorScheme } from '../core/test-utils/emulate-media.js';
import { paperTheme } from './__fixtures__/paper.js';
import { tactileTheme } from './__fixtures__/tactile.js';
import { extractValue, splitBlocks } from './__fixtures__/theme-css.js';
import { defineTheme } from './define-theme.js';
import { getThemeClassName } from './theme-class-name.js';

const tactileBlocks = splitBlocks(defineTheme(tactileTheme));
const paperBlocks = splitBlocks(defineTheme(paperTheme));
const tactileClassName = getThemeClassName(tactileTheme.name);
const paperClassName = getThemeClassName(paperTheme.name);

const tactileRadius = extractValue(tactileBlocks.themeWide, '--luke-radius-control');
const paperRadius = extractValue(paperBlocks.themeWide, '--luke-radius-control');
const lightBase = extractValue(tactileBlocks.baseLight, '--luke-color-surface-base');
const darkBase = extractValue(tactileBlocks.mediaDark, '--luke-color-surface-base');
const lightText = extractValue(tactileBlocks.baseLight, '--luke-color-text-primary');
const darkText = extractValue(tactileBlocks.mediaDark, '--luke-color-text-primary');

it('keeps the values below distinct, so a resolved match cannot pass by luck', () => {
	expect(new Set([lightBase, darkBase]).size).toBe(2);
	expect(new Set([lightText, darkText]).size).toBe(2);
	expect(new Set([tactileRadius, paperRadius]).size).toBe(2);
});

const createdElements: Array<Element> = [];

function createDiv(parent: Element, mode?: 'light' | 'dark'): HTMLDivElement {
	const div = document.createElement('div');
	if (mode !== undefined) div.dataset.colorMode = mode;
	parent.append(div);
	createdElements.push(div);
	return div;
}

function readVar(element: Element, varName: string): string {
	return getComputedStyle(element).getPropertyValue(varName).trim();
}

/** The computed colour a probe gets when it paints `value`, for comparing with computed styles. */
function computedColor(value: string): string {
	const probe = createDiv(document.body);
	probe.style.color = value;
	return getComputedStyle(probe).color;
}

beforeEach(() => {
	document.documentElement.classList.add(tactileClassName);
});

afterEach(async () => {
	for (const element of createdElements) element.remove();
	createdElements.length = 0;
	document.documentElement.className = '';
	document.documentElement.removeAttribute('data-color-mode');
	document.body.removeAttribute('data-color-mode');
	document.body.classList.remove(...rootClassName.split(' '));
	await emulateColorScheme('light');
});

describe('theme identity', () => {
	it('themes the document from the identity class on <html>', () => {
		expect(readVar(createDiv(document.body), '--luke-radius-control')).toBe(tactileRadius);

		document.documentElement.className = paperClassName;
		expect(readVar(createDiv(document.body), '--luke-radius-control')).toBe(paperRadius);
	});

	it('does nothing for an identity class below <html>, and has no fallback without one', () => {
		const nested = createDiv(document.body);
		nested.className = paperClassName;
		expect(readVar(nested, '--luke-radius-control')).toBe(tactileRadius);

		document.documentElement.className = '';
		expect(readVar(createDiv(document.body), '--luke-radius-control')).toBe('');
	});
});

describe('document colour mode', () => {
	it('follows a live change to the system preference with no attribute and no script', async () => {
		const target = createDiv(document.body);

		await emulateColorScheme('light');
		expect(readVar(target, '--luke-color-surface-base')).toBe(lightBase);
		expect(getComputedStyle(document.documentElement).colorScheme).toBe('light');

		await emulateColorScheme('dark');
		expect(readVar(target, '--luke-color-surface-base')).toBe(darkBase);
		expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	});

	it('lets an explicit mode on <html> override the system preference', async () => {
		await emulateColorScheme('dark');
		document.documentElement.dataset.colorMode = 'light';
		expect(readVar(createDiv(document.body), '--luke-color-surface-base')).toBe(lightBase);
		expect(getComputedStyle(document.documentElement).colorScheme).toBe('light');

		await emulateColorScheme('light');
		document.documentElement.dataset.colorMode = 'dark';
		expect(readVar(createDiv(document.body), '--luke-color-surface-base')).toBe(darkBase);
		expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');
	});
});

describe('nested colour-mode scopes', () => {
	it('lets the nearest explicit scope win at every depth', async () => {
		await emulateColorScheme('dark');
		const outer = createDiv(document.body, 'light');
		const middle = createDiv(outer, 'dark');
		const inner = createDiv(middle, 'light');
		const plainInInner = createDiv(inner);

		const expected = [
			[outer, lightBase, 'light'],
			[middle, darkBase, 'dark'],
			[inner, lightBase, 'light'],
			[plainInInner, lightBase, 'light'],
		] as const;
		for (const [element, base, scheme] of expected) {
			expect(readVar(element, '--luke-color-surface-base')).toBe(base);
			expect(getComputedStyle(element).colorScheme).toBe(scheme);
		}
	});

	it('repaints a scope with its own text, accent, and surface colours', () => {
		document.documentElement.dataset.colorMode = 'light';
		const scope = createDiv(document.body, 'dark');
		const styles = getComputedStyle(scope);

		expect(styles.color).toBe(computedColor(darkText));
		expect(styles.backgroundColor).toBe(computedColor(darkBase));
		expect(styles.accentColor).toBe(
			computedColor(
				extractValue(tactileBlocks.mediaDark, '--luke-color-background-accent-solid-rest'),
			),
		);
	});

	it('lets application CSS replace the scope background', () => {
		const style = document.head.appendChild(document.createElement('style'));
		style.textContent = '.app-panel { background-color: rgb(1, 2, 3); }';
		createdElements.push(style);
		const scope = createDiv(document.body, 'dark');
		scope.className = 'app-panel';

		expect(getComputedStyle(scope).backgroundColor).toBe('rgb(1, 2, 3)');
	});

	for (const withRootClassName of [false, true]) {
		it(`treats <body> as a scope ${withRootClassName ? 'with' : 'without'} rootClassName`, () => {
			document.documentElement.dataset.colorMode = 'light';
			if (withRootClassName) document.body.classList.add(...rootClassName.split(' '));
			document.body.dataset.colorMode = 'dark';
			const styles = getComputedStyle(document.body);

			expect(styles.colorScheme).toBe('dark');
			expect(styles.color).toBe(computedColor(darkText));
			expect(styles.backgroundColor).toBe(computedColor(darkBase));
			expect(readVar(createDiv(document.body), '--luke-color-surface-base')).toBe(darkBase);
		});
	}
});

describe('root containment', () => {
	it('answers unnamed container queries against the root with no theme stylesheet loaded', () => {
		document.documentElement.className = '';
		const fixtureThemes = document.getElementById('luke-ui-fixture-themes');
		fixtureThemes?.remove();
		const style = document.head.appendChild(document.createElement('style'));
		style.textContent = '@container (inline-size >= 1px) { .container-probe { order: 7; } }';
		createdElements.push(style);
		try {
			const probe = createDiv(document.body);
			probe.className = 'container-probe';

			expect(getComputedStyle(document.documentElement).containerType).toBe('inline-size');
			expect(getComputedStyle(probe).order).toBe('7');
		} finally {
			if (fixtureThemes) document.head.append(fixtureThemes);
		}
	});
});
