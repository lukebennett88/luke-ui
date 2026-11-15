import axe from 'axe-core';
import { expect, test } from 'vite-plus/test';
import { renderApp } from '../test/render-app.js';

const PRIMARY = 'button/primary';
const SECONDARY = 'button/secondary';

/** The decorative outline spans drawn over a comparison image. They have no role to query. */
function outlines(container: HTMLElement) {
	return [...container.querySelectorAll<HTMLElement>('[role="region"] img ~ span[aria-hidden]')];
}

function currentParams() {
	return new URLSearchParams(window.location.search);
}

test('loads the report and shows the first capture side by side', async () => {
	const app = await renderApp('?source=local');

	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();
	await expect
		.element(app.locator.getByRole('img', { name: `Expected screenshot of ${PRIMARY}` }))
		.toBeVisible();
	await expect
		.element(app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` }))
		.toBeVisible();
	await expect
		.element(app.locator.getByRole('link', { name: 'primary Changed' }))
		.toHaveAttribute('aria-current', 'true');
	await expect.element(app.locator.getByRole('radio', { name: 'Side by side' })).toBeChecked();
});

test('j and k step through the captures and keep the selection in the URL', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();

	await app.user.keyboard('j');

	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: SECONDARY }))
		.toBeVisible();
	expect(currentParams().get('capture')).toBe(SECONDARY);
	await expect
		.element(app.locator.getByRole('link', { name: 'secondary Changed' }))
		.toHaveAttribute('aria-current', 'true');

	await app.user.keyboard('k');

	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();
	expect(currentParams().get('capture')).toBe(PRIMARY);
});

test('number keys switch between side by side, overlay, and diff', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByRole('radio', { name: 'Side by side' })).toBeChecked();

	await app.user.keyboard('2');

	await expect.element(app.locator.getByRole('radio', { name: 'Overlay' })).toBeChecked();
	await expect.element(app.locator.getByRole('slider', { name: 'Actual' })).toBeVisible();
	expect(currentParams().get('view')).toBe('overlay');

	await app.user.keyboard('3');

	await expect.element(app.locator.getByRole('radio', { name: 'Diff' })).toBeChecked();
	await expect
		.element(app.locator.getByRole('img', { name: `Diff screenshot of ${PRIMARY}` }))
		.toBeVisible();
	expect(app.locator.getByRole('img').elements()).toHaveLength(1);

	await app.user.keyboard('1');

	await expect.element(app.locator.getByRole('radio', { name: 'Side by side' })).toBeChecked();
	expect(currentParams().has('view')).toBe(false);
});

test('f opens the overlay and flips it between the expected and actual images', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByRole('radio', { name: 'Side by side' })).toBeChecked();
	const actual = app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` });

	await app.user.keyboard('f');

	await expect.element(app.locator.getByRole('slider', { name: 'Actual' })).toHaveValue('0');
	await expect.element(actual).toHaveStyle({ opacity: '0' });

	await app.user.keyboard('f');

	await expect.element(app.locator.getByRole('slider', { name: 'Actual' })).toHaveValue('100');
	await expect.element(actual).toHaveStyle({ opacity: '1' });
});

test('outlines each differing region on both images', async () => {
	const app = await renderApp('?source=local');

	// The fixture's diff marks two clusters of pixels, and side by side shows two images.
	await expect.poll(() => outlines(app.container)).toHaveLength(4);
});

test('keeps the outlines visible over the overlay at every opacity', async () => {
	const app = await renderApp('?source=local&view=overlay');
	await expect.poll(() => outlines(app.container)).toHaveLength(2);
	const actual = app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` });

	await app.user.keyboard('f');
	await expect.element(actual).toHaveStyle({ opacity: '0' });

	const [outline] = outlines(app.container);
	// The outlines sit over the top image and outside the element that fades.
	expect(outline?.parentElement).toBe(actual.element().parentElement);
	expect(outline?.checkVisibility({ opacityProperty: true })).toBe(true);
});

test('the outline control and the h key turn the outlines off and on', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => outlines(app.container)).toHaveLength(4);

	await app.user.click(app.locator.getByText('Outline differences'));

	await expect.poll(() => outlines(app.container)).toHaveLength(0);
	expect(currentParams().get('highlight')).toBe('off');

	await app.user.keyboard('h');

	await expect.poll(() => outlines(app.container)).toHaveLength(4);
});

test('Next keeps focus when it reaches the last capture', async () => {
	const app = await renderApp('?source=local&capture=text%2Fadded-case');
	const next = app.locator.getByRole('button', { name: 'Next capture' });

	await app.user.click(next);
	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: 'text/removed-case' }))
		.toBeVisible();
	await app.user.keyboard('{Enter}');

	await expect.element(next).toHaveFocus();
	await expect.element(app.locator.getByText('4 of 4')).toBeVisible();
});

test('the slash key focuses the filter, and typing there filters without running shortcuts', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();
	const filter = app.locator.getByRole('searchbox', { name: 'Filter captures' });

	await app.user.keyboard('/');
	await expect.element(filter).toHaveFocus();
	await app.user.keyboard('text');

	await expect.element(filter).toHaveValue('text');
	const captures = app.locator.getByRole('navigation', { name: 'Captures' }).getByRole('link');
	await expect.poll(() => captures.elements()).toHaveLength(2);
	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: 'text/added-case' }))
		.toBeVisible();

	await app.user.keyboard('j');

	await expect.element(filter).toHaveValue('textj');
	await expect.element(app.locator.getByText('No captures match the filter.')).toBeVisible();
});

test('turning keyboard shortcuts off stops single-key navigation and persists', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();

	await app.user.click(app.locator.getByText('Keyboard shortcuts'));
	await expect
		.element(app.locator.getByRole('checkbox', { name: 'Keyboard shortcuts' }))
		.not.toBeChecked();
	await app.user.keyboard('j');
	await app.user.keyboard('3');

	await expect.element(app.locator.getByRole('heading', { level: 2, name: PRIMARY })).toBeVisible();
	await expect.element(app.locator.getByRole('radio', { name: 'Side by side' })).toBeChecked();
	expect(currentParams().has('capture')).toBe(false);
	expect(localStorage.getItem('visual-review:shortcuts')).toBe('off');
});

test('an added capture shows its one image and no view switch', async () => {
	const app = await renderApp('?source=local&capture=text%2Fadded-case');

	await expect
		.element(app.locator.getByRole('img', { name: 'Actual screenshot of text/added-case' }))
		.toBeVisible();
	expect(app.locator.getByRole('img').elements()).toHaveLength(1);
	expect(app.locator.getByRole('radio').elements()).toHaveLength(0);
});

test('a deep link restores the capture, view, and zoom', async () => {
	const app = await renderApp('?source=local&capture=button%2Fsecondary&view=diff&zoom=2');

	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: SECONDARY }))
		.toBeVisible();
	const diff = app.locator.getByRole('img', { name: `Diff screenshot of ${SECONDARY}` });
	await expect.element(diff).toBeVisible();
	await expect.poll(() => diff.element().getBoundingClientRect().width).toBe(400);
});

test('the comparison is a labelled region the keyboard can focus and scroll', async () => {
	const app = await renderApp('?source=local&zoom=4');

	const stage = app.locator.getByRole('region', { name: 'Screenshots' });
	await expect.element(stage).toHaveAttribute('tabindex', '0');
});

test('the review has one top-level heading and no axe violations', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => outlines(app.container)).toHaveLength(4);

	expect(app.locator.getByRole('heading', { level: 1 }).elements()).toHaveLength(1);
	const result = await axe.run(app.container);
	expect(result.violations).toEqual([]);
});
