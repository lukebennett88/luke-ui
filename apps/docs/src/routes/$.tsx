import { Blockquote } from '@luke-ui/react/blockquote';
import { Em } from '@luke-ui/react/em';
import { Strong } from '@luke-ui/react/strong';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import type { Root as PageTree } from 'fumadocs-core/page-tree';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { Suspense } from 'react';
import * as z from 'zod';
import browserCollections from '../../.source/browser';
import { ComponentPropsTable } from '../components/component-props-table.js';
import { DocsArticle } from '../components/docs-article/docs-article.js';
import {
	Card,
	Cards,
	createMdxHeading,
	MdxCode,
	MdxFence,
	MdxImage,
	MdxLink,
	MdxParagraph,
	MdxTable,
} from '../components/docs-article/mdx-elements.js';
import { DocsShell } from '../components/docs-shell.js';
import { ExampleBlock } from '../components/example-block';
import { IconGallery } from '../components/icon-gallery';
import type { PageActionsMode } from '../components/page-actions';
import { PageActions } from '../components/page-actions';
import { SourceCodeBlock } from '../components/source-code-block';
import { withBasePath } from '../lib/base-path.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { markdownUrlForPage } from '../lib/markdown-page-path.js';
import { resolvePageHeadMeta } from '../lib/page-head.js';
import { source } from '../lib/source';

const GITHUB_DOCS_URL = `${GITHUB_REPO_URL}/blob/main/apps/docs/content/docs`;
const GITHUB_TREE_URL = `${GITHUB_REPO_URL}/tree/main`;

// `remarkAutoTypeTable` converts `<auto-type-table>` to a static `<TypeTable>` during MDX compilation.
const mdxComponents = {
	a: MdxLink,
	blockquote: Blockquote,
	Card,
	Cards,
	code: MdxCode,
	ComponentPropsTable,
	em: Em,
	ExampleBlock,
	h1: createMdxHeading(1),
	h2: createMdxHeading(2),
	h3: createMdxHeading(3),
	h4: createMdxHeading(4),
	h5: createMdxHeading(5),
	h6: createMdxHeading(6),
	IconGallery,
	img: MdxImage,
	p: MdxParagraph,
	pre: MdxFence,
	SourceCodeBlock,
	strong: Strong,
	table: MdxTable,
	TypeTable,
};

export const Route = createFileRoute('/$')({
	component: Page,
	loader: async ({ params }) => {
		const slugs = params._splat?.split('/') ?? [];
		const data = await fetchPageData(slugs);
		await clientLoader.preload(data.path);
		return data;
	},
	head: ({ loaderData, match }) => ({
		links: loaderData
			? [
					{ href: loaderData.markdownUrl, rel: 'alternate', type: 'text/markdown' },
					{ href: withBasePath('/llms.txt', import.meta.env.BASE_URL), rel: 'describedby' },
				]
			: [],
		// A thrown `notFound()` leaves `loaderData` undefined, so supply the 404 title directly
		// instead of falling through to the root route's default title.
		meta: resolvePageHeadMeta(
			match.status === 'notFound' ? { description: null, title: 'Page not found' } : loaderData,
		),
	}),
});

/**
 * Calls the `loader` server function, treating a static-cache miss as a
 * missing page. This applies only in the browser: the static host serves one
 * shared `404.html` for every missing path, so hydrating it at a different
 * URL re-runs this loader. `staticFunctionMiddleware` then fetches a
 * prerendered JSON file that does not exist, the host returns its HTML 404
 * page instead, and parsing that as JSON throws a `SyntaxError`. Every other
 * error, and a `SyntaxError` during prerender, is a real loader failure and
 * rethrows unchanged.
 */
async function fetchPageData(slugs: Array<string>) {
	try {
		return await loader({ data: slugs });
	} catch (error) {
		if (!import.meta.env.SSR && error instanceof SyntaxError) throw notFound();
		throw error;
	}
}

const loader = createServerFn({
	method: 'GET',
})
	.validator((slugs) => z.array(z.string()).parse(slugs))
	// staticFunctionMiddleware breaks Vite HMR in dev — only apply in prod build.
	.middleware(import.meta.env.PROD ? [staticFunctionMiddleware] : [])
	.handler(async ({ data: slugs }) => {
		const page = source.getPage(slugs);
		if (!page) throw notFound();

		const markdownPath = markdownUrlForPage(page.url);

		return {
			description: page.data.description ?? null,
			githubUrl: `${GITHUB_DOCS_URL}/${page.path}`,
			markdownUrl: withBasePath(markdownPath, import.meta.env.BASE_URL),
			pageActions: page.data.pageActions ?? 'all',
			pageTree: await source.serializePageTree(source.getPageTree()),
			path: page.path,
			reactAriaUrl: page.data.reactAria ?? null,
			sourceUrl: page.data.source ? `${GITHUB_TREE_URL}/${page.data.source}` : null,
			title: page.data.title,
		};
	});

const clientLoader = browserCollections.docs.createClientLoader({
	component(
		{ toc, frontmatter, default: MDX },
		props: {
			githubUrl: string;
			markdownUrl: string;
			pageActions: PageActionsMode;
			reactAriaUrl: string | null;
			sourceUrl: string | null;
			tree: PageTree;
		},
	) {
		const { githubUrl, markdownUrl, pageActions, reactAriaUrl, sourceUrl, tree } = props;
		return (
			<DocsArticle
				actions={
					<PageActions
						githubUrl={githubUrl}
						markdownUrl={markdownUrl}
						mode={pageActions}
						reactAriaUrl={reactAriaUrl}
						sourceUrl={sourceUrl}
					/>
				}
				description={frontmatter.description}
				title={frontmatter.title}
				toc={toc}
				tree={tree}
			>
				<MDX components={mdxComponents} />
			</DocsArticle>
		);
	},
});

function Page() {
	const data = useFumadocsLoader(Route.useLoaderData());

	return (
		<DocsShell tree={data.pageTree}>
			<Suspense>
				{clientLoader.useContent(data.path, {
					githubUrl: data.githubUrl,
					markdownUrl: data.markdownUrl,
					pageActions: data.pageActions,
					reactAriaUrl: data.reactAriaUrl,
					sourceUrl: data.sourceUrl,
					tree: data.pageTree,
				})}
			</Suspense>
		</DocsShell>
	);
}
