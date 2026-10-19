import { replaceSource } from 'fumadocs-core/mdx-plugins/stringifier';
import { visit } from 'unist-util-visit';
import { inlineExampleSource } from './inline-example-source.js';

interface MdastRoot {
	type: 'root';
}

interface MdastNode {
	type: string;
}

/**
 * Records Markdown for `<ExampleBlock>` and `<SourceCodeBlock>` so processed Markdown and
 * `llms-full.txt` carry the source those tags render, instead of a literal JSX tag.
 */
export function remarkInlineExampleSource() {
	return (tree: MdastRoot, file: Parameters<typeof replaceSource>[0]) => {
		visit(tree, (node: MdastNode) => {
			if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;
			const markdown = inlineExampleSource(node);
			if (markdown === undefined) return;
			replaceSource(file, node as Parameters<typeof replaceSource>[1], markdown);
		});
	};
}
