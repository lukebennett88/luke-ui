/**
 * Pins the `:where(:root)` cascade contract from `stylesheet.ts`. A loaded theme stylesheet themes
 * the whole document with no class applied. An explicit identity class always wins over another
 * loaded theme's fallback. Both hold regardless of the order the stylesheets load in.
 *
 * Nested identity classes still collide: an ancestor's `.X [data-color-mode='M']` rule and a nested
 * identity's own rule share specificity (0,2,0), so they resolve by stylesheet order. Nested
 * identities are unsupported and guarded elsewhere, and this file does not test that case.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';
import paperCss from '../../dist/themes/paper/stylesheet.css?inline';
import tactileCss from '../../dist/themes/tactile/stylesheet.css?inline';
import { themeClassName as paperThemeClassName } from '../themes/paper/index.js';
import { themeClassName as tactileThemeClassName } from '../themes/tactile/index.js';
import { extractValue, splitBlocks } from './__fixtures__/theme-css.js';

const themeCss = { paper: paperCss, tactile: tactileCss } as const;
type ThemeName = keyof typeof themeCss;

const tactileBlocks = splitBlocks(tactileCss);
const paperBlocks = splitBlocks(paperCss);

const tactileRadius = extractValue(tactileBlocks.identity, '--luke-radius-control');
const paperRadius = extractValue(paperBlocks.identity, '--luke-radius-control');
const tactileLightCanvas = extractValue(tactileBlocks.baseLight, '--luke-color-surface-canvas');
const tactileDarkCanvas = extractValue(tactileBlocks.mediaDark, '--luke-color-surface-canvas');
const paperLightCanvas = extractValue(paperBlocks.baseLight, '--luke-color-surface-canvas');
const paperDarkCanvas = extractValue(paperBlocks.mediaDark, '--luke-color-surface-canvas');

it('keeps every theme and mode combination distinct, so a resolved match below cannot pass by luck', () => {
	const canvases = [tactileLightCanvas, tactileDarkCanvas, paperLightCanvas, paperDarkCanvas];
	expect(new Set(canvases).size).toBe(canvases.length);
	const radii = [tactileRadius, paperRadius];
	expect(new Set(radii).size).toBe(radii.length);
});

const injectedStyles: Array<HTMLStyleElement> = [];
const createdElements: Array<Element> = [];

function injectStylesheet(name: ThemeName): void {
	const style = document.createElement('style');
	style.textContent = themeCss[name];
	document.head.append(style);
	injectedStyles.push(style);
}

function createDiv(parent: Element): HTMLDivElement {
	const div = document.createElement('div');
	parent.append(div);
	createdElements.push(div);
	return div;
}

function readVar(element: Element, varName: string): string {
	return getComputedStyle(element).getPropertyValue(varName).trim();
}

async function emulateColorScheme(mode: 'light' | 'dark'): Promise<void> {
	await cdp().send('Emulation.setEmulatedMedia', {
		features: [{ name: 'prefers-color-scheme', value: mode }],
	});
}

afterEach(async () => {
	for (const style of injectedStyles) style.remove();
	injectedStyles.length = 0;
	for (const element of createdElements) element.remove();
	createdElements.length = 0;
	document.documentElement.className = '';
	document.documentElement.removeAttribute('data-color-mode');
	await emulateColorScheme('light');
});

type Scenario = {
	description: string;
	expected: string;
	target: () => Element;
	varName: '--luke-color-surface-canvas' | '--luke-radius-control';
};

// Each scenario names the theme it expects to win, so a passing assertion is not a coincidence.
function scenarios(): Array<Scenario> {
	return [
		{
			description:
				"a plain descendant resolves paper's radius when <html> carries the paper identity class",
			expected: paperRadius,
			target: () => {
				document.documentElement.className = paperThemeClassName;
				return createDiv(document.body);
			},
			varName: '--luke-radius-control',
		},
		{
			description:
				"a plain descendant resolves tactile's radius when <html> carries the tactile identity class",
			expected: tactileRadius,
			target: () => {
				document.documentElement.className = tactileThemeClassName;
				return createDiv(document.body);
			},
			varName: '--luke-radius-control',
		},
		{
			description:
				"a plain descendant resolves paper's dark canvas when <html> carries the paper identity class and data-color-mode='dark'",
			expected: paperDarkCanvas,
			target: () => {
				document.documentElement.className = paperThemeClassName;
				document.documentElement.dataset.colorMode = 'dark';
				return createDiv(document.body);
			},
			varName: '--luke-color-surface-canvas',
		},
		{
			description:
				"a nested data-color-mode='dark' div resolves paper's dark canvas inside a div.luke-ui-theme-paper, with no identity on <html>",
			expected: paperDarkCanvas,
			target: () => {
				const outer = createDiv(document.body);
				outer.className = paperThemeClassName;
				const inner = createDiv(outer);
				inner.dataset.colorMode = 'dark';
				return inner;
			},
			varName: '--luke-color-surface-canvas',
		},
		{
			description:
				"a nested data-color-mode='dark' div resolves tactile's dark canvas inside a div.luke-ui-theme-tactile, with no identity on <html>",
			expected: tactileDarkCanvas,
			target: () => {
				const outer = createDiv(document.body);
				outer.className = tactileThemeClassName;
				const inner = createDiv(outer);
				inner.dataset.colorMode = 'dark';
				return inner;
			},
			varName: '--luke-color-surface-canvas',
		},
		{
			description:
				"a div.luke-ui-theme-paper resolves its own radius when nested inside <html class='luke-ui-theme-tactile'>",
			expected: paperRadius,
			target: () => {
				document.documentElement.className = tactileThemeClassName;
				const paperDiv = createDiv(document.body);
				paperDiv.className = paperThemeClassName;
				return paperDiv;
			},
			varName: '--luke-radius-control',
		},
	];
}

const stylesheetOrders: ReadonlyArray<readonly [ThemeName, ThemeName]> = [
	['tactile', 'paper'],
	['paper', 'tactile'],
];

for (const order of stylesheetOrders) {
	describe(`stylesheets loaded ${order[0]} then ${order[1]}`, () => {
		beforeEach(() => {
			injectStylesheet(order[0]);
			injectStylesheet(order[1]);
		});

		for (const scenario of scenarios()) {
			it(`${scenario.description}`, () => {
				const target = scenario.target();
				expect(readVar(target, scenario.varName)).toBe(scenario.expected);
			});
		}
	});
}

// The primary consumer contract: importing one theme stylesheet themes the whole document for
// free, with no class applied anywhere.
describe('a single stylesheet with no identity class applied anywhere', () => {
	beforeEach(async () => {
		injectStylesheet('tactile');
		await emulateColorScheme('light');
	});

	it("resolves tactile's light canvas on a plain descendant", () => {
		const container = createDiv(document.body);
		const target = createDiv(container);
		expect(readVar(target, '--luke-color-surface-canvas')).toBe(tactileLightCanvas);
	});

	it("resolves tactile's dark canvas on a nested data-color-mode='dark' div", () => {
		const container = createDiv(document.body);
		const target = createDiv(container);
		target.dataset.colorMode = 'dark';
		expect(readVar(target, '--luke-color-surface-canvas')).toBe(tactileDarkCanvas);
	});

	it("resolves tactile's dark canvas on a plain descendant when <html> carries data-color-mode='dark'", () => {
		document.documentElement.dataset.colorMode = 'dark';
		const target = createDiv(document.body);
		expect(readVar(target, '--luke-color-surface-canvas')).toBe(tactileDarkCanvas);
	});
});
