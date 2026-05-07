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
import { story as buttonStory } from '../../button/button.story';
import { storyClient as buttonStoryClient } from '../../button/button.story.client';
import { story as closeButtonStory } from '../../close-button/close-button.story';
import { storyClient as closeButtonStoryClient } from '../../close-button/close-button.story.client';
import { story as comboboxFieldStory } from '../../combobox-field/combobox-field.story';
import { storyClient as comboboxFieldStoryClient } from '../../combobox-field/combobox-field.story.client';
import { story as emojiStory } from '../../emoji/emoji.story';
import { storyClient as emojiStoryClient } from '../../emoji/emoji.story.client';
import { story as headingStory } from '../../heading/heading.story';
import { storyClient as headingStoryClient } from '../../heading/heading.story.client';
import { story as iconButtonStory } from '../../icon-button/icon-button.story';
import { storyClient as iconButtonStoryClient } from '../../icon-button/icon-button.story.client';
import { story as iconStory } from '../../icon/icon.story';
import { storyClient as iconStoryClient } from '../../icon/icon.story.client';
import { baseOptions } from '../../lib/layout.shared';
import { source } from '../../lib/source';
import { getStoryPayloads } from '../../lib/story';
import { story as linkStory } from '../../link/link.story';
import { storyClient as linkStoryClient } from '../../link/link.story.client';
import { story as loadingSpinnerStory } from '../../loading-spinner/loading-spinner.story';
import { storyClient as loadingSpinnerStoryClient } from '../../loading-spinner/loading-spinner.story.client';
import { story as numeralStory } from '../../numeral/numeral.story';
import { storyClient as numeralStoryClient } from '../../numeral/numeral.story.client';
import { story as textFieldStory } from '../../text-field/text-field.story';
import { storyClient as textFieldStoryClient } from '../../text-field/text-field.story.client';
import { story as textStory } from '../../text/text.story';
import { storyClient as textStoryClient } from '../../text/text.story.client';

const stories = {
	['button']: buttonStory,
	['close-button']: closeButtonStory,
	['combobox-field']: comboboxFieldStory,
	['emoji']: emojiStory,
	['heading']: headingStory,
	['icon-button']: iconButtonStory,
	['icon']: iconStory,
	['link']: linkStory,
	['loading-spinner']: loadingSpinnerStory,
	['numeral']: numeralStory,
	['text-field']: textFieldStory,
	['text']: textStory,
};

const clientStories = {
	['button']: buttonStoryClient,
	['close-button']: closeButtonStoryClient,
	['combobox-field']: comboboxFieldStoryClient,
	['emoji']: emojiStoryClient,
	['heading']: headingStoryClient,
	['icon-button']: iconButtonStoryClient,
	['icon']: iconStoryClient,
	['link']: linkStoryClient,
	['loading-spinner']: loadingSpinnerStoryClient,
	['numeral']: numeralStoryClient,
	['text-field']: textFieldStoryClient,
	['text']: textStoryClient,
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
