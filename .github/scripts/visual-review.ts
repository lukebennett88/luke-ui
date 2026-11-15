// Visual review publishing helpers. Subcommands keep the YAML thin without a CI framework:
//   resolve-pr — find the open pull request a finished Visual regression run belongs to
//   prepare    — rebuild a publishable site from the untrusted visual-regression-diff artefact
//   comment    — create or update the sticky pull request comment
//
// The publish workflow runs this file with plain `node` and no install, so it imports Node
// built-ins only. It runs with secrets beside an artefact produced by pull request code. Treat
// every byte of that artefact as hostile.

import { constants } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	appendFile,
	lstat,
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	writeFile,
} from 'node:fs/promises';

export type VisualStatus = 'added' | 'changed' | 'removed' | 'unchanged';
export type PublishedStatus = Exclude<VisualStatus, 'unchanged'>;
export type ImageKind = 'expected' | 'actual' | 'diff';

export type PublishedResult = {
	id: string;
	status: PublishedStatus;
	width?: number;
	height?: number;
	mismatchedPixels?: number;
	expectedViewport?: string;
	actualViewport?: string;
};

export type PublishedMeta = {
	pullRequest: number;
	headSha: string;
	runId: number;
	runAttempt: number;
	generatedAt: string;
};

/** The `summary.json` the viewer app fetches from a pull request's deployment. */
export type PublishedSummary = {
	schemaVersion: 1;
	meta: PublishedMeta;
	counts: Record<VisualStatus, number>;
	results: Array<PublishedResult>;
};

export type ArtifactSummary = {
	/** Validated results that differ from the baseline, sorted by id. */
	results: Array<PublishedResult>;
	unchanged: number;
};

export type WorkflowRunHead = {
	event: string;
	headSha: string;
	headRepository: string;
};

export type PullRequestCandidate = {
	number: number;
	head: { sha: string; repo: { full_name: string } | null };
};

export type PublishDecision =
	| { publish: true; number: number }
	| { publish: false; reason: string };

export type IssueComment = {
	id: number;
	body?: string | null;
	user: { login: string } | null;
};

export type CommentAction =
	| { type: 'create' }
	| { type: 'update'; commentId: number }
	| { type: 'skip' };

/** Hidden marker that identifies the one sticky comment this script owns. */
export const COMMENT_MARKER = '<!-- luke-ui-visual-review -->';

/** Up to this many differing captures are embedded in the comment as images. */
export const MAX_INLINE_CAPTURES = 6;

/** Beyond the inline limit, this many capture ids are listed as links. */
export const MAX_LISTED_CAPTURES = 20;

export const MAX_SUMMARY_BYTES = 5 * 1024 * 1024;
export const MAX_RESULTS = 5_000;

/** Cloudflare Pages rejects files over 25 MiB. Stay clear of that limit. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Cloudflare Pages allows 20,000 files in one deployment. Stay well under it. */
export const MAX_PUBLISHED_FILES = 10_000;

const DIFF_ARTIFACT_NAME = 'visual-regression-diff';
const COMMENT_AUTHOR = 'github-actions[bot]';
const SUMMARY_FILE = 'summary.json';
const DIFF_DIR = 'diff';
const IMAGE_WIDTH = 260;
const SHORT_SHA_LENGTH = 7;
const API_PAGE_SIZE = 100;
const MAX_COMMENT_PAGES = 50;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIEWPORT_PATTERN = /^\d{1,5}x\d{1,5}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d{0,14}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const HTML_SPECIAL_PATTERN = /[&<>"']/g;

/** The PNGs each status publishes. Nothing else is ever copied out of the artefact. */
const IMAGE_KINDS: Record<PublishedStatus, ReadonlyArray<ImageKind>> = {
	added: ['actual'],
	changed: ['expected', 'actual', 'diff'],
	removed: ['expected'],
};

const HTML_ENTITIES: Record<string, string> = {
	'"': '&quot;',
	'&': '&amp;',
	"'": '&#39;',
	'<': '&lt;',
	'>': '&gt;',
};

/**
 * Decides which pull request a finished Visual regression run may publish to.
 *
 * The answer comes from the run's own head commit and the GitHub API, never from artefact
 * content. Only an open pull request whose head is still exactly that commit qualifies, so a
 * stale run cannot overwrite the report for a newer push.
 */
export function decidePublish(
	run: WorkflowRunHead,
	pulls: ReadonlyArray<PullRequestCandidate>,
): PublishDecision {
	if (run.event !== 'pull_request') {
		return {
			publish: false,
			reason: `The run was triggered by ${JSON.stringify(run.event)}, not a pull request.`,
		};
	}

	const match = pulls.find(
		(pull) => pull.head.sha === run.headSha && pull.head.repo?.full_name === run.headRepository,
	);
	if (match === undefined) {
		return {
			publish: false,
			reason: `No open pull request from ${run.headRepository} has head ${run.headSha}. The run is stale or its pull request has closed.`,
		};
	}

	return { number: match.number, publish: true };
}

/**
 * Validates the artefact's `summary.json` and keeps only the fields the viewer needs.
 *
 * Path fields (`expected`, `actual`, `diff`) and any other unknown keys are dropped. Image paths
 * are later derived from the validated id alone.
 */
export function parseArtifactSummary(raw: string): ArtifactSummary {
	if (Buffer.byteLength(raw) > MAX_SUMMARY_BYTES) {
		throw new Error(`${SUMMARY_FILE} is larger than ${MAX_SUMMARY_BYTES} bytes.`);
	}

	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		throw new Error(`${SUMMARY_FILE} is not valid JSON.`);
	}

	if (!isRecord(data)) throw new Error(`${SUMMARY_FILE} must be an object.`);
	if (!isRecord(data.counts)) throw new Error(`${SUMMARY_FILE} counts must be an object.`);
	const unchanged = requireCount(data.counts.unchanged, 'counts.unchanged');

	if (!Array.isArray(data.results)) throw new Error(`${SUMMARY_FILE} results must be an array.`);
	if (data.results.length > MAX_RESULTS) {
		throw new Error(`${SUMMARY_FILE} lists more than ${MAX_RESULTS} results.`);
	}

	const seen = new Set<string>();
	const results: Array<PublishedResult> = [];
	for (const [index, entry] of data.results.entries()) {
		const result = parseResult(entry, `results[${index}]`);
		if (seen.has(result.id)) throw new Error(`Duplicate capture id ${JSON.stringify(result.id)}.`);
		seen.add(result.id);
		if (result.status === 'unchanged') continue;
		results.push({ ...result, status: result.status });
	}

	results.sort((a, b) => (a.id < b.id ? -1 : 1));
	return { results, unchanged };
}

/** Reads run metadata from workflow-provided environment values, never from the artefact. */
export function parseMeta(
	env: Record<string, string | undefined>,
	now: () => Date = () => new Date(),
): PublishedMeta {
	const headSha = env.HEAD_SHA ?? '';
	if (!SHA_PATTERN.test(headSha)) throw new Error('HEAD_SHA must be a 40-character commit SHA.');

	return {
		pullRequest: requirePositiveInteger(env.PR_NUMBER, 'PR_NUMBER'),
		headSha,
		runId: requirePositiveInteger(env.RUN_ID, 'RUN_ID'),
		runAttempt: requirePositiveInteger(env.RUN_ATTEMPT, 'RUN_ATTEMPT'),
		generatedAt: now().toISOString(),
	};
}

/**
 * Builds the publishable site in `outDir` from an untrusted artefact directory.
 *
 * The output is an allow-list: the rewritten `summary.json` and the PNGs each validated result
 * implies. Anything else in the artefact, such as `_worker.js`, `_redirects`, `_headers`,
 * `_routes.json`, a `functions` directory, or HTML, is never read and so can never be published.
 */
export async function prepareSite(options: {
	artifactDir: string;
	outDir: string;
	meta: PublishedMeta;
}): Promise<PublishedSummary> {
	const { artifactDir, outDir, meta } = options;

	const existing = await readdir(outDir).catch(() => []);
	if (existing.length > 0) {
		throw new Error(`Refusing to write into ${outDir} because it is not empty.`);
	}

	const artifactRoot = await realpath(artifactDir);
	const rawSummary = await readContainedFile({
		file: path.join(artifactDir, SUMMARY_FILE),
		label: SUMMARY_FILE,
		maxBytes: MAX_SUMMARY_BYTES,
		root: artifactRoot,
	});
	const { results, unchanged } = parseArtifactSummary(rawSummary.toString('utf8'));

	const images = results.flatMap((result) => {
		return IMAGE_KINDS[result.status].map((kind) => imagePath(result.id, kind));
	});
	// One more file for summary.json itself.
	if (images.length + 1 > MAX_PUBLISHED_FILES) {
		throw new Error(`Refusing to publish more than ${MAX_PUBLISHED_FILES} files.`);
	}

	await mkdir(outDir, { recursive: true });
	const diffRoot = path.join(artifactRoot, DIFF_DIR);
	for (const image of images) {
		// Sequential: at most one screenshot is held in memory at a time.
		// oxlint-disable-next-line no-await-in-loop
		const bytes = await readContainedFile({
			file: path.join(artifactDir, ...image.split('/')),
			label: image,
			maxBytes: MAX_IMAGE_BYTES,
			root: diffRoot,
		});
		if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
			throw new Error(`${image} is not a PNG.`);
		}

		const destination = path.join(outDir, ...image.split('/'));
		// oxlint-disable-next-line no-await-in-loop
		await mkdir(path.dirname(destination), { recursive: true });
		// oxlint-disable-next-line no-await-in-loop
		await writeFile(destination, bytes);
	}

	const summary: PublishedSummary = {
		schemaVersion: 1,
		meta,
		counts: countResults(results, unchanged),
		results,
	};
	await writeFile(path.join(outDir, SUMMARY_FILE), `${JSON.stringify(summary, null, '\t')}\n`);
	return summary;
}

/** The sticky comment body for a prepared summary. */
export function commentMarkdown(options: {
	summary: PublishedSummary;
	/** Viewer origin, for example `https://luke-ui-visual-review.pages.dev`. */
	appUrl: string;
	/** Immutable per-deployment origin that serves this report's images. */
	deploymentUrl: string;
}): string {
	const { summary } = options;
	const appUrl = requireHttpsOrigin(options.appUrl, 'APP_URL');
	const deploymentUrl = requireHttpsOrigin(options.deploymentUrl, 'DEPLOYMENT_URL');
	const { pullRequest } = summary.meta;
	const shortSha = summary.meta.headSha.slice(0, SHORT_SHA_LENGTH);

	if (summary.results.length === 0) {
		return `${COMMENT_MARKER}\nNo visual changes for \`${shortSha}\`.\n`;
	}

	const { counts } = summary;
	const captureUrl = (id: string) =>
		`${appUrl}/?pr=${pullRequest}&capture=${encodeURIComponent(id)}`;
	const lines = [
		COMMENT_MARKER,
		'## Visual changes',
		'',
		'| changed | added | removed | unchanged |',
		'| --- | --- | --- | --- |',
		`| ${counts.changed} | ${counts.added} | ${counts.removed} | ${counts.unchanged} |`,
		'',
		`**[Review in the visual review app](${appUrl}/?pr=${pullRequest})**`,
		'',
		`Report for \`${shortSha}\`.`,
		'',
	];

	if (summary.results.length <= MAX_INLINE_CAPTURES) {
		for (const result of summary.results) {
			lines.push(captureDetails(result, captureUrl(result.id), deploymentUrl), '');
		}
		return lines.join('\n');
	}

	for (const result of summary.results.slice(0, MAX_LISTED_CAPTURES)) {
		lines.push(`- ${result.status}: [\`${result.id}\`](${captureUrl(result.id)})`);
	}
	const remaining = summary.results.length - MAX_LISTED_CAPTURES;
	if (remaining > 0) {
		lines.push('', `…and ${remaining} more in the visual review app.`);
	}
	lines.push('');
	return lines.join('\n');
}

/** Finds the sticky comment: it must carry the marker and come from the Actions bot. */
export function findStickyComment(comments: ReadonlyArray<IssueComment>): IssueComment | undefined {
	return comments.find((candidate) => {
		return (
			candidate.user?.login === COMMENT_AUTHOR && (candidate.body ?? '').includes(COMMENT_MARKER)
		);
	});
}

/**
 * One sticky comment per pull request. A report without differences only updates a comment that
 * already exists, so a pull request that never changed pixels gets no comment at all.
 */
export function decideCommentAction(
	differing: number,
	existingCommentId: number | undefined,
): CommentAction {
	if (existingCommentId !== undefined) return { commentId: existingCommentId, type: 'update' };
	if (differing === 0) return { type: 'skip' };
	return { type: 'create' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireCount(value: unknown, label: string): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
		throw new Error(`${SUMMARY_FILE} ${label} must be a non-negative integer.`);
	}
	return value;
}

function optionalCount(value: unknown, label: string): number | undefined {
	return value === undefined ? undefined : requireCount(value, label);
}

function optionalViewport(value: unknown, label: string): string | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== 'string' || !VIEWPORT_PATTERN.test(value)) {
		throw new Error(`${SUMMARY_FILE} ${label} must look like "1280x720".`);
	}
	return value;
}

function isVisualStatus(value: unknown): value is VisualStatus {
	return value === 'added' || value === 'changed' || value === 'removed' || value === 'unchanged';
}

type ArtifactResult = Omit<PublishedResult, 'status'> & { status: VisualStatus };

function parseResult(entry: unknown, label: string): ArtifactResult {
	if (!isRecord(entry)) throw new Error(`${SUMMARY_FILE} ${label} must be an object.`);

	const { id, status } = entry;
	if (typeof id !== 'string' || !CAPTURE_ID_PATTERN.test(id)) {
		throw new Error(`${SUMMARY_FILE} ${label}.id is not a valid capture id.`);
	}
	if (!isVisualStatus(status)) {
		throw new Error(`${SUMMARY_FILE} ${label}.status is not a known status.`);
	}

	const result: ArtifactResult = { id, status };
	const width = optionalCount(entry.width, `${label}.width`);
	const height = optionalCount(entry.height, `${label}.height`);
	const mismatchedPixels = optionalCount(entry.mismatchedPixels, `${label}.mismatchedPixels`);
	const expectedViewport = optionalViewport(entry.expectedViewport, `${label}.expectedViewport`);
	const actualViewport = optionalViewport(entry.actualViewport, `${label}.actualViewport`);
	if (width !== undefined) result.width = width;
	if (height !== undefined) result.height = height;
	if (mismatchedPixels !== undefined) result.mismatchedPixels = mismatchedPixels;
	if (expectedViewport !== undefined) result.expectedViewport = expectedViewport;
	if (actualViewport !== undefined) result.actualViewport = actualViewport;
	return result;
}

function requirePositiveInteger(value: string | undefined, name: string): number {
	if (value === undefined || !POSITIVE_INTEGER_PATTERN.test(value)) {
		throw new Error(`${name} must be a positive integer.`);
	}
	return Number(value);
}

function countResults(
	results: ReadonlyArray<PublishedResult>,
	unchanged: number,
): Record<VisualStatus, number> {
	const counts = { added: 0, changed: 0, removed: 0, unchanged };
	for (const result of results) counts[result.status] += 1;
	return counts;
}

/** Site-relative image path, built from a pattern-validated id. */
function imagePath(id: string, kind: ImageKind): string {
	return `${DIFF_DIR}/${id}.${kind}.png`;
}

/**
 * Reads one artefact file after proving it is a regular file, within the size cap, that
 * resolves inside `root`. A symlink anywhere on the path fails one of those checks.
 */
async function readContainedFile(options: {
	file: string;
	label: string;
	maxBytes: number;
	root: string;
}): Promise<Buffer> {
	const { file, label, maxBytes, root } = options;

	const stats = await lstat(file).catch(() => undefined);
	if (stats === undefined) throw new Error(`Required file ${label} is missing.`);
	if (!stats.isFile()) throw new Error(`${label} is not a regular file.`);
	if (stats.size > maxBytes) throw new Error(`${label} is larger than ${maxBytes} bytes.`);

	const resolved = await realpath(file);
	if (!resolved.startsWith(`${root}${path.sep}`)) {
		throw new Error(`${label} resolves outside the artefact.`);
	}

	// O_NOFOLLOW closes the gap between the checks above and the read.
	const handle = await open(resolved, constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		const opened = await handle.stat();
		if (!opened.isFile()) throw new Error(`${label} is not a regular file.`);
		if (opened.size > maxBytes) throw new Error(`${label} is larger than ${maxBytes} bytes.`);
		return await handle.readFile();
	} finally {
		await handle.close();
	}
}

function requireHttpsOrigin(value: string, name: string): string {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error(`${name} must be an https URL.`);
	}
	if (url.protocol !== 'https:') throw new Error(`${name} must be an https URL.`);
	return url.origin;
}

function escapeHtml(value: string): string {
	return value.replace(HTML_SPECIAL_PATTERN, (character) => HTML_ENTITIES[character] ?? character);
}

function imageUrl(deploymentUrl: string, id: string, kind: ImageKind): string {
	const encoded = imagePath(id, kind).split('/').map(encodeURIComponent).join('/');
	return `${deploymentUrl}/${encoded}`;
}

function captureDetails(result: PublishedResult, captureUrl: string, deploymentUrl: string) {
	const kinds = IMAGE_KINDS[result.status];
	const id = escapeHtml(result.id);
	const headings = kinds.map((kind) => `<th>${kind}</th>`).join('');
	const cells = kinds
		.map((kind) => {
			const source = escapeHtml(imageUrl(deploymentUrl, result.id, kind));
			return `<td><img src="${source}" alt="${kind}: ${id}" width="${IMAGE_WIDTH}"></td>`;
		})
		.join('');

	return [
		'<details>',
		`<summary>${result.status}: <a href="${escapeHtml(captureUrl)}"><code>${id}</code></a></summary>`,
		'',
		'<table>',
		`<tr>${headings}</tr>`,
		`<tr>${cells}</tr>`,
		'</table>',
		'',
		'</details>',
	].join('\n');
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined || value === '') {
		throw new Error(`${name} is not set. This script only runs inside GitHub Actions.`);
	}
	return value;
}

async function writeOutput(name: string, value: string | number | boolean) {
	const file = requireEnv('GITHUB_OUTPUT');
	await appendFile(file, `${name}=${value}\n`);
}

async function writeStepSummary(markdown: string) {
	const file = requireEnv('GITHUB_STEP_SUMMARY');
	await appendFile(file, markdown);
}

function fail(message: string): never {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function info(message: string) {
	process.stdout.write(`${message}\n`);
}

function requireRepository(): string {
	const repository = requireEnv('GITHUB_REPOSITORY');
	if (!REPOSITORY_PATTERN.test(repository)) {
		throw new Error('GITHUB_REPOSITORY is not in "owner/repo" form.');
	}
	return repository;
}

async function githubRequest<T>(options: {
	token: string;
	url: URL | string;
	method?: 'GET' | 'PATCH' | 'POST';
	body?: unknown;
}): Promise<T> {
	const { token, url, method = 'GET', body } = options;
	const response = await fetch(url, {
		body: body === undefined ? undefined : JSON.stringify(body),
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
		},
		method,
	});

	if (!response.ok) {
		throw new Error(`GitHub API ${response.status} for ${method} ${String(url)}`);
	}
	return (await response.json()) as T;
}

async function doNotPublish(reason: string) {
	info(`Nothing to publish: ${reason}`);
	await writeOutput('publish', false);
}

async function resolvePr() {
	const run: WorkflowRunHead = {
		event: process.env.RUN_EVENT ?? '',
		headRepository: process.env.HEAD_REPOSITORY ?? '',
		headSha: process.env.HEAD_SHA ?? '',
	};

	// Decide the non-pull-request case before touching the API.
	if (run.event !== 'pull_request') {
		const decision = decidePublish(run, []);
		await doNotPublish(decision.publish ? '' : decision.reason);
		return;
	}

	if (!SHA_PATTERN.test(run.headSha)) fail('HEAD_SHA must be a 40-character commit SHA.');
	const headBranch = process.env.HEAD_BRANCH ?? '';
	if (headBranch === '' || !REPOSITORY_PATTERN.test(run.headRepository)) {
		// A deleted fork leaves the run without a head repository.
		await doNotPublish('The run has no head branch or head repository.');
		return;
	}

	const token = requireEnv('GITHUB_TOKEN');
	const repository = requireRepository();
	const runId = requirePositiveInteger(process.env.RUN_ID, 'RUN_ID');

	const pullsUrl = new URL(`https://api.github.com/repos/${repository}/pulls`);
	pullsUrl.searchParams.set('state', 'open');
	pullsUrl.searchParams.set('head', `${run.headRepository.split('/')[0]}:${headBranch}`);
	pullsUrl.searchParams.set('per_page', String(API_PAGE_SIZE));
	const pulls = await githubRequest<Array<PullRequestCandidate>>({ token, url: pullsUrl });

	const decision = decidePublish(run, pulls);
	if (!decision.publish) {
		await doNotPublish(decision.reason);
		return;
	}

	// Prose-only pull requests skip the compare job, so their runs upload no artefact.
	const artifactsUrl = new URL(
		`https://api.github.com/repos/${repository}/actions/runs/${runId}/artifacts`,
	);
	artifactsUrl.searchParams.set('name', DIFF_ARTIFACT_NAME);
	const artifacts = await githubRequest<{ total_count: number }>({ token, url: artifactsUrl });
	if (artifacts.total_count === 0) {
		await doNotPublish(`Run ${runId} has no ${DIFF_ARTIFACT_NAME} artefact.`);
		return;
	}

	info(`Publishing run ${runId} for pull request #${decision.number} at ${run.headSha}.`);
	await writeOutput('number', decision.number);
	await writeOutput('sha', run.headSha);
	await writeOutput('publish', true);
}

async function prepare(artifactDir: string | undefined, outDir: string | undefined) {
	if (artifactDir === undefined || outDir === undefined) {
		fail('Usage: visual-review prepare <artifactDir> <outDir>');
	}

	const summary = await prepareSite({
		artifactDir: path.resolve(artifactDir),
		meta: parseMeta(process.env),
		outDir: path.resolve(outDir),
	});
	const { counts } = summary;
	info(
		`Prepared ${path.resolve(outDir)}: ${counts.changed} changed, ${counts.added} added, ${counts.removed} removed, ${counts.unchanged} unchanged.`,
	);
}

async function listComments(token: string, repository: string, pullRequest: number) {
	const comments: Array<IssueComment> = [];
	for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
		const url = new URL(
			`https://api.github.com/repos/${repository}/issues/${pullRequest}/comments`,
		);
		url.searchParams.set('per_page', String(API_PAGE_SIZE));
		url.searchParams.set('page', String(page));
		// Sequential: each page decides whether another one exists.
		// oxlint-disable-next-line no-await-in-loop
		const batch = await githubRequest<Array<IssueComment>>({ token, url });
		comments.push(...batch);
		if (batch.length < API_PAGE_SIZE) break;
	}
	return comments;
}

async function comment(summaryPath: string | undefined) {
	if (summaryPath === undefined) fail('Usage: visual-review comment <summaryPath>');

	const token = requireEnv('GITHUB_TOKEN');
	const repository = requireRepository();
	const pullRequest = requirePositiveInteger(process.env.PR_NUMBER, 'PR_NUMBER');
	const headSha = requireEnv('HEAD_SHA');

	// This file is the output of `prepare`, not artefact content.
	const summary: PublishedSummary = JSON.parse(await readFile(path.resolve(summaryPath), 'utf8'));
	if (summary.meta.pullRequest !== pullRequest || summary.meta.headSha !== headSha) {
		fail('The prepared summary does not match PR_NUMBER and HEAD_SHA.');
	}

	const body = commentMarkdown({
		appUrl: requireEnv('APP_URL'),
		deploymentUrl: requireEnv('DEPLOYMENT_URL'),
		summary,
	});
	await writeStepSummary(body);

	const existing = findStickyComment(await listComments(token, repository, pullRequest));
	const action = decideCommentAction(summary.results.length, existing?.id);
	switch (action.type) {
		case 'skip':
			info('No visual changes and no existing comment. Nothing to post.');
			break;
		case 'create':
			await githubRequest({
				body: { body },
				method: 'POST',
				token,
				url: `https://api.github.com/repos/${repository}/issues/${pullRequest}/comments`,
			});
			info(`Created the visual review comment on pull request #${pullRequest}.`);
			break;
		case 'update':
			await githubRequest({
				body: { body },
				method: 'PATCH',
				token,
				url: `https://api.github.com/repos/${repository}/issues/comments/${action.commentId}`,
			});
			info(`Updated visual review comment ${action.commentId}.`);
			break;
	}
}

const entry = process.argv[1];
const isCli = entry !== undefined && import.meta.url === pathToFileURL(path.resolve(entry)).href;

if (isCli) {
	const [command, ...args] = process.argv.slice(2).filter((arg) => arg !== '--');

	try {
		switch (command) {
			case 'resolve-pr':
				await resolvePr();
				break;
			case 'prepare':
				await prepare(args[0], args[1]);
				break;
			case 'comment':
				await comment(args[0]);
				break;
			case undefined:
				fail('Usage: visual-review <resolve-pr|prepare|comment>');
				break;
			default:
				fail(`Unknown command: ${command}`);
		}
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
	}
}
