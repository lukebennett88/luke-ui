// Visual review publishing helpers. Subcommands keep the YAML thin without a CI framework:
//   resolve-pr — find the open pull request a Visual regression run belongs to, and confirm the
//                run is still the latest comparison for its commit
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

/** The `workflow_run` activity this workflow subscribes to. */
export type RunAction = 'requested' | 'in_progress' | 'completed';

/**
 * What a Visual regression run means for review:
 * - `pending`: the comparison started, so any earlier decision on the commit no longer applies
 * - `report`: the comparison ran and uploaded a report
 * - `skipped`: the run passed without comparing, because nothing visual could have changed
 * - `failed`: the run failed or timed out, so there is nothing trustworthy to review
 * - `cancelled`: the run was cancelled
 * - `none`: nothing to record, for example a run a newer comparison superseded
 */
export type RunOutcome = 'pending' | 'report' | 'skipped' | 'failed' | 'cancelled' | 'none';

/**
 * What `review` records. `publish-failed` comes from the workflow, not the run: a step after the
 * App token failed, so the report may be missing or out of date.
 */
export type ReviewOutcome = Exclude<RunOutcome, 'none'> | 'publish-failed';

/**
 * - `pending`: a comparison is running, so the check is in progress
 * - `review`: someone must approve or request changes
 * - `clean`: nothing to review, so the check passes
 * - `failed`: there is no verified result to review, so the check fails
 */
export type ReviewKind = 'pending' | 'review' | 'clean' | 'failed';
export type ReviewReason = 'visual' | 'infrastructure';

/** Why a check run failed. Each one has its own title. */
export type FailureReason = 'unfinished' | 'cancelled' | 'publish-failed' | 'unverified-baseline';

export const FAILURE_TITLES: Record<FailureReason, string> = {
	cancelled: 'Comparison was cancelled',
	'publish-failed': 'Publishing the report failed',
	unfinished: 'Comparison did not finish',
	'unverified-baseline': 'Baseline could not be verified',
};

export type ReviewDecision = {
	kind: ReviewKind;
	reasons: Array<ReviewReason>;
	/** Present when `kind` is `failed`. */
	failure?: FailureReason;
};

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

type CheckRunFields = {
	name: typeof CHECK_NAME;
	head_sha: string;
	details_url: string;
	external_id: string;
	output: { title: string; summary: string; text: string };
};

export type CheckConclusion = 'action_required' | 'failure' | 'success';

/**
 * A new pending check run is `in_progress`. GitHub ignores `in_progress` on a completed check run,
 * so a pending update to an existing one is `completed` with `action_required`.
 */
export type CheckRunPayload =
	| (CheckRunFields & { status: 'in_progress' })
	| (CheckRunFields & {
			status: 'completed';
			conclusion: CheckConclusion;
			completed_at: string;
	  });

export type ExistingCheckRun = {
	id: number;
	app: { slug: string } | null;
	status?: string | null;
	external_id?: string | null;
	output?: { text?: string | null } | null;
};

/** The newest `Visual regression` pull request run for a commit, from the GitHub API. */
export type LatestComparison = { id: number; run_attempt: number; status?: string | null };

/** The fields of a workflow run that decide whether it is a trustworthy baseline. */
export type BaselineRun = {
	path?: string | null;
	head_branch?: string | null;
	head_sha?: string | null;
	event?: string | null;
	status?: string | null;
	conclusion?: string | null;
	head_repository?: { full_name?: string | null } | null;
};

/** One entry of the pull request files API. */
export type PullFile = { filename: string; previous_filename?: string; status: string };

/** A file read through the contents API at one side of the pull request. */
export type FileContent =
	| { kind: 'missing' }
	| { kind: 'too-large' }
	| { kind: 'text'; text: string };

export type FileReader = (file: string, side: 'base' | 'head') => Promise<FileContent>;

/** Hidden marker that identifies the one sticky comment this script owns. */
export const COMMENT_MARKER = '<!-- luke-ui-visual-review -->';

/** The review status inside the sticky comment, which the review backend rewrites in place. */
export const COMMENT_STATUS_START = '<!-- visual-review-status -->';
export const COMMENT_STATUS_END = '<!-- /visual-review-status -->';

/** The check run branch protection requires. The visual review GitHub App owns it. */
export const CHECK_NAME = 'visual-review';

/**
 * Older history entries drop off once either bound is reached, so the check run text stays under
 * GitHub's 65,535 characters.
 */
export const MAX_HISTORY_ENTRIES = 50;
export const MAX_HISTORY_CHARS = 60_000;

/** The check run summary has the same 65,535-character limit as its text. */
export const MAX_SUMMARY_CHARS = 60_000;

/**
 * Files that decide how screenshots are captured and compared. A pull request that changes one of
 * them could change its own comparison, so it needs a visual review even when nothing differs.
 * Each entry is a path prefix.
 */
export const INFRASTRUCTURE_PATHS: ReadonlyArray<string> = [
	'.github/scripts/package.json',
	'.github/scripts/visual-',
	'.github/visual-playwright/',
	'.github/workflows/visual-baseline.yml',
	'.github/workflows/visual-image.yml',
	'.github/workflows/visual-regression.yml',
	'.npmrc',
	'.pnpmfile.cjs',
	'packages/@luke-ui/react/scripts/visual-regression',
	'packages/@luke-ui/react/src/core/test-utils/',
	'packages/@luke-ui/react/vitest.config.ts',
	'patches/',
	'turbo.json',
];

/**
 * Configuration files that apply wherever they sit in the workspace, so a nested copy is
 * infrastructure too.
 */
export const INFRASTRUCTURE_FILE_NAMES: ReadonlyArray<string> = [
	'.npmrc',
	'.pnpmfile.cjs',
	'turbo.json',
];

/** Past this the pull request files API stops listing, so the rest cannot be checked. */
export const MAX_LISTED_PULL_FILES = 3_000;

/** A `package.json` or `pnpm-workspace.yaml` larger than this is infrastructure unread. */
export const MAX_COMPARED_FILE_BYTES = 1024 * 1024;

/** `package.json` fields a pull request can change without changing how the comparison runs. */
const PACKAGE_JSON_DEPENDENCY_FIELDS: ReadonlySet<string> = new Set([
	'dependencies',
	'devDependencies',
	'optionalDependencies',
	'peerDependencies',
	'version',
]);

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
const BASELINE_EVENTS: ReadonlySet<string> = new Set(['push', 'workflow_dispatch']);
const COMPARISON_WORKFLOW_FILE = 'visual-regression.yml';
const MAX_FILE_PAGES = MAX_LISTED_PULL_FILES / 100;
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
const CONCLUSIONS: Record<Exclude<ReviewKind, 'pending'>, CheckConclusion> = {
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

/**
 * Whether the comparison `(runId, runAttempt)` is the latest comparison for its commit. `latest` is
 * the newest `Visual regression` pull request run for the commit. A re-run keeps the run id and
 * raises `run_attempt` as soon as it is requested, so it makes the earlier attempt stale at once.
 */
export function isLatestComparison(
	latest: LatestComparison | undefined,
	runId: number,
	runAttempt: number,
): boolean {
	return latest !== undefined && latest.id === runId && latest.run_attempt === runAttempt;
}

/** Decides what a Visual regression run event means for review. */
export function decideRunOutcome(
	action: string,
	conclusion: string,
	hasArtifact: boolean,
): RunOutcome {
	if (action === 'requested' || action === 'in_progress') return 'pending';
	if (action !== 'completed') return 'none';
	switch (conclusion) {
		case 'success':
			return hasArtifact ? 'report' : 'skipped';
		case 'failure':
		case 'timed_out':
			return 'failed';
		case 'cancelled':
			return 'cancelled';
		default:
			return 'none';
	}
}

/**
 * Returns the commit a run names when it is a successful `Visual baseline` run of this
 * repository's `main`, and `null` for anything else. `repository.full_name` is always the base
 * repository, so the head repository is what proves the run built this repository's `main`.
 */
export function verifiedBaselineSha(run: BaselineRun, repository: string): string | null {
	const headSha = run.head_sha ?? '';
	const verified =
		run.path === BASELINE_WORKFLOW_PATH &&
		run.head_branch === BASELINE_BRANCH &&
		BASELINE_EVENTS.has(run.event ?? '') &&
		run.head_repository?.full_name === repository &&
		run.status === 'completed' &&
		run.conclusion === 'success' &&
		SHA_PATTERN.test(headSha);
	return verified ? headSha : null;
}

/** The changed paths that match the static infrastructure list, sorted and without duplicates. */
export function infrastructureChanges(files: ReadonlyArray<string>): Array<string> {
	const matches = files.filter((file) => {
		const name = file.slice(file.lastIndexOf('/') + 1);
		return (
			INFRASTRUCTURE_PATHS.some((prefix) => file.startsWith(prefix)) ||
			INFRASTRUCTURE_FILE_NAMES.includes(name)
		);
	});
	return [...new Set(matches)].toSorted();
}

/**
 * Whether a `package.json` change is infrastructure. Only dependency ranges and the version may
 * change: anything else, such as `scripts` or `pnpm`, can change how the comparison runs. A missing
 * file compares as `{}`. A file that is too large or not a JSON object is infrastructure.
 */
export function packageJsonIsInfrastructure(base: FileContent, head: FileContent): boolean {
	const before = comparablePackageJson(base);
	const after = comparablePackageJson(head);
	return before === undefined || after === undefined || before !== after;
}

function comparablePackageJson(content: FileContent): string | undefined {
	if (content.kind === 'missing') return '{}';
	if (content.kind === 'too-large') return undefined;
	if (Buffer.byteLength(content.text) > MAX_COMPARED_FILE_BYTES) return undefined;
	let data: unknown;
	try {
		data = JSON.parse(content.text);
	} catch {
		return undefined;
	}
	if (!isRecord(data)) return undefined;
	const rest = Object.fromEntries(
		Object.entries(data).filter(([key]) => !PACKAGE_JSON_DEPENDENCY_FIELDS.has(key)),
	);
	return canonicalJson(rest);
}

/** JSON with object keys sorted, so key order alone never counts as a change. */
function canonicalJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
	if (isRecord(value)) {
		const entries = Object.keys(value)
			.toSorted()
			.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
		return `{${entries.join(',')}}`;
	}
	return JSON.stringify(value);
}

/**
 * Removes the top-level `catalog:` and `catalogs:` blocks from a `pnpm-workspace.yaml`. A block runs
 * from its key line to the next line that starts at column 0 and is neither blank nor a comment.
 * Returns `undefined` when a removed line defines a YAML anchor, because an alias elsewhere could
 * carry the catalog's values into a setting that is compared.
 */
export function stripCatalogBlocks(text: string): string | undefined {
	const kept: Array<string> = [];
	let inCatalog = false;
	for (const line of text.split('\n')) {
		if (/^[^\s#]/.test(line)) inCatalog = /^catalogs?:/.test(line);
		if (!inCatalog) {
			kept.push(line);
			continue;
		}
		if (/(?:^|[\s:,[{-])&\S/.test(line)) return undefined;
	}
	return kept.join('\n');
}

/**
 * Whether a `pnpm-workspace.yaml` change is infrastructure. Only the catalog blocks may change.
 * Everything else, such as `overrides` or `patchedDependencies`, is compared verbatim.
 */
export function workspaceIsInfrastructure(base: FileContent, head: FileContent): boolean {
	const before = comparableWorkspace(base);
	const after = comparableWorkspace(head);
	return before === undefined || after === undefined || before !== after;
}

function comparableWorkspace(content: FileContent): string | undefined {
	if (content.kind === 'missing') return '';
	if (content.kind === 'too-large') return undefined;
	if (Buffer.byteLength(content.text) > MAX_COMPARED_FILE_BYTES) return undefined;
	return stripCatalogBlocks(content.text);
}

const COMPARED_FILES: Record<string, (base: FileContent, head: FileContent) => boolean> = {
	'package.json': packageJsonIsInfrastructure,
	'pnpm-workspace.yaml': workspaceIsInfrastructure,
};

/** Shown in place of the files a pull request too large to list may hide. */
export const UNLISTED_FILES_ENTRY = `(files past the ${MAX_LISTED_PULL_FILES.toLocaleString('en')} GitHub lists)`;

/**
 * The pull request's visual testing infrastructure changes, sorted. Both the new and the previous
 * name of a renamed file count. `package.json` and `pnpm-workspace.yaml` are read at both sides of
 * the pull request and count only when their change could alter the comparison. A file that the
 * pull request says exists but cannot be read is infrastructure.
 */
export async function findInfrastructureChanges(options: {
	files: ReadonlyArray<PullFile>;
	/** False when the pull request changes more files than the API lists. */
	complete: boolean;
	read: FileReader;
}): Promise<Array<string>> {
	const { files, read } = options;
	const paths = files.flatMap((file) => {
		return file.previous_filename === undefined
			? [file.filename]
			: [file.filename, file.previous_filename];
	});
	const found = new Set(infrastructureChanges(paths));

	const reads: Array<{ path: string; base: boolean; head: boolean }> = [];
	for (const file of files) {
		const created =
			file.status === 'added' || file.status === 'renamed' || file.status === 'copied';
		reads.push({ base: !created, head: file.status !== 'removed', path: file.filename });
		if (file.previous_filename !== undefined) {
			reads.push({ base: true, head: file.status === 'copied', path: file.previous_filename });
		}
	}

	const checks = reads
		.filter(({ path: file }) => !found.has(file))
		.map(async (expected) => {
			const compare = COMPARED_FILES[expected.path.slice(expected.path.lastIndexOf('/') + 1)];
			if (compare === undefined) return;
			const [base, head] = await Promise.all([
				read(expected.path, 'base'),
				read(expected.path, 'head'),
			]);
			const unreadable =
				(expected.base && base.kind === 'missing') || (expected.head && head.kind === 'missing');
			if (unreadable || compare(base, head)) found.add(expected.path);
		});
	await Promise.all(checks);

	const changes = [...found].toSorted();
	if (!options.complete) changes.push(UNLISTED_FILES_ENTRY);
	return changes;
}

/** Whether a comparison needs review, and why. */
export function decideReview(options: {
	outcome: ReviewOutcome;
	differing: number;
	infrastructureFiles: ReadonlyArray<string>;
	/** The verified baseline commit, or `null` when the report's baseline is missing or unverified. */
	baselineSha: string | null;
}): ReviewDecision {
	const { outcome } = options;
	switch (outcome) {
		case 'pending':
			return { kind: 'pending', reasons: [] };
		case 'failed':
			return { failure: 'unfinished', kind: 'failed', reasons: [] };
		case 'cancelled':
			return { failure: 'cancelled', kind: 'failed', reasons: [] };
		case 'publish-failed':
			return { failure: 'publish-failed', kind: 'failed', reasons: [] };
		case 'skipped':
			// Infrastructure paths are never prose-only, so a skipped run that changes them is wrong.
			if (options.infrastructureFiles.length > 0) {
				return { failure: 'unfinished', kind: 'failed', reasons: [] };
			}
			return { kind: 'clean', reasons: [] };
		case 'report': {
			if (options.baselineSha === null) {
				return { failure: 'unverified-baseline', kind: 'failed', reasons: [] };
			}
			const reasons: Array<ReviewReason> = [];
			if (options.differing > 0) reasons.push('visual');
			if (options.infrastructureFiles.length > 0) reasons.push('infrastructure');
			return { kind: reasons.length > 0 ? 'review' : 'clean', reasons };
		}
	}
}

/** The status line text shared by the check run and the sticky comment. */
export function statusText(kind: ReviewKind, failure: FailureReason = 'unfinished'): string {
	switch (kind) {
		case 'pending':
			return 'Comparing';
		case 'review':
			return 'Needs review';
		case 'clean':
			return 'No visual changes';
		case 'failed':
			return FAILURE_TITLES[failure];
	}
}

/** `2026-11-16 03:22 UTC`. */
export function formatTimestamp(date: Date): string {
	return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

const HISTORY_HEADING = '### History\n\n';

/**
 * Prepends one entry to a check run's history, newest first. Lines that are not entries are
 * dropped. The oldest entries fall off until the history has at most {@link MAX_HISTORY_ENTRIES}
 * entries and {@link MAX_HISTORY_CHARS} characters.
 */
export function prependHistory(previousText: string | null | undefined, entry: string): string {
	const newest = `- ${entry}`.slice(0, MAX_HISTORY_CHARS - HISTORY_HEADING.length - 1);
	const entries = [newest];
	let length = HISTORY_HEADING.length + newest.length + 1;
	const previous = (previousText ?? '').split('\n').filter((line) => line.startsWith('- '));
	for (const line of previous) {
		if (entries.length >= MAX_HISTORY_ENTRIES) break;
		length += line.length + 1;
		if (length > MAX_HISTORY_CHARS) break;
		entries.push(line);
	}
	return `${HISTORY_HEADING}${entries.map((line) => `${line}\n`).join('')}`;
}

/** Cuts text to `max` characters, saying so at the end. */
export function capText(text: string, max: number): string {
	if (text.length <= max) return text;
	const note = '\n\n(Truncated.)\n';
	return `${text.slice(0, max - note.length)}${note}`;
}

/**
 * Whether the check run already records `pending` for this exact comparison. The external id
 * decides, not the status: a pending check run written over an existing one is `completed`.
 */
export function isPendingFor(
	run: ExistingCheckRun | undefined,
	runId: number,
	runAttempt: number,
): boolean {
	if (run === undefined) return false;
	let state: unknown;
	try {
		state = JSON.parse(run.external_id ?? '');
	} catch {
		return false;
	}
	return (
		isRecord(state) &&
		state.kind === 'pending' &&
		state.runId === runId &&
		state.runAttempt === runAttempt
	);
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
	/** Why a `failed` check failed. */
	failure?: FailureReason;
	headSha: string;
	pullRequest: number;
	repository: string;
	/** Present when the run published a report. */
	summary: PublishedSummary | undefined;
	infrastructureFiles: ReadonlyArray<string>;
	appUrl: string;
	previousText: string | null | undefined;
	/** Whether the commit already has this App's check run, which the payload then updates. */
	updatesExisting: boolean;
	now: Date;
}): CheckRunPayload {
	const { state, summary, infrastructureFiles, now } = options;
	const appUrl = requireHttpsOrigin(options.appUrl, 'APP_URL');
	const detailsUrl = `${appUrl}/?pr=${options.pullRequest}`;
	const runUrl = `https://github.com/${options.repository}/actions/runs/${state.runId}`;
	const status = statusText(state.kind, options.failure);
	const run = `Comparison run ${state.runId} (attempt ${state.runAttempt})`;

	if (state.kind === 'pending') {
		const fields: CheckRunFields = {
			details_url: detailsUrl,
			external_id: JSON.stringify(state),
			head_sha: options.headSha,
			name: CHECK_NAME,
			output: {
				// Only the status, so no earlier report table describes a comparison still running.
				summary: `**Status:** ${status}\n`,
				text: prependHistory(options.previousText, `${formatTimestamp(now)} · ${run} started`),
				title: status,
			},
		};
		// GitHub ignores a PATCH back to `in_progress` on a completed check run, so an existing
		// one is completed as `action_required` instead. Either way the check cannot pass, and
		// the external id's `pending` kind is what readers act on.
		if (options.updatesExisting) {
			return {
				...fields,
				completed_at: now.toISOString(),
				conclusion: 'action_required',
				status: 'completed',
			};
		}
		return { ...fields, status: 'in_progress' };
	}

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

	const entry = `${formatTimestamp(now)} · ${run}: ${status.toLowerCase()}`;

	return {
		completed_at: now.toISOString(),
		conclusion: CONCLUSIONS[state.kind],
		details_url: detailsUrl,
		external_id: JSON.stringify(state),
		head_sha: options.headSha,
		name: CHECK_NAME,
		output: {
			summary: capText(`${lines.join('\n')}\n`, MAX_SUMMARY_CHARS),
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
	kind: Exclude<ReviewKind, 'pending'>;
	failure?: FailureReason;
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
		`**Status:** ${statusText(kind, options.failure)}`,
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
 * request that never needed a review gets no comment at all. A pending comparison only updates the
 * status of an existing comment.
 */
export function decideCommentAction(
	kind: ReviewKind,
	existingCommentId: number | undefined,
): CommentAction {
	if (existingCommentId !== undefined) return { commentId: existingCommentId, type: 'update' };
	if (kind !== 'review') return { type: 'skip' };
	return { type: 'create' };
}

/**
 * Rewrites only the status block of an existing sticky comment, keeping the rest of its body.
 * Returns `undefined` when the body has no complete status block.
 */
export function replaceCommentStatus(body: string, status: string): string | undefined {
	const start = body.indexOf(COMMENT_STATUS_START);
	const end = body.indexOf(COMMENT_STATUS_END, start);
	if (start === -1 || end === -1) return undefined;
	return `${body.slice(0, start + COMMENT_STATUS_START.length)}\n**Status:** ${status}\n${body.slice(end)}`;
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

/**
 * Reads one repository file at a commit through the contents API, without holding more than
 * {@link MAX_COMPARED_FILE_BYTES} of it. The path comes from the pull request, so each segment is
 * encoded.
 */
async function readRepositoryFile(options: {
	token: string;
	repository: string;
	file: string;
	ref: string;
}): Promise<FileContent> {
	const { token, repository, file, ref } = options;
	const encoded = file.split('/').map((segment) => encodeURIComponent(segment));
	const url = new URL(`https://api.github.com/repos/${repository}/contents/${encoded.join('/')}`);
	url.searchParams.set('ref', ref);
	const response = await fetch(url, {
		headers: {
			Accept: 'application/vnd.github.raw+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
		},
	});
	if (response.status === 404) {
		await response.body?.cancel();
		return { kind: 'missing' };
	}
	if (!response.ok) {
		await response.body?.cancel();
		throw new Error(`GitHub API ${response.status} for GET ${String(url)}`);
	}
	if (response.body === null) return { kind: 'text', text: '' };

	const chunks: Array<Uint8Array> = [];
	let size = 0;
	const reader = response.body.getReader();
	for (;;) {
		// Sequential: a stream yields one chunk at a time.
		// oxlint-disable-next-line no-await-in-loop
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > MAX_COMPARED_FILE_BYTES) {
			// oxlint-disable-next-line no-await-in-loop
			await reader.cancel();
			return { kind: 'too-large' };
		}
		chunks.push(value);
	}
	return { kind: 'text', text: Buffer.concat(chunks).toString('utf8') };
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

	const action = process.env.RUN_ACTION ?? '';
	if (action !== 'requested' && action !== 'in_progress' && action !== 'completed') {
		await doNotPublish(`The run event action ${JSON.stringify(action)} records nothing.`);
		return;
	}

	const token = requireEnv('GITHUB_TOKEN');
	const repository = requireRepository();
	const runId = requirePositiveInteger(process.env.RUN_ID, 'RUN_ID');
	const runAttempt = requirePositiveInteger(process.env.RUN_ATTEMPT, 'RUN_ATTEMPT');

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

	// The latest comparison is the one source of truth for freshness that the review backend
	// shares, so a superseded run or attempt never overwrites a newer state.
	const runsUrl = new URL(
		`https://api.github.com/repos/${repository}/actions/workflows/${COMPARISON_WORKFLOW_FILE}/runs`,
	);
	runsUrl.searchParams.set('head_sha', run.headSha);
	runsUrl.searchParams.set('event', 'pull_request');
	runsUrl.searchParams.set('per_page', '1');
	const { workflow_runs: latestRuns } = await githubRequest<{
		workflow_runs: Array<LatestComparison>;
	}>({ token, url: runsUrl });
	const latest = latestRuns[0];
	if (!isLatestComparison(latest, runId, runAttempt)) {
		await doNotPublish(
			`Run ${runId} attempt ${runAttempt} is not the latest comparison for ${run.headSha}.`,
		);
		return;
	}
	if (action !== 'completed' && latest?.status === 'completed') {
		// A start event delivered after the run finished must not reopen its result.
		await doNotPublish(`Run ${runId} attempt ${runAttempt} has already finished.`);
		return;
	}

	const conclusion = process.env.RUN_CONCLUSION ?? '';
	let hasArtifact = false;
	if (action === 'completed' && conclusion === 'success') {
		// Prose-only pull requests skip the compare job, so their runs upload no artefact.
		const artifactsUrl = new URL(
			`https://api.github.com/repos/${repository}/actions/runs/${runId}/artifacts`,
		);
		artifactsUrl.searchParams.set('name', DIFF_ARTIFACT_NAME);
		const artifacts = await githubRequest<{ total_count: number }>({ token, url: artifactsUrl });
		hasArtifact = artifacts.total_count > 0;
	}

	const outcome = decideRunOutcome(action, conclusion, hasArtifact);
	info(
		`Run ${runId} attempt ${runAttempt} for pull request #${decision.number} at ${run.headSha} (${action}, ${JSON.stringify(conclusion)}): ${outcome}.`,
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

/**
 * Lists the pull request's changed files. Past GitHub's 3,000-file limit the list is partial, and
 * `changedFiles` from the pull request tells when that happened.
 */
async function listPullFiles(options: {
	token: string;
	repository: string;
	pullRequest: number;
	changedFiles: number;
}) {
	const { token, repository, pullRequest, changedFiles } = options;
	const files: Array<PullFile> = [];
	for (let page = 1; page <= MAX_FILE_PAGES; page += 1) {
		const url = new URL(`https://api.github.com/repos/${repository}/pulls/${pullRequest}/files`);
		url.searchParams.set('per_page', String(API_PAGE_SIZE));
		url.searchParams.set('page', String(page));
		// Sequential: each page decides whether another one exists.
		// oxlint-disable-next-line no-await-in-loop
		const batch = await githubRequest<Array<PullFile>>({ token, url });
		files.push(
			...batch.map((file) => {
				const entry: PullFile = { filename: file.filename, status: file.status };
				if (typeof file.previous_filename === 'string') {
					entry.previous_filename = file.previous_filename;
				}
				return entry;
			}),
		);
		if (batch.length < API_PAGE_SIZE) break;
	}
	const complete = files.length < MAX_LISTED_PULL_FILES && changedFiles <= files.length;
	return { complete, files };
}

/**
 * The pull request's visual testing infrastructure changes, compared between the pull request's
 * base and the commit being recorded.
 */
async function pullInfrastructureChanges(options: {
	token: string;
	repository: string;
	pullRequest: number;
	headSha: string;
}): Promise<Array<string>> {
	const { token, repository, pullRequest, headSha } = options;
	const pull = await githubRequest<{
		base: { sha: string };
		head: { sha: string };
		changed_files: number;
	}>({ token, url: `https://api.github.com/repos/${repository}/pulls/${pullRequest}` });
	if (pull.head.sha !== headSha) {
		throw new Error(`Pull request #${pullRequest} no longer has head ${headSha}.`);
	}
	const baseSha = pull.base.sha;
	if (!SHA_PATTERN.test(baseSha)) throw new Error('GitHub returned an invalid base SHA.');
	if (!Number.isSafeInteger(pull.changed_files)) {
		throw new Error('GitHub returned an invalid changed file count.');
	}

	const { complete, files } = await listPullFiles({
		changedFiles: pull.changed_files,
		pullRequest,
		repository,
		token,
	});
	return findInfrastructureChanges({
		complete,
		files,
		read: (file, side) => {
			return readRepositoryFile({
				file,
				ref: side === 'base' ? baseSha : headSha,
				repository,
				token,
			});
		},
	});
}

/**
 * Confirms through the GitHub API that the run the artefact names is a successful Visual baseline
 * run of this repository's `main`, and returns its commit. Anything else is unverified.
 */
async function verifyBaseline(token: string, repository: string, runId: number) {
	try {
		const run = await githubRequest<BaselineRun>({
			token,
			url: `https://api.github.com/repos/${repository}/actions/runs/${runId}`,
		});
		const sha = verifiedBaselineSha(run, repository);
		if (sha !== null) return sha;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		info(`Could not read baseline run ${runId}: ${reason}`);
	}
	info(`Baseline run ${runId} is not a successful Visual baseline run of main.`);
	return null;
}

const REVIEW_OUTCOMES: ReadonlyArray<string> = [
	'pending',
	'report',
	'skipped',
	'failed',
	'cancelled',
	'publish-failed',
] satisfies ReadonlyArray<ReviewOutcome>;

function isReviewOutcome(value: string): value is ReviewOutcome {
	return REVIEW_OUTCOMES.includes(value);
}

async function review() {
	const outcome = requireEnv('OUTCOME');
	if (!isReviewOutcome(outcome)) {
		fail(`OUTCOME must be one of ${REVIEW_OUTCOMES.join(', ')}, not ${JSON.stringify(outcome)}.`);
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

	// Only a comparison that may pass reads the changed files. Every other outcome fails or stays
	// pending whatever they hold, so it makes no request that could stop it being recorded.
	const infrastructureFiles =
		outcome === 'report' || outcome === 'skipped'
			? await pullInfrastructureChanges({ headSha, pullRequest, repository, token: githubToken })
			: [];

	const baselineRunId = summary?.meta.baselineRunId ?? null;
	const baselineSha =
		baselineRunId === null ? null : await verifyBaseline(githubToken, repository, baselineRunId);
	const { failure, kind, reasons } = decideReview({
		baselineSha,
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

	if (kind === 'pending' && isPendingFor(existing, runId, runAttempt)) {
		// `requested` and `in_progress` both start a comparison. Record the start once.
		info(`${CHECK_NAME} check run ${existing?.id} already records run ${runId} as comparing.`);
		return;
	}

	const payload = checkRunPayload({
		appUrl,
		failure,
		headSha,
		infrastructureFiles,
		now: new Date(),
		previousText: existing?.output?.text,
		pullRequest,
		repository,
		state,
		summary,
		updatesExisting: existing !== undefined,
	});
	const createUrl = `https://api.github.com/repos/${repository}/check-runs`;
	if (existing === undefined) {
		await githubRequest({ body: payload, method: 'POST', token: appToken, url: createUrl });
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

	const comments = await listComments(appToken, repository, pullRequest);
	const sticky = findStickyComment(comments, `${appSlug}[bot]`);

	let body: string | undefined;
	if (kind === 'pending') {
		// Only the status changes, so the report the comment describes stays linked.
		body =
			sticky === undefined ? undefined : replaceCommentStatus(sticky.body ?? '', statusText(kind));
		await writeStepSummary(`**Status:** ${statusText(kind)}\n`);
	} else {
		body = commentMarkdown({
			appUrl,
			failure,
			headSha,
			infrastructureFiles,
			kind,
			pullRequest,
			summary,
		});
		await writeStepSummary(body);
	}

	const action =
		body === undefined ? { type: 'skip' as const } : decideCommentAction(kind, sticky?.id);
	switch (action.type) {
		case 'skip':
			info('No comment to create or update.');
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
