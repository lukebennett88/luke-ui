import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { findComponentDocContractIssues } from '../src/lib/component-doc-contract.js';
import {
	buildComponentGuideInventory,
	findCategoryMetadataIssues,
	findComponentGuideFiles,
	findGuideNavigationIssues,
	findGuideSourceIssues,
	findRepeatedMetadataIssues,
} from '../src/lib/component-guide-inventory.js';
import { findComponentPropsContractIssues } from '../src/lib/component-props-contract.js';
import { findComponentPropsTableTags } from '../src/lib/component-props-table-tags.js';
import { findMdxFiles } from '../src/lib/docs-mdx-files.js';
import type { ProseJudgmentClient } from '../src/lib/docs-prose-judgments.js';
import {
	extractProseForJudgment,
	findProseJudgmentIssues,
	toProseJudgmentClient,
} from '../src/lib/docs-prose-judgments.js';
import { exampleBlockSources } from '../src/lib/example-block-sources.js';

const MARKDOWN_H2_PATTERN = /^##\s+(.+?)\s*$/;
const FENCED_CODE_PATTERN = /```[\s\S]*?```/g;
const PROPS_TABLE_TAG_OPEN_PATTERN = /<component-props-table\b/g;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsAppRoot = resolve(scriptDir, '..');
const repoRoot = resolve(docsAppRoot, '../..');
const contentDir = resolve(docsAppRoot, 'content/docs');
const componentsDir = resolve(contentDir, 'components');
const authoredDocsDir = resolve(contentDir, 'docs');
const internalDocsDir = resolve(repoRoot, 'docs');
const reactPackageDir = resolve(repoRoot, 'packages/@luke-ui/react');
const reactPackageJsonPath = resolve(reactPackageDir, 'package.json');
const baselinePath = resolve(scriptDir, 'check-docs.baseline.txt');

const GROUPS_REQUIRING_ACCESSIBILITY = new Set(['actions', 'feedback', 'forms']);

const BEST_PRACTICES = 'Best practices';
const ANATOMY = 'Anatomy';
const ACCESSIBILITY = 'Accessibility';
const RELATED_COMPONENTS = 'Related components';
const API = 'API';
const CONTINUE_LEARNING = 'Continue learning';

const FORBIDDEN_COMPONENT_HEADINGS: Readonly<Record<string, string>> = {
	Primitive: `use "${RELATED_COMPONENTS}"`,
	'Continue learning': 'Continue learning belongs on authored guides, not component guides',
	'Next steps': `use "${RELATED_COMPONENTS}"`,
};

export interface DocsCheckPaths {
	authoredDocsDir: string;
	componentsDir: string;
	contentDir: string;
	internalDocsDir: string;
	reactPackageDir: string;
	reactPackageJsonPath: string;
}

export const defaultDocsCheckPaths: DocsCheckPaths = {
	authoredDocsDir,
	componentsDir,
	contentDir,
	internalDocsDir,
	reactPackageDir,
	reactPackageJsonPath,
};

/** One mechanically checkable docs convention violation. */
export function findDocsIssues(paths: DocsCheckPaths = defaultDocsCheckPaths): Array<string> {
	const issues: Array<string> = [];
	const componentGuides = findComponentGuideFiles(paths.componentsDir);

	issues.push(
		...findComponentDocContractIssues({ docsDir: paths.componentsDir }).map(
			(issue) => `component-doc-contract: ${issue}`,
		),
	);
	for (const guide of componentGuides) {
		issues.push(...findComponentHeadingIssues(guide));
	}

	for (const file of findAuthoredGuideFiles(paths.authoredDocsDir)) {
		issues.push(...findContinueLearningIssues(file));
	}

	const inventory = buildComponentGuideInventory({
		componentsDir: paths.componentsDir,
		guides: componentGuides,
		reactPackageJsonPath: paths.reactPackageJsonPath,
	});

	issues.push(
		...[
			...findGuideNavigationIssues(inventory),
			...findRepeatedMetadataIssues(inventory),
			...findCategoryMetadataIssues(inventory, paths.componentsDir),
			...findGuideSourceIssues(inventory, paths.reactPackageDir),
		].map((issue) => `component-guide-inventory: ${issue}`),
	);
	issues.push(
		...findComponentPropsContractIssues(inventory, paths.reactPackageDir).map(
			(issue) => `component-props-contract: ${issue}`,
		),
	);

	issues.push(...findSharedExampleIssues(paths.contentDir));

	return issues;
}

/**
 * `findDocsIssues` plus model-backed prose judgments (third-person reader references, resolved
 * token values, readability, and so on — see docs-prose-judgments.ts). Kept separate and async
 * so the large, synchronous `findDocsIssues` test suite did not need to change shape for this.
 * `client` is `undefined` when `TYPESAFE_API_KEY` is absent, in which case `warnings` is empty
 * and `issues` is exactly `findDocsIssues(paths)` — the semantic checks are skipped, not failed.
 */
export async function findDocsIssuesWithProseJudgments(
	paths: DocsCheckPaths = defaultDocsCheckPaths,
	client: ProseJudgmentClient | undefined,
): Promise<{ issues: Array<string>; warnings: Array<string> }> {
	const deterministicIssues = findDocsIssues(paths);
	const { issues: proseIssues, warnings } = await findProseJudgmentIssues(
		collectProseFiles(paths),
		client,
	);

	return { issues: [...deterministicIssues, ...proseIssues], warnings };
}

function collectProseFiles(paths: DocsCheckPaths): Array<{ relativePath: string; prose: string }> {
	const files: Array<{ relativePath: string; prose: string }> = [];

	for (const file of authoredMdxFiles(paths.contentDir)) {
		files.push({
			prose: extractProseForJudgment(readFileSync(file, 'utf8')),
			relativePath: posixRelative(paths.contentDir, file),
		});
	}

	if (existsSync(paths.internalDocsDir)) {
		for (const entry of findMarkdownFiles(paths.internalDocsDir)) {
			files.push({
				prose: extractProseForJudgment(readFileSync(entry, 'utf8')),
				relativePath: `docs/${basename(entry)}`,
			});
		}
	}

	return files;
}

function findMarkdownFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (!entry.isFile() || !entry.name.endsWith('.md')) return [];

		return [resolve(directory, entry.name)];
	});
}

export function readBaseline(path: string = baselinePath): Array<string> {
	if (!existsSync(path)) return [];
	return readFileSync(path, 'utf8')
		.split('\n')
		.flatMap((line) => {
			const trimmed = line.trim();
			if (trimmed.length === 0 || trimmed.startsWith('#')) return [];

			return [trimmed];
		});
}

export function diffAgainstBaseline(
	issues: ReadonlyArray<string>,
	baseline: ReadonlyArray<string>,
): { extra: Array<string>; stale: Array<string> } {
	const issueSet = new Set(issues);
	const baselineSet = new Set(baseline);
	return {
		extra: issues.filter((issue) => !baselineSet.has(issue)),
		stale: baseline.filter((issue) => !issueSet.has(issue)),
	};
}

function findAuthoredGuideFiles(docsDir: string): Array<{ relativePath: string; source: string }> {
	if (!existsSync(docsDir)) return [];
	const resolvedDocsDir = resolve(docsDir);
	return findMdxFiles(resolvedDocsDir).flatMap((file) => {
		if (dirname(file) !== resolvedDocsDir) return [];

		return [
			{
				relativePath: `docs/${basename(file)}`,
				source: readFileSync(file, 'utf8'),
			},
		];
	});
}

function findComponentHeadingIssues(guide: {
	group: string;
	relativePath: string;
	source: string;
}): Array<string> {
	const issues: Array<string> = [];
	const headings = markdownH2s(guide.source);
	const isPrimitive = guide.group === 'primitives';
	let seenFeature = false;
	let seenAccessibility = false;
	let seenRelated = false;
	let seenApi = false;

	for (const heading of headings) {
		const replacement = FORBIDDEN_COMPONENT_HEADINGS[heading];
		if (replacement !== undefined) {
			issues.push(`${guide.relativePath}: heading "${heading}" is not allowed (${replacement})`);
			continue;
		}

		if (heading === ANATOMY && !isPrimitive) {
			issues.push(`${guide.relativePath}: "${ANATOMY}" is only allowed on primitive guides`);
		}

		if (seenApi) {
			issues.push(`${guide.relativePath}: "${API}" must be the last heading`);
		}

		if (heading === API) {
			seenApi = true;
			continue;
		}

		if (heading === BEST_PRACTICES) {
			if (seenFeature || seenAccessibility || seenRelated) {
				issues.push(`${guide.relativePath}: "${BEST_PRACTICES}" must come before feature sections`);
			}
			continue;
		}

		if (heading === ANATOMY) {
			if (seenAccessibility || seenRelated) {
				issues.push(
					`${guide.relativePath}: "${ANATOMY}" must come before "${ACCESSIBILITY}" and "${RELATED_COMPONENTS}"`,
				);
			}
			seenFeature = true;
			continue;
		}

		if (heading === ACCESSIBILITY) {
			if (seenRelated) {
				issues.push(
					`${guide.relativePath}: "${ACCESSIBILITY}" must come before "${RELATED_COMPONENTS}"`,
				);
			}
			seenAccessibility = true;
			continue;
		}

		if (heading === RELATED_COMPONENTS) {
			seenRelated = true;
			continue;
		}

		if (seenAccessibility || seenRelated) {
			issues.push(
				`${guide.relativePath}: feature section "${heading}" must come before "${ACCESSIBILITY}" and "${RELATED_COMPONENTS}"`,
			);
		}
		seenFeature = true;
	}

	if (GROUPS_REQUIRING_ACCESSIBILITY.has(guide.group) && !headings.includes(ACCESSIBILITY)) {
		issues.push(`${guide.relativePath}: missing required "${ACCESSIBILITY}" heading`);
	}

	issues.push(...findApiSectionIssues(guide));

	return issues;
}

/**
 * A component guide always declares `source:`, so it must document its public API: an `## API`
 * heading holding at least one `<component-props-table>` tag, and no such tag outside that section.
 */
function findApiSectionIssues(guide: { relativePath: string; source: string }): Array<string> {
	const headings = markdownH2s(guide.source);
	const tagsInApiSection = findComponentPropsTableTags(guide.source);
	const tagsAnywhere = [...guide.source.matchAll(PROPS_TABLE_TAG_OPEN_PATTERN)];

	if (!headings.includes(API) || tagsInApiSection.length === 0) {
		return [
			`${guide.relativePath}: missing required "${API}" section with a component-props-table`,
		];
	}

	if (tagsAnywhere.length !== tagsInApiSection.length) {
		return [`${guide.relativePath}: component-props-table must sit under "${API}"`];
	}

	return [];
}

function findContinueLearningIssues(file: { relativePath: string; source: string }): Array<string> {
	const headings = markdownH2s(file.source);
	const lastHeading = headings.at(-1);
	if (lastHeading !== CONTINUE_LEARNING) {
		return [`${file.relativePath}: last H2 must be "${CONTINUE_LEARNING}" with <Cards>`];
	}

	const section = lastH2Section(file.source, CONTINUE_LEARNING);
	if (section === undefined || !section.includes('<Cards>')) {
		return [`${file.relativePath}: "${CONTINUE_LEARNING}" must contain <Cards>`];
	}

	return [];
}

function findSharedExampleIssues(docsContentDir: string): Array<string> {
	if (!existsSync(docsContentDir)) return [];
	const pagesBySrc = new Map<string, Set<string>>();

	for (const file of authoredMdxFiles(docsContentDir)) {
		const relativePath = posixRelative(docsContentDir, file);
		for (const src of exampleBlockSources(readFileSync(file, 'utf8'))) {
			const pages = pagesBySrc.get(src) ?? new Set<string>();
			pages.add(relativePath);
			pagesBySrc.set(src, pages);
		}
	}

	const issues: Array<string> = [];
	for (const [src, pages] of [...pagesBySrc.entries()].sort(([a], [b]) => a.localeCompare(b))) {
		if (pages.size < 2) continue;
		issues.push(`${src}: referenced from more than one page (${[...pages].join(', ')})`);
	}
	return issues;
}

function authoredMdxFiles(docsContentDir: string): Array<string> {
	return findMdxFiles(docsContentDir);
}

/** H2 titles in document order, ignoring fenced code. */
export function markdownH2s(source: string): Array<string> {
	const headings: Array<string> = [];
	for (const line of stripFencedCode(source).split('\n')) {
		const match = MARKDOWN_H2_PATTERN.exec(line);
		if (match?.[1] !== undefined) headings.push(match[1]);
	}
	return headings;
}

function lastH2Section(source: string, heading: string): string | undefined {
	const stripped = stripFencedCode(source);
	const marker = `\n## ${heading}`;
	const start = stripped.lastIndexOf(marker);
	if (start === -1) {
		return stripped.startsWith(`## ${heading}`) ? stripped : undefined;
	}
	return stripped.slice(start);
}

function stripFencedCode(source: string): string {
	return source.replace(FENCED_CODE_PATTERN, '');
}

function posixRelative(from: string, to: string): string {
	return relative(from, to).split('\\').join('/');
}

const isMain =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	await main();
}

async function main(): Promise<void> {
	// Opt-in: without an API key the semantic prose checks are skipped, not failed, so CI stays
	// green until a key is configured. The deterministic checks below always run regardless.
	const apiKeyPresent = process.env['TYPESAFE_API_KEY'] !== undefined;
	const client: ProseJudgmentClient | undefined = apiKeyPresent
		? toProseJudgmentClient(new TypeSafeClient())
		: undefined;

	const { issues, warnings } = await findDocsIssuesWithProseJudgments(
		defaultDocsCheckPaths,
		client,
	);
	const baseline = readBaseline();
	const { extra, stale } = diffAgainstBaseline(issues, baseline);

	if (!apiKeyPresent) {
		// oxlint-disable-next-line no-console
		console.log('check:docs: TYPESAFE_API_KEY is not set — skipping prose judgments.');
	}

	for (const warning of warnings) {
		// oxlint-disable-next-line no-console
		console.warn(
			`check:docs: borderline prose judgment (review, does not fail the build): ${warning}`,
		);
	}

	if (extra.length > 0 || stale.length > 0) {
		if (extra.length > 0) {
			// oxlint-disable-next-line no-console
			console.error('Docs convention violations not in the baseline:');
			for (const issue of extra) {
				// oxlint-disable-next-line no-console
				console.error(`  ${issue}`);
			}
		}
		if (stale.length > 0) {
			// oxlint-disable-next-line no-console
			console.error('Baseline entries that no longer occur (remove them from the baseline):');
			for (const issue of stale) {
				// oxlint-disable-next-line no-console
				console.error(`  ${issue}`);
			}
		}
		process.exitCode = 1;
	} else if (issues.length > 0) {
		// oxlint-disable-next-line no-console
		console.log(`check:docs: ${issues.length} known violation(s) match the baseline.`);
	} else {
		// oxlint-disable-next-line no-console
		console.log('check:docs: no violations.');
	}
}
