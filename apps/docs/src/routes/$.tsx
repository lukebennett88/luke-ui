import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/notebook/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Suspense } from 'react';
import * as z from 'zod';
import browserCollections from '../../.source/browser';
import { ComponentPropsTable } from '../components/component-props-table.js';
import { DocsTreePathnameProvider } from '../components/docs-tree-pathname-provider.js';
import { ExampleBlock } from '../components/example-block';
import { IconGallery } from '../components/icon-gallery';
import { PageActions } from '../components/page-actions';
import type { PageActionsMode } from '../components/page-actions';
import { SourceCodeBlock } from '../components/source-code-block';
import { agentHeadLinks } from '../lib/agent-head-links.js';
import { withBasePath } from '../lib/base-path.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { baseOptions } from '../lib/layout.shared';
import { markdownUrlForPage } from '../lib/markdown-page-path.js';
import { resolvePageHeadMeta } from '../lib/page-head.js';
import { source } from '../lib/source';

const GITHUB_DOCS_URL = `${GITHUB_REPO_URL}/blob/main/apps/docs/content/docs`;
const GITHUB_TREE_URL = `${GITHUB_REPO_URL}/tree/main`;

// `remarkAutoTypeTable` converts `<auto-type-table>` to a static `<TypeTable>` during MDX compilation.
const mdxComponents = {
	...defaultMdxComponents,
	ComponentPropsTable,
	ExampleBlock,
	IconGallery,
	SourceCodeBlock,
	TypeTable,
};

export const Route = createFileRoute('/$')({
	component: Page,
	loader: async ({ params }) => {
		const slugs = params._splat?.split('/') ?? [];
		const data = await loader({ data: slugs });
		await clientLoader.preload(data.path);
		return data;
	},
	head: ({ loaderData, match }) => ({
		links: loaderData ? agentHeadLinks(loaderData.markdownUrl, import.meta.env.BASE_URL) : [],
		// A thrown `notFound()` leaves `loaderData` undefined, so supply the 404 title directly
		// instead of falling through to the root route's default title.
		meta: resolvePageHeadMeta(
			match.status === 'notFound' ? { description: null, title: 'Page not found' } : loaderData,
		),
	}),
});

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
			className?: string;
			githubUrl: string;
			markdownUrl: string;
			pageActions: PageActionsMode;
			reactAriaUrl: string | null;
			sourceUrl: string | null;
		},
	) {
		const { githubUrl, markdownUrl, pageActions, reactAriaUrl, sourceUrl, ...pageProps } = props;
		return (
			<DocsPage
				toc={toc}
				{...pageProps}
				footer={{ className: 'mt-12 border-t pt-8 md:mt-16 md:pt-10' }}
			>
				<DocsTitle>{frontmatter.title}</DocsTitle>
				{/*
				 * Fumadocs' default `mb-8` stacks with the `article` layout's own `gap-4` and this row's
				 * `mt-4`, leaving about 64px before the actions row. Drop it to normal rhythm: the layout
				 * gap plus this row's own top margin.
				 */}
				<DocsDescription className="mb-0">{frontmatter.description}</DocsDescription>
				<div className="not-prose mt-4">
					<PageActions
						githubUrl={githubUrl}
						markdownUrl={markdownUrl}
						mode={pageActions}
						reactAriaUrl={reactAriaUrl}
						sourceUrl={sourceUrl}
					/>
				</div>
				<DocsBody>
					<MDX components={mdxComponents} />
				</DocsBody>
			</DocsPage>
		);
	},
});

function Page() {
	const data = useFumadocsLoader(Route.useLoaderData());

	return (
		<DocsTreePathnameProvider>
			<DocsLayout {...baseOptions()} tree={data.pageTree}>
				<Suspense>
					{clientLoader.useContent(data.path, {
						className: 'pb-16 md:pb-20 xl:pb-24',
						githubUrl: data.githubUrl,
						markdownUrl: data.markdownUrl,
						pageActions: data.pageActions,
						reactAriaUrl: data.reactAriaUrl,
						sourceUrl: data.sourceUrl,
					})}
				</Suspense>
			</DocsLayout>
		</DocsTreePathnameProvider>
	);
}
