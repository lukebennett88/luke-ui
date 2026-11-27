import { expect, test } from 'vite-plus/test';
import { expectNoAxeViolations } from '../../../../packages/@luke-ui/react/src/core/test-utils/axe.js';
import { renderApp } from '../test/render-app.js';

test('keeps a legacy comparison link scrolled to its capture', async () => {
	const capture = 'checkbox/states-paper-dark';
	const app = await renderApp(`?source=local&capture=${capture}&view=overlay`);

	await expect
		.element(app.locator.getByRole('region', { name: `Before and After screenshot of ${capture}` }))
		.toBeVisible();
	await expect.poll(() => new URLSearchParams(location.search).get('view')).toBe('compare');
	expect(new URLSearchParams(location.search).get('capture')).toBe(capture);
	expect(window.scrollY).toBeGreaterThan(0);
});

test('advances through unviewed themes, folds the example, and reopens it on Undo', async () => {
	const app = await renderApp('?source=local');
	const example = app.locator.getByRole('region', { name: /^checkbox \/ states/ });
	const toggle = example.getByRole('button', { name: /^checkbox \/ states/ });
	const dark = example.getByRole('tab', { name: /Paper dark/ });
	const markDarkViewed = example.getByRole('button', { name: 'Mark viewed states Paper dark' });

	await app.user.click(example.getByRole('button', { name: 'Mark viewed states Paper light' }));
	await expect.element(dark).toHaveAttribute('aria-selected', 'true');

	await app.user.click(markDarkViewed);
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');

	await app.user.click(app.locator.getByRole('button', { name: 'Undo', exact: true }));
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect.element(dark).toHaveAttribute('aria-selected', 'true');
	await expect.element(markDarkViewed).toBeEnabled();
	await expectNoAxeViolations(app.container);
});
