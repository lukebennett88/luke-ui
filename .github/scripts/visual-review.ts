// Visual review publishing helpers. Subcommands keep the YAML thin without a CI framework:
//   resolve-pr — find the open pull request a finished Visual regression run belongs to
//   prepare    — rebuild a publishable site from the untrusted visual-regression-diff artefact,
//                in a deploy directory it creates itself
//   review     — record the `visual-review` check run for the commit and update the sticky pull
//                request comment, both as the visual review GitHub App
//
// The publish workflow runs this file with plain `node` and no install, so it imports Node
// built-ins only. It runs with secrets beside an artefact produced by pull request code. Treat
// every byte of that artefact as hostile.

import { constants } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { appendFile, lstat, mkdir, open, readFile, realpath, writeFile } from 'node:fs/promises';

export type VisualStatus = 'added' | 'changed' | 'removed' | 'unchanged';
export type PublishedStatus = Exclude<VisualStatus, 'unchanged'>;
type ImageKind = 'expected' | 'actual' | 'diff';

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
	/** The Visual baseline run the report was compared against, when the artefact names one. */
	baselineRunId: number | null;
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

/**
 * What a finished Visual regression run means for review:
 * - `report`: the comparison ran and uploaded a report
 * - `skipped`: the run passed without comparing, because nothing visual could have changed
 * - `failed`: the run failed, so there is nothing trustworthy to review
 * - `none`: nothing to record, for example a cancelled run that a newer push superseded
 */
export type RunOutcome = 'report' | 'skipped' | 'failed' | 'none';

/**
 * - `review`: someone must approve or request changes
 * - `clean`: nothing to review, so the check passes
 * - `failed`: the comparison did not finish, so the check fails
 */
export type ReviewKind = 'review' | 'clean' | 'failed';
export type ReviewReason = 'visual' | 'infrastructure';

/**
 * The check run's `external_id`. Only this workflow writes it, and a decision never changes it,
 * so the review backend can tell which comparison run an approval applies to.
 */
export type CheckState = {
	v: 1;
	runId: number;
	runAttempt: number;
	baselineRunId: number | null;
	baselineSha: string | null;
	kind: ReviewKind;
	reasons: Array<ReviewReason>;
};

export type CheckRunPayload = {
	name: typeof CHECK_NAME;
	head_sha: string;
	details_url: string;
	external_id: string;
	status: 'completed';
	conclusion: 'action_required' | 'failure' | 'success';
	completed_at: string;
	output: { title: string; summary: string; text: string };
};

export type ExistingCheckRun = {
	id: number;
	app: { slug: string } | null;
	output?: { text?: string | null } | null;
};

/** Hidden marker that identifies the one sticky comment this script owns. */
export const COMMENT_MARKER = '<!-- luke-ui-visual-review -->';

/** The review status inside the sticky comment, which the review backend rewrites in place. */
export const COMMENT_STATUS_START = '<!-- visual-review-status -->';
export const COMMENT_STATUS_END = '<!-- /visual-review-status -->';

/** The check run branch protection requires. The visual review GitHub App owns it. */
export const CHECK_NAME = 'visual-review';

/** Older entries drop off so the check run text stays well under GitHub's 65,535 characters. */
export const MAX_HISTORY_ENTRIES = 50;

/**
 * Files that decide how screenshots are captured and compared. A pull request that changes one of
 * them could change its own comparison, so it needs a visual review even when nothing differs.
 * Each entry is a path prefix.
 */
export const INFRASTRUCTURE_PATHS: ReadonlyArray<string> = [
	'.github/scripts/visual-ci.ts',
	'.github/scripts/visual-gate.sh',
	'.github/scripts/visual-impact.ts',
	'.github/visual-playwright/',
	'.github/workflows/visual-baseline.yml',
	'.github/workflows/visual-image.yml',
	'.github/workflows/visual-regression.yml',
	'packages/@luke-ui/react/scripts/visual-regression',
	'packages/@luke-ui/react/vitest.config.ts',
];

/** Also bounds how many results the artefact can list, since each one costs bytes. */
export const MAX_SUMMARY_BYTES = 5 * 1024 * 1024;

/** Cloudflare Pages rejects files over 25 MiB. Stay clear of that limit. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/**
 * Cloudflare Pages allows 20,000 files in one deployment. The suite has about 320 captures, so
 * a report where every one changed is under 1,000 files.
 */
export const MAX_PUBLISHED_FILES = 3_000;

/**
 * Budget for one report. The whole capture set is about 11 MB and a report where every capture
 * changed is about 35 MB, so this only stops an artefact built to waste storage and upload time.
 */
export const MAX_PUBLISHED_BYTES = 300 * 1024 * 1024;

const DIFF_ARTIFACT_NAME = 'visual-regression-diff';
const SUMMARY_FILE = 'summary.json';
const BASELINE_FILE = 'baseline.json';
const MAX_BASELINE_BYTES = 1024;
const BASELINE_WORKFLOW_PATH = '.github/workflows/visual-baseline.yml';
const BASELINE_BRANCH = 'main';
const MAX_FILE_PAGES = 30;
const MAX_LISTED_INFRASTRUCTURE_FILES = 20;
const MAX_TITLE_LENGTH = 100;
const APP_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;
const DIFF_DIR = 'diff';
const SHORT_SHA_LENGTH = 7;
const API_PAGE_SIZE = 100;
const MAX_COMMENT_PAGES = 50;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIEWPORT_PATTERN = /^\d{1,5}x\d{1,5}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d{0,14}$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/** A check run that needs review blocks merging until a decision replaces `action_required`. */
const CONCLUSIONS: Record<ReviewKind, CheckRunPayload['conclusion']> = {
	clean: 'success',
	failed: 'failure',
	review: 'action_required',
};

/** The PNGs each status publishes. Nothing else is ever copied out of the artefact. */
const IMAGE_KINDS: Record<PublishedStatus, ReadonlyArray<ImageKind>> = {
	added: ['actual'],
	changed: ['expected', 'actual', 'diff'],
	removed: ['expected'],
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

	// The number is written to GITHUB_OUTPUT and into the deploy command, so prove its shape.
	if (!Number.isSafeInteger(match.number) || match.number <= 0) {
		return { publish: false, reason: 'GitHub returned an invalid pull request number.' };
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

export type RunMeta = Omit<PublishedMeta, 'baselineRunId'>;

/** Reads run metadata from workflow-provided environment values, never from the artefact. */
export function parseMeta(
	env: Record<string, string | undefined>,
	now: () => Date = () => new Date(),
): RunMeta {
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
 * Reads the baseline run id the comparison recorded. The artefact is hostile, so this only proves
 * the shape. `review` checks through the GitHub API that the run really is a baseline from `main`.
 * Runs from before the comparison recorded its baseline have no file, and get `null`.
 */
export function parseBaselineRunId(raw: string | undefined): number | null {
	if (raw === undefined) return null;
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		throw new Error(`${BASELINE_FILE} is not valid JSON.`);
	}
	if (!isRecord(data) || typeof data.runId !== 'number' || !Number.isSafeInteger(data.runId)) {
		throw new Error(`${BASELINE_FILE} runId must be a positive integer.`);
	}
	if (data.runId <= 0) throw new Error(`${BASELINE_FILE} runId must be a positive integer.`);
	return data.runId;
}

/**
 * Builds the publishable site in `outDir` from an untrusted artefact directory.
 *
 * The output is an allow-list: the rewritten `summary.json` and the PNGs each validated result
 * implies. Anything else in the artefact, such as `_worker.js`, `_redirects`, `_headers`,
 * `_routes.json`, a `functions` directory, or HTML, is never read and so can never be published.
 *
 * Wrangler runs from the parent of `outDir`, where it would pick up a `functions` directory or
 * a Wrangler configuration file. This function creates that parent itself and refuses one that
 * already exists, so the directory is known to hold the site and nothing else.
 */
export async function prepareSite(options: {
	artifactDir: string;
	outDir: string;
	meta: RunMeta;
}): Promise<PublishedSummary> {
	const { artifactDir, outDir } = options;

	const artifactRoot = await realpath(artifactDir);
	const rawSummary = await readContainedFile({
		file: path.join(artifactDir, SUMMARY_FILE),
		label: SUMMARY_FILE,
		maxBytes: MAX_SUMMARY_BYTES,
		root: artifactRoot,
	});
	const { results, unchanged } = parseArtifactSummary(rawSummary.toString('utf8'));
	const baselineFile = path.join(artifactDir, BASELINE_FILE);
	const rawBaseline = (await lstat(baselineFile).catch(() => undefined))
		? await readContainedFile({
				file: baselineFile,
				label: BASELINE_FILE,
				maxBytes: MAX_BASELINE_BYTES,
				root: artifactRoot,
			})
		: undefined;
	const meta: PublishedMeta = {
		...options.meta,
		baselineRunId: parseBaselineRunId(rawBaseline?.toString('utf8')),
	};

	const diffRoot = path.join(artifactRoot, DIFF_DIR);
	const images = results.flatMap((result) => {
		return IMAGE_KINDS[result.status].map((kind) => {
			const label = imagePath(result.id, kind);
			return {
				file: path.join(artifactDir, ...label.split('/')),
				label,
				maxBytes: MAX_IMAGE_BYTES,
				root: diffRoot,
			};
		});
	});
	// One more file for summary.json itself.
	if (images.length + 1 > MAX_PUBLISHED_FILES) {
		throw new Error(`Refusing to publish more than ${MAX_PUBLISHED_FILES} files.`);
	}

	// Check every file and the total size before writing anything.
	const sizes = await Promise.all(images.map((image) => containedFileSize(image)));
	let expectedBytes = 0;
	for (const size of sizes) expectedBytes = addToBudget(expectedBytes, size);

	const deployDir = path.dirname(outDir);
	await mkdir(deployDir).catch((error: NodeJS.ErrnoException) => {
		if (error.code !== 'EEXIST') throw error;
		throw new Error(`Refusing to deploy from ${deployDir} because it already exists.`);
	});
	await mkdir(outDir);

	let publishedBytes = 0;
	for (const image of images) {
		// Sequential: at most one screenshot is held in memory at a time.
		// oxlint-disable-next-line no-await-in-loop
		const bytes = await readContainedFile(image);
		if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
			throw new Error(`${image.label} is not a PNG.`);
		}
		// Counts the bytes actually read, in case a file changed after the size check.
		publishedBytes = addToBudget(publishedBytes, bytes.length);

		const destination = path.join(outDir, ...image.label.split('/'));
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
	const summaryJson = `${JSON.stringify(summary, null, '\t')}\n`;
	addToBudget(publishedBytes, Buffer.byteLength(summaryJson));
	await writeFile(path.join(outDir, SUMMARY_FILE), summaryJson);
	return summary;
}

/** Decides what a finished Visual regression run means for review, from its conclusion alone. */
export function decideRunOutcome(conclusion: string, hasArtifact: boolean): RunOutcome {
	switch (conclusion) {
		case 'success':
			return hasArtifact ? 'report' : 'skipped';
		case 'failure':
		case 'timed_out':
			return 'failed';
		default:
			// `cancelled` usually means a newer push superseded the run. Leave the check alone.
			return 'none';
	}
}

/** The pull request files that belong to the visual testing infrastructure, sorted. */
export function infrastructureChanges(files: ReadonlyArray<string>): Array<string> {
	return files
		.filter((file) => INFRASTRUCTURE_PATHS.some((prefix) => file.startsWith(prefix)))
		.toSorted();
}

/** Whether a report needs review, and why. */
export function decideReview(options: {
	outcome: Exclude<RunOutcome, 'none'>;
	differing: number;
	infrastructureFiles: ReadonlyArray<string>;
}): { kind: ReviewKind; reasons: Array<ReviewReason> } {
	if (options.outcome === 'failed') return { kind: 'failed', reasons: [] };
	const reasons: Array<ReviewReason> = [];
	if (options.differing > 0) reasons.push('visual');
	if (options.infrastructureFiles.length > 0) reasons.push('infrastructure');
	return { kind: reasons.length > 0 ? 'review' : 'clean', reasons };
}

/** The status line text shared by the check run and the sticky comment. */
export function statusText(kind: ReviewKind): string {
	switch (kind) {
		case 'review':
			return 'Needs review';
		case 'clean':
			return 'No visual changes';
		case 'failed':
			return 'Comparison did not finish';
	}
}

/** `2026-11-16 03:22 UTC`. */
export function formatTimestamp(date: Date): string {
	return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/**
 * Prepends one entry to a check run's history. Lines that are not entries are dropped, and the
 * oldest entries fall off past {@link MAX_HISTORY_ENTRIES}.
 */
export function prependHistory(previousText: string | null | undefined, entry: string): string {
	const previous = (previousText ?? '').split('\n').filter((line) => line.startsWith('- '));
	const entries = [`- ${entry}`, ...previous].slice(0, MAX_HISTORY_ENTRIES);
	return ['### History', '', ...entries, ''].join('\n');
}

function countParts(counts: Record<VisualStatus, number>): Array<string> {
	return (['changed', 'added', 'removed'] as const)
		.filter((status) => counts[status] > 0)
		.map((status) => `${counts[status]} ${status}`);
}

function countsTable(counts: Record<VisualStatus, number>): Array<string> {
	return [
		'| changed | added | removed | unchanged |',
		'| --- | --- | --- | --- |',
		`| ${counts.changed} | ${counts.added} | ${counts.removed} | ${counts.unchanged} |`,
	];
}

function infrastructureList(files: ReadonlyArray<string>): Array<string> {
	const listed = files.slice(0, MAX_LISTED_INFRASTRUCTURE_FILES).map((file) => `- \`${file}\``);
	const more = files.length - listed.length;
	return more > 0 ? [...listed, `- and ${more} more`] : listed;
}

/**
 * The `visual-review` check run for one comparison run. Its first summary line is the status,
 * which the review backend rewrites when someone approves or requests changes.
 */
export function checkRunPayload(options: {
	state: CheckState;
	headSha: string;
	pullRequest: number;
	repository: string;
	/** Present when the run published a report. */
	summary: PublishedSummary | undefined;
	infrastructureFiles: ReadonlyArray<string>;
	appUrl: string;
	previousText: string | null | undefined;
	now: Date;
}): CheckRunPayload {
	const { state, summary, infrastructureFiles, now } = options;
	const appUrl = requireHttpsOrigin(options.appUrl, 'APP_URL');
	const detailsUrl = `${appUrl}/?pr=${options.pullRequest}`;
	const runUrl = `https://github.com/${options.repository}/actions/runs/${state.runId}`;
	const status = statusText(state.kind);

	const reasonParts: Array<string> = [];
	if (state.reasons.includes('visual') && summary !== undefined) {
		reasonParts.push(countParts(summary.counts).join(', '));
	}
	if (state.reasons.includes('infrastructure')) {
		reasonParts.push('visual testing infrastructure changed');
	}
	const title = state.kind === 'review' ? `${status}: ${reasonParts.join('; ')}` : status;

	const baseline =
		state.baselineRunId === null
			? 'an unrecorded baseline'
			: `baseline run [${state.baselineRunId}](https://github.com/${options.repository}/actions/runs/${state.baselineRunId})${
					state.baselineSha === null
						? ' (unverified)'
						: ` from \`main@${state.baselineSha.slice(0, SHORT_SHA_LENGTH)}\``
				}`;

	const lines = [`**Status:** ${status}`, ''];
	if (summary !== undefined) lines.push(...countsTable(summary.counts), '');
	if (state.kind !== 'failed') lines.push(`[Review in the visual review app](${detailsUrl})`, '');
	lines.push(
		`Comparison run [${state.runId}](${runUrl}) (attempt ${state.runAttempt}) against ${baseline}.`,
	);
	if (infrastructureFiles.length > 0) {
		lines.push(
			'',
			'This pull request changes the visual testing infrastructure, so it needs a review even when nothing differs:',
			'',
			...infrastructureList(infrastructureFiles),
		);
	}

	const entry = `${formatTimestamp(now)} · Comparison run ${state.runId} (attempt ${state.runAttempt}): ${status.toLowerCase()}`;

	return {
		completed_at: now.toISOString(),
		conclusion: CONCLUSIONS[state.kind],
		details_url: detailsUrl,
		external_id: JSON.stringify(state),
		head_sha: options.headSha,
		name: CHECK_NAME,
		output: {
			summary: `${lines.join('\n')}\n`,
			text: prependHistory(options.previousText, entry),
			title: title.slice(0, MAX_TITLE_LENGTH),
		},
		status: 'completed',
	};
}

/**
 * The one check run this App already made for the commit, if any. Re-running a comparison updates
 * it instead of adding a second run with the same name.
 */
export function findOwnCheckRun(
	runs: ReadonlyArray<ExistingCheckRun>,
	appSlug: string,
): ExistingCheckRun | undefined {
	return runs.filter((run) => run.app?.slug === appSlug).toSorted((a, b) => b.id - a.id)[0];
}

/** The sticky comment body: the review status, the counts, and a link to the review app. */
export function commentMarkdown(options: {
	kind: ReviewKind;
	pullRequest: number;
	headSha: string;
	summary: PublishedSummary | undefined;
	infrastructureFiles: ReadonlyArray<string>;
	/** Viewer origin, for example `https://luke-ui-visual-review.pages.dev`. */
	appUrl: string;
}): string {
	const { kind, summary } = options;
	const appUrl = requireHttpsOrigin(options.appUrl, 'APP_URL');
	const shortSha = options.headSha.slice(0, SHORT_SHA_LENGTH);

	const lines = [
		COMMENT_MARKER,
		'## Visual review',
		'',
		COMMENT_STATUS_START,
		`**Status:** ${statusText(kind)}`,
		COMMENT_STATUS_END,
		'',
	];
	if (summary !== undefined && summary.results.length > 0) {
		lines.push(...countsTable(summary.counts), '');
	}
	if (options.infrastructureFiles.length > 0) {
		lines.push(
			'This pull request changes the visual testing infrastructure, so it needs a review even when nothing differs.',
			'',
		);
	}
	if (kind !== 'failed') {
		lines.push(`**[Review in the visual review app](${appUrl}/?pr=${options.pullRequest})**`, '');
	}
	lines.push(`Report for \`${shortSha}\`.`, '');
	return lines.join('\n');
}

/** Finds the sticky comment: it must carry the marker and come from the given bot. */
export function findStickyComment(
	comments: ReadonlyArray<IssueComment>,
	author: string,
): IssueComment | undefined {
	return comments.find((candidate) => {
		return candidate.user?.login === author && (candidate.body ?? '').includes(COMMENT_MARKER);
	});
}

/**
 * One sticky comment per pull request. Only a report that needs review creates one, so a pull
 * request that never needed a review gets no comment at all.
 */
export function decideCommentAction(
	kind: ReviewKind,
	existingCommentId: number | undefined,
): CommentAction {
	if (existingCommentId !== undefined) return { commentId: existingCommentId, type: 'update' };
	if (kind !== 'review') return { type: 'skip' };
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

type ContainedFile = {
	file: string;
	/** Artefact-relative name used in error messages. */
	label: string;
	maxBytes: number;
	/** Resolved directory the file must stay inside. */
	root: string;
};

/**
 * Proves an artefact file is a regular file, within its size cap, that resolves inside `root`,
 * and returns its size. A symlink anywhere on the path fails one of those checks.
 */
async function containedFileSize(options: ContainedFile): Promise<number> {
	const { file, label, maxBytes, root } = options;

	const stats = await lstat(file).catch(() => undefined);
	if (stats === undefined) throw new Error(`Required file ${label} is missing.`);
	if (!stats.isFile()) throw new Error(`${label} is not a regular file.`);
	if (stats.size > maxBytes) throw new Error(`${label} is larger than ${maxBytes} bytes.`);

	const resolved = await realpath(file);
	if (!resolved.startsWith(`${root}${path.sep}`)) {
		throw new Error(`${label} resolves outside the artefact.`);
	}
	return stats.size;
}

/** Reads one artefact file after the {@link containedFileSize} checks. */
async function readContainedFile(options: ContainedFile): Promise<Buffer> {
	const { file, label, maxBytes } = options;
	await containedFileSize(options);

	// O_NOFOLLOW closes the gap between the checks above and the read.
	const handle = await open(await realpath(file), constants.O_RDONLY | constants.O_NOFOLLOW);
	try {
		const opened = await handle.stat();
		if (!opened.isFile()) throw new Error(`${label} is not a regular file.`);
		if (opened.size > maxBytes) throw new Error(`${label} is larger than ${maxBytes} bytes.`);
		return await handle.readFile();
	} finally {
		await handle.close();
	}
}

/** Adds `bytes` to a running total and fails once the report exceeds its size budget. */
function addToBudget(total: number, bytes: number): number {
	const next = total + bytes;
	if (next > MAX_PUBLISHED_BYTES) {
		throw new Error(`Refusing to publish more than ${MAX_PUBLISHED_BYTES} bytes.`);
	}
	return next;
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
	await writeOutput('outcome', 'none');
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

	const conclusion = process.env.RUN_CONCLUSION ?? '';
	let hasArtifact = false;
	if (conclusion === 'success') {
		// Prose-only pull requests skip the compare job, so their runs upload no artefact.
		const artifactsUrl = new URL(
			`https://api.github.com/repos/${repository}/actions/runs/${runId}/artifacts`,
		);
		artifactsUrl.searchParams.set('name', DIFF_ARTIFACT_NAME);
		const artifacts = await githubRequest<{ total_count: number }>({ token, url: artifactsUrl });
		hasArtifact = artifacts.total_count > 0;
	}

	const outcome = decideRunOutcome(conclusion, hasArtifact);
	info(
		`Run ${runId} for pull request #${decision.number} at ${run.headSha} concluded ${JSON.stringify(conclusion)}: ${outcome}.`,
	);
	await writeOutput('number', decision.number);
	await writeOutput('sha', run.headSha);
	await writeOutput('outcome', outcome);
	await writeOutput('publish', outcome === 'report');
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

/** Lists the pull request's changed files. Past GitHub's 3,000-file limit the list is partial. */
async function listPullFiles(token: string, repository: string, pullRequest: number) {
	const files: Array<string> = [];
	for (let page = 1; page <= MAX_FILE_PAGES; page += 1) {
		const url = new URL(`https://api.github.com/repos/${repository}/pulls/${pullRequest}/files`);
		url.searchParams.set('per_page', String(API_PAGE_SIZE));
		url.searchParams.set('page', String(page));
		// Sequential: each page decides whether another one exists.
		// oxlint-disable-next-line no-await-in-loop
		const batch = await githubRequest<Array<{ filename: string }>>({ token, url });
		files.push(...batch.map((file) => file.filename));
		if (batch.length < API_PAGE_SIZE) return { complete: true, files };
	}
	return { complete: false, files };
}

/**
 * Confirms through the GitHub API that the run the artefact names is a successful Visual baseline
 * run on `main`, and returns its commit. Anything else is recorded as unverified.
 */
async function verifyBaseline(token: string, repository: string, runId: number) {
	try {
		const run = await githubRequest<{
			path?: string;
			head_branch?: string | null;
			head_sha?: string;
			conclusion?: string | null;
			repository?: { full_name?: string };
		}>({ token, url: `https://api.github.com/repos/${repository}/actions/runs/${runId}` });
		const verified =
			run.path === BASELINE_WORKFLOW_PATH &&
			run.head_branch === BASELINE_BRANCH &&
			run.conclusion === 'success' &&
			run.repository?.full_name === repository &&
			SHA_PATTERN.test(run.head_sha ?? '');
		if (verified) return run.head_sha ?? null;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		info(`Could not read baseline run ${runId}: ${reason}`);
	}
	info(
		`Baseline run ${runId} is not a successful Visual baseline run on main. Recording it as unverified.`,
	);
	return null;
}

async function review() {
	const outcome = requireEnv('OUTCOME');
	if (outcome !== 'report' && outcome !== 'skipped' && outcome !== 'failed') {
		fail(`OUTCOME must be report, skipped, or failed, not ${JSON.stringify(outcome)}.`);
	}
	const githubToken = requireEnv('GITHUB_TOKEN');
	const appToken = requireEnv('APP_TOKEN');
	const appSlug = requireEnv('APP_SLUG');
	if (!APP_SLUG_PATTERN.test(appSlug)) fail('APP_SLUG is not a GitHub App slug.');
	const repository = requireRepository();
	const appUrl = requireEnv('APP_URL');
	const pullRequest = requirePositiveInteger(process.env.PR_NUMBER, 'PR_NUMBER');
	const headSha = requireEnv('HEAD_SHA');
	if (!SHA_PATTERN.test(headSha)) fail('HEAD_SHA must be a 40-character commit SHA.');
	const runId = requirePositiveInteger(process.env.RUN_ID, 'RUN_ID');
	const runAttempt = requirePositiveInteger(process.env.RUN_ATTEMPT, 'RUN_ATTEMPT');

	let summary: PublishedSummary | undefined;
	if (outcome === 'report') {
		// This file is the output of `prepare`, not artefact content.
		summary = JSON.parse(await readFile(path.resolve(requireEnv('SUMMARY_FILE')), 'utf8'));
		if (summary?.meta.pullRequest !== pullRequest || summary.meta.headSha !== headSha) {
			fail('The prepared summary does not match PR_NUMBER and HEAD_SHA.');
		}
	}

	const pullFiles = await listPullFiles(githubToken, repository, pullRequest);
	const infrastructureFiles = infrastructureChanges(pullFiles.files);
	if (!pullFiles.complete) {
		// Files past the limit cannot be checked, so assume they include infrastructure.
		infrastructureFiles.push('(files past the 3,000 GitHub lists)');
	}

	const baselineRunId = summary?.meta.baselineRunId ?? null;
	const baselineSha =
		baselineRunId === null ? null : await verifyBaseline(githubToken, repository, baselineRunId);
	const { kind, reasons } = decideReview({
		differing: summary?.results.length ?? 0,
		infrastructureFiles,
		outcome,
	});
	const state: CheckState = { baselineRunId, baselineSha, kind, reasons, runAttempt, runId, v: 1 };

	const checkRunsUrl = new URL(
		`https://api.github.com/repos/${repository}/commits/${headSha}/check-runs`,
	);
	checkRunsUrl.searchParams.set('check_name', CHECK_NAME);
	checkRunsUrl.searchParams.set('filter', 'all');
	checkRunsUrl.searchParams.set('per_page', String(API_PAGE_SIZE));
	const { check_runs: checkRuns } = await githubRequest<{ check_runs: Array<ExistingCheckRun> }>({
		token: appToken,
		url: checkRunsUrl,
	});
	const existing = findOwnCheckRun(checkRuns, appSlug);

	const payload = checkRunPayload({
		appUrl,
		headSha,
		infrastructureFiles,
		now: new Date(),
		previousText: existing?.output?.text,
		pullRequest,
		repository,
		state,
		summary,
	});
	if (existing === undefined) {
		await githubRequest({
			body: payload,
			method: 'POST',
			token: appToken,
			url: `https://api.github.com/repos/${repository}/check-runs`,
		});
		info(`Created the ${CHECK_NAME} check run for ${headSha}: ${payload.output.title}.`);
	} else {
		const { head_sha: _headSha, ...update } = payload;
		await githubRequest({
			body: update,
			method: 'PATCH',
			token: appToken,
			url: `https://api.github.com/repos/${repository}/check-runs/${existing.id}`,
		});
		info(`Updated ${CHECK_NAME} check run ${existing.id} for ${headSha}: ${payload.output.title}.`);
	}

	const body = commentMarkdown({
		appUrl,
		headSha,
		infrastructureFiles,
		kind,
		pullRequest,
		summary,
	});
	await writeStepSummary(body);

	const comments = await listComments(appToken, repository, pullRequest);
	const sticky = findStickyComment(comments, `${appSlug}[bot]`);
	const action = decideCommentAction(kind, sticky?.id);
	switch (action.type) {
		case 'skip':
			info('Nothing to review and no existing comment. Nothing to post.');
			break;
		case 'create':
			await githubRequest({
				body: { body },
				method: 'POST',
				token: appToken,
				url: `https://api.github.com/repos/${repository}/issues/${pullRequest}/comments`,
			});
			info(`Created the visual review comment on pull request #${pullRequest}.`);
			break;
		case 'update':
			await githubRequest({
				body: { body },
				method: 'PATCH',
				token: appToken,
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
			case 'review':
				await review();
				break;
			case undefined:
				fail('Usage: visual-review <resolve-pr|prepare|review>');
				break;
			default:
				fail(`Unknown command: ${command}`);
		}
	} catch (error) {
		fail(error instanceof Error ? error.message : String(error));
	}
}
