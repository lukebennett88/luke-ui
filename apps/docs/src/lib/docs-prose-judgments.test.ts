import type { NoulResponse, Questions, ScoreResponse } from '@typesafe-ai/sdk';
import { expect, test } from 'vite-plus/test';
import type { ProseJudgmentClient } from './docs-prose-judgments.js';
import { extractProseForJudgment, findProseJudgmentIssues } from './docs-prose-judgments.js';

test('findProseJudgmentIssues returns nothing when no client is given (TYPESAFE_API_KEY absent)', async () => {
	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'We document the system for users.',
				relativePath: 'docs/example.mdx',
			},
		],
		undefined,
	);
	expect(result).toEqual({
		findings: [],
		issues: [],
		usage: { models: [], totalInputTokens: 0, totalOutputTokens: 0 },
		warnings: [],
	});
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

	await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Some prose.', relativePath: 'docs/one.mdx' }],
		client,
	);

	expect(requestCount).toBe(1);
});

test('a high-probability Noul result becomes an issue (>= 0.9), routed through the same string shape as deterministic issues', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.95 });

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'We document the system for users.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	expect(result.issues).toEqual(['docs/example.mdx: third-person reader reference']);
	expect(result.warnings).toEqual([]);
});

test('a high-probability Noul result carries a structured finding with its key, label, probability, and severity', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.95 });

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'We document the system for users.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	expect(result.findings).toEqual([
		{
			key: 'thirdPersonReaderReference',
			label: 'third-person reader reference',
			probability: 0.95,
			questionType: 'noul',
			relativePath: 'docs/example.mdx',
			severity: 'violation',
		},
	]);
});

test('a borderline result (0.7-0.9) is a warning, not an issue, and never fails the build', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.8 });

	const result = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Some ambiguous prose.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result.issues).toEqual([]);
	expect(result.warnings).toEqual(['docs/example.mdx: third-person reader reference']);
	expect(result.findings).toEqual([
		{
			key: 'thirdPersonReaderReference',
			label: 'third-person reader reference',
			probability: 0.8,
			questionType: 'noul',
			relativePath: 'docs/example.mdx',
			severity: 'warning',
		},
	]);
});

test('a result exactly at the violation boundary (0.9) is a violation, and just below it (0.899) is a warning', async () => {
	const violationBoundary = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Boundary prose.', relativePath: 'docs/example.mdx' }],
		fakeClient({ thirdPersonReaderReference: 0.9 }),
	);
	expect(violationBoundary.findings[0]?.severity).toBe('violation');

	const justBelow = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Boundary prose.', relativePath: 'docs/example.mdx' }],
		fakeClient({ thirdPersonReaderReference: 0.899 }),
	);
	expect(justBelow.findings[0]?.severity).toBe('warning');
});

test('a result exactly at the warning boundary (0.7) is a warning, and just below it (0.699) is dropped as noise', async () => {
	const warningBoundary = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Boundary prose.', relativePath: 'docs/example.mdx' }],
		fakeClient({ thirdPersonReaderReference: 0.7 }),
	);
	expect(warningBoundary.findings[0]?.severity).toBe('warning');

	const justBelow = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Boundary prose.', relativePath: 'docs/example.mdx' }],
		fakeClient({ thirdPersonReaderReference: 0.699 }),
	);
	expect(justBelow.findings).toEqual([]);
});

test('a result below 0.7 is dropped as noise', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.4 });

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'You can configure this yourself.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	expect(result).toEqual({
		findings: [],
		issues: [],
		usage: { models: [], totalInputTokens: 0, totalOutputTokens: 0 },
		warnings: [],
	});
});

test('a score-question finding carries score, confidence, and the full probability distribution', async () => {
	const client: ProseJudgmentClient = {
		async systemOne(request) {
			return { answers: zeroAnswers(request.questions, { readability: 0.92 }) };
		},
	};

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'A long, winding, compound sentence.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	expect(result.findings).toEqual([
		{
			confidence: 1,
			key: 'readability',
			label: 'readability',
			probabilities: { '2': 0.92 },
			probability: 0.92,
			questionType: 'score',
			relativePath: 'docs/example.mdx',
			score: 2,
			severity: 'violation',
		},
	]);
});

test('aggregates model and usage across files when the client reports them', async () => {
	const client: ProseJudgmentClient = {
		async systemOne(request) {
			return {
				answers: zeroAnswers(request.questions),
				model: 'jev-1',
				usage: { input_tokens: 100, output_tokens: 10 },
			};
		},
	};

	const result = await findProseJudgmentIssues(
		[
			{ audience: 'consumer', prose: 'First file prose.', relativePath: 'docs/one.mdx' },
			{ audience: 'consumer', prose: 'Second file prose.', relativePath: 'docs/two.mdx' },
		],
		client,
	);

	expect(result.usage).toEqual({
		models: ['jev-1'],
		totalInputTokens: 200,
		totalOutputTokens: 20,
	});
});

test('does not fabricate model/usage when the client omits them', async () => {
	const result = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Some prose.', relativePath: 'docs/one.mdx' }],
		fakeClient({}),
	);

	expect(result.usage).toEqual({ models: [], totalInputTokens: 0, totalOutputTokens: 0 });
});

// The four acceptance cases: the old regex checker got these wrong, the model-backed judgment
// (represented here by a fake client) gets them right.

test('"Use the &mdash; entity here." is not reported (the old checker flagged it as a prose semicolon false positive)', async () => {
	// A correctly-behaving model returns a low probability on every question for this sentence;
	// the fake encodes that expectation directly rather than depending on live model behaviour.
	const client = fakeClient({});

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'Use the &mdash; entity here.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	expect(result).toEqual({
		findings: [],
		issues: [],
		usage: { models: [], totalInputTokens: 0, totalOutputTokens: 0 },
		warnings: [],
	});
});

test('"Contact us for support." is not reported as first-person (the old checker flagged "us")', async () => {
	const client = fakeClient({ thirdPersonReaderReference: 0.02 });

	const result = await findProseJudgmentIssues(
		[{ audience: 'consumer', prose: 'Contact us for support.', relativePath: 'docs/example.mdx' }],
		client,
	);

	expect(result).toEqual({
		findings: [],
		issues: [],
		usage: { models: [], totalInputTokens: 0, totalOutputTokens: 0 },
		warnings: [],
	});
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
		[{ audience: 'consumer', prose, relativePath: 'docs/example.mdx' }],
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

test('extractProseForJudgment strips a component-props-table path and an ExampleBlock src, keeping surrounding prose', () => {
	// Based on the real shape of content/docs/components/typography/heading.mdx: multi-line
	// `component-props-table` attributes plus a single-line `ExampleBlock` tag.
	const source = `---
title: Heading
description: Semantic heading with automatic level management.
source: packages/@luke-ui/react/src/exports/heading.ts
---

\`Heading\` renders a semantic section heading. It reads its level from \`HeadingLevels\` context
without advancing it. Set \`level\` to override it directly.

<ExampleBlock src="heading/basic" title="Heading — Basic" />

## API

### HeadingProps

<component-props-table
	path="packages/@luke-ui/react/src/core/heading/heading.tsx"
	name="HeadingProps"
/>
`;

	const prose = extractProseForJudgment(source);

	expect(prose).not.toContain('packages/@luke-ui/react/src/core/heading/heading.tsx');
	expect(prose).not.toContain('heading/basic');
	expect(prose).toContain(
		'`Heading` renders a semantic section heading. It reads its level from `HeadingLevels` context',
	);
	expect(prose).toContain('without advancing it. Set `level` to override it directly.');
	expect(prose).toContain('<component-props-table');
	expect(prose).toContain('name="HeadingProps"');
	expect(prose).toContain('<ExampleBlock src="" title="Heading — Basic" />');
});

test('extractProseForJudgment strips an auto-type-table path, keeping surrounding prose', () => {
	// Based on the real shape of content/docs/docs/authoring-a-theme.mdx, which carries both a
	// single-line and a multi-line `auto-type-table`. Its leaked repository path was the remaining
	// source of a false `monorepoDetail` hit after `component-props-table` was handled.
	const source = `---
title: Authoring a theme
---

A theme starts from \`defineTheme\`. Pass it an accent colour and a neutral.

<auto-type-table path="packages/@luke-ui/react/src/theme/define-theme.ts" name="ThemeInput" />

The generator derives every step of the scale from that accent.

<auto-type-table
	path="packages/@luke-ui/react/src/theme/define-theme.ts"
	name="ThemeOutput"
/>
`;

	const prose = extractProseForJudgment(source);

	expect(prose).not.toContain('packages/@luke-ui/react/src/theme/define-theme.ts');
	expect(prose).toContain(
		'A theme starts from `defineTheme`. Pass it an accent colour and a neutral.',
	);
	expect(prose).toContain('The generator derives every step of the scale from that accent.');
	expect(prose).toContain('<auto-type-table path="" name="ThemeInput" />');
	expect(prose).toContain('name="ThemeOutput"');
});

test('a maintainer-audience file is not asked monorepoDetail, but a consumer-audience file is', async () => {
	async function requestedQuestionKeys(
		relativePath: string,
		audience: 'consumer' | 'maintainer',
	): Promise<ReadonlyArray<string>> {
		let keys: ReadonlyArray<string> = [];
		const spyClient: ProseJudgmentClient = {
			async systemOne(request) {
				keys = Object.keys(request.questions);
				return { answers: zeroAnswers(request.questions) };
			},
		};
		await findProseJudgmentIssues(
			[{ audience, prose: 'Some prose mentioning packages/@luke-ui/react.', relativePath }],
			spyClient,
		);
		return keys;
	}

	const maintainerKeys = await requestedQuestionKeys('docs/COMPONENTS.md', 'maintainer');
	const consumerKeys = await requestedQuestionKeys('components/actions/button.mdx', 'consumer');

	expect(maintainerKeys).not.toContain('monorepoDetail');
	expect(consumerKeys).toContain('monorepoDetail');
});

test('a resolvedTokenValue result at 0.81 is a violation, while a thirdPersonReaderReference result at 0.81 is only a warning', async () => {
	// The key behavioural change from per-question thresholds: resolvedTokenValue's violation
	// threshold is 0.80 (evidence-based, see PROSE_JUDGMENT_QUESTIONS), so 0.81 crosses it, while
	// thirdPersonReaderReference's violation threshold stays at 0.90, so the same 0.81 is only a
	// warning for that question.
	const client = fakeClient({ resolvedTokenValue: 0.81, thirdPersonReaderReference: 0.81 });

	const result = await findProseJudgmentIssues(
		[
			{
				audience: 'consumer',
				prose: 'sp16 is 16px, and you can configure this.',
				relativePath: 'docs/example.mdx',
			},
		],
		client,
	);

	const severityByKey = new Map(result.findings.map((finding) => [finding.key, finding.severity]));
	expect(severityByKey.get('resolvedTokenValue')).toBe('violation');
	expect(severityByKey.get('thirdPersonReaderReference')).toBe('warning');
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
