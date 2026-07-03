import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Suspense } from 'react';
import browserCollections from '../../../.source/browser';
import { PageActions } from '../../components/page-actions';
import { baseOptions } from '../../lib/layout.shared';
import { withBasePath } from '../../lib/markdown-url';
import { source } from '../../lib/source';
import { getStorybookStoryUrl } from '../../lib/storybook';

const GITHUB_DOCS_URL = 'https://github.com/lukebennett88/luke-ui/blob/main/apps/docs/content/docs';

export const Route = createFileRoute('/docs/$')({
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
	.inputValidator((slugs: Array<string>) => slugs)
	// staticFunctionMiddleware breaks Vite HMR in dev — only apply in prod build.
	.middleware(import.meta.env.PROD ? [staticFunctionMiddleware] : [])
	.handler(async ({ data: slugs }) => {
		const page = source.getPage(slugs);
		if (!page) throw notFound();

		return {
			githubUrl: `${GITHUB_DOCS_URL}/${page.path}`,
			markdownUrl: withBasePath(`${page.url}.md`, import.meta.env.BASE_URL),
			pageTree: await source.serializePageTree(source.getPageTree()),
			path: page.path,
			storybookUrl: getStorybookStoryUrl(page.path, import.meta.env.BASE_URL),
		};
	});

const clientLoader = browserCollections.docs.createClientLoader({
	component(
		{ toc, frontmatter, default: MDX },
		props: {
			className?: string;
			githubUrl: string;
			markdownUrl: string;
			storybookUrl: string | null;
		},
	) {
		const { githubUrl, markdownUrl, storybookUrl, ...pageProps } = props;
		return (
			<DocsPage toc={toc} {...pageProps}>
				<DocsTitle>{frontmatter.title}</DocsTitle>
				<DocsBody>
					{frontmatter.description ? <blockquote>{frontmatter.description}</blockquote> : null}
					<PageActions githubUrl={githubUrl} markdownUrl={markdownUrl} storybookUrl={storybookUrl} />
					<MDX components={defaultMdxComponents} />
				</DocsBody>
			</DocsPage>
		);
	},
});

function Page() {
	const data = useFumadocsLoader(Route.useLoaderData());

	return (
		<DocsLayout {...baseOptions()} tree={data.pageTree}>
			<Suspense>
				{clientLoader.useContent(data.path, {
					className: '',
					githubUrl: data.githubUrl,
					markdownUrl: data.markdownUrl,
					storybookUrl: data.storybookUrl,
				})}
			</Suspense>
		</DocsLayout>
	);
}
