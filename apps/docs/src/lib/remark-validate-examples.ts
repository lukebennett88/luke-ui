import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { visit } from 'unist-util-visit';
import { findMdxFiles } from './docs-mdx-files.js';
import { exampleBlockSources } from './example-block-sources.js';

interface Position {
	start: { line: number; column: number };
}

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value: string | { type: 'mdxJsxAttributeValueExpression'; value: string };
}

interface MdxJsxFlowElement {
	attributes: Array<MdxJsxAttribute | { type: 'mdxJsxExpressionAttribute'; value: string }>;
	name: string;
	position?: Position;
	type: string;
}

interface FindOrphanedExamplesOptions {
	docsDir: string;
	examplesDir: string;
}

export function remarkValidateExamples() {
	return (tree: unknown, file: { cwd?: string; path?: string }) => {
		const examplesDir = resolve(file.cwd ?? process.cwd(), 'src/examples');

		visit(tree as never, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name !== 'ExampleBlock') return;

			const srcAttr = node.attributes.find(
				(attr: MdxJsxAttribute | { type: 'mdxJsxExpressionAttribute'; value: string }) => {
					return attr.type === 'mdxJsxAttribute' && attr.name === 'src';
				},
			) as MdxJsxAttribute | undefined;

			if (!srcAttr || typeof srcAttr.value !== 'string') {
				const location = node.position ? `${file.path}:${node.position.start.line}` : file.path;
				throw new Error(`${location}: <ExampleBlock> requires a string \`src\` prop`);
			}

			const { value: src } = srcAttr;
			const examplePath = resolve(examplesDir, `${src}.tsx`);

			if (!existsSync(examplePath)) {
				const location = node.position ? `${file.path}:${node.position.start.line}` : file.path;
				throw new Error(
					`${location}: <ExampleBlock src="${src}"> does not match any file at src/examples/${src}.tsx`,
				);
			}
		});
	};
}

export function findOrphanedExamples({
	docsDir,
	examplesDir,
}: FindOrphanedExamplesOptions): Array<string> {
	const resolvedDocsDir = resolve(docsDir);
	const resolvedExamplesDir = resolve(examplesDir);
	const reachableExamples = findDocumentedExamples(resolvedDocsDir, resolvedExamplesDir);
	const pendingExamples = [...reachableExamples];

	for (const examplePath of pendingExamples) {
		for (const importedExample of findImportedExamples(examplePath, resolvedExamplesDir)) {
			if (reachableExamples.has(importedExample)) continue;

			reachableExamples.add(importedExample);
			pendingExamples.push(importedExample);
		}
	}

	return findExampleFiles(resolvedExamplesDir)
		.filter((examplePath) => !reachableExamples.has(examplePath))
		.map((examplePath) => relative(resolvedExamplesDir, examplePath))
		.sort();
}

function findExampleFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);

		if (entry.isDirectory()) return findExampleFiles(path);
		return extname(entry.name) === '.tsx' ? [path] : [];
	});
}

function findDocumentedExamples(docsDir: string, examplesDir: string): Set<string> {
	const documentedExamples = new Set<string>();

	for (const file of findMdxFiles(docsDir)) {
		for (const src of exampleBlockSources(readFileSync(file, 'utf8'))) {
			documentedExamples.add(resolve(examplesDir, `${src}.tsx`));
		}
	}

	return documentedExamples;
}

function findImportedExamples(examplePath: string, examplesDir: string): Array<string> {
	const importedExamples: Array<string> = [];
	const importPattern = /\bfrom\s+["']((?:\.|#docs\/)[^"']+)["']/g;
	const contents = readFileSync(examplePath, 'utf8');

	for (const match of contents.matchAll(importPattern)) {
		const importPath = match[1];
		if (!importPath) continue;

		const resolvedImportPath = importPath.startsWith('#docs/')
			? resolve(examplesDir, importPath.slice('#docs/'.length))
			: resolve(examplePath, '..', importPath);
		const importedPath = extname(resolvedImportPath)
			? resolvedImportPath.replace(/\.js$/, '.tsx')
			: `${resolvedImportPath}.tsx`;

		if (importedPath.startsWith(`${examplesDir}/`) && existsSync(importedPath)) {
			importedExamples.push(importedPath);
		}
	}

	return importedExamples;
}
