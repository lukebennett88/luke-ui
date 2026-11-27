import { expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../../../packages/@luke-ui/react/src/core/test-utils/axe.js';
import { renderApp } from '../test/render-app.js';
import { ReviewTrigger } from './review-panel.js';

test('announces a stale baseline refusal once', async () => {
	const headSha = 'a'.repeat(40);
	const review = {
		checkUrl: 'https://github.com/example/repo/checks/1',
		decidedBy: null,
		headSha,
		kind: 'review' as const,
		reasons: ['infrastructure' as const],
		runAttempt: 1,
		runId: 1,
		state: 'needs-review' as const,
	};
	const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValue(
		new Response(JSON.stringify({ error: 'stale-baseline', message: 'Baseline changed.' }), {
			headers: { 'Content-Type': 'application/json' },
			status: 409,
		}),
	);
	try {
		const app = await renderApp(
			'?pr=1',
			<ReviewTrigger
				isCompact={false}
				isOpen
				onOpenChange={() => {}}
				progress={undefined}
				report={{
					captures: [],
					counts: { added: 0, changed: 0, removed: 0, unchanged: 1 },
					meta: { generatedAt: '', headSha, pullRequest: 1, runAttempt: 1, runId: 1 },
				}}
				review={{
					number: 1,
					onReview: () => {},
					pullReview: { kind: 'loaded', review },
					refreshSession: () => {},
					session: { kind: 'ok', data: { canReview: true, user: { login: 'reviewer' } } },
				}}
			/>,
		);
		const dialog = page.getByRole('dialog', { name: 'Review #1' });
		await app.user.click(dialog.getByRole('button', { name: 'Approve' }));
		const message = 'The baseline on main has changed. Update the branch to compare against it.';
		await expect.element(dialog.getByRole('status')).toHaveTextContent(message);
		expect(dialog.element().textContent?.split(message)).toHaveLength(2);
		const dialogElement = dialog.element();
		if (!(dialogElement instanceof HTMLElement)) throw new Error('Expected an HTML dialog');
		await expectNoAxeViolations(dialogElement);
	} finally {
		fetchMock.mockRestore();
	}
});

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
