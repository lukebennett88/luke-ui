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

test('changes the site theme from the example', async () => {
	renderShowcase();
	const showcase = getShowcase();

	await userEvent.click(showcase.getByRole('radio', { name: 'Paper' }), { force: true });

	expect(document.documentElement).toHaveClass(THEME_IDENTITY_CLASS_NAMES.paper);
});

test('Cancel resets the name field', async () => {
	renderShowcase();
	const showcase = getShowcase();
	const name = showcase.getByRole('textbox', { name: /Name/ });
	await userEvent.fill(name, 'Ada');

	await userEvent.click(showcase.getByRole('button', { name: 'Cancel' }));

	await expect.element(name).toHaveValue('');
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
	test(`fits the interactive example at ${inlineSize}`, async () => {
		renderShowcase(inlineSize);
		await expect.element(getShowcase()).toBeVisible();
		const scope = container as HTMLElement;
		const save = getShowcase().getByRole('button', { name: 'Save changes' }).element();
		expect(save.scrollWidth).toBeLessThanOrEqual(save.clientWidth);
		expect(scope.scrollWidth).toBeLessThanOrEqual(scope.clientWidth);
	});
}

function getShowcase() {
	return page.getByRole('region', { name: 'Interactive example' });
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
