import type {
	ChoiceResponse,
	NoulResponse,
	Question,
	Questions,
	ScoreResponse,
	TypeSafeClient,
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
 * they run in parallel in a single call.
 */
export interface ProseJudgmentClient {
	systemOne: (request: { state: string; questions: Questions }) => Promise<{
		answers: Record<string, Answer>;
	}>;
}

/** Adapts a real `TypeSafeClient` to the loosened `ProseJudgmentClient` shape above. */
export function toProseJudgmentClient(client: TypeSafeClient): ProseJudgmentClient {
	return {
		async systemOne(request) {
			const response = await client.systemOne(request);
			return { answers: response.answers };
		},
	};
}

/** A high-probability Noul/Score result fails the build, via the existing baseline mechanism. */
const VIOLATION_THRESHOLD = 0.9;

/** Below this, a result is treated as noise and dropped entirely. */
const WARNING_THRESHOLD = 0.7;

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

const MONOREPO_DETAIL = `Does this documentation prose expose monorepo or maintainer-only
implementation detail to a consumer of the published package, for example a "pnpm --dir" command,
a "packages/@luke-ui/..." repository path, or a "dist/" build-output internal? Consumer-facing
install or usage instructions using the published package name (for example "npm install
@luke-ui/react") are correct and must NOT be flagged.`;

const BUNDLER_WALKTHROUGH = `Does this documentation prose walk through configuration or setup
steps that are specific to one particular bundler or build tool (for example a detailed Webpack,
Vite, or Rollup config walkthrough) where the component or feature being documented does not
actually require any bundler-specific setup? A brief, necessary mention of a bundler requirement
(for example a Vite plugin the styling system genuinely depends on) is correct and must NOT be
flagged.`;

/**
 * `satisfies` rather than a type annotation so each entry's `key` stays a string literal, letting
 * callers (and tests) derive the exact key union instead of widening it to `string`.
 */
export const PROSE_JUDGMENT_QUESTIONS = [
	{
		key: 'thirdPersonReaderReference',
		label: 'third-person reader reference',
		question: noul(THIRD_PERSON_READER_REFERENCE),
	},
	{
		key: 'resolvedTokenValue',
		label: 'resolved token value documented',
		question: noul(RESOLVED_TOKEN_VALUE),
	},
	{
		key: 'readability',
		label: 'readability',
		question: score(READABILITY, READABILITY_LEVELS),
		worstScoreLevel: String(READABILITY_LEVELS.length - 1),
	},
	{
		key: 'monorepoDetail',
		label: 'monorepo or maintainer implementation detail',
		question: noul(MONOREPO_DETAIL),
	},
	{
		key: 'bundlerWalkthrough',
		label: 'unnecessary bundler-specific walkthrough',
		question: noul(BUNDLER_WALKTHROUGH),
	},
] as const satisfies ReadonlyArray<ProseJudgmentQuestion>;

/**
 * One prose judgment finding, before thresholding decides whether it becomes an issue, a
 * warning, or is dropped as noise.
 */
interface ProseJudgmentResult {
	readonly relativePath: string;
	readonly label: string;
	readonly probability: number;
}

/**
 * Runs every question in `PROSE_JUDGMENT_QUESTIONS` against each file's prose, batched into one
 * `systemOne` request per file. `issues` (>= VIOLATION_THRESHOLD) are formatted like the other
 * deterministic issue strings so they flow through the existing baseline mechanism unchanged;
 * `warnings` (>= WARNING_THRESHOLD, < VIOLATION_THRESHOLD) are printed but never fail the build.
 * Returns both empty when `client` is `undefined` (no `TYPESAFE_API_KEY`), so callers can skip
 * the model-backed pass entirely without special-casing it here.
 */
export async function findProseJudgmentIssues(
	files: ReadonlyArray<{ relativePath: string; prose: string }>,
	client: ProseJudgmentClient | undefined,
): Promise<{ issues: Array<string>; warnings: Array<string> }> {
	if (client === undefined) return { issues: [], warnings: [] };

	const results = await Promise.all(
		files.map((file) => judgeFile(file.relativePath, file.prose, client)),
	);

	const issues: Array<string> = [];
	const warnings: Array<string> = [];
	for (const result of results.flat()) {
		const formatted = `${result.relativePath}: ${result.label}`;
		if (result.probability >= VIOLATION_THRESHOLD) {
			issues.push(formatted);
		} else if (result.probability >= WARNING_THRESHOLD) {
			warnings.push(formatted);
		}
	}

	return { issues, warnings };
}

async function judgeFile(
	relativePath: string,
	prose: string,
	client: ProseJudgmentClient,
): Promise<Array<ProseJudgmentResult>> {
	if (prose.trim().length === 0) return [];

	const questions: Questions = Object.fromEntries(
		PROSE_JUDGMENT_QUESTIONS.map((entry) => [entry.key, entry.question]),
	);

	const response = await client.systemOne({ questions, state: prose });

	// Widened to the interface so the optional `worstScoreLevel`, which `as const` narrows away on
	// the entries that do not declare it, stays readable on every entry.
	const entries: ReadonlyArray<ProseJudgmentQuestion> = PROSE_JUDGMENT_QUESTIONS;

	return entries.flatMap((entry) => {
		const answer = response.answers[entry.key];
		const probability =
			entry.question.type === 'noul'
				? (answer as NoulResponse | undefined)?.noul
				: worstLevelProbability(answer as ScoreResponse | undefined, entry.worstScoreLevel);
		if (probability === undefined) return [];

		return [{ label: entry.label, probability, relativePath }];
	});
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
 * Strips frontmatter and fenced code so the model judges prose, not code — the only
 * preprocessing this module needs. Residual MDX such as `<Callout>` tags is acceptable model
 * input and deliberately left in place rather than parsed out.
 */
export function extractProseForJudgment(source: string): string {
	return stripFencedCode(stripFrontmatter(source));
}

const FRONTMATTER_STRIP_PATTERN = /^---\n[\s\S]*?\n---\n/;
const FENCED_CODE_PATTERN = /```[\s\S]*?```/g;

function stripFrontmatter(source: string): string {
	return source.replace(FRONTMATTER_STRIP_PATTERN, '');
}

function stripFencedCode(source: string): string {
	return source.replace(FENCED_CODE_PATTERN, '');
}
