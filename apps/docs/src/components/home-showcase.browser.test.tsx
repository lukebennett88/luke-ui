import '../styles/app.css';
import { HeadingLevels } from '@luke-ui/react/heading';
import { Provider } from '@luke-ui/react/provider';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import axe from 'axe-core';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { themeTokens } from '../generated/token-reference.generated.js';
import { THEME_IDENTITY_CLASS_NAMES } from '../lib/theme-prefs-shared.js';
import { HomeShowcase } from './home-showcase.js';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	localStorage.clear();
	document.documentElement.removeAttribute('class');
	document.documentElement.removeAttribute('data-color-mode');
	container = undefined;
	root = undefined;
});

test('holds the site theme controls', async () => {
	renderShowcase();
	const showcase = getShowcase();

	await expect.element(showcase.getByRole('radiogroup', { name: 'Theme profile' })).toBeVisible();
	await expect.element(showcase.getByRole('radiogroup', { name: 'Colour mode' })).toBeVisible();
});

test('names the theme class on the document, and follows a change of theme', async () => {
	renderShowcase();
	const showcase = getShowcase();
	const tactile = showcase.getByText(`.${THEME_IDENTITY_CLASS_NAMES.tactile}`);
	const paper = showcase.getByText(`.${THEME_IDENTITY_CLASS_NAMES.paper}`);
	await expect.element(tactile).toBeVisible();
	await expect.element(paper).not.toBeVisible();

	await userEvent.click(showcase.getByRole('radio', { name: 'Paper' }), { force: true });

	await expect.element(paper).toBeVisible();
	await expect.element(tactile).not.toBeVisible();
	expect(document.documentElement).toHaveClass(THEME_IDENTITY_CLASS_NAMES.paper);
});

test('Reset restores the default name and size', async () => {
	renderShowcase();
	const showcase = getShowcase();
	const name = showcase.getByRole('textbox', { name: /Name/ });
	const size = showcase.getByRole('button', { name: /Size/ });
	await userEvent.fill(name, 'Ada');
	await userEvent.click(size);
	await userEvent.click(page.getByRole('option', { name: 'Large' }));
	await expect.element(size).toHaveTextContent('Large');

	await userEvent.click(showcase.getByRole('button', { name: 'Reset' }));

	await expect.element(name).toHaveValue('');
	await expect.element(size).toHaveTextContent('Medium');
});

test('saving with an empty name shows the validation error', async () => {
	renderShowcase();
	const showcase = getShowcase();

	await userEvent.click(showcase.getByRole('button', { name: 'Save changes' }));

	await expect.element(showcase.getByRole('textbox', { name: /Name/ })).toBeInvalid();
	await expect.element(showcase.getByRole('button', { name: 'Save changes' })).not.toBeDisabled();
});

test('saving a valid name holds the button pending, then settles', async () => {
	renderShowcase();
	const showcase = getShowcase();
	await userEvent.fill(showcase.getByRole('textbox', { name: /Name/ }), 'Ada');

	await userEvent.click(showcase.getByRole('button', { name: 'Save changes' }));

	await expect
		.element(showcase.getByRole('button', { name: 'Save changes' }))
		.toHaveAttribute('aria-disabled', 'true');
	await expect
		.element(showcase.getByRole('button', { name: 'Save changes' }), { timeout: 3000 })
		.not.toHaveAttribute('aria-disabled', 'true');
	await expect.element(showcase.getByRole('textbox', { name: /Name/ })).toHaveValue('Ada');
});

/** Each control with the public tokens its annotations name, in reading order. */
const ANNOTATED_CONTROLS = [
	{
		description: 'color.border.control Field border radius.control Control corners',
		role: 'textbox',
		name: /Name/,
		tokens: ['color.border.control', 'radius.control'],
	},
	{
		description: 'controlSize.px32 Small control height color.text.secondary Chevron',
		role: 'button',
		name: /Size/,
		tokens: ['controlSize.px32', 'color.text.secondary'],
	},
	{
		description: 'color.background.neutral.subtle.rest Standard prominence',
		role: 'button',
		name: 'Reset',
		tokens: ['color.background.neutral.subtle.rest'],
	},
	{
		description: 'color.background.accent.solid.rest High prominence',
		role: 'button',
		name: 'Save changes',
		tokens: ['color.background.accent.solid.rest'],
	},
] as const;

for (const control of ANNOTATED_CONTROLS) {
	test(`describes ${String(control.name)} with its annotations`, async () => {
		renderShowcase();

		await expect
			.element(getShowcase().getByRole(control.role, { name: control.name }))
			.toHaveAccessibleDescription(control.description);
	});
}

test('names only public tokens', () => {
	const publicPaths = new Set(themeTokens.map((token) => token.path));

	expect(
		ANNOTATED_CONTROLS.flatMap((control) => control.tokens).filter(
			(path) => !publicPaths.has(path),
		),
	).toEqual([]);
});

test('the showcase has no axe violations', async () => {
	renderShowcase();
	await expect.element(getShowcase()).toBeVisible();

	const results = await axe.run(container as HTMLElement);
	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
});

for (const inlineSize of ['34rem', '20rem']) {
	test(`stacked at ${inlineSize}: notes sit below tokens and nothing overlaps`, async () => {
		renderShowcase(inlineSize);
		await expect.element(getShowcase()).toBeVisible();
		const scope = container as HTMLElement;
		const rect = (element: Element) => element.getBoundingClientRect();
		const intersects = (a: DOMRect, b: DOMRect) =>
			a.left < b.right - 0.5 &&
			b.left < a.right - 0.5 &&
			a.top < b.bottom - 0.5 &&
			b.top < a.bottom - 0.5;
		const tokens = [...scope.querySelectorAll('[id$="-token"]')];
		const notes = [...scope.querySelectorAll('[id$="-note"]')];
		expect(tokens).toHaveLength(6);
		expect(notes).toHaveLength(6);
		for (const [index, token] of tokens.entries()) {
			const note = notes[index] as Element;
			expect(intersects(rect(token), rect(note))).toBe(false);
			// The note follows its token directly, with a small gap.
			const gap = rect(note).top - rect(token).bottom;
			expect(gap).toBeGreaterThanOrEqual(0);
			expect(gap).toBeLessThanOrEqual(8);
		}
		const controls = [
			...scope.querySelectorAll('input, button[type="reset"], button[type="submit"]'),
			...scope.querySelectorAll('button[aria-haspopup]'),
		];
		expect(controls.length).toBeGreaterThanOrEqual(4);
		for (const annotation of tokens.map((token) => token.parentElement?.parentElement)) {
			for (const control of controls) {
				expect(intersects(rect(annotation as Element), rect(control))).toBe(false);
			}
		}
		const save = [...scope.querySelectorAll('button[type="submit"]')][0] as HTMLElement;
		expect(save.scrollWidth).toBeLessThanOrEqual(save.clientWidth);
		expect(scope.scrollWidth).toBeLessThanOrEqual(scope.clientWidth);
	});
}

function getShowcase() {
	return page.getByRole('region', { name: 'Token specimen' });
}

function renderShowcase(inlineSize = '38rem') {
	container = document.body.appendChild(document.createElement('div'));
	container.style.maxInlineSize = inlineSize;
	root = createRoot(container);
	act(() => {
		root?.render(
			// Mirrors `__root.tsx`: the mode controls draw icons from the spritesheet.
			<Provider spritesheetHref={spriteSheetHref}>
				<HeadingLevels base={1}>
					<HomeShowcase />
				</HeadingLevels>
			</Provider>,
		);
	});
}
