import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, open, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import type {
	IssueComment,
	PublishedMeta,
	PublishedResult,
	PublishedSummary,
	PullRequestCandidate,
} from './visual-review.js';
import {
	COMMENT_MARKER,
	commentMarkdown,
	decideCommentAction,
	decidePublish,
	findStickyComment,
	MAX_IMAGE_BYTES,
	MAX_PUBLISHED_BYTES,
	MAX_PUBLISHED_FILES,
	MAX_SUMMARY_BYTES,
	parseArtifactSummary,
	parseMeta,
	prepareSite,
} from './visual-review.js';

const HEAD_SHA = 'a'.repeat(40);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

const meta: PublishedMeta = {
	generatedAt: '2026-01-02T03:04:05.000Z',
	headSha: HEAD_SHA,
	pullRequest: 12,
	runAttempt: 2,
	runId: 345,
};

const artifactCounts = { added: 0, changed: 0, removed: 0, unchanged: 0 };

function artifactSummary(results: Array<unknown>, extra: Record<string, unknown> = {}): string {
	return JSON.stringify({ counts: artifactCounts, results, ...extra });
}

/** Writes an artefact directory with `summary.json` and the given files, relative to its root. */
async function createArtifact(summary: string, files: Record<string, Buffer | string> = {}) {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-review-'));
	const artifactDir = path.join(root, 'artifact');
	await mkdir(artifactDir);
	await writeFile(path.join(artifactDir, 'summary.json'), summary);
	await Promise.all(
		Object.entries(files).map(async ([file, content]) => {
			const target = path.join(artifactDir, ...file.split('/'));
			await mkdir(path.dirname(target), { recursive: true });
			await writeFile(target, content);
		}),
	);
	return { artifactDir, outDir: path.join(root, 'deploy', 'site'), root };
}

async function listFiles(directory: string): Promise<Array<string>> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true });
	return entries
		.filter((entry) => !entry.isDirectory())
		.map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)))
		.map((file) => file.split(path.sep).join('/'))
		.toSorted();
}

const pull = (
	number: number,
	sha: string,
	repository: string | null = 'luke/luke-ui',
): PullRequestCandidate => ({
	head: { repo: repository === null ? null : { full_name: repository }, sha },
	number,
});

const run = { event: 'pull_request', headRepository: 'luke/luke-ui', headSha: HEAD_SHA };

test('publishes to the open pull request whose head is exactly the run commit', () => {
	const decision = decidePublish(run, [pull(7, 'b'.repeat(40)), pull(12, HEAD_SHA)]);
	expect(decision).toEqual({ number: 12, publish: true });
});

test('does not publish a stale run whose commit is no longer the pull request head', () => {
	const decision = decidePublish(run, [pull(12, 'b'.repeat(40))]);
	expect(decision.publish).toBe(false);
	expect(!decision.publish && decision.reason).toContain('stale');
});

test('does not publish when the pull request has closed', () => {
	expect(decidePublish(run, []).publish).toBe(false);
});

test('does not match a pull request whose head lives in another repository', () => {
	// Same branch name and commit, but the pull request comes from a different fork.
	expect(decidePublish(run, [pull(12, HEAD_SHA, 'mallory/luke-ui')]).publish).toBe(false);
	expect(decidePublish(run, [pull(12, HEAD_SHA, null)]).publish).toBe(false);
});

test('matches a fork pull request by the fork repository', () => {
	const forkRun = { ...run, headRepository: 'contributor/luke-ui' };
	const decision = decidePublish(forkRun, [
		pull(3, HEAD_SHA, 'luke/luke-ui'),
		pull(4, HEAD_SHA, 'contributor/luke-ui'),
	]);
	expect(decision).toEqual({ number: 4, publish: true });
});

for (const number of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN, '12\npublish=true']) {
	test(`does not publish for the pull request number ${JSON.stringify(number)}`, () => {
		// The API response is typed, not validated, so the number is checked before it is written.
		const candidate = { ...pull(12, HEAD_SHA), number: number as number };
		const decision = decidePublish(run, [candidate]);
		expect(decision.publish).toBe(false);
		expect(!decision.publish && decision.reason).toContain('invalid pull request number');
	});
}

for (const event of ['push', 'workflow_dispatch', '']) {
	test(`does not publish a run triggered by ${JSON.stringify(event)}`, () => {
		const decision = decidePublish({ ...run, event }, [pull(12, HEAD_SHA)]);
		expect(decision.publish).toBe(false);
		expect(!decision.publish && decision.reason).toContain('not a pull request');
	});
}

test('keeps only differing results, sorted by id, with the viewer fields alone', () => {
	const parsed = parseArtifactSummary(
		JSON.stringify({
			counts: { added: 99, changed: 99, removed: 99, unchanged: 40 },
			results: [
				{ id: 'text/sizes', status: 'removed', expected: '/work/diff/text/sizes.expected.png' },
				{ id: 'button/idle', status: 'unchanged' },
				{
					actual: '/work/diff/button/hover.actual.png',
					actualViewport: '1280x900',
					diff: '/work/diff/button/hover.diff.png',
					expected: '/work/diff/button/hover.expected.png',
					expectedViewport: '1280x720',
					height: 200,
					id: 'button/hover',
					mismatchedPixels: 42,
					somethingElse: '<script>',
					status: 'changed',
					width: 100,
				},
			],
		}),
	);

	expect(parsed).toEqual({
		results: [
			{
				actualViewport: '1280x900',
				expectedViewport: '1280x720',
				height: 200,
				id: 'button/hover',
				mismatchedPixels: 42,
				status: 'changed',
				width: 100,
			},
			{ id: 'text/sizes', status: 'removed' },
		],
		unchanged: 40,
	});
});

for (const id of [
	'../../etc/passwd',
	'button/../../../etc/passwd',
	'../outside',
	'/etc/passwd',
	'button/hover/extra',
	'button',
	'button\\hover',
	'button/hover.actual',
	'Button/Hover',
	'button/hover\u0000',
	'button/-hover',
	'',
	42,
]) {
	test(`rejects the capture id ${JSON.stringify(id)}`, () => {
		expect(() => parseArtifactSummary(artifactSummary([{ id, status: 'changed' }]))).toThrow(
			/not a valid capture id/,
		);
	});
}

test('rejects duplicate capture ids', () => {
	const results = [
		{ id: 'button/hover', status: 'changed' },
		{ id: 'button/hover', status: 'unchanged' },
	];
	expect(() => parseArtifactSummary(artifactSummary(results))).toThrow(/Duplicate capture id/);
});

for (const status of ['modified', '', undefined, 1]) {
	test(`rejects the unknown status ${JSON.stringify(status)}`, () => {
		expect(() => parseArtifactSummary(artifactSummary([{ id: 'button/hover', status }]))).toThrow(
			/not a known status/,
		);
	});
}

for (const [field, value] of [
	['width', -1],
	['width', 1.5],
	['height', '200'],
	['height', null],
	['mismatchedPixels', Number.MAX_SAFE_INTEGER + 1],
	['expectedViewport', '1280x720; rm -rf'],
	['expectedViewport', '1280'],
	['actualViewport', '123456x1'],
	['actualViewport', 1280],
] as const) {
	test(`rejects ${field} ${JSON.stringify(value)}`, () => {
		const result = { id: 'button/hover', status: 'changed', [field]: value };
		expect(() => parseArtifactSummary(artifactSummary([result]))).toThrow(field);
	});
}

test('rejects a non-finite numeric field', () => {
	// JSON cannot carry Infinity, so 1e999 is how a hostile file would smuggle one in.
	const raw = `{"counts":{"unchanged":0},"results":[{"id":"button/hover","status":"changed","width":1e999}]}`;
	expect(() => parseArtifactSummary(raw)).toThrow(/width/);
});

for (const unchanged of [-1, 1.5, '3', undefined]) {
	test(`rejects the unchanged count ${JSON.stringify(unchanged)}`, () => {
		const raw = JSON.stringify({ counts: { unchanged }, results: [] });
		expect(() => parseArtifactSummary(raw)).toThrow(/counts\.unchanged/);
	});
}

for (const raw of ['', 'not json', '[]', 'null', '{"counts":{"unchanged":0}}', '{"results":[]}']) {
	test(`rejects the malformed summary ${JSON.stringify(raw)}`, () => {
		expect(() => parseArtifactSummary(raw)).toThrow(/summary\.json/);
	});
}

test('rejects an oversized summary before parsing it', () => {
	const raw = artifactSummary([], { padding: 'x'.repeat(MAX_SUMMARY_BYTES) });
	expect(() => parseArtifactSummary(raw)).toThrow(/larger than/);
});

test('reads run metadata from the environment', () => {
	const parsed = parseMeta(
		{ HEAD_SHA, PR_NUMBER: '12', RUN_ATTEMPT: '2', RUN_ID: '345' },
		() => new Date(meta.generatedAt),
	);
	expect(parsed).toEqual(meta);
});

for (const [name, value] of [
	['PR_NUMBER', '0'],
	['PR_NUMBER', '12; echo'],
	['PR_NUMBER', undefined],
	['RUN_ID', '-3'],
	['RUN_ATTEMPT', '1.5'],
	['HEAD_SHA', 'abc123'],
	['HEAD_SHA', `${'a'.repeat(39)}G`],
] as const) {
	test(`rejects ${name}=${JSON.stringify(value)}`, () => {
		const env = { HEAD_SHA, PR_NUMBER: '12', RUN_ATTEMPT: '2', RUN_ID: '345', [name]: value };
		expect(() => parseMeta(env)).toThrow(name);
	});
}

test('publishes the rewritten summary and exactly the images each status implies', async () => {
	const { artifactDir, outDir } = await createArtifact(
		JSON.stringify({
			counts: { added: 1, changed: 1, removed: 1, unchanged: 7 },
			results: [
				{ id: 'text/sizes', status: 'removed' },
				{ id: 'button/idle', status: 'unchanged' },
				{ id: 'button/hover', mismatchedPixels: 3, status: 'changed' },
				{ id: 'card/new', status: 'added' },
			],
		}),
		{
			'diff/button/hover.actual.png': PNG,
			'diff/button/hover.diff.png': PNG,
			'diff/button/hover.expected.png': PNG,
			// Present in the artefact, but an unchanged or added result does not imply them.
			'diff/button/idle.actual.png': PNG,
			'diff/card/new.actual.png': PNG,
			'diff/card/new.diff.png': PNG,
			'diff/text/sizes.expected.png': PNG,
		},
	);

	const summary = await prepareSite({ artifactDir, meta, outDir });

	expect(await listFiles(outDir)).toEqual([
		'diff/button/hover.actual.png',
		'diff/button/hover.diff.png',
		'diff/button/hover.expected.png',
		'diff/card/new.actual.png',
		'diff/text/sizes.expected.png',
		'summary.json',
	]);
	expect(await readFile(path.join(outDir, 'diff/card/new.actual.png'))).toEqual(PNG);
	expect(summary).toEqual({
		schemaVersion: 1,
		meta,
		counts: { added: 1, changed: 1, removed: 1, unchanged: 7 },
		results: [
			{ id: 'button/hover', mismatchedPixels: 3, status: 'changed' },
			{ id: 'card/new', status: 'added' },
			{ id: 'text/sizes', status: 'removed' },
		],
	});
	expect(JSON.parse(await readFile(path.join(outDir, 'summary.json'), 'utf8'))).toEqual(summary);
});

test('never publishes Pages control files or anything else the artefact carries', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
		{
			_headers: '/*\n  Access-Control-Allow-Origin: https://evil.example\n',
			_redirects: '/* https://evil.example 302\n',
			'_routes.json': '{"version":1,"include":["/*"],"exclude":[]}',
			'_worker.js': 'export default { fetch() { return new Response("owned"); } };',
			'diff/_worker.js': 'export default {};',
			'diff/card/index.html': '<script>alert(1)</script>',
			'diff/card/new.actual.png': PNG,
			'functions/_middleware.js': 'export const onRequest = () => new Response("owned");',
			'index.html': '<script>alert(1)</script>',
		},
	);

	await prepareSite({ artifactDir, meta, outDir });

	expect(await listFiles(outDir)).toEqual(['diff/card/new.actual.png', 'summary.json']);
});

test('takes metadata and counts from the workflow, never from the artefact', async () => {
	const { artifactDir, outDir } = await createArtifact(
		JSON.stringify({
			counts: { added: 500, changed: 500, removed: 500, unchanged: 2 },
			meta: { headSha: 'f'.repeat(40), pullRequest: 999, runAttempt: 9, runId: 9 },
			results: [{ id: 'card/new', pullRequest: 999, status: 'added' }],
			schemaVersion: 99,
		}),
		{ 'diff/card/new.actual.png': PNG },
	);

	const summary = await prepareSite({ artifactDir, meta, outDir });

	expect(summary.schemaVersion).toBe(1);
	expect(summary.meta).toEqual(meta);
	expect(summary.counts).toEqual({ added: 1, changed: 0, removed: 0, unchanged: 2 });
	expect(summary.results).toEqual([{ id: 'card/new', status: 'added' }]);
});

test('publishes a summary alone when nothing differs', async () => {
	const { artifactDir, outDir } = await createArtifact(
		JSON.stringify({
			counts: { ...artifactCounts, unchanged: 1 },
			results: [{ id: 'button/idle', status: 'unchanged' }],
		}),
	);

	const summary = await prepareSite({ artifactDir, meta, outDir });

	expect(summary.results).toEqual([]);
	expect(await listFiles(outDir)).toEqual(['summary.json']);
});

test('fails when a required image is missing', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'button/hover', status: 'changed' }]),
		{ 'diff/button/hover.actual.png': PNG, 'diff/button/hover.expected.png': PNG },
	);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(
		'Required file diff/button/hover.diff.png is missing.',
	);
});

test('fails when the summary is missing', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-review-'));

	await expect(
		prepareSite({ artifactDir: root, meta, outDir: path.join(root, 'deploy', 'site') }),
	).rejects.toThrow('Required file summary.json is missing.');
});

for (const [name, bytes] of [
	['HTML', Buffer.from('<!doctype html><script>alert(1)</script>')],
	['an SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')],
	['a truncated signature', PNG.subarray(0, 4)],
	['no bytes', Buffer.alloc(0)],
] as const) {
	test(`rejects a .png file that holds ${name}`, async () => {
		const { artifactDir, outDir } = await createArtifact(
			artifactSummary([{ id: 'card/new', status: 'added' }]),
			{ 'diff/card/new.actual.png': bytes },
		);

		await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/is not a PNG/);
	});
}

test('rejects a symlinked image even when it points at a real PNG', async () => {
	const { artifactDir, outDir, root } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
	);
	await writeFile(path.join(root, 'secret.png'), PNG);
	await mkdir(path.join(artifactDir, 'diff', 'card'), { recursive: true });
	await symlink(
		path.join(root, 'secret.png'),
		path.join(artifactDir, 'diff', 'card', 'new.actual.png'),
	);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/not a regular file/);
});

test('rejects an image reached through a symlinked directory outside the artefact', async () => {
	const { artifactDir, outDir, root } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
	);
	await mkdir(path.join(root, 'outside'));
	await writeFile(path.join(root, 'outside', 'new.actual.png'), PNG);
	await mkdir(path.join(artifactDir, 'diff'));
	await symlink(path.join(root, 'outside'), path.join(artifactDir, 'diff', 'card'));

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(
		/resolves outside the artefact/,
	);
});

test('rejects a symlinked summary', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-review-'));
	const artifactDir = path.join(root, 'artifact');
	await mkdir(artifactDir);
	await writeFile(path.join(root, 'elsewhere.json'), artifactSummary([]));
	await symlink(path.join(root, 'elsewhere.json'), path.join(artifactDir, 'summary.json'));

	await expect(
		prepareSite({ artifactDir, meta, outDir: path.join(root, 'deploy', 'site') }),
	).rejects.toThrow(/not a regular file/);
});

test('rejects an image over the size cap', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
		{ 'diff/card/new.actual.png': Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]) },
	);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/larger than/);
});

test('rejects an oversized summary file without reading it', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([], { padding: 'x'.repeat(MAX_SUMMARY_BYTES) }),
	);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/larger than/);
});

test('refuses a deploy directory that already exists, even an empty one', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]));
	const deployDir = path.dirname(outDir);
	await mkdir(deployDir);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/already exists/);
	expect(await listFiles(deployDir)).toEqual([]);
});

test('leaves a deploy directory that holds Wrangler inputs untouched', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]));
	const deployDir = path.dirname(outDir);
	await mkdir(path.join(deployDir, 'functions'), { recursive: true });
	await writeFile(path.join(deployDir, 'functions', '_middleware.js'), 'export {};');

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(/already exists/);
	expect(await listFiles(deployDir)).toEqual(['functions/_middleware.js']);
});

test('creates the deploy directory with the site as its only entry', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
		{ 'diff/card/new.actual.png': PNG },
	);

	await prepareSite({ artifactDir, meta, outDir });

	expect(await readdir(path.dirname(outDir))).toEqual(['site']);
});

/** A PNG signature followed by a hole, so a large file costs almost no disk. */
async function writeSparsePng(file: string, size: number) {
	await mkdir(path.dirname(file), { recursive: true });
	const handle = await open(file, 'w');
	try {
		await handle.write(PNG);
		await handle.truncate(size);
	} finally {
		await handle.close();
	}
}

test('rejects a report over the total size budget before writing anything', async () => {
	// Every image is within the per-file cap. Only their sum breaks the budget.
	const imagesNeeded = Math.floor(MAX_PUBLISHED_BYTES / MAX_IMAGE_BYTES) + 1;
	const results = Array.from({ length: Math.ceil(imagesNeeded / 3) }, (_, index) => ({
		id: `button/case-${index}`,
		status: 'changed',
	}));
	const { artifactDir, outDir } = await createArtifact(artifactSummary(results));
	await Promise.all(
		results.flatMap((result) => {
			return ['expected', 'actual', 'diff'].map((kind) => {
				const file = path.join(artifactDir, 'diff', `${result.id}.${kind}.png`);
				return writeSparsePng(file, MAX_IMAGE_BYTES);
			});
		}),
	);

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(
		`Refusing to publish more than ${MAX_PUBLISHED_BYTES} bytes.`,
	);
	await expect(readdir(path.dirname(outDir))).rejects.toThrow(/ENOENT/);
});

test('rejects a report with more files than the cap', async () => {
	const results = Array.from({ length: Math.ceil(MAX_PUBLISHED_FILES / 3) + 1 }, (_, index) => ({
		id: `button/case-${index}`,
		status: 'changed',
	}));
	const { artifactDir, outDir } = await createArtifact(artifactSummary(results));

	await expect(prepareSite({ artifactDir, meta, outDir })).rejects.toThrow(
		`Refusing to publish more than ${MAX_PUBLISHED_FILES} files.`,
	);
});

const APP_URL = 'https://luke-ui-visual-review.pages.dev';

function publishedSummary(results: Array<PublishedResult>, unchanged = 30): PublishedSummary {
	const counts = { added: 0, changed: 0, removed: 0, unchanged };
	for (const result of results) counts[result.status] += 1;
	return { counts, meta, results, schemaVersion: 1 };
}

test('reports the counts, the commit, and a link to the review app', () => {
	const markdown = commentMarkdown({
		appUrl: APP_URL,
		summary: publishedSummary([
			{ id: 'button/hover', status: 'changed' },
			{ id: 'button/idle', status: 'changed' },
			{ id: 'card/new', status: 'added' },
		]),
	});

	expect(markdown).toBe(
		[
			COMMENT_MARKER,
			'## Visual changes',
			'',
			'| changed | added | removed | unchanged |',
			'| --- | --- | --- | --- |',
			'| 2 | 1 | 0 | 30 |',
			'',
			`**[Review in the visual review app](${APP_URL}/?pr=12)**`,
			'',
			'Report for `aaaaaaa`.',
			'',
		].join('\n'),
	);
});

test('reports no visual changes in one line', () => {
	const markdown = commentMarkdown({ appUrl: APP_URL, summary: publishedSummary([]) });

	expect(markdown).toBe(`${COMMENT_MARKER}\nNo visual changes for \`aaaaaaa\`.\n`);
});

test('uses only the origin of the configured app URL', () => {
	const markdown = commentMarkdown({
		appUrl: `${APP_URL}/some/path?x=1`,
		summary: publishedSummary([{ id: 'card/new', status: 'added' }]),
	});

	expect(markdown).toContain(`](${APP_URL}/?pr=12)`);
});

for (const url of ['', 'not a url', 'http://insecure.example', 'javascript:alert(1)']) {
	test(`rejects the app URL ${JSON.stringify(url)}`, () => {
		const summary = publishedSummary([{ id: 'card/new', status: 'added' }]);
		expect(() => commentMarkdown({ appUrl: url, summary })).toThrow(/APP_URL/);
	});
}

const stickyComment = (overrides: Partial<IssueComment> = {}): IssueComment => ({
	body: `${COMMENT_MARKER}\n## Visual changes\n`,
	id: 1,
	user: { login: 'github-actions[bot]' },
	...overrides,
});

test('finds the sticky comment by marker and bot author together', () => {
	const comments = [
		stickyComment({ body: 'Looks good to me.', id: 1 }),
		// Anyone can paste the marker, so the author must match too.
		stickyComment({ id: 2, user: { login: 'mallory' } }),
		stickyComment({ id: 3, user: null }),
		stickyComment({ body: null, id: 4 }),
		stickyComment({ id: 5 }),
		stickyComment({ id: 6 }),
	];

	expect(findStickyComment(comments)?.id).toBe(5);
	expect(findStickyComment(comments.slice(0, 4))).toBeUndefined();
	expect(findStickyComment([])).toBeUndefined();
});

test('creates a comment only when captures differ', () => {
	expect(decideCommentAction(3, undefined)).toEqual({ type: 'create' });
	expect(decideCommentAction(0, undefined)).toEqual({ type: 'skip' });
});

test('updates an existing comment whether or not captures still differ', () => {
	expect(decideCommentAction(3, 77)).toEqual({ commentId: 77, type: 'update' });
	expect(decideCommentAction(0, 77)).toEqual({ commentId: 77, type: 'update' });
});
