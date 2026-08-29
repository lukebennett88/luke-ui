import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Minimal shape of an mdast node, enough to narrow to an MDX JSX element. */
interface MdastNode {
	type: string;
}

interface MdxJsxAttributeValueExpression {
	type: 'mdxJsxAttributeValueExpression';
	value: string;
}

interface MdxJsxAttribute {
	name: string;
	type: 'mdxJsxAttribute';
	value: string | MdxJsxAttributeValueExpression;
}

interface MdxJsxExpressionAttribute {
	type: 'mdxJsxExpressionAttribute';
	value: string;
}

interface MdxJsxElementNode {
	attributes: Array<MdxJsxAttribute | MdxJsxExpressionAttribute>;
	name?: string | null;
	type: 'mdxJsxFlowElement' | 'mdxJsxTextElement';
}

const docsAppRoot = fileURLToPath(new URL('../..', import.meta.url));
const repoRoot = resolve(docsAppRoot, '..', '..');

export type ExampleTagName = 'ExampleBlock' | 'SourceCodeBlock';

// Repo-relative directory each tag's `src` prop resolves against.
const SOURCE_DIRS_BY_TAG: Readonly<Record<ExampleTagName, string>> = {
	ExampleBlock: 'src/examples',
	SourceCodeBlock: 'src/samples',
};

/** Repo-relative path and trimmed source contents for one inlined example block. */
export function expectedInlinedExampleBlock(
	tagName: ExampleTagName,
	src: string,
): { content: string; repoRelativePath: string } {
	const sourceDir = SOURCE_DIRS_BY_TAG[tagName];
	const repoRelativePath = `apps/docs/${sourceDir}/${src}.tsx`;

	return {
		repoRelativePath,
		content: readSourceFile(repoRelativePath, tagName, src),
	};
}

const fileContentsCache = new Map<string, string>();

/**
 * `stringify` hook for `remarkLLMs` that replaces `<ExampleBlock>` and `<SourceCodeBlock>` tags
 * with the source they render, so `llms-full.txt` carries real code instead of a literal tag.
 * Returns `undefined` for any other node so the default stringifier handles it.
 */
export function inlineExampleSource(node: MdastNode): string | undefined {
	if (!isMdxJsxElement(node)) return undefined;

	const tagName = node.name;
	if (tagName !== 'ExampleBlock' && tagName !== 'SourceCodeBlock') return undefined;

	const src = readSrcAttribute(node);
	if (src === undefined) return undefined;

	const { content, repoRelativePath } = expectedInlinedExampleBlock(tagName, src);

	return `${repoRelativePath}\n\n\`\`\`tsx\n${content}\n\`\`\``;
}

function isMdxJsxElement(node: MdastNode): node is MdxJsxElementNode {
	return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
}

function readSrcAttribute(node: MdxJsxElementNode): string | undefined {
	const srcAttr = node.attributes.find((attr): attr is MdxJsxAttribute => {
		return attr.type === 'mdxJsxAttribute' && attr.name === 'src';
	});

	if (!srcAttr || typeof srcAttr.value !== 'string') return undefined;
	return srcAttr.value;
}

function readSourceFile(repoRelativePath: string, tagName: string, src: string): string {
	const cached = fileContentsCache.get(repoRelativePath);
	if (cached !== undefined) return cached;

	const absolutePath = resolve(repoRoot, repoRelativePath);

	let raw: string;
	try {
		raw = readFileSync(absolutePath, 'utf8');
	} catch {
		throw new Error(
			`<${tagName} src="${src}"> could not be inlined: no file at ${repoRelativePath}`,
		);
	}

	const contents = raw.trimEnd();
	fileContentsCache.set(repoRelativePath, contents);
	return contents;
}
