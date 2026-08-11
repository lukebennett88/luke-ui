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
import { DocsTreePathnameProvider } from '../components/docs-tree-pathname-provider.js';
import { ExampleBlock } from '../components/example-block';
import { IconGallery } from '../components/icon-gallery';
import { PageActions } from '../components/page-actions';
import { SourceCodeBlock } from '../components/source-code-block';
import { withBasePath } from '../lib/base-path.js';
import { getComponentPageNavigation } from '../lib/component-page-navigation.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { baseOptions } from '../lib/layout.shared';
import { source } from '../lib/source';
import { getStorybookStoryUrl } from '../lib/storybook';

const GITHUB_DOCS_URL = `${GITHUB_REPO_URL}/blob/main/apps/docs/content/docs`;
const GITHUB_TREE_URL = `${GITHUB_REPO_URL}/tree/main`;

// `remarkAutoTypeTable` converts `<auto-type-table>` to a static `<TypeTable>` during MDX compilation.
const mdxComponents = {
	...defaultMdxComponents,
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

		const markdownPath = `${page.url === '/' ? '/index' : page.url}.md`;
		const rawComponentNavigation = getComponentPageNavigation(page.url);
		// A guide-depth URL only gets Guide/Props tabs when a props page actually
		// exists alongside it — a standalone guide page with no API surface of its
		// own sits at the same URL depth but has no props.mdx sibling, so showing
		// the tab would link to a 404.
		const hasPropsPage =
			rawComponentNavigation?.current === 'props' || source.getPage([...slugs, 'props']) != null;
		const componentNavigation = hasPropsPage ? rawComponentNavigation : null;

		return {
			componentNavigation: componentNavigation
				? {
						...componentNavigation,
						guideUrl: withBasePath(componentNavigation.guideUrl, import.meta.env.BASE_URL),
						propsUrl: withBasePath(componentNavigation.propsUrl, import.meta.env.BASE_URL),
					}
				: null,
			githubUrl: `${GITHUB_DOCS_URL}/${page.path}`,
			markdownUrl: withBasePath(markdownPath, import.meta.env.BASE_URL),
			pageTree: await source.serializePageTree(source.getPageTree()),
			path: page.path,
			reactAriaUrl: page.data.reactAria ?? null,
			sourceUrl: page.data.source ? `${GITHUB_TREE_URL}/${page.data.source}` : null,
			storybookUrl: getStorybookStoryUrl(page.path, import.meta.env.BASE_URL, page.data.source),
		};
	});

const clientLoader = browserCollections.docs.createClientLoader({
	component(
		{ toc, frontmatter, default: MDX },
		props: {
			className?: string;
			componentNavigation: ReturnType<typeof getComponentPageNavigation>;
			githubUrl: string;
			markdownUrl: string;
			reactAriaUrl: string | null;
			sourceUrl: string | null;
			storybookUrl: string | null;
		},
	) {
		const {
			componentNavigation,
			githubUrl,
			markdownUrl,
			reactAriaUrl,
			sourceUrl,
			storybookUrl,
			...pageProps
		} = props;
		return (
			<DocsPage
				toc={toc}
				{...pageProps}
				footer={{ className: 'mt-12 border-t pt-8 md:mt-16 md:pt-10' }}
			>
				<DocsTitle>{frontmatter.title}</DocsTitle>
				<DocsDescription>{frontmatter.description}</DocsDescription>
				<div className="not-prose mt-4">
					<PageActions
						githubUrl={githubUrl}
						markdownUrl={markdownUrl}
						reactAriaUrl={reactAriaUrl}
						sourceUrl={sourceUrl}
						storybookUrl={storybookUrl}
					/>
				</div>
				{componentNavigation ? (
					<nav
						aria-label="Component documentation"
						className="not-prose mt-6 flex gap-6 border-fd-border border-b"
					>
						{[
							{ href: componentNavigation.guideUrl, id: 'guide', label: 'Guide' },
							{ href: componentNavigation.propsUrl, id: 'props', label: 'Props' },
						].map((item) => {
							const isCurrent = componentNavigation.current === item.id;
							return (
								<a
									aria-current={isCurrent ? 'page' : undefined}
									className={`-mb-px border-b-2 px-1 py-3 text-sm transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring ${
										isCurrent
											? 'border-fd-primary text-fd-primary'
											: 'border-transparent text-fd-muted-foreground hover:border-fd-border hover:text-fd-foreground'
									}`}
									href={item.href}
									key={item.id}
								>
									{item.label}
								</a>
							);
						})}
					</nav>
				) : null}
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
						componentNavigation: data.componentNavigation,
						githubUrl: data.githubUrl,
						markdownUrl: data.markdownUrl,
						reactAriaUrl: data.reactAriaUrl,
						sourceUrl: data.sourceUrl,
						storybookUrl: data.storybookUrl,
					})}
				</Suspense>
			</DocsLayout>
		</DocsTreePathnameProvider>
	);
}
