import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { json, mockApi, publishedReport } from '../test/mock-api.js';
import { renderApp } from '../test/render-app.js';

type App = Awaited<ReturnType<typeof renderApp>>;

const HEAD_SHA = 'a'.repeat(40);
const COMPARISON = { headSha: HEAD_SHA, runAttempt: 1, runId: 34 };

// Each test reviews its own pull request, because the app loads a report once per page load.
let nextNumber = 100;

afterEach(() => {
	vi.restoreAllMocks();
});

function review(overrides: Record<string, unknown> = {}) {
	return {
		baselineRunId: 7,
		baselineSha: 'b'.repeat(40),
		checkUrl: 'https://github.com/lukebennett88/luke-ui/runs/9',
		decidedBy: null,
		kind: 'review',
		reasons: ['visual'],
		state: 'needs-review',
		...COMPARISON,
		...overrides,
	};
}

const REVIEWER = {
	canReview: true,
	user: { avatarUrl: 'https://example.test/a.png', login: 'luke' },
};

function setup({
	decision,
	hasReport = true,
	pullReview = review(),
	reportMeta = COMPARISON,
	session = REVIEWER as unknown,
}: {
	decision?: (init: RequestInit | undefined) => Response;
	hasReport?: boolean;
	pullReview?: unknown;
	reportMeta?: typeof COMPARISON;
	session?: unknown;
} = {}) {
	const number = nextNumber++;
	const calls = mockApi({
		...(hasReport
			? {
					[`GET https://pr-${number}.reports.test/summary.json`]: () =>
						publishedReport(number, reportMeta),
				}
			: {}),
		'GET /api/session': () => json(session),
		[`GET /api/pulls/${number}/review`]: () => json({ headSha: HEAD_SHA, review: pullReview }),
		...(decision ? { [`POST /api/pulls/${number}/decision`]: decision } : {}),
	});
	return { calls, number, search: `?pr=${number}` };
}

/** Opens the Review popover from the top bar. */
async function openReview(app: App) {
	const trigger = app.locator.getByRole('button', { name: 'Review', exact: true });
	// Wait outside `act`, which holds back the render that loads the report.
	await expect.element(trigger).toBeVisible();
	await app.user.click(trigger);
	const panel = page.getByRole('dialog', { name: /^Review #/ });
	await expect.element(panel).toBeVisible();
	return panel;
}

test('the top bar shows the review status beside the Review button', async () => {
	const { search } = setup({ pullReview: review({ decidedBy: 'mia', state: 'approved' }) });
	const app = await renderApp(search);

	await expect.element(app.locator.getByRole('banner').getByText('Approved by @mia')).toBeVisible();
	await expect
		.element(app.locator.getByRole('button', { name: 'Review', exact: true }))
		.toBeVisible();
});

test('a signed-out visitor sees the status and a sign-in link that returns to the review', async () => {
	const { search } = setup({ session: { user: null } });
	const app = await renderApp(`${search}&capture=button%2Fsecondary`);
	await expect.poll(() => window.location.search).toContain('capture=button%2Fsecondary');
	const panel = await openReview(app);

	await expect.element(panel.getByText('Needs review')).toBeVisible();
	const signIn = panel.getByRole('link', { name: 'Sign in with GitHub to review' });
	await expect.element(signIn).toBeVisible();
	const href = new URL(signIn.element().getAttribute('href') ?? '', window.location.href);
	expect(href.pathname).toBe('/api/auth/login');
	expect(new URLSearchParams(href.searchParams.get('return')?.split('?')[1]).get('capture')).toBe(
		'button/secondary',
	);
	expect(panel.getByRole('button', { name: 'Approve' }).elements()).toHaveLength(0);
});

test('approving posts the review’s comparison, whatever has been viewed', async () => {
	const { calls, number, search } = setup({
		decision: () => json({ review: review({ decidedBy: 'luke', state: 'approved' }) }),
	});
	const app = await renderApp(search);
	const panel = await openReview(app);
	await expect.element(panel.getByText('0 of 6 viewed', { exact: false })).toBeVisible();
	const approve = panel.getByRole('button', { name: 'Approve' });

	await app.user.click(approve);

	await expect.element(panel.getByText('Saved. Approved by @luke.')).toBeVisible();
	await expect
		.element(app.locator.getByRole('banner').getByText('Approved by @luke'))
		.toBeVisible();
	const decision = calls.find((call) => call.key === `POST /api/pulls/${number}/decision`);
	expect(decision?.body).toEqual({ decision: 'approve', ...COMPARISON });
	expect(decision?.headers.get('Content-Type')).toBe('application/json');
	// A reviewer can still change the decision.
	await expect.element(approve).toBeEnabled();
	await expect.element(panel.getByRole('button', { name: 'Request changes' })).toBeEnabled();
});

test('requesting changes needs a note, then posts it', async () => {
	const { calls, number, search } = setup({
		decision: () => json({ review: review({ decidedBy: 'luke', state: 'changes-requested' }) }),
	});
	const app = await renderApp(search);
	const panel = await openReview(app);
	const note = panel.getByRole('textbox', { name: /^Note/ });
	await expect.element(note).toHaveFocus();
	const requestChanges = panel.getByRole('button', { name: 'Request changes' });

	await app.user.click(requestChanges);

	await expect.element(panel.getByText('Say what needs to change.')).toBeVisible();
	await expect.element(note).toHaveFocus();
	expect(calls.some((call) => call.key.startsWith('POST'))).toBe(false);

	await app.user.fill(note, 'The focus ring moved');
	await app.user.click(requestChanges);

	await expect
		.element(app.locator.getByRole('banner').getByText('Changes requested by @luke'))
		.toBeVisible();
	await expect.element(note).toHaveValue('');
	const decision = calls.find((call) => call.key === `POST /api/pulls/${number}/decision`);
	expect(decision?.body).toEqual({
		decision: 'request-changes',
		note: 'The focus ring moved',
		...COMPARISON,
	});
});

test('a note is sent with an approval when the reviewer writes one', async () => {
	const { calls, number, search } = setup({
		decision: () => json({ review: review({ decidedBy: 'luke', state: 'approved' }) }),
	});
	const app = await renderApp(search);
	const panel = await openReview(app);

	await app.user.fill(panel.getByRole('textbox', { name: /^Note/ }), '  Intended  ');
	await app.user.click(panel.getByRole('button', { name: 'Approve' }));

	await expect.element(panel.getByText('Saved. Approved by @luke.')).toBeVisible();
	const decision = calls.find((call) => call.key === `POST /api/pulls/${number}/decision`);
	expect(decision?.body).toEqual({ decision: 'approve', note: 'Intended', ...COMPARISON });
});

test('typing j and k in the note does not step through examples', async () => {
	const { search } = setup();
	const app = await renderApp(search);
	await expect
		.poll(() => new URLSearchParams(window.location.search).get('capture'))
		.toBe('button/primary');
	const panel = await openReview(app);
	const note = panel.getByRole('textbox', { name: /^Note/ });
	await expect.element(note).toHaveFocus();

	await app.user.keyboard('jk');

	await expect.element(note).toHaveValue('jk');
	expect(new URLSearchParams(window.location.search).get('capture')).toBe('button/primary');
});

test('a stale decision asks the reviewer to reload', async () => {
	const { search } = setup({
		decision: () => json({ error: 'stale', message: 'A newer comparison ran.' }, 409),
	});
	const app = await renderApp(search);
	const panel = await openReview(app);
	const approve = panel.getByRole('button', { name: 'Approve' });

	await app.user.click(approve);

	await expect
		.element(panel.getByText('A newer commit or comparison exists. Reload the page to review it.'))
		.toBeVisible();
	await expect.element(app.locator.getByRole('banner').getByText('Needs review')).toBeVisible();
	await expect.element(approve).toBeDisabled();
	await expect.element(panel.getByRole('button', { name: 'Reload' })).toBeVisible();
});

test('a report for an older comparison turns the decisions off', async () => {
	const { search } = setup({ reportMeta: { ...COMPARISON, runId: 33 } });
	const app = await renderApp(search);
	const panel = await openReview(app);

	await expect.element(panel.getByText(/This report is out of date/)).toBeVisible();
	await expect.element(panel.getByRole('button', { name: 'Approve' })).toBeDisabled();
	await expect.element(panel.getByRole('button', { name: 'Request changes' })).toBeDisabled();
	await expect.element(panel.getByRole('button', { name: 'Reload' })).toBeVisible();
});

test('a reviewer without write access reads the status only, and can sign out', async () => {
	const { calls, search } = setup({ session: { ...REVIEWER, canReview: false } });
	mockLogout(calls);
	const app = await renderApp(search);
	const panel = await openReview(app);

	await expect
		.element(panel.getByText('Reviewing needs write access to the repository.'))
		.toBeVisible();
	await expect.element(panel.getByText(/^Signed in as @luke\./)).toBeVisible();
	expect(panel.getByRole('button', { name: 'Approve' }).elements()).toHaveLength(0);

	await app.user.click(panel.getByRole('button', { name: 'Sign out' }));

	await expect.element(panel.getByText('Signed out.')).toBeVisible();
});

test('says when the pull request changes visual testing infrastructure', async () => {
	const { search } = setup({ pullReview: review({ reasons: ['infrastructure'] }) });
	const app = await renderApp(search);
	const panel = await openReview(app);

	await expect
		.element(panel.getByText('This pull request changes visual testing infrastructure.'))
		.toBeVisible();
});

test('without a review backend, the review says so and keeps working', async () => {
	const number = nextNumber++;
	mockApi({
		[`GET https://pr-${number}.reports.test/summary.json`]: () =>
			publishedReport(number, COMPARISON),
		'GET /api/session': () =>
			new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
		[`GET /api/pulls/${number}/review`]: () =>
			new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
	});
	const app = await renderApp(`?pr=${number}`);
	const panel = await openReview(app);

	await expect
		.element(panel.getByText('Review actions are only available on the deployed app.'))
		.toBeVisible();
	await app.user.keyboard('{Escape}');
	await expect.element(panel).not.toBeInTheDocument();
	await app.user.keyboard('j');
	await expect
		.poll(() => new URLSearchParams(window.location.search).get('capture'))
		.toBe('button/secondary');
});

test('a pull request without a report still shows its review status', async () => {
	const { search } = setup({ hasReport: false });
	const app = await renderApp(search);
	await expect
		.element(app.locator.getByRole('heading', { level: 1, name: /^No report for pull request/ }))
		.toBeVisible();
	const panel = await openReview(app);

	await expect
		.element(
			panel.getByText('There is no report for this comparison yet, so it cannot be reviewed here.'),
		)
		.toBeVisible();
	await expect.element(panel.getByRole('button', { name: 'Approve' })).toBeDisabled();
});

test('a local comparison has no pull request, so it has no Review button', async () => {
	const app = await renderApp('?source=local');
	await expect.element(app.locator.getByText('0 of 6 viewed')).toBeVisible();

	expect(app.locator.getByRole('button', { name: 'Review', exact: true }).elements()).toHaveLength(
		0,
	);
});

test('the review popover has no axe violations', async () => {
	const { search } = setup();
	const app = await renderApp(search);
	const panel = await openReview(app);
	await expect.element(panel.getByRole('textbox', { name: /^Note/ })).toHaveFocus();

	const result = await axe.run(panel.element());
	expect(result.violations).toEqual([]);
});

for (const state of ['failed', 'comparing']) {
	test(`turns decisions off for a ${state} check with matching report metadata`, async () => {
		const { search } = setup({ pullReview: review({ state }) });
		const app = await renderApp(search);
		const panel = await openReview(app);

		await expect
			.element(
				panel.getByText(state === 'failed' ? 'Comparison failed' : 'Comparing', { exact: true }),
			)
			.toBeVisible();
		await expect.element(panel.getByRole('button', { name: 'Approve' })).toBeDisabled();
		await expect.element(panel.getByRole('button', { name: 'Request changes' })).toBeDisabled();
	});
}

/** Answers sign-out alongside the routes `setup` mocked. */
function mockLogout(calls: Array<{ key: string }>) {
	const fetchMock = vi.mocked(globalThis.fetch);
	const previous = fetchMock.getMockImplementation();
	fetchMock.mockImplementation(async (input, init) => {
		const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
		if (init?.method === 'POST' && url.pathname === '/api/auth/logout') {
			calls.push({ key: 'POST /api/auth/logout' });
			return new Response(null, { status: 204 });
		}
		if (!previous) throw new Error('fetch is not mocked');
		return previous(input, init);
	});
}
