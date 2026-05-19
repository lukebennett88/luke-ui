import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
	dir: 'content/docs',
	docs: {
		postprocess: {
			includeProcessedMarkdown: true,
		},
	},
});

// Strip the leading H1 + blockquote emitted by the package-doc generator so
// they don't duplicate DocsTitle and DocsDescription. Fumadocs's `<include>`
// wraps the included content in a nested `root` node, so we recurse.
// Safe because no hosted MDX file authors an inline `# H1` or leading
// blockquote — titles and descriptions always come from frontmatter.
interface MdastNode {
	type?: string;
	depth?: number;
	children?: Array<MdastNode>;
}

function stripIncludedHeader() {
	return (tree: MdastNode) => {
		stripFrom(tree);
	};
}

function stripFrom(node: MdastNode): boolean {
	const children = node.children;
	if (!children) return false;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child) continue;
		if (child.type === 'heading' && child.depth === 1) {
			let removeCount = 1;
			const next = children[i + 1];
			if (next?.type === 'blockquote') removeCount = 2;
			children.splice(i, removeCount);
			return true;
		}
		if (child.type === 'root' && stripFrom(child)) return true;
	}
	return false;
}

export default defineConfig({
	mdxOptions: {
		remarkPlugins: (v) => [...v, stripIncludedHeader],
	},
});
