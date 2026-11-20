import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { repository } from '../config.js';
import { json, mockApi, publishedReport } from '../test/mock-api.js';
import { cleanupApps, renderApp } from '../test/render-app.js';

type App = Awaited<ReturnType<typeof renderApp>>;

const PRIMARY = 'button/primary';
const SECONDARY = 'button/secondary';
const STATES_LIGHT = 'checkbox/states-paper-light';
const STATES_DARK = 'checkbox/states-paper-dark';
/** Six differing captures in five examples: `checkbox/states` has two themes. */
const TOTAL = 6;

afterEach(() => {
	vi.restoreAllMocks();
});

/** A theme tab's name: its theme, then its seen state for assistive technology. */
function themeTab(theme: string, state: string) {
	return new RegExp(`^${theme}\\s*, ${state}$`);
}

function currentParams() {
	return new URLSearchParams(window.location.search);
}

/** The decorative outlines drawn over a capture's images. They have no role to query. */
function outlines(container: HTMLElement, captureId: string) {
	return [
		...container.querySelectorAll<HTMLElement>(
			`[data-capture="${CSS.escape(captureId)}"] [data-region]`,
		),
	];
}

function inView(app: App) {
	return app.locator.getByRole('group', { name: 'Capture in view' });
}

function section(app: App, name: string) {
	return app.locator.getByRole('region', { name: new RegExp(`^${name.replace('/', ' / ')}`) });
}

async function openViewOptions(app: App) {
	await app.user.click(
		app.locator.getByRole('button', { name: /^View (Actual|Expected|Diff|Side by side|Overlay)$/ }),
	);
	const dialog = page.getByRole('dialog', { name: 'View options' });
	await expect.element(dialog).toBeVisible();
	return dialog;
}

test('loads the report and shows the first example’s actual image, outlined', async () => {
	const app = await renderApp('?source=local');

	await expect
		.element(app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` }))
		.toBeVisible();
	await expect.poll(() => inView(app).element().textContent).toContain('button / primary');
	await expect.element(app.locator.getByText(`0 of ${TOTAL} viewed`)).toBeVisible();
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	// The fixture's diff marks two clusters of pixels.
	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(2);
	expect(
		app.locator.getByRole('img', { name: `Expected screenshot of ${PRIMARY}` }).elements(),
	).toHaveLength(0);
});

test('an example’s themes are tabs, and the tab chosen is the capture in view', async () => {
	const app = await renderApp('?source=local');
	const themes = app.locator.getByRole('tablist', { name: 'states themes' });
	await expect.poll(() => themes.getByRole('tab').elements()).toHaveLength(2);
	await expect
		.element(themes.getByRole('tab').first())
		.toHaveAccessibleName(themeTab('Paper light', 'not viewed'));

	await app.user.click(themes.getByRole('tab', { name: /Paper dark/ }));

	await expect.poll(() => currentParams().get('capture')).toBe(STATES_DARK);
	await expect.poll(() => inView(app).element().textContent).toContain('states · Paper dark');
	await expect
		.element(app.locator.getByRole('img', { name: `Actual screenshot of ${STATES_DARK}` }))
		.toBeVisible();
});

test('j and k step through the examples and keep the capture in view in the URL', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);

	await app.user.keyboard('j');
	await expect.poll(() => currentParams().get('capture')).toBe(SECONDARY);
	await app.user.keyboard('j');
	await expect.poll(() => currentParams().get('capture')).toBe(STATES_LIGHT);
	await expect.poll(() => inView(app).element().textContent).toContain('states · Paper light');

	await app.user.keyboard('k');

	await expect.poll(() => currentParams().get('capture')).toBe(SECONDARY);
});

test('number keys show the expected, actual and diff images, and s and o switch layouts', async () => {
	const app = await renderApp('?source=local');
	const primary = section(app, PRIMARY);
	await expect.element(primary.getByRole('img', { name: /^Actual/ })).toBeVisible();

	await app.user.keyboard('1');
	await expect.element(primary.getByRole('img', { name: /^Expected/ })).toBeVisible();
	expect(currentParams().get('pane')).toBe('expected');

	await app.user.keyboard('3');
	await expect.element(primary.getByRole('img', { name: /^Diff/ })).toBeVisible();
	expect(primary.getByRole('img').elements()).toHaveLength(1);
	expect(currentParams().get('pane')).toBe('diff');

	await app.user.keyboard('s');
	await expect.poll(() => primary.getByRole('img').elements()).toHaveLength(2);
	expect(currentParams().get('view')).toBe('side');

	await app.user.keyboard('o');
	await expect.poll(() => currentParams().get('view')).toBe('overlay');
	await expect.element(app.locator.getByRole('button', { name: 'View Overlay' })).toBeVisible();

	await app.user.keyboard('2');
	await expect.poll(() => primary.getByRole('img').elements()).toHaveLength(1);
	expect(currentParams().has('view')).toBe(false);
	expect(currentParams().has('pane')).toBe(false);
});

test('the overlay fades the actual image and keeps its outlines visible', async () => {
	const app = await renderApp('?source=local&view=overlay');
	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(2);
	const actual = app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` });
	const dialog = await openViewOptions(app);

	dialog.getByRole('slider', { name: 'Actual opacity' }).element().focus();
	await app.user.keyboard('{Home}');

	await expect.element(actual).toHaveStyle({ opacity: '0' });
	const [outline] = outlines(app.container, PRIMARY);
	// The outlines sit over the top image and outside the element that fades.
	expect(outline?.parentElement).toBe(actual.element().parentElement);
	expect(outline?.checkVisibility({ opacityProperty: true })).toBe(true);
});

test('outlines turn off in View options and with h, and the choice is in the link', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(2);
	const dialog = await openViewOptions(app);

	await app.user.click(dialog.getByText('Outline differences'));
	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(0);
	expect(currentParams().get('highlight')).toBe('off');
	await app.user.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();

	await app.user.keyboard('h');

	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(2);
	expect(currentParams().has('highlight')).toBe(false);
});

test('d and Shift D step through the differences in the capture in view', async () => {
	const app = await renderApp('?source=local');
	const differences = app.locator.getByRole('group', {
		name: 'Differences in the capture in view',
	});
	await expect.poll(() => differences.element().textContent).toContain('2 differences');

	await app.user.keyboard('d');
	await expect.poll(() => differences.element().textContent).toContain('1 of 2');
	await app.user.click(differences.getByRole('button', { name: 'Next difference (D)' }));
	await expect.poll(() => differences.element().textContent).toContain('2 of 2');
	await app.user.keyboard('D');

	await expect.poll(() => differences.element().textContent).toContain('1 of 2');
	// The difference stepped to carries the stepper's number, and the rest step back.
	const [active, other] = outlines(app.container, PRIMARY);
	expect(active?.textContent).toBe('1');
	expect(other?.textContent).toBe('');
	await expect.poll(() => getComputedStyle(other ?? document.body).opacity).toBe('0.4');
	expect(getComputedStyle(active ?? document.body).opacity).toBe('1');
});

test('zoom keys scale the capture in view only, and its zoom is in the link', async () => {
	const app = await renderApp('?source=local');
	const primary = app.locator.getByRole('img', { name: `Actual screenshot of ${PRIMARY}` });
	const secondary = app.locator.getByRole('img', { name: `Actual screenshot of ${SECONDARY}` });
	await expect.poll(() => primary.element().getBoundingClientRect().width).toBe(200);

	await app.user.keyboard('+');
	await app.user.keyboard('+');

	await expect.poll(() => primary.element().getBoundingClientRect().width).toBe(400);
	expect(currentParams().get('zoom')).toBe('2');
	expect(secondary.element().getBoundingClientRect().width).toBe(200);

	await app.user.keyboard('f');
	await expect.poll(() => currentParams().get('zoom')).toBe('screen');
	await app.user.keyboard('0');

	await expect.poll(() => currentParams().has('zoom')).toBe(false);
	await expect.poll(() => primary.element().getBoundingClientRect().width).toBe(200);
});

test('the slash key opens Contents on the filter, and typing there runs no shortcuts', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	const filter = app.locator.getByRole('searchbox', { name: 'Filter captures' });

	await app.user.keyboard('/');
	await expect.element(filter).toHaveFocus();
	await app.user.keyboard('text');

	await expect.element(filter).toHaveValue('text');
	const contents = app.locator.getByRole('navigation', { name: 'Contents' });
	await expect.poll(() => contents.getByRole('listitem').elements()).toHaveLength(2);
	await expect.poll(() => currentParams().get('capture')).toBe('text/added-case');
	expect(currentParams().get('q')).toBe('text');

	await app.user.keyboard('j');

	await expect.element(filter).toHaveValue('textj');
	await expect.element(contents.getByText('No captures match the filter.')).toBeVisible();
});

test('a status filter keeps only the examples it matches', async () => {
	const app = await renderApp('?source=local&status=removed');

	await expect
		.element(app.locator.getByRole('img', { name: 'Expected screenshot of text/removed-case' }))
		.toBeVisible();
	await expect.poll(() => currentParams().get('capture')).toBe('text/removed-case');
	expect(app.locator.getByRole('img').elements()).toHaveLength(1);
});

test('Hide viewed leaves viewed examples out, and an empty result offers to clear', async () => {
	const app = await renderApp('?source=local');
	await app.user.click(app.locator.getByRole('button', { name: 'Contents', exact: true }));
	await app.user.click(app.locator.getByRole('button', { name: 'Mark all viewed' }));
	await expect.element(app.locator.getByText(`${TOTAL} of ${TOTAL} viewed`).first()).toBeVisible();

	await app.user.click(app.locator.getByText('Hide viewed'));

	expect(currentParams().get('hide')).toBe('viewed');
	await expect
		.element(app.locator.getByRole('main').getByText('No captures match the filter.'))
		.toBeVisible();
	await app.user.click(app.locator.getByRole('button', { name: 'Clear filter' }));

	await expect
		.poll(() => app.locator.getByRole('main').getByRole('heading', { level: 2 }).elements())
		.toHaveLength(5);
	expect(currentParams().has('hide')).toBe(false);
});

test('marking an example viewed folds it to a labelled row, and Undo opens it again', async () => {
	const app = await renderApp('?source=local');
	const toggle = section(app, PRIMARY).getByRole('button', { name: /^button \/ primary/ });
	await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');

	await app.user.click(inView(app).getByText('Viewed'));

	await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect.element(toggle).toHaveAccessibleDescription('Viewed');
	await expect.element(app.locator.getByText(`1 of ${TOTAL} viewed`)).toBeVisible();
	// The next example still to view takes over the top bar.
	await expect.poll(() => currentParams().get('capture')).toBe(SECONDARY);

	await app.user.click(app.locator.getByRole('button', { name: 'Undo' }));

	await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect.element(app.locator.getByText(`0 of ${TOTAL} viewed`)).toBeVisible();
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
});

test('viewing one theme moves to the next without marking it, and the menu marks them all', async () => {
	const app = await renderApp(`?source=local&capture=${encodeURIComponent(STATES_LIGHT)}`);
	const themes = app.locator.getByRole('tablist', { name: 'states themes' });
	await expect.poll(() => inView(app).element().textContent).toContain('states · Paper light');

	await app.user.click(inView(app).getByText('Viewed'));

	await expect
		.element(themes.getByRole('tab', { name: themeTab('Paper light', 'viewed') }))
		.toBeVisible();
	await expect
		.element(themes.getByRole('tab', { name: themeTab('Paper dark', 'not viewed') }))
		.toHaveAttribute('aria-selected', 'true');
	await expect.poll(() => currentParams().get('capture')).toBe(STATES_DARK);
	await expect.element(inView(app).getByRole('checkbox')).not.toBeChecked();

	await app.user.click(app.locator.getByRole('button', { name: 'More for states' }));
	await app.user.click(page.getByRole('menuitem', { name: 'Mark all 2 themes viewed' }));

	await expect.element(section(app, 'checkbox/states').getByText('2 themes viewed')).toBeVisible();
	await expect.element(app.locator.getByText(`2 of ${TOTAL} viewed`)).toBeVisible();
});

test('viewed captures persist in this browser, and a capture changed since is flagged', async () => {
	const comparison = { headSha: 'a'.repeat(40), runAttempt: 1, runId: 1 };
	mockApi({
		'GET https://pr-301.reports.test/summary.json': () =>
			publishedReport(301, comparison, { fingerprint: '1'.repeat(64) }),
		'GET https://pr-302.reports.test/summary.json': () =>
			publishedReport(302, comparison, { fingerprint: '2'.repeat(64) }),
		'GET https://pr-303.reports.test/summary.json': () =>
			publishedReport(303, comparison, { fingerprint: '1'.repeat(64) }),
		'GET /api/session': () => json({ user: null }),
	});
	let app = await renderApp('?pr=301');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	await app.user.click(inView(app).getByText('Viewed'));
	await expect.element(app.locator.getByText(`1 of ${TOTAL} viewed`)).toBeVisible();
	cleanupApps();

	// A later commit whose images differ.
	app = await renderApp('?pr=302');

	await expect
		.element(
			app.locator.getByRole('region', {
				name: `Actual screenshot of ${PRIMARY}, changed since viewed`,
			}),
		)
		.toBeVisible();
	await expect.element(app.locator.getByText(`0 of ${TOTAL} viewed`)).toBeVisible();
	await app.user.click(app.locator.getByRole('button', { name: 'Contents', exact: true }));
	await expect
		.poll(() => app.locator.getByRole('navigation', { name: 'Contents' }).element().textContent)
		.toContain('1 changed since viewed');
	cleanupApps();

	// A commit whose images match what was viewed.
	app = await renderApp('?pr=303');

	await expect.element(app.locator.getByText(`1 of ${TOTAL} viewed`)).toBeVisible();
	await expect
		.element(section(app, PRIMARY).getByRole('button', { name: /^button \/ primary/ }))
		.toHaveAttribute('aria-expanded', 'false');
});

test('Undo puts back a capture that had changed since it was viewed', async () => {
	const comparison = { headSha: 'a'.repeat(40), runAttempt: 1, runId: 1 };
	mockApi({
		'GET https://pr-301.reports.test/summary.json': () =>
			publishedReport(301, comparison, { fingerprint: '1'.repeat(64) }),
		'GET https://pr-302.reports.test/summary.json': () =>
			publishedReport(302, comparison, { fingerprint: '2'.repeat(64) }),
		'GET /api/session': () => json({ user: null }),
	});
	let app = await renderApp('?pr=301');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	await app.user.click(inView(app).getByText('Viewed'));
	await expect.element(app.locator.getByText(`1 of ${TOTAL} viewed`)).toBeVisible();
	cleanupApps();
	app = await renderApp('?pr=302');
	const changed = app.locator.getByRole('region', {
		name: `Actual screenshot of ${PRIMARY}, changed since viewed`,
	});
	await expect.element(changed).toBeVisible();

	await app.user.click(inView(app).getByText('Viewed'));
	await expect.element(app.locator.getByText(`1 of ${TOTAL} viewed`)).toBeVisible();
	await app.user.click(app.locator.getByRole('button', { name: 'Undo' }));

	await expect.element(changed).toBeVisible();
	await expect.element(app.locator.getByText(`0 of ${TOTAL} viewed`)).toBeVisible();
});

test('marking a capture viewed keeps what another tab marked meanwhile', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	// Another tab marks a capture viewed after this one read its record.
	const otherTab = `visual-review:seen:${repository}:${SECONDARY}`;
	localStorage.setItem(otherTab, 'from another tab');

	await app.user.click(inView(app).getByText('Viewed'));

	await expect.element(app.locator.getByText(/^\d+ of 6 viewed$/).first()).toBeVisible();
	expect(localStorage.getItem(otherTab)).toBe('from another tab');
	expect(localStorage.getItem(`visual-review:seen:${repository}:${PRIMARY}`)).not.toBeNull();
});

test('a deep link opens its theme, image and zoom', async () => {
	const app = await renderApp(
		`?source=local&capture=${encodeURIComponent(STATES_DARK)}&view=diff&zoom=2`,
	);

	const diff = app.locator.getByRole('img', { name: `Diff screenshot of ${STATES_DARK}` });
	await expect.element(diff).toBeVisible();
	await expect.poll(() => diff.element().getBoundingClientRect().width).toBe(400);
	await expect
		.element(app.locator.getByRole('tab', { name: themeTab('Paper dark', 'not viewed') }))
		.toHaveAttribute('aria-selected', 'true');
	expect(currentParams().get('capture')).toBe(STATES_DARK);
	expect(currentParams().get('zoom')).toBe('2');
});

test('an added capture shows its one image whatever image is chosen', async () => {
	const app = await renderApp('?source=local&capture=text%2Fadded-case&pane=expected');
	const added = section(app, 'text/added-case');

	await expect
		.element(added.getByRole('img', { name: 'Actual screenshot of text/added-case' }))
		.toBeVisible();
	expect(added.getByRole('img').elements()).toHaveLength(1);
});

test('the keyboard can reach a zoomed capture and scroll it', async () => {
	await page.viewport(800, 800);
	const app = await renderApp(`?source=local&capture=${encodeURIComponent(PRIMARY)}&zoom=4`);
	const stage = app.locator.getByRole('region', { name: `Actual screenshot of ${PRIMARY}` });
	await expect.element(stage).toHaveAttribute('tabindex', '0');

	stage.element().focus();
	await app.user.keyboard('{ArrowRight}');

	await expect.poll(() => stage.element().scrollLeft).toBeGreaterThan(0);
});

test('turning single-key shortcuts off stops them, and the choice persists', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => currentParams().get('capture')).toBe(PRIMARY);
	const dialog = await openViewOptions(app);

	await app.user.click(dialog.getByText('Single-key shortcuts'));
	await expect
		.element(dialog.getByRole('switch', { name: 'Single-key shortcuts' }))
		.not.toBeChecked();
	await app.user.keyboard('{Escape}');
	await expect.element(dialog).not.toBeInTheDocument();
	await app.user.keyboard('j');
	await app.user.keyboard('3');

	expect(localStorage.getItem('visual-review:shortcuts')).toBe('off');
	expect(currentParams().get('capture')).toBe(PRIMARY);
	expect(currentParams().has('pane')).toBe(false);
});

test('on a phone, a bottom bar holds Viewed and View, and Contents opens as a sheet', async () => {
	await page.viewport(375, 812);
	const app = await renderApp('?source=local');
	const bar = app.locator.getByRole('navigation', { name: 'Capture in view' });
	await expect.element(bar.getByRole('checkbox', { name: 'Viewed primary' })).toBeVisible();

	await app.user.click(app.locator.getByRole('button', { name: /^Contents\. In view: primary/ }));

	const sheet = page.getByRole('dialog', { name: 'Contents' });
	await expect.element(sheet.getByRole('searchbox', { name: 'Filter captures' })).toBeVisible();
	await app.user.click(sheet.getByRole('button', { name: /^secondary/ }));
	await expect.poll(() => currentParams().get('capture')).toBe(SECONDARY);
	const result = await axe.run(document.body);
	expect(result.violations).toEqual([]);
});

test('on a phone, the bottom bar switches the image and steps through differences', async () => {
	await page.viewport(375, 812);
	const app = await renderApp('?source=local');
	const bar = app.locator.getByRole('navigation', { name: 'Capture in view' });
	const differences = bar.getByRole('group', { name: 'Differences in the capture in view' });
	await expect.poll(() => differences.element().textContent).toContain('2 differences');

	await app.user.click(bar.getByRole('radio', { name: 'Diff' }));
	await expect
		.element(app.locator.getByRole('img', { name: `Diff screenshot of ${PRIMARY}` }))
		.toBeVisible();
	await app.user.click(differences.getByRole('button', { name: 'Next difference' }));

	await expect.poll(() => differences.element().textContent).toContain('1 of 2');
	expect(currentParams().get('pane')).toBe('diff');
});

test('on a phone, the View sheet can still turn single-key shortcuts off', async () => {
	await page.viewport(375, 812);
	const app = await renderApp('?source=local');
	const bar = app.locator.getByRole('navigation', { name: 'Capture in view' });

	await app.user.click(bar.getByRole('button', { name: /^View/ }));
	const sheet = page.getByRole('dialog');
	await app.user.click(sheet.getByText('Single-key shortcuts'));

	await expect
		.element(sheet.getByRole('switch', { name: 'Single-key shortcuts' }))
		.not.toBeChecked();
	expect(localStorage.getItem('visual-review:shortcuts')).toBe('off');
});

test('the review has one top-level heading and no axe violations', async () => {
	const app = await renderApp('?source=local');
	await expect.poll(() => outlines(app.container, PRIMARY)).toHaveLength(2);
	await app.user.click(app.locator.getByRole('button', { name: 'Contents', exact: true }));
	await expect.element(app.locator.getByRole('navigation', { name: 'Contents' })).toBeVisible();

	expect(app.locator.getByRole('heading', { level: 1 }).elements()).toHaveLength(1);
	const result = await axe.run(app.container);
	expect(result.violations).toEqual([]);
});
