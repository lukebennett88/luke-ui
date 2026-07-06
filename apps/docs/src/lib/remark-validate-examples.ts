import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { visit } from 'unist-util-visit';

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

export function remarkValidateExamples() {
	return (tree: unknown, file: { cwd?: string; path?: string }) => {
		const examplesDir = resolve(file.cwd ?? process.cwd(), 'src/examples');

		visit(tree as never, 'mdxJsxFlowElement', (node: MdxJsxFlowElement) => {
			if (node.name !== 'ExampleBlock') return;

			const srcAttr = node.attributes.find(
				(attr: MdxJsxAttribute | { type: 'mdxJsxExpressionAttribute'; value: string }) =>
					attr.type === 'mdxJsxAttribute' && attr.name === 'src',
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
