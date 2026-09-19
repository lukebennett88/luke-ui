import type { NoulResponse, Questions, ScoreResponse } from '@typesafe-ai/sdk';
import { expect, test } from 'vite-plus/test';
import type { ProseJudgmentClient } from './docs-prose-judgments.js';
import { extractProseForJudgment, findProseJudgmentIssues } from './docs-prose-judgments.js';

test('findProseJudgmentIssues returns nothing when no client is given (TYPESAFE_API_KEY absent)', async () => {
	const result = await findProseJudgmentIssues(
		[{ prose: 'We document the system for users.', relativePath: 'docs/example.mdx' }],
		undefined,
	);
	expect(result).toEqual({ issues: [], warnings: [] });
});

test('batches every question for one file into a single systemOne request', async () => {
	let requestCount = 0;
	const client: ProseJudgmentClient = {
		async systemOne(request) {
			requestCount++;
			const questionCount = Object.keys(request.questions).length;
			expect(questionCount).toBeGreaterThan(1);
			return { answers: zeroAnswers(request.questions) };
		},
	};

	await findProseJudgmentIssues([{ prose: 'Some prose.', relativePath: 'docs/one.mdx' }], client);

	expect(requestCount).toBe(1);
});

test('a high-probability Noul result becomes an issue (>= 0.9), routed through the same string shape as deterministic issues', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.95 });

	const result = await findProseJudgmentIssues(
		[{ prose: 'We document the system for users.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result.issues).toEqual(['docs/example.mdx: third-person reader reference']);
	expect(result.warnings).toEqual([]);
});

test('a borderline result (0.7-0.9) is a warning, not an issue, and never fails the build', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.8 });

	const result = await findProseJudgmentIssues(
		[{ prose: 'Some ambiguous prose.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result.issues).toEqual([]);
	expect(result.warnings).toEqual(['docs/example.mdx: third-person reader reference']);
});

test('a result below 0.7 is dropped as noise', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.4 });

	const result = await findProseJudgmentIssues(
		[{ prose: 'You can configure this yourself.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result).toEqual({ issues: [], warnings: [] });
});

// The four acceptance cases: the old regex checker got these wrong, the model-backed judgment
// (represented here by a fake client) gets them right.

test('"Use the &mdash; entity here." is not reported (the old checker flagged it as a prose semicolon false positive)', async () => {
	// A correctly-behaving model returns a low probability on every question for this sentence;
	// the fake encodes that expectation directly rather than depending on live model behaviour.
	const client = fakeClient({});

	const result = await findProseJudgmentIssues(
		[{ prose: 'Use the &mdash; entity here.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result).toEqual({ issues: [], warnings: [] });
});

test('"Contact us for support." is not reported as first-person (the old checker flagged "us")', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.02 });

	const result = await findProseJudgmentIssues(
		[{ prose: 'Contact us for support.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result).toEqual({ issues: [], warnings: [] });
});

test('a reader reference split across a line break is recognised (the old regex missed this)', async () => {
	// "shown to the\nuser when loading" — no single line contains "the user", so the old
	// `/\bthe user\b/i` regex, which matches within one line, never saw this.
	const prose = 'A spinner is shown to the\nuser when loading.';
	const client: ProseJudgmentClient = {
		async systemOne(request) {
			// The model sees the whole text as one string, including the embedded newline, so it
			// can judge meaning across the line break — unlike a single-line regex.
			expect(request.state).toContain('shown to the\nuser when loading');
			return {
				answers: {
					...zeroAnswers(request.questions),
					thirdPersonReaderReference: fakeNoul(0.93),
				},
			};
		},
	};

	const result = await findProseJudgmentIssues(
		[{ prose, relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result.issues).toEqual(['docs/example.mdx: third-person reader reference']);
});

test('extractProseForJudgment strips frontmatter and fenced code but leaves residual MDX in place', () => {
	const source = `---
title: Example
---

<Callout>Read this first.</Callout>

Some prose about \`sp16\`.

\`\`\`tsx
const users = ['we', 'us'];
\`\`\`

More prose.
`;

	const prose = extractProseForJudgment(source);

	expect(prose).not.toContain('title: Example');
	expect(prose).not.toContain('const users');
	expect(prose).toContain('<Callout>Read this first.</Callout>');
	expect(prose).toContain('Some prose about `sp16`.');
	expect(prose).toContain('More prose.');
});

/**
 * A fake client returning 0 (no violation) for every question, except the ones named in
 * `overrides` by their descriptive question key (for example `thirdPersonReaderReference`), the
 * same key `PROSE_JUDGMENT_QUESTIONS` sends in the request.
 */
function fakeClient(overrides: Record<string, number>): ProseJudgmentClient {
	return {
		async systemOne(request) {
			return { answers: zeroAnswers(request.questions, overrides) };
		},
	};
}

/**
 * A no-violation `NoulResponse`/`ScoreResponse` (or a named override) for every question in a
 * request, keyed by the request's own opaque question keys — this fake does not need to know the
 * question order, only that `findProseJudgmentIssues` reads whichever field (`.noul` or a
 * score's worst-level probability, keyed by its numeric-index string) its own thresholding logic
 * expects.
 */
function zeroAnswers(
	questions: Questions,
	overrides: Record<string, number> = {},
): Record<string, NoulResponse | ScoreResponse> {
	return Object.fromEntries(
		Object.entries(questions).map(([key, question]) => {
			const probability = overrides[key] ?? 0;

			if (question.type === 'score') {
				return [key, fakeScore(question.criteria.length, probability)];
			}
			return [key, fakeNoul(probability)];
		}),
	);
}

/** A minimal `NoulResponse` fixture carrying only the field `findProseJudgmentIssues` reads. */
function fakeNoul(probability: number): NoulResponse {
	return { noul: probability, type: 'noul' };
}

/**
 * A minimal `ScoreResponse` fixture whose `probabilities` puts all mass on the worst (last)
 * rubric level, carrying only the fields `findProseJudgmentIssues` reads.
 */
function fakeScore(levelCount: number, worstLevelProbability: number): ScoreResponse {
	const worstLevel = String(levelCount - 1);
	return {
		confidence: 1,
		legend: {} as ScoreResponse['legend'],
		probabilities: { [worstLevel]: worstLevelProbability } as ScoreResponse['probabilities'],
		score: worstLevelProbability >= 0.5 ? levelCount - 1 : 0,
		type: 'score',
	};
}
