import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findMdxFiles } from '../src/lib/docs-mdx-files.js';
import { exampleBlockSources } from '../src/lib/example-block-sources.js';
import { expectedInlinedExampleBlock } from '../src/lib/inline-example-source.js';
import { sourceCodeBlockSources } from '../src/lib/source-code-block-sources.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsAppRoot = resolve(scriptDir, '..');
const contentDir = resolve(docsAppRoot, 'content/docs');
const builtOutputPath = resolve(docsAppRoot, 'dist/client/llms-full.txt');

const fencedBlockOpener = '\n\n```tsx\n';
const fencedBlockCloser = '\n```';

interface ExpectedBlock {
	content: string;
	repoRelativePath: string;
}

interface ParsedBlock {
	content: string;
	repoRelativePath: string;
}

function collectExpectedBlocks(): Array<ExpectedBlock> {
	const blocks: Array<ExpectedBlock> = [];

	for (const file of findMdxFiles(contentDir)) {
		const contents = readFileSync(file, 'utf8');

		for (const src of exampleBlockSources(contents)) {
			blocks.push(expectedInlinedExampleBlock('ExampleBlock', src));
		}

		for (const src of sourceCodeBlockSources(contents)) {
			blocks.push(expectedInlinedExampleBlock('SourceCodeBlock', src));
		}
	}

	return blocks;
}

function parseInlinedBlocks(builtOutput: string): {
	blocks: Array<ParsedBlock>;
	problems: Array<string>;
} {
	const blocks: Array<ParsedBlock> = [];
	const problems: Array<string> = [];
	const pathPattern = /^apps\/docs\/src\/(?:examples|samples)\/[^\n]+\.tsx$/gm;

	for (const match of builtOutput.matchAll(pathPattern)) {
		const repoRelativePath = match[0];
		const pathEnd = match.index + repoRelativePath.length;
		const afterPath = builtOutput.slice(pathEnd);

		if (!afterPath.startsWith(fencedBlockOpener)) {
			problems.push(`${repoRelativePath} is not followed by a complete \`\`\`tsx fenced block.`);
			continue;
		}

		const contentStart = pathEnd + fencedBlockOpener.length;
		const closingFenceIndex = builtOutput.indexOf(fencedBlockCloser, contentStart);

		if (closingFenceIndex === -1) {
			problems.push(
				`${repoRelativePath} has a truncated \`\`\`tsx fenced block (no closing fence).`,
			);
			continue;
		}

		const content = builtOutput.slice(contentStart, closingFenceIndex);

		if (content.length === 0) {
			problems.push(`${repoRelativePath} has an empty \`\`\`tsx fenced block.`);
		}

		blocks.push({ repoRelativePath, content });
	}

	return { blocks, problems };
}

function countByPath(blocks: Array<{ repoRelativePath: string }>): Map<string, number> {
	const counts = new Map<string, number>();

	for (const block of blocks) {
		counts.set(block.repoRelativePath, (counts.get(block.repoRelativePath) ?? 0) + 1);
	}

	return counts;
}

function validateBlockContents(
	parsedBlocks: Array<ParsedBlock>,
	expectedBlocks: Array<ExpectedBlock>,
): Array<string> {
	const problems: Array<string> = [];
	const expectedContentByPath = new Map<string, string>();

	for (const block of expectedBlocks) {
		expectedContentByPath.set(block.repoRelativePath, block.content);
	}

	for (const block of parsedBlocks) {
		const expectedContent = expectedContentByPath.get(block.repoRelativePath);

		if (expectedContent === undefined) {
			problems.push(
				`${block.repoRelativePath} appears in llms-full.txt but is not referenced by content/docs.`,
			);
			continue;
		}

		if (block.content !== expectedContent) {
			problems.push(
				`${block.repoRelativePath} fenced contents do not match the source file ` +
					'(after trimEnd(), as inlineExampleSource emits).',
			);
		}
	}

	return problems;
}

function validateBlockCounts(
	parsedBlocks: Array<ParsedBlock>,
	expectedBlocks: Array<ExpectedBlock>,
): Array<string> {
	const problems: Array<string> = [];
	const expectedCounts = countByPath(expectedBlocks);
	const parsedCounts = countByPath(parsedBlocks);

	for (const [path, expectedCount] of expectedCounts) {
		const parsedCount = parsedCounts.get(path) ?? 0;

		if (parsedCount < expectedCount) {
			problems.push(
				`llms-full.txt has ${parsedCount} inlined block(s) for ${path} but content/docs ` +
					`references it ${expectedCount} time(s).`,
			);
		}
	}

	if (parsedBlocks.length > expectedBlocks.length) {
		problems.push(
			`llms-full.txt has ${parsedBlocks.length} inlined block(s) but content/docs references ` +
				`${expectedBlocks.length}.`,
		);
	}

	return problems;
}

if (!existsSync(builtOutputPath)) {
	// oxlint-disable-next-line no-console
	console.error(
		`check:llms: no built output at ${builtOutputPath}. Run "pnpm run build:docs" first.`,
	);
	process.exit(1);
}

const builtOutput = readFileSync(builtOutputPath, 'utf8');
const problems: Array<string> = [];

if (builtOutput.includes('<ExampleBlock')) {
	problems.push('llms-full.txt still contains a literal <ExampleBlock> tag.');
}

if (builtOutput.includes('<SourceCodeBlock')) {
	problems.push('llms-full.txt still contains a literal <SourceCodeBlock> tag.');
}

const expectedBlocks = collectExpectedBlocks();
const { blocks: parsedBlocks, problems: parseProblems } = parseInlinedBlocks(builtOutput);

problems.push(...parseProblems);

if (parsedBlocks.length === 0) {
	problems.push('llms-full.txt has no inlined example source blocks.');
}

problems.push(...validateBlockContents(parsedBlocks, expectedBlocks));
problems.push(...validateBlockCounts(parsedBlocks, expectedBlocks));

if (problems.length > 0) {
	// oxlint-disable-next-line no-console
	console.error('check:llms: llms-full.txt is missing or has incorrect inlined example source.');
	for (const problem of problems) {
		// oxlint-disable-next-line no-console
		console.error(`  ${problem}`);
	}
	process.exit(1);
}

// oxlint-disable-next-line no-console
console.log(
	`check:llms: llms-full.txt inlines ${parsedBlocks.length} example block(s) with source ` +
		'contents matching their files (after trimEnd()), no bare tags found.',
);
