import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findMdxFiles } from '../src/lib/docs-mdx-files.js';
import { exampleBlockSources } from '../src/lib/example-block-sources.js';
import { sourceCodeBlockSources } from '../src/lib/source-code-block-sources.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const docsAppRoot = resolve(scriptDir, '..');
const contentDir = resolve(docsAppRoot, 'content/docs');
const builtOutputPath = resolve(docsAppRoot, 'dist/client/llms-full.txt');

// A path line introduced by `inlineExampleSource`, immediately followed by a fenced ```tsx block.
const inlinedBlockPattern = /^apps\/docs\/src\/(?:examples|samples)\/.*\.tsx$\n\n```tsx$/gm;

function countTagReferences(): number {
	let total = 0;

	for (const file of findMdxFiles(contentDir)) {
		const contents = readFileSync(file, 'utf8');
		total += exampleBlockSources(contents).length;
		total += sourceCodeBlockSources(contents).length;
	}

	return total;
}

function countInlinedBlocks(builtOutput: string): number {
	return [...builtOutput.matchAll(inlinedBlockPattern)].length;
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

const inlinedBlockCount = countInlinedBlocks(builtOutput);
const tagReferenceCount = countTagReferences();

if (inlinedBlockCount === 0) {
	problems.push('llms-full.txt has no inlined example source blocks.');
}

if (inlinedBlockCount < tagReferenceCount) {
	problems.push(
		`llms-full.txt has ${inlinedBlockCount} inlined block(s) but content/docs references ` +
			`examples ${tagReferenceCount} time(s). Some <ExampleBlock>/<SourceCodeBlock> tags did ` +
			'not make it into the built output.',
	);
}

if (problems.length > 0) {
	// oxlint-disable-next-line no-console
	console.error('check:llms: llms-full.txt is missing inlined example source.');
	for (const problem of problems) {
		// oxlint-disable-next-line no-console
		console.error(`  ${problem}`);
	}
	process.exit(1);
}

// oxlint-disable-next-line no-console
console.log(
	`check:llms: llms-full.txt inlines ${inlinedBlockCount} example block(s), no bare tags found.`,
);
