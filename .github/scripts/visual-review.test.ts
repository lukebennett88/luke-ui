import { tmpdir } from 'node:os';
import path from 'node:path';
import { mkdir, mkdtemp, open, readdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import type {
	BaselineArtifact,
	CheckRunRequest,
	CheckState,
	ExistingCheckRun,
	FileContent,
	FileReader,
	IssueComment,
	LatestComparison,
	PublishedMeta,
	PublishedResult,
	PublishedSummary,
	PullFile,
	PullRequestCandidate,
	RunMeta,
	SweepPresentation,
} from './visual-review.js';
import {
	canRecordFailedPublication,
	CHECK_NAME,
	checkRecordedBaseline,
	checkRunPayload,
	COMMENT_MARKER,
	COMMENT_STATUS_END,
	COMMENT_STATUS_START,
	commentMarkdown,
	decideCommentAction,
	decidePublish,
	decideReview,
	decideRunOutcome,
	findInfrastructureChanges,
	findOwnCheckRun,
	findStickyComment,
	formatTimestamp,
	isSupersededFailure,
	infrastructureChanges,
	isAlreadyRecorded,
	isCurrentBaseline,
	MAX_HISTORY_CHARS,
	MAX_HISTORY_ENTRIES,
	MAX_IMAGE_BYTES,
	MAX_PUBLISHED_BYTES,
	MAX_PUBLISHED_FILES,
	MAX_SUMMARY_BYTES,
	MAX_SUMMARY_CHARS,
	MAX_SWEEP_RESTORES,
	newestBaselineRun,
	parseArtifactSummary,
	parseBaseline,
	parseMeta,
	planReconcile,
	planSweep,
	prepareSite,
	prependHistory,
	presentationBody,
	recordedState,
	replaceCommentStatus,
	restoredPresentation,
	revalidateComparison,
	stripCatalogBlocks,
	SWEEP_GRACE_MS,
	UNLISTED_FILES_ENTRY,
	verifiedBaselineSha,
	writeSweepPresentation,
} from './visual-review.js';

const DUPLICATE_CAPTURE_ID_PATTERN = /Duplicate capture id/;
const WIDTH_PATTERN = /width/;
const COUNTS_UNCHANGED_PATTERN = /counts\.unchanged/;
const SUMMARY_JSON_PATTERN = /summary\.json/;
const LARGER_THAN_PATTERN = /larger than/;
const NOT_A_REGULAR_FILE_PATTERN = /not a regular file/;
const ENOENT_PATTERN = /ENOENT/;
const BASELINE_JSON_PATTERN = /baseline\.json/;
const APP_URL_ERROR_PATTERN = /APP_URL/;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

const HEAD_SHA = 'a'.repeat(40);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

const runMeta: RunMeta = {
	generatedAt: '2026-01-02T03:04:05.000Z',
	headSha: HEAD_SHA,
	pullRequest: 12,
	runAttempt: 2,
	runId: 345,
};

const meta: PublishedMeta = {
	...runMeta,
	baselineArtifactId: null,
	baselineRunAttempt: null,
	baselineRunId: null,
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
	expect(() => parseArtifactSummary(artifactSummary(results))).toThrow(
		DUPLICATE_CAPTURE_ID_PATTERN,
	);
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
	expect(() => parseArtifactSummary(raw)).toThrow(WIDTH_PATTERN);
});

for (const unchanged of [-1, 1.5, '3', undefined]) {
	test(`rejects the unchanged count ${JSON.stringify(unchanged)}`, () => {
		const raw = JSON.stringify({ counts: { unchanged }, results: [] });
		expect(() => parseArtifactSummary(raw)).toThrow(COUNTS_UNCHANGED_PATTERN);
	});
}

for (const raw of ['', 'not json', '[]', 'null', '{"counts":{"unchanged":0}}', '{"results":[]}']) {
	test(`rejects the malformed summary ${JSON.stringify(raw)}`, () => {
		expect(() => parseArtifactSummary(raw)).toThrow(SUMMARY_JSON_PATTERN);
	});
}

test('rejects an oversized summary before parsing it', () => {
	const raw = artifactSummary([], { padding: 'x'.repeat(MAX_SUMMARY_BYTES) });
	expect(() => parseArtifactSummary(raw)).toThrow(LARGER_THAN_PATTERN);
});

test('reads run metadata from the environment', () => {
	const parsed = parseMeta(
		{ HEAD_SHA, PR_NUMBER: '12', RUN_ATTEMPT: '2', RUN_ID: '345' },
		() => new Date(meta.generatedAt),
	);
	expect(parsed).toEqual(runMeta);
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

	const summary = await prepareSite({ artifactDir, meta: runMeta, outDir });

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
			{
				fingerprint: expect.stringMatching(FINGERPRINT_PATTERN),
				id: 'button/hover',
				mismatchedPixels: 3,
				status: 'changed',
			},
			{ fingerprint: expect.stringMatching(FINGERPRINT_PATTERN), id: 'card/new', status: 'added' },
			{
				fingerprint: expect.stringMatching(FINGERPRINT_PATTERN),
				id: 'text/sizes',
				status: 'removed',
			},
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

	await prepareSite({ artifactDir, meta: runMeta, outDir });

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

	const summary = await prepareSite({ artifactDir, meta: runMeta, outDir });

	expect(summary.schemaVersion).toBe(1);
	expect(summary.meta).toEqual(meta);
	expect(summary.counts).toEqual({ added: 1, changed: 0, removed: 0, unchanged: 2 });
	expect(summary.results).toEqual([
		{ fingerprint: expect.stringMatching(FINGERPRINT_PATTERN), id: 'card/new', status: 'added' },
	]);
});

test('publishes a summary alone when nothing differs', async () => {
	const { artifactDir, outDir } = await createArtifact(
		JSON.stringify({
			counts: { ...artifactCounts, unchanged: 1 },
			results: [{ id: 'button/idle', status: 'unchanged' }],
		}),
	);

	const summary = await prepareSite({ artifactDir, meta: runMeta, outDir });

	expect(summary.results).toEqual([]);
	expect(await listFiles(outDir)).toEqual(['summary.json']);
});

test('fails when a required image is missing', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'button/hover', status: 'changed' }]),
		{ 'diff/button/hover.actual.png': PNG, 'diff/button/hover.expected.png': PNG },
	);

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		'Required file diff/button/hover.diff.png is missing.',
	);
});

test('fails when the summary is missing', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'visual-review-'));

	await expect(
		prepareSite({ artifactDir: root, meta: runMeta, outDir: path.join(root, 'deploy', 'site') }),
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

		await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
			/is not a PNG/,
		);
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

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		/not a regular file/,
	);
});

test('rejects an image reached through a symlinked directory outside the artefact', async () => {
	const { artifactDir, outDir, root } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
	);
	await mkdir(path.join(root, 'outside'));
	await writeFile(path.join(root, 'outside', 'new.actual.png'), PNG);
	await mkdir(path.join(artifactDir, 'diff'));
	await symlink(path.join(root, 'outside'), path.join(artifactDir, 'diff', 'card'));

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
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
		prepareSite({ artifactDir, meta: runMeta, outDir: path.join(root, 'deploy', 'site') }),
	).rejects.toThrow(NOT_A_REGULAR_FILE_PATTERN);
});

test('rejects an image over the size cap', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
		{ 'diff/card/new.actual.png': Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]) },
	);

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		LARGER_THAN_PATTERN,
	);
});

test('rejects an oversized summary file without reading it', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([], { padding: 'x'.repeat(MAX_SUMMARY_BYTES) }),
	);

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		LARGER_THAN_PATTERN,
	);
});

test('refuses a deploy directory that already exists, even an empty one', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]));
	const deployDir = path.dirname(outDir);
	await mkdir(deployDir);

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		/already exists/,
	);
	expect(await listFiles(deployDir)).toEqual([]);
});

test('leaves a deploy directory that holds Wrangler inputs untouched', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]));
	const deployDir = path.dirname(outDir);
	await mkdir(path.join(deployDir, 'functions'), { recursive: true });
	await writeFile(path.join(deployDir, 'functions', '_middleware.js'), 'export {};');

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		/already exists/,
	);
	expect(await listFiles(deployDir)).toEqual(['functions/_middleware.js']);
});

test('creates the deploy directory with the site as its only entry', async () => {
	const { artifactDir, outDir } = await createArtifact(
		artifactSummary([{ id: 'card/new', status: 'added' }]),
		{ 'diff/card/new.actual.png': PNG },
	);

	await prepareSite({ artifactDir, meta: runMeta, outDir });

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

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		`Refusing to publish more than ${MAX_PUBLISHED_BYTES} bytes.`,
	);
	await expect(readdir(path.dirname(outDir))).rejects.toThrow(ENOENT_PATTERN);
});

test('rejects a report with more files than the cap', async () => {
	const results = Array.from({ length: Math.ceil(MAX_PUBLISHED_FILES / 3) + 1 }, (_, index) => ({
		id: `button/case-${index}`,
		status: 'changed',
	}));
	const { artifactDir, outDir } = await createArtifact(artifactSummary(results));

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		`Refusing to publish more than ${MAX_PUBLISHED_FILES} files.`,
	);
});

const APP_URL = 'https://luke-ui-visual-review.pages.dev';

function publishedSummary(results: Array<PublishedResult>, unchanged = 30): PublishedSummary {
	const counts = { added: 0, changed: 0, removed: 0, unchanged };
	for (const result of results) counts[result.status] += 1;
	return { counts, meta, results, schemaVersion: 1 };
}

test('records the baseline run, attempt, and artefact the comparison names', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]), {
		'baseline.json': '{"runId":678,"runAttempt":2,"artifactId":9001}\n',
	});

	const summary = await prepareSite({ artifactDir, meta: runMeta, outDir });

	expect(summary.meta).toMatchObject({
		baselineArtifactId: 9001,
		baselineRunAttempt: 2,
		baselineRunId: 678,
	});
});

for (const raw of [
	'{"runId":678}',
	'{"runId":678,"runAttempt":2}',
	'{"runId":678,"artifactId":9}',
]) {
	test(`treats the baseline file ${raw}, which names no exact artefact, as unverified`, () => {
		expect(parseBaseline(raw)).toBeNull();
	});
}

test('records no baseline for a run from before comparisons named one', async () => {
	const { artifactDir, outDir } = await createArtifact(artifactSummary([]));

	const summary = await prepareSite({ artifactDir, meta: runMeta, outDir });

	expect(summary.meta).toMatchObject({
		baselineArtifactId: null,
		baselineRunAttempt: null,
		baselineRunId: null,
	});
});

for (const raw of [
	'',
	'nope',
	'[]',
	'{}',
	'{"runId":0}',
	'{"runId":"7"}',
	'{"runId":1.5}',
	'{"runId":7,"runAttempt":0,"artifactId":9}',
	'{"runId":7,"runAttempt":1,"artifactId":"9"}',
	'{"runId":7,"runAttempt":null,"artifactId":9}',
]) {
	test(`rejects the baseline file ${JSON.stringify(raw)}`, () => {
		expect(() => parseBaseline(raw)).toThrow(BASELINE_JSON_PATTERN);
	});
}

test('rejects a symlinked baseline file', async () => {
	const { artifactDir, outDir, root } = await createArtifact(artifactSummary([]));
	await writeFile(path.join(root, 'elsewhere.json'), '{"runId":1}');
	await symlink(path.join(root, 'elsewhere.json'), path.join(artifactDir, 'baseline.json'));

	await expect(prepareSite({ artifactDir, meta: runMeta, outDir })).rejects.toThrow(
		/not a regular file/,
	);
});

const completedRun = (overrides: Partial<Parameters<typeof decideRunOutcome>[0]> = {}) => {
	return decideRunOutcome({
		compareConclusion: 'success',
		conclusion: 'success',
		hasArtifact: true,
		status: 'completed',
		...overrides,
	});
};

test('treats a run that has not finished as pending', () => {
	for (const status of ['queued', 'in_progress', 'waiting', 'requested', null]) {
		expect(completedRun({ conclusion: null, status })).toBe('pending');
	}
});

test('records a successful run with a report, and a cancelled run as cancelled', () => {
	expect(completedRun()).toBe('report');
	expect(completedRun({ conclusion: 'cancelled', compareConclusion: 'cancelled' })).toBe(
		'cancelled',
	);
});

// Each of these finished without a verified comparison, so none may leave an earlier result.
for (const conclusion of [
	'failure',
	'timed_out',
	'neutral',
	'skipped',
	'stale',
	'action_required',
	'startup_failure',
	null,
	undefined,
	'something_new',
]) {
	test(`fails a finished run that concluded ${JSON.stringify(conclusion)}`, () => {
		expect(completedRun({ conclusion })).toBe('failed');
		expect(completedRun({ compareConclusion: 'skipped', conclusion, hasArtifact: false })).toBe(
			'failed',
		);
	});
}

test('skips only when the compare job was skipped', () => {
	expect(completedRun({ compareConclusion: 'skipped', hasArtifact: false })).toBe('skipped');
	// A compare job that succeeded but uploaded nothing did not finish its comparison.
	expect(completedRun({ hasArtifact: false })).toBe('failed');
	// A run with no compare job, or one that ended any other way, never passes as skipped.
	expect(completedRun({ compareConclusion: undefined, hasArtifact: false })).toBe('failed');
	expect(completedRun({ compareConclusion: 'neutral', hasArtifact: true })).toBe('failed');
});

const recordedRun = (state: Partial<CheckState>) => ({
	app: { slug: 'luke-ui-visual-review' },
	external_id: JSON.stringify(checkState(state)),
	id: 1,
	status: 'completed',
});

const latestRun = (overrides: Partial<LatestComparison> = {}): LatestComparison => ({
	conclusion: 'success',
	id: 345,
	run_attempt: 2,
	status: 'completed',
	...overrides,
});

const plan = (options: Partial<Parameters<typeof planReconcile>[0]>) => {
	return planReconcile({
		compareConclusion: 'success',
		hasArtifact: true,
		latest: latestRun(),
		recorded: undefined,
		...options,
	});
};

test('reconciles from the latest comparison, not the event', () => {
	expect(plan({})).toEqual({ outcome: 'report', runAttempt: 2, runId: 345 });
	expect(plan({ latest: latestRun({ conclusion: null, status: 'in_progress' }) })).toEqual({
		outcome: 'pending',
		runAttempt: 2,
		runId: 345,
	});
	expect(plan({ latest: undefined }).outcome).toBe('none');
});

test('records a newer attempt that finished after its start event was dropped', () => {
	// Attempt 1 was approved. Attempt 2's start event never arrived, so its completion is the
	// first event for it, and the approval must not survive.
	const approvedFirstAttempt = recordedRun({ kind: 'review', runAttempt: 1 });

	expect(plan({ recorded: approvedFirstAttempt })).toEqual({
		outcome: 'report',
		runAttempt: 2,
		runId: 345,
	});
});

test('writes nothing for an older attempt event once the newer attempt is recorded', () => {
	// The event is for attempt 1, but the latest comparison is attempt 2, already recorded and
	// possibly approved. Recording it again would discard the decision.
	for (const kind of ['review', 'clean'] as const) {
		const decision = plan({ recorded: recordedRun({ kind, runAttempt: 2 }) });
		expect(decision.outcome).toBe('none');
		expect(decision.outcome === 'none' && decision.reason).toContain('already recorded');
	}
});

test('records the latest comparison again after a recorded failure', () => {
	// A failed publication is recorded as failed, so the next event retries it.
	expect(plan({ recorded: recordedRun({ kind: 'failed', runAttempt: 2 }) }).outcome).toBe('report');
});

test('records a start once, whatever the recorded check status', () => {
	const running = latestRun({ conclusion: null, status: 'in_progress' });
	const pending = recordedRun({ kind: 'pending', reasons: [] });

	expect(plan({ latest: running, recorded: pending }).outcome).toBe('none');
	// A finished run replaces the pending record.
	expect(plan({ recorded: pending }).outcome).toBe('report');
	expect(plan({ latest: running, recorded: recordedRun({ kind: 'review' }) }).outcome).toBe(
		'pending',
	);
});

test('reads the recorded state only from an external id this workflow wrote', () => {
	expect(recordedState(undefined)).toBeUndefined();
	expect(recordedState({ app: null, external_id: 'not json', id: 1 })).toBeUndefined();
	expect(recordedState({ app: null, external_id: '{"v":2}', id: 1 })).toBeUndefined();
	expect(recordedState({ app: null, external_id: null, id: 1 })).toBeUndefined();
	expect(
		isAlreadyRecorded({
			outcome: 'report',
			recorded: recordedRun({ kind: 'review', runId: 999 }),
			runAttempt: 2,
			runId: 345,
		}),
	).toBe(false);
});

const BASELINE_SHA = 'b'.repeat(40);

const baselineRun = {
	conclusion: 'success',
	event: 'push',
	head_branch: 'main',
	head_repository: { full_name: 'luke/luke-ui' },
	head_sha: BASELINE_SHA,
	path: '.github/workflows/visual-baseline.yml',
	status: 'completed',
};

test('verifies a successful Visual baseline run of main, pushed or dispatched', () => {
	expect(verifiedBaselineSha(baselineRun, 'luke/luke-ui')).toBe(BASELINE_SHA);
	expect(verifiedBaselineSha({ ...baselineRun, event: 'workflow_dispatch' }, 'luke/luke-ui')).toBe(
		BASELINE_SHA,
	);
});

for (const [name, baseline] of [
	// A fork's own branch called main runs in this repository with the fork as head repository.
	[
		'a fork branch named main',
		{ ...baselineRun, head_repository: { full_name: 'mallory/luke-ui' } },
	],
	['a run with no head repository', { ...baselineRun, head_repository: null }],
	['a pull request run', { ...baselineRun, event: 'pull_request' }],
	['a pull_request_target run', { ...baselineRun, event: 'pull_request_target' }],
	['another workflow', { ...baselineRun, path: '.github/workflows/visual-regression.yml' }],
	['another branch', { ...baselineRun, head_branch: 'feature' }],
	['a failed run', { ...baselineRun, conclusion: 'failure' }],
	['a run still in progress', { ...baselineRun, conclusion: null, status: 'in_progress' }],
	['a malformed commit', { ...baselineRun, head_sha: 'abc' }],
] as const) {
	test(`does not verify ${name} as a baseline`, () => {
		expect(verifiedBaselineSha(baseline, 'luke/luke-ui')).toBeNull();
	});
}

test('finds the visual testing infrastructure among changed paths', () => {
	expect(
		infrastructureChanges([
			'packages/@luke-ui/react/src/button/button.tsx',
			'.github/workflows/visual-regression.yml',
			'packages/@luke-ui/react/scripts/visual-regression-lib.ts',
			'.github/visual-playwright/Dockerfile',
			'.github/workflows/visual-review-publish.yml',
			'.github/scripts/visual-review.ts',
			'.github/scripts/package.json',
			'packages/@luke-ui/react/src/core/test-utils/axe.ts',
			'patches/react-aria.patch',
			'packages/@luke-ui/react/turbo.json',
			'turbo.json',
			'docs/VISUAL_TESTING.md',
		]),
	).toEqual([
		'.github/scripts/package.json',
		'.github/scripts/visual-review.ts',
		'.github/visual-playwright/Dockerfile',
		'.github/workflows/visual-regression.yml',
		'packages/@luke-ui/react/scripts/visual-regression-lib.ts',
		'packages/@luke-ui/react/src/core/test-utils/axe.ts',
		'packages/@luke-ui/react/turbo.json',
		'patches/react-aria.patch',
		'turbo.json',
	]);
});

const text = (value: string): FileContent => ({ kind: 'text', text: value });
const json = (value: unknown): FileContent => text(JSON.stringify(value, null, '\t'));
const MISSING: FileContent = { kind: 'missing' };

/** A reader over fixed base and head file contents. Unlisted files are missing. */
function fixedReader(
	base: Record<string, FileContent>,
	head: Record<string, FileContent>,
): FileReader {
	return async (file, side) => (side === 'base' ? base : head)[file] ?? MISSING;
}

async function infrastructureFor(
	files: Array<PullFile>,
	base: Record<string, FileContent> = {},
	head: Record<string, FileContent> = {},
	complete = true,
) {
	return findInfrastructureChanges({ complete, files, read: fixedReader(base, head) });
}

test('counts a file renamed away from an infrastructure path', async () => {
	const files = [
		{
			filename: 'docs/old-visual-ci.ts',
			previous_filename: '.github/scripts/visual-ci.ts',
			status: 'renamed',
		},
	];

	expect(await infrastructureFor(files)).toEqual(['.github/scripts/visual-ci.ts']);
});

test('treats a pull request with more files than the API lists as infrastructure', async () => {
	const files = [{ filename: 'README.md', status: 'modified' }];

	expect(await infrastructureFor(files, {}, {}, false)).toEqual([UNLISTED_FILES_ENTRY]);
});

const packageBase = {
	dependencies: { react: '^19.3.0' },
	name: '@luke-ui/react',
	scripts: { 'test:visual:run': 'vp test run --project visual' },
	version: '1.0.0',
};
const packageFile = 'packages/@luke-ui/react/package.json';
const modifiedPackage = [{ filename: packageFile, status: 'modified' }];

test('ignores a package.json change to dependencies and the version alone', async () => {
	const head = json({
		...packageBase,
		devDependencies: { typescript: '^7.0.2' },
		dependencies: { react: '^19.4.0' },
		version: '1.1.0',
	});

	expect(
		await infrastructureFor(
			modifiedPackage,
			{ [packageFile]: json(packageBase) },
			{ [packageFile]: head },
		),
	).toEqual([]);
});

test('ignores a package.json whose keys only moved', async () => {
	const reordered = `{"version":"1.0.0","scripts":{"test:visual:run":"vp test run --project visual"},"name":"@luke-ui/react","dependencies":{"react":"^19.3.0"}}`;

	expect(
		await infrastructureFor(
			modifiedPackage,
			{ [packageFile]: json(packageBase) },
			{ [packageFile]: text(reordered) },
		),
	).toEqual([]);
});

for (const [name, head] of [
	['a scripts change', json({ ...packageBase, scripts: { 'test:visual:run': 'true' } })],
	['a pnpm field', json({ ...packageBase, pnpm: { overrides: { react: '1.0.0' } } })],
	['unparseable JSON', text('{"name":')],
	['a JSON array', text('[]')],
	['a file over the size cap', { kind: 'too-large' } as const],
] as const) {
	test(`counts a package.json with ${name}`, async () => {
		expect(
			await infrastructureFor(
				modifiedPackage,
				{ [packageFile]: json(packageBase) },
				{ [packageFile]: head },
			),
		).toEqual([packageFile]);
	});
}

test('compares an added or removed package.json against an empty object', async () => {
	const added = [{ filename: packageFile, status: 'added' }];
	const removed = [{ filename: packageFile, status: 'removed' }];
	const dependenciesOnly = json({ dependencies: { react: '^19.3.0' }, version: '1.0.0' });

	expect(await infrastructureFor(added, {}, { [packageFile]: dependenciesOnly })).toEqual([]);
	expect(await infrastructureFor(added, {}, { [packageFile]: json(packageBase) })).toEqual([
		packageFile,
	]);
	expect(await infrastructureFor(removed, { [packageFile]: json(packageBase) })).toEqual([
		packageFile,
	]);
});

test('counts a package.json the pull request lists but the API cannot read', async () => {
	// Modified means it exists at both sides. A missing head must not compare as `{}`.
	expect(await infrastructureFor(modifiedPackage)).toEqual([packageFile]);
});

test('counts a package.json renamed away from its directory', async () => {
	const files = [
		{ filename: 'scratch/package.json.bak', previous_filename: packageFile, status: 'renamed' },
	];

	expect(await infrastructureFor(files, { [packageFile]: json(packageBase) })).toEqual([
		packageFile,
	]);
});

const workspaceBase = [
	'packages:',
	'  - packages/*',
	'',
	'overrides:',
	"  vite@*: 'catalog:'",
	'',
	'catalog:',
	'  playwright: ^1.65.0',
	'  # Kept with the Dockerfile.',
	'',
	'  react: ^19.3.0',
	'minimumReleaseAgeExclude:',
	'  - vite-plus',
	'',
].join('\n');
const modifiedWorkspace = [{ filename: 'pnpm-workspace.yaml', status: 'modified' }];

async function workspaceInfrastructure(head: string) {
	return infrastructureFor(
		modifiedWorkspace,
		{ 'pnpm-workspace.yaml': text(workspaceBase) },
		{ 'pnpm-workspace.yaml': text(head) },
	);
}

test('ignores a pnpm-workspace.yaml change inside the catalog alone', async () => {
	const head = workspaceBase
		.replace('playwright: ^1.65.0', 'playwright: ^1.66.0')
		.replace('react: ^19.3.0', "react: ^19.4.0\ncatalogs:\n  next:\n    react: '20.0.0'");

	expect(await workspaceInfrastructure(head)).toEqual([]);
});

for (const [name, head] of [
	['an overrides change', workspaceBase.replace("vite@*: 'catalog:'", "vite@*: '8.0.0'")],
	[
		'a setting after the catalog',
		workspaceBase.replace('  - vite-plus', '  - vite-plus\n  - evil'),
	],
	['a new top-level setting', `${workspaceBase}patchedDependencies:\n  react: patch.diff\n`],
	['a catalog anchor', workspaceBase.replace('catalog:', 'catalog: &pins')],
] as const) {
	test(`counts a pnpm-workspace.yaml with ${name}`, async () => {
		expect(await workspaceInfrastructure(head)).toEqual(['pnpm-workspace.yaml']);
	});
}

test('strips each catalog block up to the next top-level key', () => {
	expect(stripCatalogBlocks(workspaceBase)).toBe(
		[
			'packages:',
			'  - packages/*',
			'',
			'overrides:',
			"  vite@*: 'catalog:'",
			'',
			'minimumReleaseAgeExclude:',
			'  - vite-plus',
			'',
		].join('\n'),
	);
	// `catalogMode` is a different setting, not a catalog block.
	expect(stripCatalogBlocks('catalogMode: strict\n')).toBe('catalogMode: strict\n');
});

const reviewOf = (overrides: Partial<Parameters<typeof decideReview>[0]>) => {
	return decideReview({
		baselineCurrent: true,
		baselineSha: BASELINE_SHA,
		differing: 0,
		infrastructureFiles: [],
		outcome: 'report',
		...overrides,
	});
};

test('needs review for differences, infrastructure changes, or both', () => {
	const infra = ['.github/scripts/visual-ci.ts'];
	expect(reviewOf({ differing: 2 })).toEqual({ kind: 'review', reasons: ['visual'] });
	expect(reviewOf({ infrastructureFiles: infra })).toEqual({
		kind: 'review',
		reasons: ['infrastructure'],
	});
	expect(reviewOf({ differing: 1, infrastructureFiles: infra })).toEqual({
		kind: 'review',
		reasons: ['visual', 'infrastructure'],
	});
});

test('passes a verified report without differences and a skipped comparison', () => {
	expect(reviewOf({})).toEqual({ kind: 'clean', reasons: [] });
	// A skipped run compared nothing, so it has no baseline to verify.
	expect(reviewOf({ baselineSha: null, outcome: 'skipped' })).toEqual({
		kind: 'clean',
		reasons: [],
	});
});

for (const differing of [0, 2]) {
	test(`fails a report with ${differing} differences and an unverified baseline`, () => {
		expect(reviewOf({ baselineSha: null, differing })).toEqual({
			failure: 'unverified-baseline',
			kind: 'failed',
			reasons: [],
		});
	});
}

for (const differing of [0, 2]) {
	test(`fails a report with ${differing} differences against an out-of-date baseline`, () => {
		expect(reviewOf({ baselineCurrent: false, differing })).toEqual({
			failure: 'outdated-baseline',
			kind: 'failed',
			reasons: [],
		});
	});
}

test('finds the newest baseline that passes verification', () => {
	const runs = [
		// A fork's main is listed by `branch=main` too, and must be passed over.
		{ ...baselineRun, head_repository: { full_name: 'mallory/luke-ui' }, id: 900, run_attempt: 1 },
		{ ...baselineRun, id: 800, run_attempt: 2 },
		{ ...baselineRun, id: 700, run_attempt: 1 },
	];

	expect(newestBaselineRun(runs, 'luke/luke-ui')?.id).toBe(800);
	expect(newestBaselineRun(runs.slice(0, 1), 'luke/luke-ui')).toBeUndefined();
});

test('treats a baseline as current only at the newest run and attempt', () => {
	const newest = { ...baselineRun, id: 800, run_attempt: 2 };

	expect(isCurrentBaseline(newest, 800, 2)).toBe(true);
	// A dispatch on main made a newer run.
	expect(isCurrentBaseline(newest, 700, 1)).toBe(false);
	// A re-run of the same baseline run made a newer attempt.
	expect(isCurrentBaseline(newest, 800, 1)).toBe(false);
	expect(isCurrentBaseline(newest, 800, null)).toBe(false);
	expect(isCurrentBaseline(newest, null, null)).toBe(false);
	expect(isCurrentBaseline(undefined, 800, 2)).toBe(false);
});

const recordedBaseline = { artifactId: 9001, runAttempt: 2, runId: 800 };
const baselineArtifact = (overrides: Partial<BaselineArtifact> = {}): BaselineArtifact => ({
	expired: false,
	id: 9001,
	name: 'visual-baseline',
	...overrides,
});

const baselineCheck = (overrides: Partial<Parameters<typeof checkRecordedBaseline>[0]> = {}) => {
	return checkRecordedBaseline({
		artifacts: [baselineArtifact()],
		newest: { ...baselineRun, id: 800, run_attempt: 2 },
		recorded: recordedBaseline,
		repository: 'luke/luke-ui',
		run: { ...baselineRun, id: 800, run_attempt: 2 },
		...overrides,
	});
};

test('accepts the exact baseline the comparison recorded while it is the newest', () => {
	expect(baselineCheck()).toEqual({ baselineCurrent: true, baselineSha: BASELINE_SHA });
	// An expired copy beside the one artefact changes nothing.
	expect(
		baselineCheck({ artifacts: [baselineArtifact({ expired: true, id: 1 }), baselineArtifact()] }),
	).toEqual({ baselineCurrent: true, baselineSha: BASELINE_SHA });
});

test('treats a re-run of the recorded baseline as out of date', () => {
	// The re-run replaced the artefact, so the recorded one no longer exists either.
	const rerun = { ...baselineRun, id: 800, run_attempt: 3 };
	expect(
		baselineCheck({ artifacts: [baselineArtifact({ id: 9002 })], newest: rerun, run: rerun }),
	).toEqual({ baselineCurrent: false, baselineSha: BASELINE_SHA });
});

test('treats a newer baseline run as out of date', () => {
	expect(baselineCheck({ newest: { ...baselineRun, id: 900, run_attempt: 1 } })).toEqual({
		baselineCurrent: false,
		baselineSha: BASELINE_SHA,
	});
});

for (const [name, artifacts] of [
	['another artefact', [baselineArtifact({ id: 9002 })]],
	['no artefact', []],
	['only an expired artefact', [baselineArtifact({ expired: true })]],
	['two artefacts', [baselineArtifact(), baselineArtifact({ id: 9002 })]],
	['unreadable artefacts', undefined],
] as const) {
	test(`does not verify a recorded baseline whose run has ${name}`, () => {
		expect(baselineCheck({ artifacts })).toEqual({ baselineCurrent: false, baselineSha: null });
	});
}

test('does not verify a missing, unreadable, or untrusted baseline run', () => {
	const unverified = { baselineCurrent: false, baselineSha: null };
	expect(baselineCheck({ recorded: null })).toEqual(unverified);
	expect(baselineCheck({ run: undefined })).toEqual(unverified);
	expect(
		baselineCheck({ run: { ...baselineRun, event: 'pull_request', id: 800, run_attempt: 2 } }),
	).toEqual(unverified);
});

for (const [outcome, failure] of [
	['failed', 'unfinished'],
	['cancelled', 'cancelled'],
	['publish-failed', 'publish-failed'],
] as const) {
	test(`fails a ${outcome} comparison, whatever it changed`, () => {
		const infra = ['.github/scripts/visual-ci.ts'];
		expect(reviewOf({ differing: 3, infrastructureFiles: infra, outcome })).toEqual({
			failure,
			kind: 'failed',
			reasons: [],
		});
	});
}

test('fails a skipped comparison that changed infrastructure', () => {
	const infra = ['.github/scripts/visual-ci.ts'];
	expect(reviewOf({ infrastructureFiles: infra, outcome: 'skipped' })).toEqual({
		failure: 'unfinished',
		kind: 'failed',
		reasons: [],
	});
});

test('records a started comparison as pending', () => {
	expect(reviewOf({ baselineSha: null, outcome: 'pending' })).toEqual({
		kind: 'pending',
		reasons: [],
	});
});

const NOW = new Date('2026-11-16T03:22:45.000Z');

function checkState(overrides: Partial<CheckState> = {}): CheckState {
	return {
		baselineRunAttempt: 1,
		baselineRunId: 678,
		baselineSha: 'b'.repeat(40),
		kind: 'review',
		reasons: ['visual'],
		runAttempt: 2,
		runId: 345,
		v: 1,
		...overrides,
	};
}

function payloadFor(
	state: CheckState,
	overrides: Partial<Parameters<typeof checkRunPayload>[0]> = {},
) {
	return checkRunPayload({
		appUrl: APP_URL,
		headSha: HEAD_SHA,
		infrastructureFiles: [],
		now: NOW,
		previousText: undefined,
		updatesExisting: false,
		pullRequest: 12,
		repository: 'luke/luke-ui',
		state,
		summary: publishedSummary([
			{ id: 'button/hover', status: 'changed' },
			{ id: 'card/new', status: 'added' },
		]),
		...overrides,
	});
}

test('asks for review of a report with differences', () => {
	const payload = payloadFor(checkState());

	expect(payload).toMatchObject({
		completed_at: NOW.toISOString(),
		conclusion: 'action_required',
		details_url: `${APP_URL}/?pr=12`,
		head_sha: HEAD_SHA,
		name: CHECK_NAME,
		status: 'completed',
	});
	expect(payload.output.title).toBe('Needs review: 1 changed, 1 added');
	expect(payload.output.summary.split('\n')[0]).toBe('**Status:** Needs review');
	expect(payload.output.summary).toContain('| 1 | 1 | 0 | 30 |');
	expect(payload.output.summary).toContain(
		'against baseline run [678](https://github.com/luke/luke-ui/actions/runs/678) (attempt 1) from `main@bbbbbbb`.',
	);
	expect(payload.output.text).toBe(
		[
			'### History',
			'',
			'- 2026-11-16 03:22 UTC · Comparison run 345 (attempt 2): needs review',
			'',
		].join('\n'),
	);
});

test('stores the comparison run and baseline in the external id', () => {
	const state = checkState({ baselineRunAttempt: 3, reasons: ['visual', 'infrastructure'] });

	const recorded = JSON.parse(payloadFor(state).external_id);

	expect(recorded).toEqual(state);
	expect(recorded.baselineRunAttempt).toBe(3);
});

test('records a failed resolve only on a checked commit or an open pull request head', () => {
	const checked = recordedRun({ kind: 'review' });

	expect(canRecordFailedPublication({ pullRequest: 12, recorded: undefined })).toBe(true);
	expect(canRecordFailedPublication({ pullRequest: undefined, recorded: checked })).toBe(true);
	// A closed pull request or a commit that is no longer its head gets no new check run.
	expect(canRecordFailedPublication({ pullRequest: undefined, recorded: undefined })).toBe(false);
});

test('links the details to the app root when the pull request is unknown', () => {
	const payload = payloadFor(checkState({ kind: 'failed', reasons: [] }), {
		failure: 'publish-failed',
		pullRequest: undefined,
		summary: undefined,
	});

	expect(payload.details_url).toBe(`${APP_URL}/`);
	expect(payload.output.title).toBe('Publishing the report failed');
});

test('lists changed infrastructure and names it in the title', () => {
	const payload = payloadFor(checkState({ reasons: ['infrastructure'] }), {
		infrastructureFiles: ['.github/scripts/visual-ci.ts'],
		summary: publishedSummary([]),
	});

	expect(payload.output.title).toBe('Needs review: visual testing infrastructure changed');
	expect(payload.output.summary).toContain('- `.github/scripts/visual-ci.ts`');
});

test('marks an unverified or unrecorded baseline', () => {
	expect(payloadFor(checkState({ baselineSha: null })).output.summary).toContain('(unverified)');
	expect(
		payloadFor(checkState({ baselineRunId: null, baselineSha: null })).output.summary,
	).toContain('against an unrecorded baseline.');
});

test('passes a clean report', () => {
	const clean = payloadFor(checkState({ kind: 'clean', reasons: [] }), {
		summary: publishedSummary([]),
	});
	expect(clean).toMatchObject({ conclusion: 'success', status: 'completed' });
	expect(clean.output.title).toBe('No visual changes');
});

for (const [failure, title] of [
	['unfinished', 'Comparison did not finish'],
	['cancelled', 'Comparison was cancelled'],
	['publish-failed', 'Publishing the report failed'],
	['unverified-baseline', 'Baseline could not be verified'],
	['outdated-baseline', 'Baseline is out of date'],
] as const) {
	test(`fails the check with the title "${title}"`, () => {
		const failed = payloadFor(checkState({ kind: 'failed', reasons: [] }), {
			failure,
			summary: undefined,
		});
		expect(failed).toMatchObject({
			completed_at: NOW.toISOString(),
			conclusion: 'failure',
			status: 'completed',
		});
		expect(failed.output.title).toBe(title);
		expect(failed.output.summary.split('\n')[0]).toBe(`**Status:** ${title}`);
		expect(failed.output.summary).not.toContain('Review in the visual review app');
		expect(failed.output.text).toContain(`(attempt 2): ${title.toLowerCase()}`);
	});
}

const pendingState = checkState({
	baselineRunId: null,
	baselineSha: null,
	kind: 'pending',
	reasons: [],
});

test('creates a started comparison in progress, with no conclusion', () => {
	const payload = payloadFor(pendingState);

	expect(payload.status).toBe('in_progress');
	expect(payload).not.toHaveProperty('conclusion');
	expect(payload).not.toHaveProperty('completed_at');
	expect(payload.output).toEqual({
		summary: '**Status:** Comparing\n',
		text: '### History\n\n- 2026-11-16 03:22 UTC · Comparison run 345 (attempt 2) started\n',
		title: 'Comparing',
	});
	expect(JSON.parse(payload.external_id)).toEqual(pendingState);
});

test('completes an existing check run as action_required for a started comparison', () => {
	// GitHub ignores a PATCH back to `in_progress` on a completed check run, which would leave an
	// earlier approval passing.
	const payload = payloadFor(pendingState, { updatesExisting: true });

	expect(payload).toMatchObject({
		completed_at: NOW.toISOString(),
		conclusion: 'action_required',
		status: 'completed',
	});
	expect(payload.output.title).toBe('Comparing');
	expect(payload.output.summary).toBe('**Status:** Comparing\n');
	expect(JSON.parse(payload.external_id)).toEqual(pendingState);
});

test(`caps the check run summary at ${MAX_SUMMARY_CHARS} characters`, () => {
	const files = Array.from({ length: 20 }, (_, index) => `${index}${'x'.repeat(5_000)}`);
	const payload = payloadFor(checkState({ reasons: ['infrastructure'] }), {
		infrastructureFiles: files,
	});

	expect(payload.output.summary.length).toBeLessThanOrEqual(MAX_SUMMARY_CHARS);
	expect(payload.output.summary.split('\n')[0]).toBe('**Status:** Needs review');
});

test('keeps the commit history when a later comparison run updates the check', () => {
	const previousText = [
		'### History',
		'',
		'- 2026-11-16 03:40 UTC · Approved by @luke',
		'- 2026-11-16 03:22 UTC · Comparison run 300 (attempt 1): needs review',
		'',
	].join('\n');

	const payload = payloadFor(checkState(), { previousText });

	expect(payload.output.text.split('\n').filter((line) => line.startsWith('- '))).toEqual([
		'- 2026-11-16 03:22 UTC · Comparison run 345 (attempt 2): needs review',
		'- 2026-11-16 03:40 UTC · Approved by @luke',
		'- 2026-11-16 03:22 UTC · Comparison run 300 (attempt 1): needs review',
	]);
});

test(`keeps the newest ${MAX_HISTORY_ENTRIES} history entries`, () => {
	const previous = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, index) => `- old ${index}`);

	const entries = prependHistory(previous.join('\n'), 'new')
		.split('\n')
		.filter((line) => line.startsWith('- '));

	expect(entries).toHaveLength(MAX_HISTORY_ENTRIES);
	expect(entries[0]).toBe('- new');
	expect(entries.at(-1)).toBe(`- old ${MAX_HISTORY_ENTRIES - 2}`);
});

test(`drops the oldest history entries past ${MAX_HISTORY_CHARS} characters`, () => {
	// Ten long entries are well under the entry count, but over the size bound together.
	const previous = Array.from({ length: 10 }, (_, index) => `- old ${index} ${'x'.repeat(9_000)}`);

	const history = prependHistory(previous.join('\n'), 'new');
	const entries = history.split('\n').filter((line) => line.startsWith('- '));

	expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_CHARS);
	expect(entries[0]).toBe('- new');
	expect(entries.slice(1)).toEqual(previous.slice(0, entries.length - 1));
	expect(entries.length).toBe(7);
});

test('cuts one oversized history entry to fit', () => {
	const history = prependHistory(undefined, 'x'.repeat(MAX_HISTORY_CHARS * 2));

	expect(history.length).toBeLessThanOrEqual(MAX_HISTORY_CHARS);
	expect(history.startsWith('### History\n\n- x')).toBe(true);
});

const currentBaseline = { ...baselineRun, id: 678, run_attempt: 1 };

const sweepPlan = (options: Partial<Parameters<typeof planSweep>[0]> = {}) => {
	return planSweep({
		conclusion: 'success',
		latest: latestRun(),
		newestBaseline: currentBaseline,
		now: NOW,
		state: checkState(),
		...options,
	});
};

/** A comparison that finished `ago` milliseconds before {@link NOW}. */
const finishedRun = (ago: number, overrides: Partial<LatestComparison> = {}) => {
	return latestRun({
		run_attempt: 3,
		updated_at: new Date(NOW.getTime() - ago).toISOString(),
		...overrides,
	});
};

const pendingRecord = checkState({
	baselineRunAttempt: null,
	baselineRunId: null,
	baselineSha: null,
	kind: 'pending',
	reasons: [],
});

const notRecorded = (comparison: string) => ({
	action: 'write',
	conclusion: 'failure',
	historyEntry: `${comparison} was not recorded`,
	title: 'Publishing the report failed',
});

test('leaves a passing result of the latest comparison against the current baseline alone', () => {
	for (const kind of ['review', 'clean'] as const) {
		expect(sweepPlan({ state: checkState({ kind }) }).action).toBe('none');
	}
});

// A failing check run already blocks merging and says why, whatever went stale behind it.
for (const conclusion of ['failure', 'neutral', 'cancelled']) {
	test(`leaves a check run that concludes ${JSON.stringify(conclusion)} alone`, () => {
		for (const kind of ['review', 'clean', 'pending', 'failed'] as const) {
			const swept = sweepPlan({
				conclusion,
				latest: finishedRun(SWEEP_GRACE_MS),
				newestBaseline: undefined,
				state: checkState({ kind }),
			});
			expect(swept.action).toBe('none');
		}
	});
}

test('leaves a result of the latest comparison that needs review alone', () => {
	const swept = sweepPlan({
		conclusion: 'action_required',
		latest: finishedRun(SWEEP_GRACE_MS * 10, { run_attempt: 2 }),
		newestBaseline: undefined,
	});

	expect(swept.action).toBe('none');
});

// A new check run is created in progress, so it has no conclusion.
for (const conclusion of [null, undefined, 'action_required']) {
	test(`fails a check run that concludes ${JSON.stringify(conclusion)} long after the latest comparison finished`, () => {
		const sameAttempt = finishedRun(SWEEP_GRACE_MS, { run_attempt: 2 });
		const newerAttempt = finishedRun(SWEEP_GRACE_MS);
		for (const [latest, state] of [
			[sameAttempt, pendingRecord],
			[sameAttempt, checkState({ kind: 'failed' })],
			[newerAttempt, pendingRecord],
			// A result of an older attempt, which an earlier sweep may have set to `Comparing`.
			[newerAttempt, checkState({ kind: 'review' })],
			[newerAttempt, checkState({ kind: 'clean' })],
		] as const) {
			expect(sweepPlan({ conclusion, latest, state })).toEqual(
				notRecorded(`Comparison run 345 (attempt ${latest.run_attempt})`),
			);
		}
	});

	test(`leaves a check run that concludes ${JSON.stringify(conclusion)} alone until the latest comparison has finished for the grace period`, () => {
		const running = latestRun({ conclusion: null, run_attempt: 3, status: 'in_progress' });
		const justFinished = finishedRun(SWEEP_GRACE_MS - 1);
		for (const latest of [running, justFinished, undefined]) {
			for (const state of [pendingRecord, checkState({ kind: 'review' })]) {
				expect(sweepPlan({ conclusion, latest, state }).action).toBe('none');
			}
		}
	});
}

for (const [kind, entry] of [
	['failed', 'The check run passed on a failed result'],
	['pending', 'The check run passed on an unfinished comparison'],
	[undefined, 'The check run passed on a failed result'],
] as const) {
	test(`fails a passing check run that records ${JSON.stringify(kind)}`, () => {
		// Whatever the latest comparison is: the record itself must stop passing.
		for (const latest of [latestRun(), finishedRun(0), undefined]) {
			expect(sweepPlan({ latest, state: checkState({ kind }) })).toEqual({
				action: 'write',
				conclusion: 'failure',
				historyEntry: entry,
				title: 'Publishing the report failed',
			});
		}
	});
}

test('leaves a passing commit with no comparison alone', () => {
	expect(sweepPlan({ latest: undefined }).action).toBe('none');
});

test('shows a newer comparison that is still running as comparing', () => {
	const latest = latestRun({ conclusion: null, run_attempt: 3, status: 'queued' });

	expect(sweepPlan({ latest })).toEqual({
		action: 'write',
		conclusion: 'action_required',
		historyEntry: 'Comparison run 345 (attempt 3) started',
		title: 'Comparing',
	});
});

test('shows a newer finished comparison as comparing until the publisher records it', () => {
	// The recorded pass no longer applies, even while the publisher may still be writing.
	expect(sweepPlan({ latest: finishedRun(SWEEP_GRACE_MS - 1) })).toEqual({
		action: 'write',
		conclusion: 'action_required',
		historyEntry: 'Comparison run 345 (attempt 3) finished and is not recorded yet',
		title: 'Comparing',
	});
});

for (const [name, latest] of [
	['at the end of the grace period', finishedRun(SWEEP_GRACE_MS)],
	['long after it', finishedRun(SWEEP_GRACE_MS * 10)],
	['with no finish time', finishedRun(0, { updated_at: null })],
	['in a newer run', finishedRun(SWEEP_GRACE_MS, { id: 999, run_attempt: 1 })],
] as const) {
	test(`fails a newer finished comparison that was never recorded, ${name}`, () => {
		expect(sweepPlan({ latest })).toEqual(
			notRecorded(`Comparison run ${latest.id} (attempt ${latest.run_attempt})`),
		);
	});
}

for (const [name, newestBaseline] of [
	['a newer baseline run', { ...baselineRun, id: 700, run_attempt: 1 }],
	['a re-run of the recorded baseline', { ...baselineRun, id: 678, run_attempt: 2 }],
	['no successful baseline at all', undefined],
] as const) {
	test(`fails a passing result after ${name}`, () => {
		for (const kind of ['review', 'clean'] as const) {
			expect(sweepPlan({ newestBaseline, state: checkState({ kind }) })).toEqual({
				action: 'write',
				conclusion: 'failure',
				historyEntry: 'Baseline run 678 (attempt 1) is no longer current',
				title: 'Baseline is out of date',
			});
		}
	});
}

test('never fails a skipped comparison for its baseline, because it has none', () => {
	const skipped = checkState({
		baselineRunAttempt: null,
		baselineRunId: null,
		baselineSha: null,
		kind: 'clean',
		reasons: [],
	});

	expect(sweepPlan({ newestBaseline: undefined, state: skipped }).action).toBe('none');
});

const outdated: SweepPresentation = {
	conclusion: 'failure',
	historyEntry: 'Baseline run 678 (attempt 1) is no longer current',
	title: 'Baseline is out of date',
};

const SWEPT_HISTORY = '### History\n\n- 2026-11-16 03:40 UTC · Approved by @luke\n';

/** A check run as the API returns it, recording `state`. */
const storedRun = (
	state: Partial<CheckState> | string,
	overrides: Partial<ExistingCheckRun> = {},
): ExistingCheckRun => ({
	app: { slug: 'luke-ui-visual-review' },
	conclusion: 'success',
	external_id: typeof state === 'string' ? state : JSON.stringify(checkState(state)),
	id: 1,
	output: {
		summary: '**Status:** Approved by @luke\n\n| changed |\n| --- |\n| 2 |\n',
		text: SWEPT_HISTORY,
		title: 'Approved by @luke',
	},
	status: 'completed',
	...overrides,
});

test('changes how a check run reads and never its record', () => {
	const body = presentationBody({ existing: storedRun({}), now: NOW, presentation: outdated });

	expect(body).toEqual({
		completed_at: NOW.toISOString(),
		conclusion: 'failure',
		output: {
			// The report table stays, under the new status.
			summary: '**Status:** Baseline is out of date\n\n| changed |\n| --- |\n| 2 |\n',
			text: '### History\n\n- 2026-11-16 03:22 UTC · Baseline run 678 (attempt 1) is no longer current\n- 2026-11-16 03:40 UTC · Approved by @luke\n',
			title: 'Baseline is out of date',
		},
		status: 'completed',
	});
	for (const key of ['external_id', 'head_sha', 'name']) expect(body).not.toHaveProperty(key);
});

test('completes a check run that is still in progress', () => {
	const inProgress = storedRun(pendingRecord, {
		conclusion: null,
		output: { summary: '**Status:** Comparing\n', text: SWEPT_HISTORY, title: 'Comparing' },
		status: 'in_progress',
	});
	const presentation: SweepPresentation = {
		conclusion: 'failure',
		historyEntry: 'Comparison run 345 (attempt 2) was not recorded',
		title: 'Publishing the report failed',
	};

	expect(presentationBody({ existing: inProgress, now: NOW, presentation })).toMatchObject({
		completed_at: NOW.toISOString(),
		conclusion: 'failure',
		output: { summary: '**Status:** Publishing the report failed\n' },
		status: 'completed',
	});
});

test('writes the status line alone when the summary has none', () => {
	for (const output of [null, { summary: null }, { summary: 'No status here.\n' }]) {
		const body = presentationBody({
			existing: storedRun({}, { output }),
			now: NOW,
			presentation: outdated,
		});
		expect(body.output.summary).toBe('**Status:** Baseline is out of date\n');
	}
});

/** Answers each request with the next response, and records every request. */
function stubRequests(responses: Array<ExistingCheckRun>) {
	const requests: Array<Parameters<CheckRunRequest>[0]> = [];
	const remaining = [...responses];
	const request: CheckRunRequest = async (options) => {
		requests.push(options);
		const next = remaining.shift();
		if (next === undefined) throw new Error('More requests than stubbed responses.');
		return next;
	};
	return { request, requests };
}

const patches = (requests: Array<Parameters<CheckRunRequest>[0]>) => {
	return requests.flatMap((request) => (request.method === 'PATCH' ? [request.body] : []));
};

const sweepWrite = (planned: ExistingCheckRun, responses: Array<ExistingCheckRun>) => {
	const stub = stubRequests(responses);
	const result = writeSweepPresentation({
		now: () => NOW,
		planned,
		presentation: outdated,
		request: stub.request,
	});
	return { requests: stub.requests, result };
};

test('writes the planned presentation when the check run has not changed', async () => {
	const planned = storedRun({});
	// History added between the plan and the write is kept, because the body is built from the
	// read made just before the write.
	const fresh = storedRun({}, { output: { ...planned.output, text: '### History\n\n- newer\n' } });
	const { requests, result } = sweepWrite(planned, [fresh, storedRun({})]);

	await expect(result).resolves.toEqual({
		restored: false,
		title: 'Baseline is out of date',
		written: true,
	});
	expect(requests.map((request) => request.method)).toEqual(['GET', 'PATCH']);
	expect(patches(requests)[0]?.conclusion).toBe('failure');
	expect(patches(requests)[0]?.output.text).toContain('- newer\n');
});

for (const [name, fresh] of [
	['record', storedRun({ runAttempt: 3 })],
	['conclusion', storedRun({}, { conclusion: 'action_required' })],
] as const) {
	test(`writes nothing when the ${name} changed after the plan`, async () => {
		const { requests, result } = sweepWrite(storedRun({}), [fresh]);

		await expect(result).resolves.toMatchObject({ written: false });
		expect(requests.map((request) => request.method)).toEqual(['GET']);
	});
}

for (const [landed, conclusion, title] of [
	[{ kind: 'pending', runAttempt: 3 }, 'action_required', 'Comparing'],
	[{ kind: 'review', runAttempt: 3 }, 'action_required', 'Needs review'],
	[{ kind: 'clean', runAttempt: 3 }, 'success', 'No visual changes'],
	[{ kind: 'failed', runAttempt: 3 }, 'failure', 'Comparison failed'],
	['not json', 'failure', 'Comparison failed'],
] as const) {
	test(`restores a ${JSON.stringify(landed)} record a publication wrote under the sweep`, async () => {
		const planned = storedRun({});
		const overwritten = storedRun(landed, { conclusion: 'failure' });
		const { requests, result } = sweepWrite(planned, [planned, overwritten, storedRun(landed)]);

		await expect(result).resolves.toEqual({ restored: true, title, written: true });
		const [, restore] = patches(requests);
		expect(restore).toMatchObject({ conclusion, output: { title } });
		expect(restore?.output.summary.split('\n')[0]).toBe(`**Status:** ${title}`);
		expect(restore?.output.text).toContain(
			'Sweep withdrawn: a newer result was recorded at the same time',
		);
		expect(restore?.output.text).toContain('- 2026-11-16 03:40 UTC · Approved by @luke');
		for (const body of patches(requests)) expect(body).not.toHaveProperty('external_id');
	});
}

test('restores a pending record with the status alone, and a result with where its report is', () => {
	expect(restoredPresentation(storedRun({ kind: 'pending' })).summary).toBe(
		'**Status:** Comparing\n',
	);
	expect(restoredPresentation(storedRun({ kind: 'review' })).summary).toBe(
		'**Status:** Needs review\n\nA sweep written at the same moment replaced the report summary. The visual review app still has the report.\n',
	);
});

test('writes success only to restore a clean result', async () => {
	const planned = storedRun({});
	for (const kind of ['pending', 'review', 'failed'] as const) {
		const landed = storedRun({ kind, runAttempt: 3 });
		const { requests, result } = sweepWrite(planned, [planned, landed, landed]);
		// Sequential: each case reads its own stub.
		// oxlint-disable-next-line no-await-in-loop
		await result;
		expect(patches(requests).map((body) => body.conclusion)).not.toContain('success');
	}
});

test(`stops after ${MAX_SWEEP_RESTORES} restores and leaves the check needing action`, async () => {
	const planned = storedRun({});
	// Every write lands on yet another clean record.
	const moving = Array.from({ length: MAX_SWEEP_RESTORES + 2 }, (_, index) => {
		return storedRun({ kind: 'clean', runAttempt: 10 + index });
	});
	const { requests, result } = sweepWrite(planned, [planned, ...moving]);

	await expect(result).resolves.toMatchObject({ restored: true, written: true });
	expect(patches(requests).map((body) => body.conclusion)).toEqual([
		'failure',
		...Array.from({ length: MAX_SWEEP_RESTORES }, () => 'success'),
		'action_required',
	]);
	// No request follows the final write.
	expect(requests).toHaveLength(MAX_SWEEP_RESTORES + 3);
});

/** Answers like {@link stubRequests}, but rejects where the response is an `Error`. */
function failingRequests(responses: Array<ExistingCheckRun | Error>) {
	const methods: Array<string> = [];
	const remaining = [...responses];
	const request: CheckRunRequest = async (options) => {
		methods.push(options.method);
		const next = remaining.shift();
		if (next === undefined) throw new Error('More requests than stubbed responses.');
		if (next instanceof Error) throw next;
		return next;
	};
	return { methods, request };
}

test('tries a restore that fails again', async () => {
	const planned = storedRun({});
	const landed = storedRun({ kind: 'clean', runAttempt: 3 });
	const outage = new Error('GitHub API 502');
	const stub = failingRequests([planned, landed, outage, outage, landed]);

	const result = await writeSweepPresentation({
		now: () => NOW,
		planned,
		presentation: outdated,
		request: stub.request,
	});

	expect(result).toEqual({ restored: true, title: 'No visual changes', written: true });
	expect(stub.methods).toEqual(['GET', 'PATCH', 'PATCH', 'PATCH', 'PATCH']);
});

test('gives up on a restore after three failed tries', async () => {
	const planned = storedRun({});
	const outage = new Error('GitHub API 502');
	const stub = failingRequests([
		planned,
		storedRun({ kind: 'clean', runAttempt: 3 }),
		outage,
		outage,
		outage,
	]);

	await expect(
		writeSweepPresentation({
			now: () => NOW,
			planned,
			presentation: outdated,
			request: stub.request,
		}),
	).rejects.toThrow('GitHub API 502');
	expect(stub.methods).toHaveLength(5);
});

test('does not retry its own write, which the next sweep plans again', async () => {
	const planned = storedRun({});
	const stub = failingRequests([planned, new Error('GitHub API 502')]);

	await expect(
		writeSweepPresentation({
			now: () => NOW,
			planned,
			presentation: outdated,
			request: stub.request,
		}),
	).rejects.toThrow('GitHub API 502');
	expect(stub.methods).toEqual(['GET', 'PATCH']);
});

test('stops restoring as soon as a restore lands on the record it restored', async () => {
	const planned = storedRun({});
	const first = storedRun({ kind: 'review', runAttempt: 3 });
	const second = storedRun({ kind: 'clean', runAttempt: 4 });
	const { requests, result } = sweepWrite(planned, [planned, first, second, second]);

	await expect(result).resolves.toEqual({
		restored: true,
		title: 'No visual changes',
		written: true,
	});
	expect(patches(requests).map((body) => body.conclusion)).toEqual([
		'failure',
		'action_required',
		'success',
	]);
});

const revalidate = (latest: LatestComparison | undefined) => {
	return revalidateComparison({ read: async () => latest, runAttempt: 2, runId: 345 });
};

test('records a comparison that is still the latest just before the write', async () => {
	await expect(revalidate(latestRun())).resolves.toEqual({ write: true });
});

for (const [name, latest] of [
	['a newer attempt', latestRun({ run_attempt: 3 })],
	['a newer run', latestRun({ id: 999, run_attempt: 1 })],
	['no comparison', undefined],
] as const) {
	test(`records nothing for a comparison superseded by ${name}`, async () => {
		const decision = await revalidate(latest);

		expect(decision.write).toBe(false);
		expect(!decision.write && decision.reason).toContain('no longer the latest comparison');
	});
}

test('fails rather than records when the latest comparison cannot be read', async () => {
	const read = async () => {
		throw new Error('GitHub API 502');
	};

	await expect(revalidateComparison({ read, runAttempt: 2, runId: 345 })).rejects.toThrow(
		'GitHub API 502',
	);
});

test('records a failed publication only when no newer result is recorded', () => {
	const latest = latestRun({ run_attempt: 3 });
	const failure = { latest, runAttempt: 2, runId: 345 };

	for (const kind of ['review', 'clean'] as const) {
		const recorded = recordedRun({ kind, runAttempt: 3 });
		expect(isSupersededFailure({ ...failure, recorded })).toBe(true);
	}
	// The failure is for the latest comparison itself.
	expect(
		isSupersededFailure({ ...failure, recorded: recordedRun({ runAttempt: 3 }), runAttempt: 3 }),
	).toBe(false);
	// The newer comparison is not recorded as a result yet, or the latest could not be read.
	for (const kind of ['pending', 'failed'] as const) {
		expect(
			isSupersededFailure({ ...failure, recorded: recordedRun({ kind, runAttempt: 3 }) }),
		).toBe(false);
	}
	expect(isSupersededFailure({ ...failure, recorded: recordedRun({ runAttempt: 2 }) })).toBe(false);
	expect(isSupersededFailure({ ...failure, recorded: undefined })).toBe(false);
	expect(
		isSupersededFailure({
			...failure,
			latest: undefined,
			recorded: recordedRun({ runAttempt: 3 }),
		}),
	).toBe(false);
});

test('formats timestamps to the minute in UTC', () => {
	expect(formatTimestamp(new Date('2026-01-02T09:08:59.999Z'))).toBe('2026-01-02 09:08 UTC');
});

test('updates the newest check run this App made, ignoring other sources', () => {
	const runs = [
		{ app: { slug: 'github-actions' }, id: 90 },
		{ app: { slug: 'luke-ui-visual-review' }, id: 10 },
		{ app: { slug: 'luke-ui-visual-review' }, id: 20 },
		{ app: null, id: 99 },
	];

	expect(findOwnCheckRun(runs, 'luke-ui-visual-review')?.id).toBe(20);
	expect(findOwnCheckRun(runs.slice(0, 1), 'luke-ui-visual-review')).toBeUndefined();
});

function comment(options: Partial<Parameters<typeof commentMarkdown>[0]> = {}): string {
	return commentMarkdown({
		appUrl: APP_URL,
		headSha: HEAD_SHA,
		infrastructureFiles: [],
		kind: 'review',
		pullRequest: 12,
		summary: publishedSummary([
			{ id: 'button/hover', status: 'changed' },
			{ id: 'button/idle', status: 'changed' },
			{ id: 'card/new', status: 'added' },
		]),
		...options,
	});
}

test('reports the status, the counts, the commit, and a link to the review app', () => {
	expect(comment()).toBe(
		[
			COMMENT_MARKER,
			'## Visual review',
			'',
			COMMENT_STATUS_START,
			'**Status:** Needs review',
			COMMENT_STATUS_END,
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

test('explains an infrastructure review without differences', () => {
	const markdown = comment({
		infrastructureFiles: ['.github/scripts/visual-ci.ts'],
		summary: publishedSummary([]),
	});

	expect(markdown).not.toContain('| changed |');
	expect(markdown).toContain('changes the visual testing infrastructure');
});

test('reports a clean or failed comparison without a review link for failures', () => {
	expect(comment({ kind: 'clean', summary: publishedSummary([]) })).toContain(
		'**Status:** No visual changes',
	);
	const failed = comment({ kind: 'failed', summary: undefined });
	expect(failed).toContain('**Status:** Comparison did not finish');
	expect(failed).not.toContain('Review in the visual review app');
});

test('uses only the origin of the configured app URL', () => {
	expect(comment({ appUrl: `${APP_URL}/some/path?x=1` })).toContain(`](${APP_URL}/?pr=12)`);
});

for (const url of ['', 'not a url', 'http://insecure.example', 'javascript:alert(1)']) {
	test(`rejects the app URL ${JSON.stringify(url)}`, () => {
		expect(() => comment({ appUrl: url })).toThrow(APP_URL_ERROR_PATTERN);
		expect(() => payloadFor(checkState(), { appUrl: url })).toThrow(APP_URL_ERROR_PATTERN);
	});
}

const BOT = 'luke-ui-visual-review[bot]';

const stickyComment = (overrides: Partial<IssueComment> = {}): IssueComment => ({
	body: `${COMMENT_MARKER}\n## Visual review\n`,
	id: 1,
	user: { login: BOT },
	...overrides,
});

test('finds the sticky comment by marker and App bot author together', () => {
	const comments = [
		stickyComment({ body: 'Looks good to me.', id: 1 }),
		// Anyone can paste the marker, so the author must match too.
		stickyComment({ id: 2, user: { login: 'mallory' } }),
		// The comment from before the App owned it cannot be edited by the App.
		stickyComment({ id: 3, user: { login: 'github-actions[bot]' } }),
		stickyComment({ id: 4, user: null }),
		stickyComment({ body: null, id: 5 }),
		stickyComment({ id: 6 }),
		stickyComment({ id: 7 }),
	];

	expect(findStickyComment(comments, BOT)?.id).toBe(6);
	expect(findStickyComment(comments.slice(0, 5), BOT)).toBeUndefined();
	expect(findStickyComment([], BOT)).toBeUndefined();
});

test('creates a comment only when the commit needs review', () => {
	expect(decideCommentAction('review', undefined)).toEqual({ type: 'create' });
	expect(decideCommentAction('clean', undefined)).toEqual({ type: 'skip' });
	expect(decideCommentAction('failed', undefined)).toEqual({ type: 'skip' });
});

test('updates an existing comment whatever the result', () => {
	expect(decideCommentAction('review', 77)).toEqual({ commentId: 77, type: 'update' });
	expect(decideCommentAction('clean', 77)).toEqual({ commentId: 77, type: 'update' });
	expect(decideCommentAction('failed', 77)).toEqual({ commentId: 77, type: 'update' });
});

test('gives each failure its own status in the comment', () => {
	const cancelled = comment({ failure: 'cancelled', kind: 'failed', summary: undefined });
	expect(cancelled).toContain('**Status:** Comparison was cancelled');
	const unverified = comment({ failure: 'unverified-baseline', kind: 'failed' });
	expect(unverified).toContain('**Status:** Baseline could not be verified');
	expect(unverified).not.toContain('Review in the visual review app');
});

test('never creates a comment for a pending comparison, only updates one', () => {
	expect(decideCommentAction('pending', undefined)).toEqual({ type: 'skip' });
	expect(decideCommentAction('pending', 77)).toEqual({ commentId: 77, type: 'update' });
});

test('sets a pending comment to comparing and keeps the rest of the report', () => {
	const body = comment();

	const updated = replaceCommentStatus(body, 'Comparing');

	expect(updated).toBe(body.replace('**Status:** Needs review', '**Status:** Comparing'));
	expect(updated).toContain('| 2 | 1 | 0 | 30 |');
});

test('replaces a status the review backend rewrote', () => {
	const body = `${COMMENT_MARKER}\n${COMMENT_STATUS_START}\n**Status:** Approved by @luke\n\nextra\n${COMMENT_STATUS_END}\nrest`;

	expect(replaceCommentStatus(body, 'Comparing')).toBe(
		`${COMMENT_MARKER}\n${COMMENT_STATUS_START}\n**Status:** Comparing\n${COMMENT_STATUS_END}\nrest`,
	);
});

for (const body of [
	`${COMMENT_MARKER}\n**Status:** Needs review`,
	`${COMMENT_MARKER}\n${COMMENT_STATUS_START}\n**Status:** Needs review`,
	`${COMMENT_MARKER}\n${COMMENT_STATUS_END}\n${COMMENT_STATUS_START}\n**Status:** Needs review`,
]) {
	test(`leaves a comment without a complete status block alone: ${JSON.stringify(body)}`, () => {
		expect(replaceCommentStatus(body, 'Comparing')).toBeUndefined();
	});
}
