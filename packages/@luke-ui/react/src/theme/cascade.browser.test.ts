/**
 * Pins the `:where(:root)` cascade contract from `stylesheet.ts`. A loaded theme stylesheet themes
 * the whole document with no class applied. An explicit identity class always wins over another
 * loaded theme's fallback. Both hold regardless of the order the stylesheets load in.
 *
 * Nested identity classes do not collide by default: a nested identity resolves its own
 * identity-owned values, and it also resolves its own colour, depth, and control-finish
 * values correctly under the system-controlled mode, because those are declared directly on the
 * identity class by the base-light and media-dark blocks. The collision happens only when an
 * explicit `data-color-mode` scope sits on or inside the nested identity: then the ancestor's
 * `.X [data-color-mode='M']` rule and the nested identity's own `.Y[data-color-mode='M']` rule share
 * specificity (0,2,0), so stylesheet order decides the winner. This file covers both cases.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import paperCss from '../../dist/themes/paper/stylesheet.css?inline';
import tactileCss from '../../dist/themes/tactile/stylesheet.css?inline';
import { emulateColorScheme } from '../core/test-utils/emulate-media.js';
import { extractValue, splitBlocks } from './__fixtures__/theme-css.js';
import { themeClassName as paperThemeClassName } from './bundles/paper/index.js';
import { themeClassName as tactileThemeClassName } from './bundles/tactile/index.js';

const themeCss = { paper: paperCss, tactile: tactileCss } as const;
type ThemeName = keyof typeof themeCss;

const tactileBlocks = splitBlocks(tactileCss);
const paperBlocks = splitBlocks(paperCss);

const tactileRadius = extractValue(tactileBlocks.identity, '--luke-radius-control');
const paperRadius = extractValue(paperBlocks.identity, '--luke-radius-control');
const tactileLightBase = extractValue(tactileBlocks.baseLight, '--luke-color-surface-base');
const tactileDarkBase = extractValue(tactileBlocks.mediaDark, '--luke-color-surface-base');
const paperLightBase = extractValue(paperBlocks.baseLight, '--luke-color-surface-base');
const paperDarkBase = extractValue(paperBlocks.mediaDark, '--luke-color-surface-base');

it('keeps every theme and mode combination distinct, so a resolved match below cannot pass by luck', () => {
	const bases = [tactileLightBase, tactileDarkBase, paperLightBase, paperDarkBase];
	expect(new Set(bases).size).toBe(bases.length);
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
	varName: '--luke-color-surface-base' | '--luke-radius-control';
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
				"a plain descendant resolves paper's dark base surface when <html> carries the paper identity class and data-color-mode='dark'",
			expected: paperDarkBase,
			target: () => {
				document.documentElement.className = paperThemeClassName;
				document.documentElement.dataset.colorMode = 'dark';
				return createDiv(document.body);
			},
			varName: '--luke-color-surface-base',
		},
		{
			description:
				"a nested data-color-mode='dark' div resolves paper's dark base surface inside a div.luke-ui-theme-paper, with no identity on <html>",
			expected: paperDarkBase,
			target: () => {
				const outer = createDiv(document.body);
				outer.className = paperThemeClassName;
				const inner = createDiv(outer);
				inner.dataset.colorMode = 'dark';
				return inner;
			},
			varName: '--luke-color-surface-base',
		},
		{
			description:
				"a nested data-color-mode='dark' div resolves tactile's dark base surface inside a div.luke-ui-theme-tactile, with no identity on <html>",
			expected: tactileDarkBase,
			target: () => {
				const outer = createDiv(document.body);
				outer.className = tactileThemeClassName;
				const inner = createDiv(outer);
				inner.dataset.colorMode = 'dark';
				return inner;
			},
			varName: '--luke-color-surface-base',
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

		it("resolves paper's light base surface on a div.luke-ui-theme-paper nested inside <html class='luke-ui-theme-tactile'>, under system light, with no explicit data-color-mode anywhere", async () => {
			await emulateColorScheme('light');
			document.documentElement.className = tactileThemeClassName;
			const paperDiv = createDiv(document.body);
			paperDiv.className = paperThemeClassName;
			expect(readVar(paperDiv, '--luke-color-surface-base')).toBe(paperLightBase);
		});

		it("resolves paper's dark base surface on a div.luke-ui-theme-paper nested inside <html class='luke-ui-theme-tactile'>, under system dark, with no explicit data-color-mode anywhere", async () => {
			await emulateColorScheme('dark');
			document.documentElement.className = tactileThemeClassName;
			const paperDiv = createDiv(document.body);
			paperDiv.className = paperThemeClassName;
			expect(readVar(paperDiv, '--luke-color-surface-base')).toBe(paperDarkBase);
		});

		it(`resolves the dark base surface of whichever theme's stylesheet loaded last (${order[1]}) when data-color-mode='dark' sits on a nested div.luke-ui-theme-paper inside <html class='luke-ui-theme-tactile'>`, () => {
			document.documentElement.className = tactileThemeClassName;
			const paperDiv = createDiv(document.body);
			paperDiv.className = paperThemeClassName;
			paperDiv.dataset.colorMode = 'dark';
			const expected = order[1] === 'paper' ? paperDarkBase : tactileDarkBase;
			expect(readVar(paperDiv, '--luke-color-surface-base')).toBe(expected);
		});
	});
}

// The primary consumer contract: importing one theme stylesheet themes the whole document for
// free, with no class applied anywhere.
describe('a single stylesheet with no identity class applied anywhere', () => {
	beforeEach(async () => {
		injectStylesheet('tactile');
		await emulateColorScheme('light');
	});

	it("resolves tactile's light base surface on a plain descendant", () => {
		const container = createDiv(document.body);
		const target = createDiv(container);
		expect(readVar(target, '--luke-color-surface-base')).toBe(tactileLightBase);
	});

	it("resolves tactile's dark base surface on a nested data-color-mode='dark' div", () => {
		const container = createDiv(document.body);
		const target = createDiv(container);
		target.dataset.colorMode = 'dark';
		expect(readVar(target, '--luke-color-surface-base')).toBe(tactileDarkBase);
	});

	it("resolves tactile's dark base surface on a plain descendant when <html> carries data-color-mode='dark'", () => {
		document.documentElement.dataset.colorMode = 'dark';
		const target = createDiv(document.body);
		expect(readVar(target, '--luke-color-surface-base')).toBe(tactileDarkBase);
	});
});
