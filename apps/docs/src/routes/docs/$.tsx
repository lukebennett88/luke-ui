import type { Story } from '@fumadocs/story';
import type { StoryClient } from '@fumadocs/story/client';
import { StoryPayloadProvider } from '@fumadocs/story/client';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Suspense } from 'react';
import browserCollections from '../../../.source/browser';
import { baseOptions } from '../../lib/layout.shared';
import { source } from '../../lib/source';
import { getStoryPayloads } from '../../lib/story';

const storyModules = import.meta.glob<{ story: Story }>('../../*/*.story.tsx', { eager: true });
const clientStoryModules = import.meta.glob<{ storyClient: StoryClient }>(
	'../../*/*.story.client.tsx',
	{ eager: true },
);

const dirName = (globPath: string) => globPath.split('/').at(-2)!;

const stories: Record<string, Story> = Object.fromEntries(
	Object.entries(storyModules).map(([p, mod]) => [dirName(p), mod.story]),
);

const clientStories: Record<string, StoryClient> = Object.fromEntries(
	Object.entries(clientStoryModules).map(([p, mod]) => [dirName(p), mod.storyClient]),
);

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
			pageTree: await source.serializePageTree(source.getPageTree()),
			path: page.path,
			storyPayloads: await getStoryPayloads(stories),
		};
	});

const clientLoader = browserCollections.docs.createClientLoader({
	component(
		{ toc, frontmatter, default: MDX },
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
			<StoryPayloadProvider
				payloads={data.storyPayloads}
				clients={clientStories as { [K in keyof typeof data.storyPayloads]: StoryClient }}
			>
				<Suspense>
					{clientLoader.useContent(data.path, {
						className: '',
					})}
				</Suspense>
			</StoryPayloadProvider>
		</DocsLayout>
	);
}
