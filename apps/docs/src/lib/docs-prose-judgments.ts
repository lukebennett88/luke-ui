import type {
	ChoiceResponse,
	NoulResponse,
	Question,
	Questions,
	ScoreResponse,
	TypeSafeClient,
	Usage,
} from '@typesafe-ai/sdk';
import { noul, score } from '@typesafe-ai/sdk';

/** This module only asks `noul`/`score` questions, but the SDK's `Questions` type also allows
 * `choice`, so a real client's answers are typed over all three. */
type Answer = ChoiceResponse | NoulResponse | ScoreResponse;

/**
 * Model-backed prose judgments for docs pages, replacing the old regex `PROSE_PATTERNS` scan.
 * A regex cannot tell "Contact us for support." (correct direct address) from "we document the
 * system for users" (incorrect third-person reader reference), and it cannot see a reader
 * reference that is split across a line break. A TypeSafe System One model judges the whole
 * prose text at once instead, so it gets both cases right. See check-docs.ts for how the
 * deterministic checks that stay regex-based are kept separate from this.
 */

/**
 * The subset of `TypeSafeClient` this module depends on, loosened to the answer fields it
 * actually reads (`.noul`, `.probabilities`) so tests can inject a fake instead of calling the
 * real API — `TypeSafeClient.systemOne`'s own generic, per-question-keyed return type is too
 * precise for a plain fake to implement structurally, so `toProseJudgmentClient` below adapts a
 * real client to this simpler shape. One request batches every question for a file's prose so
 * they run in parallel in a single call. `model` and `usage` are optional so a minimal test fake
 * can still implement this structurally without fabricating request-cost metadata it has no
 * opinion about.
 */
export interface ProseJudgmentClient {
	systemOne: (request: { state: string; questions: Questions }) => Promise<{
		answers: Record<string, Answer>;
		model?: string;
		usage?: Usage;
	}>;
}

/** Adapts a real `TypeSafeClient` to the loosened `ProseJudgmentClient` shape above. */
export function toProseJudgmentClient(client: TypeSafeClient): ProseJudgmentClient {
	return {
		async systemOne(request) {
			const response = await client.systemOne(request);
			return { answers: response.answers, model: response.model, usage: response.usage };
		},
	};
}

/**
 * Which collected-file directory a question's judgment applies to — see `collectProseFiles` in
 * check-docs.ts for the directories this is derived from. `'consumer'` is the published site under
 * `content/docs`; `'maintainer'` is the repo-root `docs/*.md` files aimed at contributors. A
 * question that applies to both lists both; `findProseJudgmentIssues` skips a question entirely
 * (not just drops its answer) for a file whose audience it does not list, so maintainer-only prose
 * is never even asked a consumer-only question.
 */
export type ProseAudience = 'consumer' | 'maintainer';

interface ProseJudgmentQuestion {
	/**
	 * Names this question in the request and keys its answer back. Descriptive rather than
	 * positional so a reordering of `PROSE_JUDGMENT_QUESTIONS` cannot silently remap answers to
	 * the wrong label. Question names are not sent to the model, so this is purely for code.
	 */
	readonly key: string;
	/** Appears in a reported issue/warning string; not sent to the model. */
	readonly label: string;
	readonly question: Question;
	/** For a `score` question: the last rubric level's key, whose probability mass is read. */
	readonly worstScoreLevel?: string;
	/** Which file audience(s) this question is asked of — see `ProseAudience`. */
	readonly audiences: ReadonlyArray<ProseAudience>;
	/** A high-probability result (>= this) fails the build, via the existing baseline mechanism. */
	readonly violationThreshold: number;
	/** Below this, a result is treated as noise and dropped entirely. */
	readonly warningThreshold: number;
}

const THIRD_PERSON_READER_REFERENCE = `Does this documentation prose refer to the reader of the
documentation in the third person, for example calling them "users", "the user", "a person", or
"people", instead of addressing them directly as "you"? Only count a reference to the person
reading and using the documented software. Do not count "users" or "user" when it is a code
identifier, a variable name, a prop name, or part of a code sample or type name (for example "the
users prop" or "an array of users" describing application data is fine). Direct address such as
"Contact us for support" or "you can configure this" is correct and must NOT be flagged — "us" and
"you" referring to the reader and the documentation's author are both fine. A reference split
across a line break, such as "shown to the" ending one line and "user when loading" starting the
next, still counts as a third-person reader reference.`;

const RESOLVED_TOKEN_VALUE = `Does this documentation prose state the resolved, literal value of a
themeable design token instead of only naming the token, for example writing "sp16 is 16px" or
"the danger color is #b91c1c"? Naming a token alone (for example "use the sp16 spacing key") is
fine and must NOT be flagged. Only flag prose that also asserts what the token currently resolves
to, since that resolved value is theme-dependent and documenting it as fixed fact is incorrect.`;

const READABILITY = `Rate the readability of this documentation prose using ASD-STE100-style
technical writing standards: short sentences, one instruction or fact per sentence, plain
vocabulary, and active voice. Ignore code samples, headings, and JSX/MDX markup — judge only the
prose sentences.`;

// Levels are concrete and self-standing so each reads correctly with no other context. The last
// level is the violation level: its probability mass is what gets thresholded.
const READABILITY_LEVELS = [
	'clear: short, plain sentences; each carries one idea; easy to follow on a single read',
	'acceptable: mostly clear, but at least one sentence is longer or more complex than necessary',
	'hard to follow: multiple long or compound sentences, passive voice, or stacked clauses that force a re-read',
] as const;

const MONOREPO_DETAIL = `Does this documentation prose expose repository or maintainer-only detail
that a consumer of the published package never needs, specifically: the monorepo's own directory
layout or workspace/package organisation (for example a "packages/@luke-ui/..." repository path,
or naming other internal workspace packages); a contributor or maintainer workflow such as running
the repository's own tests, code generators, linters, or release/publish steps; build or release
infrastructure such as CI configuration, versioning tooling, or a "dist/" build-output internal; or
internal implementation machinery a consumer never calls directly, such as an internal helper
function, module, or file that is not part of the published API. Do NOT flag ordinary component API
or behaviour: describing what a prop does, how a component renders, which HTML element it produces,
its accessibility behaviour, or how it composes with other components are all correct and must NOT
be flagged. Do NOT flag naming the published package in a consumer install or import example (for
example "npm install @luke-ui/react" or "import { Button } from '@luke-ui/react'") — that is
ordinary consumer-facing usage, not repository detail.`;

// The earlier wording asked whether the documented feature "does not actually require any
// bundler-specific setup" — a fact the prose alone cannot establish, so the model sat near 0.5 on
// every input: a four-bundler config tour scored only 0.55, below its own warning threshold, and
// the question could never fire. This asks only about what is observable in the text: how much
// bundler configuration is being walked through.
const BUNDLER_WALKTHROUGH = `Does this documentation prose walk the reader through the configuration
of a specific bundler or build tool — naming its config file, plugins, loaders, or options, such as
editing webpack.config.js, adding style-loader or MiniCssExtractPlugin, ordering Rollup plugins, or
setting Vite's optimizeDeps? Flag prose that reads as a bundler setup tutorial, and flag it more
strongly when it repeats those steps for several different bundlers. Ordinary package installation
and import instructions (for example "npm install @luke-ui/react" followed by an import statement)
are correct and must NOT be flagged. A single sentence stating a bundler requirement, such as
telling the reader the bundler must serve an asset as a URL rather than inlining it, is also
correct and must NOT be flagged.`;

const BOTH_AUDIENCES: ReadonlyArray<ProseAudience> = ['consumer', 'maintainer'];

/**
 * `satisfies` rather than a type annotation so each entry's `key` stays a string literal, letting
 * callers (and tests) derive the exact key union instead of widening it to `string`.
 */
export const PROSE_JUDGMENT_QUESTIONS = [
	{
		// Provisional default (0.9/0.7): no observed miscalibration for this question yet.
		audiences: BOTH_AUDIENCES,
		key: 'thirdPersonReaderReference',
		label: 'third-person reader reference',
		question: noul(THIRD_PERSON_READER_REFERENCE),
		violationThreshold: 0.9,
		warningThreshold: 0.7,
	},
	{
		// Evidence-based. Two pages once stated "`sp16` is 16px" (docs/layout.mdx and
		// docs/token-reference.mdx, both since fixed). Repeated live runs scored them 0.820-0.850 and
		// 0.870-0.890, while every other page in the corpus scored at most 0.040 — so 0.80 catches
		// the lower true positive with room for the observed jitter, and nothing sits in between.
		audiences: BOTH_AUDIENCES,
		key: 'resolvedTokenValue',
		label: 'resolved token value documented',
		question: noul(RESOLVED_TOKEN_VALUE),
		violationThreshold: 0.8,
		warningThreshold: 0.6,
	},
	{
		// Provisional default (0.9/0.7): no observed miscalibration for this question yet.
		audiences: BOTH_AUDIENCES,
		key: 'readability',
		label: 'readability',
		question: score(READABILITY, READABILITY_LEVELS),
		violationThreshold: 0.9,
		warningThreshold: 0.7,
		worstScoreLevel: String(READABILITY_LEVELS.length - 1),
	},
	{
		// Consumer-only: this question asks whether repository/maintainer detail leaked into
		// CONSUMER-facing docs, so it is meaningless for the maintainer docs under <repoRoot>/docs,
		// which are expected to discuss repository internals.
		audiences: ['consumer'],
		key: 'monorepoDetail',
		label: 'monorepo or maintainer implementation detail',
		question: noul(MONOREPO_DETAIL),
		// 0.9/0.7 held through tuning: the prompt rewrite and the audience/extraction scoping were
		// the intervention, and the threshold was deliberately left alone so the effect stayed
		// attributable. Synthetic probes then separated cleanly across it — repository, contributor
		// and build-infrastructure prose scored 0.96-0.98, component API and accessibility prose
		// 0.02 — so there is no evidence for moving it.
		violationThreshold: 0.9,
		warningThreshold: 0.7,
	},
	{
		// 0.9/0.7, validated against the rewritten prompt rather than the corpus: no page here
		// contains a bundler walkthrough, so synthetic probes stood in. Bundler config tutorials
		// scored 0.97-0.98 and ordinary install/import prose 0.01-0.24. The earlier prompt could
		// not clear its own warning threshold at all (see BUNDLER_WALKTHROUGH above).
		audiences: BOTH_AUDIENCES,
		key: 'bundlerWalkthrough',
		label: 'unnecessary bundler-specific walkthrough',
		question: noul(BUNDLER_WALKTHROUGH),
		violationThreshold: 0.9,
		warningThreshold: 0.7,
	},
] as const satisfies ReadonlyArray<ProseJudgmentQuestion>;

/**
 * One prose judgment finding, carrying everything the API returned for it — not just the bare
 * `"<path>: <label>"` string `issues`/`warnings` reduce to. `main()` in check-docs.ts uses this to
 * print a diagnostic report; `issues`/`warnings` stay the reduced string form because
 * `diffAgainstBaseline` and its tests depend on that exact shape.
 */
export interface ProseJudgmentFinding {
	readonly relativePath: string;
	/** The descriptive question key, e.g. `monorepoDetail` — see `PROSE_JUDGMENT_QUESTIONS`. */
	readonly key: string;
	readonly label: string;
	/** The thresholded number: a Noul's `.noul`, or a Score's worst-rubric-level probability. */
	readonly probability: number;
	readonly severity: 'violation' | 'warning';
	readonly questionType: 'noul' | 'score';
	/** Present only when `questionType` is `'score'`. */
	readonly score?: number;
	readonly confidence?: number;
	readonly probabilities?: Record<string, number>;
}

/** Aggregate request-cost metadata across every file judged in one `findProseJudgmentIssues` run. */
export interface ProseJudgmentUsage {
	/** The models named across responses; more than one entry means the run was not uniform. */
	readonly models: ReadonlyArray<string>;
	readonly totalInputTokens: number;
	readonly totalOutputTokens: number;
}

/**
 * Runs every question in `PROSE_JUDGMENT_QUESTIONS` that applies to a file's `audience` against
 * that file's prose, batched into one `systemOne` request per file — a question not applicable to
 * a file's audience (see `ProseAudience`) is left out of that file's request entirely, rather than
 * sent and its answer discarded. `issues` (>= a question's own `violationThreshold`) are formatted
 * like the other deterministic issue strings so they flow through the existing baseline mechanism
 * unchanged; `warnings` (>= `warningThreshold`, < `violationThreshold`) are printed but never fail
 * the build. `findings` carries the same issues and warnings in structured form (probability,
 * score, confidence, distribution, and so on) for richer diagnostic reporting. `usage` aggregates
 * `model`/`usage` across every request, when the client exposes them.
 * Returns everything empty when `client` is `undefined` (no `TYPESAFE_API_KEY`), so callers can
 * skip the model-backed pass entirely without special-casing it here.
 */
export async function findProseJudgmentIssues(
	files: ReadonlyArray<{ relativePath: string; prose: string; audience: ProseAudience }>,
	client: ProseJudgmentClient | undefined,
): Promise<{
	issues: Array<string>;
	warnings: Array<string>;
	findings: Array<ProseJudgmentFinding>;
	usage: ProseJudgmentUsage;
}> {
	if (client === undefined) {
		return {
			findings: [],
			issues: [],
			usage: { models: [], totalInputTokens: 0, totalOutputTokens: 0 },
			warnings: [],
		};
	}

	const results = await Promise.all(
		files.map((file) => judgeFile(file.relativePath, file.prose, file.audience, client)),
	);

	const issues: Array<string> = [];
	const warnings: Array<string> = [];
	const findings: Array<ProseJudgmentFinding> = [];
	const models = new Set<string>();
	let totalInputTokens = 0;
	let totalOutputTokens = 0;

	for (const result of results) {
		if (result.model !== undefined) models.add(result.model);
		if (result.usage !== undefined) {
			totalInputTokens += result.usage.input_tokens;
			totalOutputTokens += result.usage.output_tokens;
		}

		for (const finding of result.findings) {
			const formatted = `${finding.relativePath}: ${finding.label}`;
			if (finding.severity === 'violation') {
				issues.push(formatted);
			} else {
				warnings.push(formatted);
			}
			findings.push(finding);
		}
	}

	return {
		findings,
		issues,
		usage: { models: [...models], totalInputTokens, totalOutputTokens },
		warnings,
	};
}

async function judgeFile(
	relativePath: string,
	prose: string,
	audience: ProseAudience,
	client: ProseJudgmentClient,
): Promise<{
	findings: Array<ProseJudgmentFinding>;
	model: string | undefined;
	usage: Usage | undefined;
}> {
	if (prose.trim().length === 0) return { findings: [], model: undefined, usage: undefined };

	// Widened to the interface so the optional `worstScoreLevel`, which `as const` narrows away on
	// the entries that do not declare it, stays readable on every entry.
	const allEntries: ReadonlyArray<ProseJudgmentQuestion> = PROSE_JUDGMENT_QUESTIONS;
	const entries = allEntries.filter((entry) => entry.audiences.includes(audience));

	// A question that does not apply to this file's audience is left out of the request below
	// entirely — not sent and its answer discarded — so it costs no tokens and never produces a
	// meaningless answer for prose it was never meant to judge.
	if (entries.length === 0) return { findings: [], model: undefined, usage: undefined };

	const questions: Questions = Object.fromEntries(
		entries.map((entry) => [entry.key, entry.question]),
	);

	const response = await client.systemOne({ questions, state: prose });

	const findings = entries.flatMap((entry): Array<ProseJudgmentFinding> => {
		const answer = response.answers[entry.key];

		if (entry.question.type === 'score') {
			const scoreAnswer = answer as ScoreResponse | undefined;
			const probability = worstLevelProbability(scoreAnswer, entry.worstScoreLevel);
			if (probability === undefined || scoreAnswer === undefined) return [];
			const severity = severityFor(probability, entry);
			if (severity === undefined) return [];

			return [
				{
					confidence: scoreAnswer.confidence,
					key: entry.key,
					label: entry.label,
					probabilities: scoreAnswer.probabilities as Record<string, number>,
					probability,
					questionType: 'score',
					relativePath,
					score: scoreAnswer.score,
					severity,
				},
			];
		}

		const probability = (answer as NoulResponse | undefined)?.noul;
		if (probability === undefined) return [];
		const severity = severityFor(probability, entry);
		if (severity === undefined) return [];

		return [
			{
				key: entry.key,
				label: entry.label,
				probability,
				questionType: 'noul',
				relativePath,
				severity,
			},
		];
	});

	return { findings, model: response.model, usage: response.usage };
}

/**
 * `undefined` below `question.warningThreshold` — such a result is noise, dropped entirely.
 * Thresholds come from the question itself (see `PROSE_JUDGMENT_QUESTIONS`), not a shared module
 * constant, since evidence has shown different questions warrant different cutoffs.
 */
function severityFor(
	probability: number | undefined,
	question: Pick<ProseJudgmentQuestion, 'violationThreshold' | 'warningThreshold'>,
): 'violation' | 'warning' | undefined {
	if (probability === undefined) return undefined;
	if (probability >= question.violationThreshold) return 'violation';
	if (probability >= question.warningThreshold) return 'warning';
	return undefined;
}

/** For a `score` question, the probability mass on its last (violation) rubric level. */
function worstLevelProbability(
	answer: ScoreResponse | undefined,
	worstScoreLevel: string | undefined,
): number | undefined {
	if (answer === undefined || worstScoreLevel === undefined) return undefined;
	return (answer.probabilities as Record<string, number>)[worstScoreLevel];
}

/**
 * Strips frontmatter, fenced code, and docs-machinery attribute values so the model judges prose,
 * not code or documentation infrastructure — the only preprocessing this module needs. Residual
 * MDX such as `<Callout>` tags is acceptable model input and deliberately left in place rather than
 * parsed out; this is deliberately NOT a general MDX/JSX scanner (~300 lines of that were removed
 * when this module replaced the old regex checker) — only the known tags below are handled.
 */
export function extractProseForJudgment(source: string): string {
	return stripDocsMachineryAttributes(stripFencedCode(stripFrontmatter(source)));
}

const FRONTMATTER_STRIP_PATTERN = /^---\n[\s\S]*?\n---\n/;
const FENCED_CODE_PATTERN = /```[\s\S]*?```/g;

/**
 * `<component-props-table path="..." name="..." />`, `<auto-type-table path="..." name="..." />`,
 * and `<ExampleBlock src="..." title="..." />` are documentation infrastructure, not authored
 * prose — their `path`/`src` attribute values are repository file paths and example-fixture ids
 * that leak into the judged text and were causing false `monorepoDetail` hits (33 of 49 consumer
 * pages carry a `component-props-table` tag; the `heading.mdx` guide alone has three, tipping it
 * into violation, and `authoring-a-theme.mdx` carries an `auto-type-table` for the same reason).
 * Attributes can be split across lines (`path="…"\n\tname="…"`), so these patterns match across
 * newlines and only strip the attribute's value, leaving the rest of the tag and all surrounding
 * prose intact.
 */
const COMPONENT_PROPS_TABLE_PATH_PATTERN = /(<component-props-table\b[\s\S]*?\bpath=")[^"]*(")/g;
const AUTO_TYPE_TABLE_PATH_PATTERN = /(<auto-type-table\b[\s\S]*?\bpath=")[^"]*(")/g;
const EXAMPLE_BLOCK_SRC_PATTERN = /(<ExampleBlock\b[\s\S]*?\bsrc=")[^"]*(")/g;

function stripDocsMachineryAttributes(source: string): string {
	return source
		.replace(COMPONENT_PROPS_TABLE_PATH_PATTERN, '$1$2')
		.replace(AUTO_TYPE_TABLE_PATH_PATTERN, '$1$2')
		.replace(EXAMPLE_BLOCK_SRC_PATTERN, '$1$2');
}

function stripFrontmatter(source: string): string {
	return source.replace(FRONTMATTER_STRIP_PATTERN, '');
}

function stripFencedCode(source: string): string {
	return source.replace(FENCED_CODE_PATTERN, '');
}
