import axe from 'axe-core';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { json, mockApi, publishedReport } from '../test/mock-api.js';
import { renderApp } from '../test/render-app.js';

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
	pullReview = review(),
	reportMeta = COMPARISON,
	session = REVIEWER as unknown,
	decision,
}: {
	decision?: (init: RequestInit | undefined) => Response;
	pullReview?: unknown;
	reportMeta?: typeof COMPARISON;
	session?: unknown;
} = {}) {
	const number = nextNumber++;
	const calls = mockApi({
		[`GET https://pr-${number}.reports.test/summary.json`]: () =>
			publishedReport(number, reportMeta),
		'GET /api/session': () => json(session),
		[`GET /api/pulls/${number}/review`]: () => json({ headSha: HEAD_SHA, review: pullReview }),
		...(decision ? { [`POST /api/pulls/${number}/decision`]: decision } : {}),
	});
	return { calls, number, search: `?pr=${number}` };
}

test('a signed-out visitor sees the status and a sign-in link that returns to the review', async () => {
	const { search } = setup({ session: { user: null } });
	const app = await renderApp(`${search}&capture=button%2Fsecondary`);
	const bar = app.locator.getByRole('region', { name: 'Review' });

	await expect.element(bar.getByText('Needs review')).toBeVisible();
	await expect
		.element(bar.getByRole('link', { name: 'Sign in with GitHub to review' }))
		.toHaveAttribute(
			'href',
			`/api/auth/login?return=${encodeURIComponent(`/${search}&capture=button%2Fsecondary`)}`,
		);
	expect(bar.getByRole('button').elements()).toHaveLength(0);
});

test('approving posts the review’s comparison and shows the new state', async () => {
	const { calls, number, search } = setup({
		decision: () => json({ review: review({ decidedBy: 'luke', state: 'approved' }) }),
	});
	const app = await renderApp(search);
	const approve = app.locator.getByRole('button', { name: 'Approve' });
	await expect.element(approve).toBeVisible();

	await app.user.click(approve);

	await expect.element(app.locator.getByText('Saved. Approved by @luke.')).toBeVisible();
	await expect.element(app.locator.getByText('Approved by @luke', { exact: true })).toBeVisible();
	const decision = calls.find((call) => call.key === `POST /api/pulls/${number}/decision`);
	expect(decision?.body).toEqual({ decision: 'approve', ...COMPARISON });
	expect(decision?.headers.get('Content-Type')).toBe('application/json');
	// A reviewer can still change the decision.
	await expect.element(approve).toBeEnabled();
	await expect.element(app.locator.getByRole('button', { name: 'Request changes' })).toBeEnabled();
});

test('requesting changes needs a note, then posts it', async () => {
	const { calls, number, search } = setup({
		decision: () => json({ review: review({ decidedBy: 'luke', state: 'changes-requested' }) }),
	});
	const app = await renderApp(search);
	const requestChanges = app.locator.getByRole('button', { name: 'Request changes' });
	await expect.element(requestChanges).toBeVisible();

	await app.user.click(requestChanges);
	const note = app.locator.getByRole('textbox', { name: 'What needs to change?' });
	await expect.element(note).toHaveFocus();
	await app.user.click(app.locator.getByRole('button', { name: 'Submit request' }));

	await expect.element(app.locator.getByText('Say what needs to change.')).toBeVisible();
	expect(calls.some((call) => call.key.startsWith('POST'))).toBe(false);

	await app.user.fill(note, 'The focus ring moved');
	await app.user.click(app.locator.getByRole('button', { name: 'Submit request' }));

	await expect
		.element(app.locator.getByText('Changes requested by @luke', { exact: true }))
		.toBeVisible();
	await expect.element(requestChanges).toHaveFocus();
	const decision = calls.find((call) => call.key === `POST /api/pulls/${number}/decision`);
	expect(decision?.body).toEqual({
		decision: 'request-changes',
		note: 'The focus ring moved',
		...COMPARISON,
	});
});

test('typing j and k in the note does not step through captures', async () => {
	const { search } = setup();
	const app = await renderApp(search);
	const requestChanges = app.locator.getByRole('button', { name: 'Request changes' });
	await expect.element(requestChanges).toBeVisible();
	await app.user.click(requestChanges);
	const note = app.locator.getByRole('textbox', { name: 'What needs to change?' });
	await expect.element(note).toHaveFocus();

	await app.user.keyboard('jk');

	await expect.element(note).toHaveValue('jk');
	expect(new URLSearchParams(window.location.search).has('capture')).toBe(false);
	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: 'button/primary' }))
		.toBeVisible();
});

test('a stale decision asks the reviewer to reload', async () => {
	const { search } = setup({
		decision: () => json({ error: 'stale', message: 'A newer comparison ran.' }, 409),
	});
	const app = await renderApp(search);
	const approve = app.locator.getByRole('button', { name: 'Approve' });
	await expect.element(approve).toBeVisible();

	await app.user.click(approve);

	await expect
		.element(
			app.locator.getByText('A newer commit or comparison exists. Reload the page to review it.'),
		)
		.toBeVisible();
	await expect.element(app.locator.getByText('Needs review', { exact: true })).toBeVisible();
	await expect.element(approve).toBeDisabled();
	await expect.element(app.locator.getByRole('button', { name: 'Reload' })).toBeVisible();
});

test('a report for an older comparison disables the decisions', async () => {
	const { search } = setup({ reportMeta: { ...COMPARISON, runId: 33 } });
	const app = await renderApp(search);

	await expect.element(app.locator.getByText(/This report is out of date/)).toBeVisible();
	await expect.element(app.locator.getByRole('button', { name: 'Approve' })).toBeDisabled();
	await expect.element(app.locator.getByRole('button', { name: 'Request changes' })).toBeDisabled();
	await expect.element(app.locator.getByRole('button', { name: 'Reload' })).toBeVisible();
});

test('a reviewer without write access reads the status only', async () => {
	const { search } = setup({ session: { ...REVIEWER, canReview: false } });
	const app = await renderApp(search);

	await expect
		.element(app.locator.getByText('Reviewing needs write access to the repository.'))
		.toBeVisible();
	await expect.element(app.locator.getByText('Signed in as @luke')).toBeVisible();
	expect(app.locator.getByRole('button', { name: 'Approve' }).elements()).toHaveLength(0);
});

test('says when the pull request changes visual testing infrastructure', async () => {
	const { search } = setup({ pullReview: review({ reasons: ['infrastructure'] }) });
	const app = await renderApp(search);

	await expect
		.element(app.locator.getByText('This pull request changes visual testing infrastructure.'))
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

	await expect
		.element(app.locator.getByText('Review actions are only available on the deployed app.'))
		.toBeVisible();
	await app.user.keyboard('j');
	await expect
		.element(app.locator.getByRole('heading', { level: 2, name: 'button/secondary' }))
		.toBeVisible();
});

test('the review bar has no axe violations', async () => {
	const { search } = setup();
	const app = await renderApp(search);
	const requestChanges = app.locator.getByRole('button', { name: 'Request changes' });
	await expect.element(requestChanges).toBeVisible();
	await app.user.click(requestChanges);
	await expect
		.element(app.locator.getByRole('textbox', { name: 'What needs to change?' }))
		.toHaveFocus();

	const result = await axe.run(app.locator.getByRole('region', { name: 'Review' }).element());
	expect(result.violations).toEqual([]);
});

for (const state of ['failed', 'comparing']) {
	test(`disables decisions for a ${state} check with matching report metadata`, async () => {
		const { search } = setup({ pullReview: review({ state }) });
		const app = await renderApp(search);

		await expect
			.element(
				app.locator.getByText(state === 'failed' ? 'Comparison failed' : 'Comparing', {
					exact: true,
				}),
			)
			.toBeVisible();
		await expect.element(app.locator.getByRole('button', { name: 'Approve' })).toBeDisabled();
		await expect
			.element(app.locator.getByRole('button', { name: 'Request changes' }))
			.toBeDisabled();
	});
}
