import { expect, test } from 'vite-plus/test';
import type { Context } from './access.js';
import { writeDecision } from './decision-repair.js';
import type { RestCheckRun } from './repo-reads.js';
import type { ExternalId } from './review.js';

test('restores a newer comparison when an approval lands on its check run', async () => {
	const headSha = 'a'.repeat(40);
	const externalId: ExternalId = {
		baselineRunAttempt: 1,
		baselineRunId: 123,
		baselineSha: 'b'.repeat(40),
		kind: 'review',
		reasons: [],
		runAttempt: 1,
		runId: 456,
		v: 1,
	};
	const run: RestCheckRun = {
		app: { id: 1 },
		conclusion: 'action_required',
		external_id: JSON.stringify(externalId),
		head_sha: headSha,
		html_url: null,
		id: 789,
		output: { summary: null, text: null, title: 'Needs review' },
		status: 'completed',
	};
	const newerId: ExternalId = { ...externalId, kind: 'pending', runAttempt: 2 };
	const writes: Array<unknown> = [];
	const url = new URL('https://review.example/api/pulls/1/decision');
	const now = new Date('2026-11-20T00:00:00Z');
	const context: Context = {
		config: {
			appId: 1,
			appOrigin: url.origin,
			clientId: 'client-id',
			clientSecret: 'client-secret',
			privateKey: 'private-key',
			repository: 'example/repo',
			repositoryName: 'repo',
			sessionSecret: 'session-secret',
		},
		deps: {
			fetch: async (input, init) => {
				const request = new Request(input, init);
				expect(request.url).toBe('https://api.github.com/repos/example/repo/check-runs/789');
				expect(request.method).toBe('PATCH');
				writes.push(await request.json());
				return Response.json({ ...run, external_id: JSON.stringify(newerId) });
			},
			now: () => now.getTime(),
		},
		github: { appSlug: async () => 'squint', installationToken: async () => 'token' },
		request: new Request(url, { method: 'POST' }),
		url,
		waitUntil: () => {},
	};

	const outcome = await writeDecision(context, {
		conclusion: 'success',
		externalId,
		headSha,
		login: 'reviewer',
		note: undefined,
		now,
		run,
		status: 'Approved by @reviewer',
	});

	expect(outcome).toMatchObject({
		comment: { status: 'Comparing' },
		error: { code: 'stale', status: 409 },
		kind: 'repaired',
	});
	expect(writes).toMatchObject([
		{ conclusion: 'success' },
		{ conclusion: 'action_required', output: { title: 'Comparing' } },
	]);
	for (const write of writes) expect(write).not.toHaveProperty('external_id');
});
