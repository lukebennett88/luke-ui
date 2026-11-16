import { describe, expect, test } from 'vite-plus/test';
import type { Env } from './config.js';
import type { ResponseCache } from './github.js';
import { createHandler } from './handler.js';
import { pkceChallenge, signToken, verifyToken } from './session.js';
import { generateTestKey } from './test-key.js';

const NOW = Date.parse('2026-11-16T03:40:00Z');
const ORIGIN = 'https://review.example';
const SECRET = 'a-test-secret-that-is-32-bytes-long';
const HEAD = 'a'.repeat(40);
const BOT = 'luke-ui-visual-review[bot]';
const BASELINE = 'b'.repeat(40);
const { pem } = await generateTestKey();

const env: Env = {
	APP_ORIGIN: ORIGIN,
	GITHUB_APP_CLIENT_ID: 'Iv23.client',
	GITHUB_APP_CLIENT_SECRET: 'client-secret',
	GITHUB_APP_ID: '42',
	GITHUB_APP_PRIVATE_KEY: pem,
	GITHUB_REPOSITORY: 'octo/widgets',
	SESSION_SECRET: SECRET,
};

interface CheckRun {
	app: { id: number } | null;
	conclusion: string | null;
	external_id: string | null;
	head_sha: string;
	html_url: string;
	id: number;
	output: { summary: string | null; text: string | null; title: string | null };
	status: string;
}

function checkRun(externalId: Record<string, unknown> = {}): CheckRun {
	return {
		app: { id: 42 },
		conclusion: 'action_required',
		external_id: JSON.stringify({
			baselineRunAttempt: 1,
			baselineRunId: 456,
			baselineSha: BASELINE,
			kind: 'review',
			reasons: ['visual'],
			runAttempt: 1,
			runId: 123,
			v: 1,
			...externalId,
		}),
		head_sha: HEAD,
		html_url: 'https://github.com/octo/widgets/runs/900',
		id: 900,
		output: {
			summary: '**Status:** Needs review\n\n| Changed | 3 |',
			text: '### History\n\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review',
			title: 'Needs review: 3 changed',
		},
		status: 'completed',
	};
}

interface WorkflowRun {
	conclusion: string | null;
	event: string;
	head_branch: string;
	head_repository: { full_name: string };
	head_sha: string;
	id: number;
	run_attempt: number;
	status: string;
}

/** A `Visual regression` run on the head commit. */
function comparisonRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
	return {
		conclusion: 'success',
		event: 'pull_request',
		head_branch: 'button-padding',
		head_repository: { full_name: 'mona/widgets' },
		head_sha: HEAD,
		id: 123,
		run_attempt: 1,
		status: 'completed',
		...overrides,
	};
}

/** A `Visual baseline` run on `main`. */
function baselineRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
	return comparisonRun({
		event: 'push',
		head_branch: 'main',
		head_repository: { full_name: 'octo/widgets' },
		head_sha: BASELINE,
		id: 456,
		...overrides,
	});
}

interface ListedCheckRun {
	conclusion: string | null;
	externalId: string | null;
	title: string;
}

interface Call {
	authorization: string | null;
	body: unknown;
	method: string;
	url: string;
}

/** A stand-in for the GitHub endpoints the worker calls, recording every request. */
function fakeGitHub() {
	const state = {
		/** The account behind the session's user id, or `null` when GitHub answers 404. */
		account: { id: 1, login: 'luke' } as { id: number; login: string } | null,
		baselineRuns: [baselineRun()],
		checkRuns: [checkRun()],
		comments: [
			{ body: 'Looks good', id: 1, user: { login: 'mona' } },
			{
				body: '<!-- luke-ui-visual-review -->\n<!-- visual-review-status -->\n**Status:** Needs review\n<!-- /visual-review-status -->\n3 changed',
				id: 2,
				user: { login: BOT },
			},
		],
		/** The latest comparison on each read, in order, or `'error'` for a 500. The last repeats. */
		comparisons: [comparisonRun()] as Array<WorkflowRun | 'error'>,
		/** The `external_id` a check run write returns, when the publisher wrote in between. */
		externalIdAfterWrite: undefined as string | null | undefined,
		/** The check run that `GET /api/pulls` lists for pull request 5. */
		listedCheckRun: {
			conclusion: 'SUCCESS',
			externalId: checkRun().external_id,
			title: 'Approved by @luke',
		} as ListedCheckRun,
		permission: {
			permission: 'write',
			role_name: 'write',
			user: { id: 1 } as { id: number } | null,
		},
		pull: { head: { sha: HEAD }, state: 'open' },
	};
	const calls: Array<Call> = [];
	let comparisonReads = 0;

	async function fetchStub(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		const request = new Request(input, init);
		const url = new URL(request.url);
		const text = await request.text();
		const body: unknown = text ? JSON.parse(text) : undefined;
		calls.push({
			authorization: request.headers.get('Authorization'),
			body,
			method: request.method,
			url: url.toString(),
		});
		const route = `${request.method} ${url.host}${url.pathname}`;
		const respond = (value: unknown, status = 200) => Response.json(value, { status });
		const permissionRoute = `GET api.github.com/repos/octo/widgets/collaborators/${state.account?.login}/permission`;
		if (state.account && route === permissionRoute) return respond(state.permission);
		switch (route) {
			case 'GET api.github.com/repos/octo/widgets/installation':
				return respond({ id: 7 });
			case 'POST api.github.com/app/installations/7/access_tokens':
				return respond({ expires_at: new Date(NOW + 3_600_000).toISOString(), token: 'ghs_test' });
			case 'GET api.github.com/app':
				return respond({ slug: 'luke-ui-visual-review' });
			case 'POST github.com/login/oauth/access_token':
				return respond({ access_token: 'ghu_test', token_type: 'bearer' });
			case 'GET api.github.com/user':
				return respond({
					avatar_url: 'https://avatars.githubusercontent.com/u/1',
					id: 1,
					login: 'luke',
				});
			case 'GET api.github.com/user/1':
				return state.account ? respond(state.account) : respond({ message: 'Not Found' }, 404);
			case 'GET api.github.com/repos/octo/widgets/pulls/5':
				return respond(state.pull);
			case `GET api.github.com/repos/octo/widgets/commits/${HEAD}/check-runs`:
				return respond({ check_runs: state.checkRuns, total_count: state.checkRuns.length });
			case 'PATCH api.github.com/repos/octo/widgets/check-runs/900':
				return respond({
					...checkRun(),
					conclusion: null,
					external_id: state.externalIdAfterWrite ?? checkRun().external_id,
					...(body as Partial<CheckRun>),
				});
			case 'GET api.github.com/repos/octo/widgets/actions/workflows/visual-regression.yml/runs': {
				const run = state.comparisons[Math.min(comparisonReads, state.comparisons.length - 1)];
				comparisonReads += 1;
				if (run === 'error') return respond({ message: 'Server Error' }, 500);
				return respond({ total_count: run ? 1 : 0, workflow_runs: run ? [run] : [] });
			}
			case 'GET api.github.com/repos/octo/widgets/actions/workflows/visual-baseline.yml/runs':
				return respond({
					total_count: state.baselineRuns.length,
					workflow_runs: state.baselineRuns,
				});
			case 'GET api.github.com/repos/octo/widgets/issues/5/comments':
				return respond(state.comments);
			case 'PATCH api.github.com/repos/octo/widgets/issues/comments/2':
				return respond({ id: 2, ...(body as object) });
			case 'POST api.github.com/graphql':
				return respond(graphqlPulls(state.listedCheckRun));
			default:
				throw new Error(`Unexpected request: ${route}`);
		}
	}

	return { calls, fetch: fetchStub, state };
}

function graphqlPulls(listed: ListedCheckRun) {
	const run = checkRun();
	return {
		data: {
			repository: {
				pullRequests: {
					nodes: [
						{
							author: { login: 'mona' },
							commits: {
								nodes: [
									{
										commit: {
											checkSuites: {
												nodes: [
													{
														checkRuns: {
															nodes: [{ ...listed, databaseId: run.id, url: run.html_url }],
														},
													},
												],
											},
											oid: HEAD,
										},
									},
								],
							},
							headRefName: 'button-padding',
							headRefOid: HEAD,
							isDraft: false,
							number: 5,
							title: 'Tighten button padding',
							url: 'https://github.com/octo/widgets/pull/5',
						},
						{
							author: null,
							commits: { nodes: [{ commit: { checkSuites: { nodes: [] }, oid: 'c'.repeat(40) } }] },
							headRefName: 'docs',
							headRefOid: 'c'.repeat(40),
							isDraft: true,
							number: 6,
							title: 'Docs',
							url: 'https://github.com/octo/widgets/pull/6',
						},
					],
				},
			},
		},
	};
}

function setup() {
	const github = fakeGitHub();
	const handle = createHandler({ fetch: github.fetch, now: () => NOW });
	return { github, handle };
}

function sessionToken(login = 'luke'): Promise<string> {
	return signToken(SECRET, 'vr_session', {
		avatarUrl: 'https://avatars.githubusercontent.com/u/1',
		exp: NOW / 1000 + 3600,
		id: 1,
		login,
	});
}

interface DecisionOptions {
	contentType?: string;
	cookie?: string | null;
	origin?: string;
}

async function decisionRequest(
	body: Record<string, unknown>,
	{ contentType = 'application/json', cookie, origin = ORIGIN }: DecisionOptions = {},
): Promise<Request> {
	const headers = new Headers({ 'Content-Type': contentType, Origin: origin });
	const session = cookie === undefined ? await sessionToken() : cookie;
	if (session !== null) headers.set('Cookie', `vr_session=${session}`);
	return new Request(`${ORIGIN}/api/pulls/5/decision`, {
		body: JSON.stringify(body),
		headers,
		method: 'POST',
	});
}

const APPROVE = { decision: 'approve', headSha: HEAD, runAttempt: 1, runId: 123 };

function setCookies(response: Response): Array<string> {
	return response.headers.getSetCookie();
}

function patches(calls: Array<Call>): Array<Call> {
	return calls.filter((call) => call.method === 'PATCH');
}

describe('configuration', () => {
	for (const path of ['/api/session', '/api/pulls', '/api/unknown']) {
		test(`answers ${path} as unconfigured without every secret`, async () => {
			const { handle } = setup();
			const response = await handle(new Request(`${ORIGIN}${path}`), {
				...env,
				SESSION_SECRET: 'too short',
			});
			expect(response.status).toBe(503);
			expect(await response.json()).toMatchObject({ error: 'unconfigured' });
		});
	}

	test('sends JSON that browsers must not sniff', async () => {
		const { handle } = setup();
		const response = await handle(new Request(`${ORIGIN}/api/session`), env);
		expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('Cache-Control')).toBe('no-store');
	});
});

describe('sign-in', () => {
	async function startLogin(handle: ReturnType<typeof setup>['handle']) {
		const response = await handle(new Request(`${ORIGIN}/api/auth/login?return=/?pr=5`), env);
		const location = new URL(response.headers.get('Location') ?? '');
		const [cookie = ''] = setCookies(response);
		const value = /^vr_login=([^;]+)/.exec(cookie)?.[1];
		return { cookie, location, response, value };
	}

	test('login redirects to GitHub with PKCE and a state', async () => {
		const { handle } = setup();
		const { cookie, location, response, value } = await startLogin(handle);

		expect(response.status).toBe(302);
		expect(`${location.origin}${location.pathname}`).toBe(
			'https://github.com/login/oauth/authorize',
		);
		expect(location.searchParams.get('client_id')).toBe('Iv23.client');
		expect(location.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/api/auth/callback`);
		expect(location.searchParams.get('code_challenge_method')).toBe('S256');
		expect(cookie).toContain('Path=/api/auth; HttpOnly; Secure; SameSite=Lax');

		const stored = await verifyToken(SECRET, 'vr_login', value, NOW / 1000);
		expect(stored).toMatchObject({ exp: NOW / 1000 + 600, return: '/?pr=5' });
		expect(location.searchParams.get('state')).toBe(stored?.state);
		expect(location.searchParams.get('code_challenge')).toBe(
			await pkceChallenge(String(stored?.verifier)),
		);
	});

	test('login refuses a return path on another site', async () => {
		const { handle } = setup();
		const response = await handle(
			new Request(`${ORIGIN}/api/auth/login?return=//evil.example`),
			env,
		);
		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: 'invalid' });
	});

	test('callback exchanges the code, starts a session and returns', async () => {
		const { github, handle } = setup();
		const { location, value } = await startLogin(handle);
		const state = location.searchParams.get('state') ?? '';
		const stored = await verifyToken(SECRET, 'vr_login', value, NOW / 1000);

		const response = await handle(
			new Request(`${ORIGIN}/api/auth/callback?code=abc123&state=${state}`, {
				headers: { Cookie: `vr_login=${value}` },
			}),
			env,
		);

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(`${ORIGIN}/?pr=5`);
		const [clearLogin, session = ''] = setCookies(response);
		expect(clearLogin).toMatch(/^vr_login=; Max-Age=0; Path=\/api\/auth;/);
		expect(session).toMatch(
			/^vr_session=[^;]+; Max-Age=28800; Path=\/; HttpOnly; Secure; SameSite=Strict$/,
		);
		expect(session).not.toContain('ghu_test');

		const exchange = github.calls.find((call) => call.url.endsWith('/login/oauth/access_token'));
		expect(exchange?.body).toEqual({
			client_id: 'Iv23.client',
			client_secret: 'client-secret',
			code: 'abc123',
			code_verifier: stored?.verifier,
			redirect_uri: `${ORIGIN}/api/auth/callback`,
		});
		const user = github.calls.find((call) => call.url === 'https://api.github.com/user');
		expect(user?.authorization).toBe('Bearer ghu_test');

		const sessionValue = /^vr_session=([^;]+)/.exec(session)?.[1];
		const me = await handle(
			new Request(`${ORIGIN}/api/session`, { headers: { Cookie: `vr_session=${sessionValue}` } }),
			env,
		);
		expect(await me.json()).toEqual({
			canReview: true,
			user: { avatarUrl: 'https://avatars.githubusercontent.com/u/1', login: 'luke' },
		});
	});

	test('callback rejects a state that does not match the login', async () => {
		const { github, handle } = setup();
		const { value } = await startLogin(handle);

		const response = await handle(
			new Request(`${ORIGIN}/api/auth/callback?code=abc123&state=forged`, {
				headers: { Cookie: `vr_login=${value}` },
			}),
			env,
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ error: 'invalid' });
		expect(setCookies(response)).toEqual([
			'vr_login=; Max-Age=0; Path=/api/auth; HttpOnly; Secure; SameSite=Lax',
		]);
		expect(github.calls.some((call) => call.url.includes('/login/oauth/'))).toBe(false);
	});

	test('logout clears the session', async () => {
		const { handle } = setup();
		const response = await handle(
			new Request(`${ORIGIN}/api/auth/logout`, {
				body: '{}',
				headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
				method: 'POST',
			}),
			env,
		);
		expect(response.status).toBe(204);
		expect(setCookies(response)).toEqual([
			'vr_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict',
		]);
	});
});

describe('session', () => {
	test('is empty without a cookie', async () => {
		const { handle } = setup();
		const response = await handle(new Request(`${ORIGIN}/api/session`), env);
		expect(await response.json()).toEqual({ user: null });
	});

	test('is empty, and clears the cookie, when the cookie was tampered with', async () => {
		const { handle } = setup();
		const token = await sessionToken();
		const response = await handle(
			new Request(`${ORIGIN}/api/session`, { headers: { Cookie: `vr_session=x${token}` } }),
			env,
		);
		expect(await response.json()).toEqual({ user: null });
		expect(setCookies(response)[0]).toMatch(/^vr_session=; Max-Age=0;/);
	});

	test('cannot review with read access', async () => {
		const { github, handle } = setup();
		github.state.permission = {
			...github.state.permission,
			permission: 'read',
			role_name: 'triage',
		};
		const response = await handle(
			new Request(`${ORIGIN}/api/session`, {
				headers: { Cookie: `vr_session=${await sessionToken()}` },
			}),
			env,
		);
		expect(await response.json()).toMatchObject({ canReview: false, user: { login: 'luke' } });
	});

	test('checks the permission of the account behind the session user id', async () => {
		const { github, handle } = setup();
		github.state.account = { id: 1, login: 'luke-renamed' };
		const response = await handle(
			new Request(`${ORIGIN}/api/session`, {
				headers: { Cookie: `vr_session=${await sessionToken()}` },
			}),
			env,
		);
		expect(await response.json()).toMatchObject({ canReview: true });
		expect(github.calls.map((call) => new URL(call.url).pathname)).toContain(
			'/repos/octo/widgets/collaborators/luke-renamed/permission',
		);
	});

	test('cannot review when the permission belongs to another account', async () => {
		const { github, handle } = setup();
		github.state.permission = { ...github.state.permission, user: { id: 2 } };
		const response = await handle(
			new Request(`${ORIGIN}/api/session`, {
				headers: { Cookie: `vr_session=${await sessionToken()}` },
			}),
			env,
		);
		expect(await response.json()).toMatchObject({ canReview: false });
	});
});

describe('pull requests', () => {
	test('lists open pull requests with their reviews, through the cache', async () => {
		const { github } = setup();
		const store = new Map<string, Response>();
		const cache: ResponseCache = {
			match: async (request) => store.get(request.url)?.clone(),
			put: async (request, response) => {
				store.set(request.url, response);
			},
		};
		const handle = createHandler({ cache, fetch: github.fetch, now: () => NOW });

		const response = await handle(new Request(`${ORIGIN}/api/pulls`), env);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
		expect(await response.json()).toEqual({
			pulls: [
				{
					author: 'mona',
					draft: false,
					headRef: 'button-padding',
					headSha: HEAD,
					number: 5,
					review: {
						baselineRunAttempt: 1,
						baselineRunId: 456,
						baselineSha: BASELINE,
						checkUrl: 'https://github.com/octo/widgets/runs/900',
						decidedBy: 'luke',
						headSha: HEAD,
						kind: 'review',
						reasons: ['visual'],
						runAttempt: 1,
						runId: 123,
						state: 'approved',
					},
					title: 'Tighten button padding',
					url: 'https://github.com/octo/widgets/pull/5',
				},
				{
					author: null,
					draft: true,
					headRef: 'docs',
					headSha: 'c'.repeat(40),
					number: 6,
					review: null,
					title: 'Docs',
					url: 'https://github.com/octo/widgets/pull/6',
				},
			],
		});
		const graphql = github.calls.find((call) => call.url.endsWith('/graphql'));
		expect(graphql?.authorization).toBe('Bearer ghs_test');
		expect(graphql?.body).toMatchObject({
			variables: { appId: 42, name: 'widgets', owner: 'octo' },
		});

		await handle(new Request(`${ORIGIN}/api/pulls`), env);
		expect(github.calls.filter((call) => call.url.endsWith('/graphql'))).toHaveLength(1);
	});

	test('lists a comparison in progress as comparing', async () => {
		const { github, handle } = setup();
		github.state.listedCheckRun = {
			conclusion: null,
			externalId: checkRun({
				baselineRunId: null,
				baselineSha: null,
				kind: 'pending',
				reasons: [],
				runAttempt: 2,
			}).external_id,
			title: 'Comparing',
		};
		const response = await handle(new Request(`${ORIGIN}/api/pulls`), env);
		const { pulls } = (await response.json()) as { pulls: Array<{ review: unknown }> };
		expect(pulls[0]?.review).toMatchObject({
			decidedBy: null,
			kind: 'pending',
			runAttempt: 2,
			state: 'comparing',
		});
	});

	test('reads the review of the head commit', async () => {
		const { github, handle } = setup();
		const response = await handle(new Request(`${ORIGIN}/api/pulls/5/review`), env);
		expect(await response.json()).toMatchObject({
			headSha: HEAD,
			review: { runId: 123, state: 'needs-review' },
		});
		const list = github.calls.find((call) => call.url.includes('/check-runs?'));
		expect(new URL(list?.url ?? '').searchParams.get('check_name')).toBe('visual-review');
	});

	test('refuses a pull request number that is not a positive integer', async () => {
		const { handle } = setup();
		const response = await handle(new Request(`${ORIGIN}/api/pulls/0/review`), env);
		expect(response.status).toBe(400);
	});
});

describe('decisions', () => {
	test('approve completes the check run and updates the comment', async () => {
		const { github, handle } = setup();
		const response = await handle(await decisionRequest(APPROVE), env);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			review: expect.objectContaining({ decidedBy: 'luke', runId: 123, state: 'approved' }),
		});
		const [checkPatch, commentPatch] = patches(github.calls);
		expect(checkPatch?.body).toEqual({
			completed_at: '2026-11-16T03:40:00.000Z',
			conclusion: 'success',
			output: {
				summary: '**Status:** Approved by @luke\n\n| Changed | 3 |',
				text: '### History\n\n- 2026-11-16 03:40 UTC · Approved by @luke\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review',
				title: 'Approved by @luke',
			},
			status: 'completed',
		});
		expect(commentPatch?.url).toBe('https://api.github.com/repos/octo/widgets/issues/comments/2');
		expect(commentPatch?.body).toEqual({
			body: '<!-- luke-ui-visual-review -->\n<!-- visual-review-status -->\n**Status:** Approved by @luke\n<!-- /visual-review-status -->\n3 changed',
		});
	});

	test('request changes records the note', async () => {
		const { github, handle } = setup();
		const response = await handle(
			await decisionRequest({
				...APPROVE,
				decision: 'request-changes',
				note: ' The focus\nring  is clipped ',
			}),
			env,
		);

		expect(await response.json()).toMatchObject({
			review: { decidedBy: 'luke', state: 'changes-requested' },
		});
		expect(patches(github.calls)[0]?.body).toMatchObject({
			conclusion: 'failure',
			output: {
				text: expect.stringContaining(
					'- 2026-11-16 03:40 UTC · Changes requested by @luke: The focus ring is clipped\n',
				),
				title: 'Changes requested by @luke',
			},
		});
	});

	test('request changes needs a note', async () => {
		const { github, handle } = setup();
		const response = await handle(
			await decisionRequest({ ...APPROVE, decision: 'request-changes', note: '   ' }),
			env,
		);
		expect(response.status).toBe(400);
		expect(patches(github.calls)).toEqual([]);
	});

	test('checks the comparison and the baseline against GitHub Actions', async () => {
		const { github, handle } = setup();
		await handle(await decisionRequest(APPROVE), env);
		const query = (workflow: string) =>
			github.calls
				.filter((call) => call.url.includes(`/workflows/${workflow}/runs?`))
				.map((call) => Object.fromEntries(new URL(call.url).searchParams));
		// The latest comparison is read before and after the decision is written.
		expect(query('visual-regression.yml')).toEqual([
			{ event: 'pull_request', head_sha: HEAD, per_page: '1' },
			{ event: 'pull_request', head_sha: HEAD, per_page: '1' },
		]);
		expect(query('visual-baseline.yml')).toEqual([
			{ branch: 'main', per_page: '100', status: 'success' },
		]);
		const token = github.calls.find((call) => call.url.endsWith('/access_tokens'));
		expect(token?.body).toEqual({
			permissions: { actions: 'read', checks: 'write', metadata: 'read', pull_requests: 'write' },
			repositories: ['widgets'],
		});
	});

	test('names the reviewer by their current login after a rename', async () => {
		const { github, handle } = setup();
		github.state.account = { id: 1, login: 'luke-renamed' };
		const response = await handle(
			await decisionRequest(APPROVE, { cookie: await sessionToken('luke') }),
			env,
		);
		expect(await response.json()).toMatchObject({
			review: { decidedBy: 'luke-renamed', state: 'approved' },
		});
		expect(patches(github.calls)[0]?.body).toMatchObject({
			output: { title: 'Approved by @luke-renamed' },
		});
	});

	test('ignores a baseline run from a fork branch called main', async () => {
		const { github, handle } = setup();
		github.state.baselineRuns = [
			baselineRun({
				event: 'workflow_dispatch',
				head_repository: { full_name: 'mona/widgets' },
				head_sha: 'e'.repeat(40),
				id: 457,
			}),
			baselineRun(),
		];
		const response = await handle(await decisionRequest(APPROVE), env);
		expect(response.status).toBe(200);
	});

	test('returns the check run to pending when a re-run starts during the decision', async () => {
		const { github, handle } = setup();
		github.state.comparisons = [
			comparisonRun(),
			comparisonRun({ conclusion: null, run_attempt: 2, status: 'queued' }),
		];
		const response = await handle(await decisionRequest(APPROVE), env);

		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({ error: 'stale' });
		const [decision, pending, comment] = patches(github.calls);
		expect(decision?.body).toMatchObject({ conclusion: 'success', status: 'completed' });
		expect(pending?.url).toBe('https://api.github.com/repos/octo/widgets/check-runs/900');
		// GitHub ignores `in_progress` on a completed check run, so pending stays completed.
		expect(pending?.body).toEqual({
			completed_at: '2026-11-16T03:40:00.000Z',
			conclusion: 'action_required',
			external_id: JSON.stringify({
				baselineRunAttempt: null,
				baselineRunId: null,
				baselineSha: null,
				kind: 'pending',
				reasons: [],
				runAttempt: 2,
				runId: 123,
				v: 1,
			}),
			output: {
				summary: '**Status:** Comparing\n',
				text: '### History\n\n- 2026-11-16 03:40 UTC · Comparison run 123 (attempt 2) started\n- 2026-11-16 03:40 UTC · Approved by @luke\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review',
				title: 'Comparing',
			},
			status: 'completed',
		});
		expect(comment?.body).toEqual({
			body: '<!-- luke-ui-visual-review -->\n<!-- visual-review-status -->\n**Status:** Comparing\n<!-- /visual-review-status -->\n3 changed',
		});
	});

	test('undoes the decision when the comparison cannot be read again', async () => {
		const { github, handle } = setup();
		github.state.comparisons = [comparisonRun(), 'error'];
		const response = await handle(await decisionRequest(APPROVE), env);

		expect(response.status).toBe(502);
		expect(await response.json()).toMatchObject({ error: 'upstream' });
		const [decision, undo, ...rest] = patches(github.calls);
		expect(decision?.body).toMatchObject({ conclusion: 'success', status: 'completed' });
		expect(undo?.body).toEqual({
			completed_at: '2026-11-16T03:40:00.000Z',
			conclusion: 'action_required',
			output: {
				summary: '**Status:** Needs review\n\n| Changed | 3 |',
				text: '### History\n\n- 2026-11-16 03:40 UTC · Decision by @luke undone: the comparison could not be checked\n- 2026-11-16 03:40 UTC · Approved by @luke\n- 2026-11-16 03:22 UTC · Comparison run 123 (attempt 1): needs review',
				title: 'Needs review: 3 changed',
			},
			status: 'completed',
		});
		// The comment never showed the decision, so it is left alone.
		expect(rest).toEqual([]);
	});

	test('returns the check run to pending when the publisher wrote during the decision', async () => {
		const { github, handle } = setup();
		// The write's response shows the publisher already marked a re-run as started.
		github.state.externalIdAfterWrite = checkRun({
			baselineRunAttempt: null,
			baselineRunId: null,
			baselineSha: null,
			kind: 'pending',
			reasons: [],
			runAttempt: 2,
		}).external_id;
		const response = await handle(await decisionRequest(APPROVE), env);

		expect(response.status).toBe(409);
		expect(await response.json()).toMatchObject({ error: 'stale' });
		const [, pending] = patches(github.calls);
		expect(pending?.body).toMatchObject({
			conclusion: 'action_required',
			external_id: github.state.externalIdAfterWrite,
			output: { summary: '**Status:** Comparing\n', title: 'Comparing' },
		});
		// The repair does not wait for the runs list to show the re-run.
		const comparisonReads = github.calls.filter((call) =>
			call.url.includes('/visual-regression.yml/runs'),
		);
		expect(comparisonReads).toHaveLength(1);
	});

	test('returns the check run to pending for the latest comparison when the write loses its external id', async () => {
		const { github, handle } = setup();
		github.state.externalIdAfterWrite = 'legacy';
		const response = await handle(await decisionRequest(APPROVE), env);

		expect(response.status).toBe(409);
		const [, pending] = patches(github.calls);
		const written = pending?.body as { external_id?: string } | undefined;
		expect(JSON.parse(String(written?.external_id))).toMatchObject({
			kind: 'pending',
			runAttempt: 1,
			runId: 123,
		});
	});

	test('keeps confirming the decision after the response through waitUntil', async () => {
		const { github, handle } = setup();
		github.state.comparisons = [
			comparisonRun(),
			comparisonRun({ conclusion: null, run_attempt: 2, status: 'queued' }),
		];
		const pending: Array<Promise<unknown>> = [];
		const response = await handle(await decisionRequest(APPROVE), env, {
			waitUntil: (promise) => pending.push(promise),
		});

		expect(response.status).toBe(409);
		expect(pending).toHaveLength(1);
		// The registered promise settles without rejecting, so the runtime never reports it.
		await expect(pending[0]).resolves.toBeUndefined();
		expect(patches(github.calls)[1]?.body).toMatchObject({ conclusion: 'action_required' });
	});

	test('reuses the installation token across requests', async () => {
		const { github, handle } = setup();
		await handle(await decisionRequest(APPROVE), env);
		await handle(await decisionRequest(APPROVE), env);
		expect(github.calls.filter((call) => call.url.endsWith('/access_tokens'))).toHaveLength(1);
	});

	const refusals: Array<{
		code: string;
		name: string;
		prepare?: (github: ReturnType<typeof fakeGitHub>) => void;
		request: () => Promise<Request>;
		status: number;
	}> = [
		{
			code: 'unauthenticated',
			name: 'without a session',
			request: () => decisionRequest(APPROVE, { cookie: null }),
			status: 401,
		},
		{
			code: 'bad-origin',
			name: 'from another origin',
			request: () =>
				decisionRequest(APPROVE, { origin: 'https://pr-5.luke-ui-visual-review.pages.dev' }),
			status: 403,
		},
		{
			code: 'invalid',
			name: 'sent as a form',
			request: () => decisionRequest(APPROVE, { contentType: 'application/x-www-form-urlencoded' }),
			status: 400,
		},
		{
			code: 'invalid',
			name: 'with a malformed head sha',
			request: () => decisionRequest({ ...APPROVE, headSha: 'HEAD' }),
			status: 400,
		},
		{
			code: 'forbidden',
			name: 'from an account without write access',
			prepare: (github) => {
				github.state.permission = {
					...github.state.permission,
					permission: 'read',
					role_name: 'read',
				};
			},
			request: () => decisionRequest(APPROVE),
			status: 403,
		},
		{
			code: 'forbidden',
			name: 'when the permission belongs to another account',
			prepare: (github) => {
				github.state.permission = { ...github.state.permission, user: { id: 2 } };
			},
			request: () => decisionRequest(APPROVE),
			status: 403,
		},
		{
			code: 'forbidden',
			name: 'when the session user id no longer exists',
			prepare: (github) => {
				github.state.account = null;
			},
			request: () => decisionRequest(APPROVE),
			status: 403,
		},
		{
			code: 'not-found',
			name: 'on a closed pull request',
			prepare: (github) => {
				github.state.pull = { ...github.state.pull, state: 'closed' };
			},
			request: () => decisionRequest(APPROVE),
			status: 404,
		},
		{
			code: 'stale',
			name: 'for a head commit that moved on',
			prepare: (github) => {
				github.state.pull = { head: { sha: 'd'.repeat(40) }, state: 'open' };
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'not-found',
			name: 'without a check run from the App',
			prepare: (github) => {
				github.state.checkRuns = [{ ...checkRun(), app: { id: 99 } }];
			},
			request: () => decisionRequest(APPROVE),
			status: 404,
		},
		{
			code: 'stale',
			name: 'for an earlier comparison run',
			prepare: (github) => {
				github.state.checkRuns = [checkRun({ runAttempt: 2 })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'not-reviewable',
			name: 'on a clean comparison',
			prepare: (github) => {
				github.state.checkRuns = [checkRun({ kind: 'clean' })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'not-reviewable',
			name: 'while the comparison is pending',
			prepare: (github) => {
				const pending = checkRun({ baselineRunId: null, baselineSha: null, kind: 'pending' });
				github.state.checkRuns = [{ ...pending, conclusion: null, status: 'in_progress' }];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'not-reviewable',
			name: 'on a check run that is not complete',
			prepare: (github) => {
				github.state.checkRuns = [{ ...checkRun(), conclusion: null, status: 'in_progress' }];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'unverified-baseline',
			name: 'on a comparison without a verified baseline',
			prepare: (github) => {
				github.state.checkRuns = [checkRun({ baselineRunId: null, baselineSha: null })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'unverified-baseline',
			name: 'on a comparison without a baseline attempt',
			prepare: (github) => {
				github.state.checkRuns = [checkRun({ baselineRunAttempt: null })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'stale-baseline',
			name: 'when the baseline run was re-run',
			prepare: (github) => {
				github.state.baselineRuns = [baselineRun({ run_attempt: 2 })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'stale-baseline',
			name: 'when a newer baseline succeeded',
			prepare: (github) => {
				github.state.baselineRuns = [
					baselineRun({ head_sha: 'e'.repeat(40), id: 457 }),
					baselineRun(),
				];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'stale',
			name: 'when a re-run superseded the comparison',
			prepare: (github) => {
				github.state.comparisons = [
					comparisonRun({ conclusion: null, run_attempt: 2, status: 'queued' }),
				];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
		{
			code: 'stale',
			name: 'when the comparison run failed',
			prepare: (github) => {
				github.state.comparisons = [comparisonRun({ conclusion: 'failure' })];
			},
			request: () => decisionRequest(APPROVE),
			status: 409,
		},
	];
	for (const refusal of refusals) {
		test(`refuses a decision ${refusal.name}`, async () => {
			const { github, handle } = setup();
			refusal.prepare?.(github);
			const response = await handle(await refusal.request(), env);
			expect(response.status).toBe(refusal.status);
			expect(await response.json()).toMatchObject({ error: refusal.code });
			expect(patches(github.calls)).toEqual([]);
		});
	}
});
