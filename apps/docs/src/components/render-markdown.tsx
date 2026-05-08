import { packageDocs } from 'virtual:package-docs';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { ReactElement } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import rehypeReact from 'rehype-react';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { rewritePackageDocLinks } from '../lib/rewrite-package-doc-links.js';

interface RenderMarkdownProps {
	source: string;
	slugMap: ReadonlyMap<string, string>;
}

export function RenderMarkdown({ source, slugMap }: RenderMarkdownProps): ReactElement {
	const rewritten = rewritePackageDocLinks(source, new Map(slugMap));
	const result = unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeReact, {
			Fragment,
			jsx,
			jsxs,
			components: defaultMdxComponents as Record<string, unknown>,
		})
		.processSync(rewritten);
	return <>{result.result as ReactElement}</>;
}

interface RenderPackageDocProps {
	slug: string;
	slugMap: ReadonlyMap<string, string>;
}

export function RenderPackageDoc({ slug, slugMap }: RenderPackageDocProps): ReactElement {
	const source = packageDocs[slug];
	if (!source) throw new Error(`Missing package docs for "${slug}"`);
	return <RenderMarkdown source={source} slugMap={slugMap} />;
}
