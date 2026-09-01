import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { exampleBlockSources } from '../src/lib/example-block-sources.js';

const MARKDOWN_H2_PATTERN = /^##\s+(.+?)\s*$/;
const IMPORT_EXPORT_PATTERN = /^(?:import|export)(?:[^A-Za-z0-9_]|$)/;
const FRONTMATTER_STRIP_PATTERN = /^---\n[\s\S]*?\n---\n/;
const FENCED_CODE_PATTERN = /```[\s\S]*?```/g;
const INLINE_CODE_PATTERN = /`[^`]*`/g;
const JSX_TAG_CHAR_PATTERN = /[A-Za-z/]/;
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

const PROSE_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
	{ label: 'prose semicolon', pattern: /;/ },
	{ label: '"assistive technologies"', pattern: /\bassistive technologies\b/i },
	{ label: 'unspaced em dash', pattern: /[^ \n]—|—[^ \n]/ },
	{ label: 'filler "simply"', pattern: /\bsimply\b/i },
	{ label: 'filler "note that"', pattern: /\bnote that\b/i },
	{ label: 'filler "it is important to"', pattern: /\bit is important to\b/i },
	{ label: 'filler "allows you to"', pattern: /\ballows you to\b/i },
	{ label: 'filler "enables you to"', pattern: /\benables you to\b/i },
	{ label: 'filler "can be used to"', pattern: /\bcan be used to\b/i },
	{ label: 'filler "seamless"', pattern: /\bseamless\b/i },
	{ label: 'first-person "we"', pattern: /\bwe\b/i },
	{ label: 'first-person "us"', pattern: /\bus\b/ },
	{ label: 'first-person "let\'s"', pattern: /\blet's\b/i },
	{ label: 'terminology "users"', pattern: /\busers\b/i },
	{ label: 'terminology "the user"', pattern: /\bthe user\b/i },
	{ label: 'terminology "a person"', pattern: /\ba person\b/i },
	{ label: 'terminology "people"', pattern: /\bpeople\b/i },
];

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
	issues.push(...findProseIssues(paths));

	return issues;
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

function findProseIssues(paths: DocsCheckPaths): Array<string> {
	const issues: Array<string> = [];

	for (const file of authoredMdxFiles(paths.contentDir)) {
		issues.push(
			...matchProsePatterns(posixRelative(paths.contentDir, file), readFileSync(file, 'utf8')),
		);
	}

	if (!existsSync(paths.internalDocsDir)) return issues;

	for (const entry of readdirSync(paths.internalDocsDir, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
		const file = resolve(paths.internalDocsDir, entry.name);
		issues.push(...matchProsePatterns(`docs/${entry.name}`, readFileSync(file, 'utf8')));
	}

	return issues;
}

function matchProsePatterns(relativePath: string, source: string): Array<string> {
	const prose = stripForProse(source);
	const issues: Array<string> = [];
	for (const { label, pattern } of PROSE_PATTERNS) {
		if (pattern.test(prose)) {
			issues.push(`${relativePath}: ${label}`);
		}
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

/**
 * Order matters here. Fenced/inline code and import/export statements are stripped first
 * because they are lexically distinct from prose and must be removed as whole units — a
 * partial strip (for example deleting only `{ users }` from an import and leaving
 * `from './data';` behind) would leak a semicolon or identifier into later passes. MDX
 * `{...}` expressions are stripped next, before tags, because an expression's brace matching
 * naturally spans and consumes any tag nested inside it as one atomic replacement — for
 * `{users.map((user) => (<Card key={user.id} />))}` the whole multi-line block collapses to
 * a single space in one step. Stripping the inner `<Card>` tag first instead would leave
 * behind a line containing only its one-space replacement, which a later expression scan
 * could mistake for a blank line and abandon early. Tags are stripped last to clean up
 * whatever markup (and any attribute expressions, e.g. `key={user.id}`) an expression on its
 * own did not already remove.
 */
function stripForProse(source: string): string {
	return stripJsxTags(
		stripJsxExpressions(
			stripInlineCode(stripImportLines(stripFencedCode(stripFrontmatter(source)))),
		),
	);
}

/**
 * Removes `import`/`export` statements in full, including continuation lines, so a
 * multi-line destructure like `import {\n\tusers,\n} from './data';` does not leak its
 * bound names into prose. Scanning tracks quote and brace state so the statement's `{...}`
 * clause can span multiple lines; it terminates at a `;` or a newline seen while unquoted
 * brace depth is zero. As a safety terminator, a blank line reached while brace depth is
 * still open means the statement is malformed (or this isn't actually an import/export
 * statement) — the leading keyword is then left as ordinary text rather than swallowing the
 * rest of the document.
 */
function stripImportLines(source: string): string {
	let result = '';
	let index = 0;
	const length = source.length;

	while (index < length) {
		const atLineStart = index === 0 || source[index - 1] === '\n';
		if (atLineStart && IMPORT_EXPORT_PATTERN.test(source.slice(index))) {
			const end = skipImportExportStatement(source, index);
			if (end !== undefined) {
				index = end;
				continue;
			}
		}

		result += source[index];
		index++;
	}

	return result;
}

/**
 * Returns the index just past the end of the import/export statement starting at `start`,
 * or `undefined` if it never reaches a well-formed end (see `stripImportLines`).
 */
function skipImportExportStatement(source: string, start: number): number | undefined {
	const length = source.length;
	let index = start;
	let braceDepth = 0;
	let quote: string | undefined;

	while (index < length) {
		const char = source[index];

		if (quote !== undefined) {
			if (char === '\\') {
				index += 2;
				continue;
			}
			if (char === quote) quote = undefined;
			index++;
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			index++;
			continue;
		}

		if (char === '{') {
			braceDepth++;
			index++;
			continue;
		}

		if (char === '}') {
			braceDepth = Math.max(0, braceDepth - 1);
			index++;
			continue;
		}

		if (char === ';' && braceDepth === 0) {
			return index + 1;
		}

		if (char === '\n') {
			if (braceDepth === 0) {
				return index;
			}
			if (isBlankLineAt(source, index + 1)) {
				return undefined;
			}
		}

		index++;
	}

	return braceDepth === 0 && quote === undefined ? length : undefined;
}

function stripFrontmatter(source: string): string {
	return source.replace(FRONTMATTER_STRIP_PATTERN, '');
}

function stripFencedCode(source: string): string {
	return source.replace(FENCED_CODE_PATTERN, '');
}

function stripInlineCode(source: string): string {
	return source.replace(INLINE_CODE_PATTERN, '');
}

/**
 * Removes MDX/JSX tag syntax (opening, closing, and self-closing tags, including their
 * attributes) while keeping the text content between tags, since that text is prose that
 * still needs checking. Each stripped tag is replaced with a single space so removing it
 * cannot fuse the words on either side into a false match. Attribute scanning tracks quote
 * and brace state so `>` characters inside string or expression attribute values (for
 * example `mode={{ a: 'b' }}` or `onClick={() => foo()}`) do not end the tag early.
 */
function stripJsxTags(source: string): string {
	let result = '';
	let index = 0;
	const length = source.length;

	while (index < length) {
		const char = source[index];
		const next = source[index + 1];

		if (char === '<' && next !== undefined && JSX_TAG_CHAR_PATTERN.test(next)) {
			const end = skipJsxTag(source, index);
			if (end !== undefined) {
				index = end;
				result += ' ';
				continue;
			}
		}

		result += char;
		index++;
	}

	return result;
}

/**
 * Returns the index just past the end of the JSX tag starting at `start` (which must be `<`),
 * or `undefined` if `start` is not actually the start of a tag. A blank line ends any JSX
 * block in MDX, so a `<` that reaches a blank line before finding its closing `>` is prose
 * (for example "values <b times larger"), not a tag — the caller falls back to emitting the
 * `<` literally instead of swallowing everything up to the blank line.
 */
function skipJsxTag(source: string, start: number): number | undefined {
	const length = source.length;
	let index = start + 1;
	let braceDepth = 0;
	let quote: string | undefined;

	while (index < length) {
		const char = source[index];

		if (quote !== undefined) {
			if (char === '\\') {
				index += 2;
				continue;
			}
			if (char === quote) quote = undefined;
			index++;
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			index++;
			continue;
		}

		if (char === '{') {
			braceDepth++;
			index++;
			continue;
		}

		if (char === '}') {
			braceDepth = Math.max(0, braceDepth - 1);
			index++;
			continue;
		}

		if (char === '>' && braceDepth === 0) {
			return index + 1;
		}

		if (char === '\n' && braceDepth === 0 && isBlankLineAt(source, index + 1)) {
			return undefined;
		}

		index++;
	}

	return undefined;
}

/** True if a blank line (only spaces/tabs, then a newline or end of string) starts at `index`. */
function isBlankLineAt(source: string, index: number): boolean {
	let cursor = index;
	while (cursor < source.length && (source[cursor] === ' ' || source[cursor] === '\t')) {
		cursor++;
	}
	return cursor === source.length || source[cursor] === '\n';
}

/**
 * Removes MDX/JSX `{...}` expressions — including flow/text expressions such as
 * `{users.map(...)}` and comments such as `{/* note *\/}` — as a single atomic unit, brace
 * to matching brace. This runs before `stripJsxTags` so a tag nested inside an expression
 * (for example `{users.map((user) => (<Card key={user.id} />))}`) disappears along with the
 * whole expression in one step, rather than being stripped on its own first and leaving
 * behind a lone-space line that a later blank-line safety check could mistake for genuinely
 * blank. Brace depth is tracked so nested expressions (`{{ a: 'b' }}`) balance correctly,
 * quote state is tracked so a brace inside a string literal does not affect depth, and a
 * blank line reached before the expression closes is treated as a safety terminator: the
 * leading `{` is then left as ordinary prose rather than swallowing the rest of the
 * document, since prose legitimately contains unmatched braces.
 */
function stripJsxExpressions(source: string): string {
	let result = '';
	let index = 0;
	const length = source.length;

	while (index < length) {
		const char = source[index];

		if (char === '{') {
			const end = skipJsxExpression(source, index);
			if (end !== undefined) {
				index = end;
				result += ' ';
				continue;
			}
		}

		result += char;
		index++;
	}

	return result;
}

/**
 * Returns the index just past the end of the `{...}` expression starting at `start` (which
 * must be `{`), or `undefined` if it never reaches a balanced close before a blank line or
 * the end of the source.
 */
function skipJsxExpression(source: string, start: number): number | undefined {
	const length = source.length;
	let index = start + 1;
	let braceDepth = 1;
	let quote: string | undefined;

	while (index < length) {
		const char = source[index];

		if (quote !== undefined) {
			if (char === '\\') {
				index += 2;
				continue;
			}
			if (char === quote) quote = undefined;
			index++;
			continue;
		}

		if (char === '"' || char === "'" || char === '`') {
			quote = char;
			index++;
			continue;
		}

		if (char === '{') {
			braceDepth++;
			index++;
			continue;
		}

		if (char === '}') {
			braceDepth--;
			if (braceDepth === 0) {
				return index + 1;
			}
			index++;
			continue;
		}

		if (char === '\n' && isBlankLineAt(source, index + 1)) {
			return undefined;
		}

		index++;
	}

	return undefined;
}

function posixRelative(from: string, to: string): string {
	return relative(from, to).split('\\').join('/');
}

const isMain =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	const issues = findDocsIssues();
	const baseline = readBaseline();
	const { extra, stale } = diffAgainstBaseline(issues, baseline);

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
