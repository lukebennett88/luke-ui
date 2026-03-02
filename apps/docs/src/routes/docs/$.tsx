import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Suspense } from 'react';
import browserCollections from '../../../.source/browser';
import { baseOptions } from '../../lib/layout.shared';
import { source } from '../../lib/source';

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
	.middleware([staticFunctionMiddleware])
	.handler(async ({ data: slugs }) => {
		const page = source.getPage(slugs);
		if (!page) throw notFound();

		return {
			pageTree: await source.serializePageTree(source.getPageTree()),
			path: page.path,
		};
	});

const clientLoader = browserCollections.docs.createClientLoader({
	component(
		{ toc, frontmatter, default: MDX },
		// You can define props for the component
		props: {
			className?: string;
		},
	) {
		return (
			<DocsPage toc={toc} {...props}>
				<DocsTitle>{frontmatter.title}</DocsTitle>
				<DocsDescription>{frontmatter.description}</DocsDescription>
				<DocsBody>
					<MDX
						components={{
							...defaultMdxComponents,
						}}
					/>
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
				})}
			</Suspense>
		</DocsLayout>
	);
}
