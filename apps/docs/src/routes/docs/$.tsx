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
import { story as buttonStory } from '../../stories/button.story';
import { storyClient as buttonStoryClient } from '../../stories/button.story.client';
import { story as comboboxFieldStory } from '../../stories/combobox-field.story';
import { storyClient as comboboxFieldStoryClient } from '../../stories/combobox-field.story.client';
import { story as comboboxStory } from '../../stories/combobox.story';
import { storyClient as comboboxStoryClient } from '../../stories/combobox.story.client';
import { story as fieldStory } from '../../stories/field.story';
import { storyClient as fieldStoryClient } from '../../stories/field.story.client';
import { story as iconStory } from '../../stories/icon.story';
import { storyClient as iconStoryClient } from '../../stories/icon.story.client';
import { story as linkStory } from '../../stories/link.story';
import { storyClient as linkStoryClient } from '../../stories/link.story.client';
import { story as loadingSpinnerStory } from '../../stories/loading-spinner.story';
import { storyClient as loadingSpinnerStoryClient } from '../../stories/loading-spinner.story.client';
import { story as textFieldStory } from '../../stories/text-field.story';
import { storyClient as textFieldStoryClient } from '../../stories/text-field.story.client';
import { story as textInputStory } from '../../stories/text-input.story';
import { storyClient as textInputStoryClient } from '../../stories/text-input.story.client';
import { story as textStory } from '../../stories/text.story';
import { storyClient as textStoryClient } from '../../stories/text.story.client';

const stories = {
	button: buttonStory,
	text: textStory,
	icon: iconStory,
	link: linkStory,
	field: fieldStory,
	'text-field': textFieldStory,
	'text-input': textInputStory,
	combobox: comboboxStory,
	'combobox-field': comboboxFieldStory,
	'loading-spinner': loadingSpinnerStory,
};

const clientStories = {
	button: buttonStoryClient,
	text: textStoryClient,
	icon: iconStoryClient,
	link: linkStoryClient,
	field: fieldStoryClient,
	'text-field': textFieldStoryClient,
	'text-input': textInputStoryClient,
	combobox: comboboxStoryClient,
	'combobox-field': comboboxFieldStoryClient,
	'loading-spinner': loadingSpinnerStoryClient,
};

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
			<StoryPayloadProvider payloads={data.storyPayloads} clients={clientStories}>
				<Suspense>
					{clientLoader.useContent(data.path, {
						className: '',
					})}
				</Suspense>
			</StoryPayloadProvider>
		</DocsLayout>
	);
}
