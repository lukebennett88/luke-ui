import { Box } from '@luke-ui/react/box';
import { Button, buttonRecipe } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { LoadingSkeleton } from '@luke-ui/react/loading-skeleton';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import lukeUiOnlyCss from './tailwind-fixtures/luke-ui-only.css?inline';
import orderedLukeUiFirstCss from './tailwind-fixtures/ordered-luke-ui-first.css?inline';
import orderedTailwindFirstCss from './tailwind-fixtures/ordered-tailwind-first.css?inline';
import unorderedLukeUiFirstCss from './tailwind-fixtures/unordered-luke-ui-first.css?inline';
import unorderedTailwindFirstCss from './tailwind-fixtures/unordered-tailwind-first.css?inline';

// Real Tailwind v4 output, compiled by the docs app's Tailwind Vite plugin, with the built Luke UI
// stylesheet. Each scenario is one application stylesheet.
const scenarios = [
	{
		css: orderedTailwindFirstCss,
		isOrdered: true,
		name: 'with the order statement, Tailwind first',
	},
	{ css: orderedLukeUiFirstCss, isOrdered: true, name: 'with the order statement, Luke UI first' },
	// Luke UI declares `base` and `luke-ui` first, so Tailwind's layers land above it.
	{
		css: unorderedLukeUiFirstCss,
		isOrdered: true,
		name: 'without the order statement, Luke UI first',
	},
	// Tailwind creates `utilities` first, so `luke-ui` lands above it. The order statement fixes this.
	{
		css: unorderedTailwindFirstCss,
		isOrdered: false,
		name: 'without the order statement, Tailwind first',
	},
] as const;

let root: Root | undefined;
let container: HTMLElement | undefined;
const styles: Array<HTMLStyleElement> = [];

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	for (const style of styles) style.remove();
	styles.length = 0;
	root = undefined;
	container = undefined;
});

function loadCss(css: string) {
	const style = document.head.appendChild(document.createElement('style'));
	style.textContent = css;
	styles.push(style);
}

function renderHost() {
	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<div>
				<Heading data-testid="heading" level={2}>
					Heading
				</Heading>
				<Button data-testid="button">Plain</Button>
				<TextInputField label="Name" />
				<Button className="p-[11px]" data-testid="tailwind-button">
					Utility
				</Button>
				<Button className="app-override" data-testid="app-button">
					App CSS
				</Button>
				<Button className="bg-[rgb(7,8,9)]!" data-testid="important-button">
					Important
				</Button>
				<Box className={buttonRecipe()} data-testid="box-button" padding="sp4">
					Box
				</Box>
				<div className="tw-component p-[3px]" data-testid="tailwind-component" />
				<LoadingSkeleton className="bg-[rgb(7,8,9)]!" data-testid="skeleton" isLoading>
					Loading
				</LoadingSkeleton>
			</div>,
		);
	});
}

function byTestId(id: string): HTMLElement {
	const element = container?.querySelector<HTMLElement>(`[data-testid="${id}"]`);
	if (element == null) throw new Error(`Expected [data-testid="${id}"].`);
	return element;
}

// Border style is left out: Preflight's `border: 0 solid` changes it on elements whose recipe sets
// no border, without drawing one.
const recipeProperties = [
	'backgroundColor',
	'blockSize',
	'borderTopWidth',
	'boxShadow',
	'display',
	'fontSize',
	'fontWeight',
	'lineHeight',
	'marginBlockStart',
	'paddingInlineStart',
] as const;

function recipeStyles() {
	const input = container?.querySelector('input');
	if (input == null) throw new Error('Expected the text input.');
	return Object.fromEntries(
		[
			['heading', byTestId('heading')],
			['button', byTestId('button')],
			['input', input],
		].map(([name, element]) => {
			const computed = getComputedStyle(element as Element);
			return [name, Object.fromEntries(recipeProperties.map((key) => [key, computed[key]]))];
		}),
	);
}

/** Luke UI's own appearance with no Tailwind loaded. */
function baselineRecipeStyles() {
	loadCss(lukeUiOnlyCss);
	renderHost();
	const baseline = recipeStyles();
	act(() => root?.unmount());
	container?.remove();
	for (const style of styles) style.remove();
	styles.length = 0;
	return baseline;
}

for (const scenario of scenarios) {
	describe(scenario.name, () => {
		test('Preflight leaves Luke UI component recipes intact', () => {
			const baseline = baselineRecipeStyles();
			loadCss(scenario.css);
			renderHost();

			expect(recipeStyles()).toEqual(baseline);
		});

		test('Box utility props override conflicting recipe styles', () => {
			loadCss(scenario.css);
			renderHost();

			expect(getComputedStyle(byTestId('box-button')).paddingInlineStart).toBe('4px');
		});

		test(
			scenario.isOrdered
				? 'Tailwind utilities override Luke UI declarations'
				: 'Luke UI outranks Tailwind utilities',
			() => {
				loadCss(scenario.css);
				renderHost();

				expect(getComputedStyle(byTestId('tailwind-button')).paddingInlineStart).toBe(
					scenario.isOrdered ? '11px' : getComputedStyle(byTestId('button')).paddingInlineStart,
				);
			},
		);

		test('Tailwind utilities outrank Tailwind components', () => {
			loadCss(scenario.css);
			renderHost();

			expect(getComputedStyle(byTestId('tailwind-component')).paddingInlineStart).toBe('3px');
		});

		test('unlayered application CSS overrides Luke UI', () => {
			loadCss(scenario.css);
			loadCss('.app-override { padding-inline: 9px; }');
			renderHost();

			expect(getComputedStyle(byTestId('app-button')).paddingInlineStart).toBe('9px');
		});

		test('an important Tailwind utility beats normal Luke UI declarations', () => {
			loadCss(scenario.css);
			renderHost();

			expect(getComputedStyle(byTestId('important-button')).backgroundColor).toBe('rgb(7, 8, 9)');
		});

		test(
			scenario.isOrdered
				? 'LoadingSkeleton keeps its important surface over an important utility'
				: 'an important utility breaks the LoadingSkeleton surface',
			() => {
				loadCss(scenario.css);
				renderHost();

				const background = getComputedStyle(byTestId('skeleton')).backgroundColor;
				if (scenario.isOrdered) expect(background).not.toBe('rgb(7, 8, 9)');
				else expect(background).toBe('rgb(7, 8, 9)');
			},
		);
	});
}
