import { Box } from '@luke-ui/react/box';
import { Heading, HeadingLevels } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { createFileRoute } from '@tanstack/react-router';
import type { SoftwareSourceCode, WithContext } from 'schema-dts';
import { license } from '../../../../packages/@luke-ui/react/package.json';
import { CodeBlock } from '../components/code-block/code-block.js';
import { HomeSectionLinks } from '../components/home-section-links.js';
import { SiteFrame } from '../components/site-frame.js';
import { withBasePath } from '../lib/base-path.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { HOME_INTRO, INSTALL_COMMAND } from '../lib/home-content.js';
import { resolvePageHeadMeta } from '../lib/page-head.js';
import { siteUrl } from '../lib/site-url.js';

export const Route = createFileRoute('/')({
	component: Home,
	head: () => ({
		links: [
			{ href: `${siteUrl()}/`, rel: 'canonical' },
			{
				href: withBasePath('/index.md', import.meta.env.BASE_URL),
				rel: 'alternate',
				type: 'text/markdown',
			},
			{ href: withBasePath('/llms.txt', import.meta.env.BASE_URL), rel: 'describedby' },
		],
		meta: resolvePageHeadMeta({ title: 'Luke UI', description: HOME_INTRO, url: `${siteUrl()}/` }),
		scripts: import.meta.env.SSR
			? [
					{
						type: 'application/ld+json',
						children: JSON.stringify({
							'@context': 'https://schema.org',
							'@type': 'SoftwareSourceCode',
							name: 'Luke UI',
							description: HOME_INTRO,
							url: `${siteUrl()}/`,
							codeRepository: GITHUB_REPO_URL,
							license: `https://spdx.org/licenses/${license}.html`,
							programmingLanguage: 'TypeScript',
						} satisfies WithContext<SoftwareSourceCode>).replaceAll('<', '\\u003c'),
					},
				]
			: [],
	}),
});

// A plain Box rather than Container: Container establishes a query container, and the card grid's
// columns should follow the viewport like the rest of the frame.
function Home() {
	return (
		<SiteFrame>
			<Box
				marginInline="auto"
				maxInlineSize="72rem"
				paddingBlock={{
					initial: 'space.64',
					bp768: 'space.96',
				}}
				paddingInline={{
					initial: 'space.16',
					bp768: 'space.32',
					bp1024: 'space.48',
				}}
			>
				<HeadingLevels base={1}>
					<Stack gap="space.24">
						<Heading typography="display">Luke UI</Heading>
						<Text color="secondary" elementType="p" typography="lead">
							{HOME_INTRO}
						</Text>
						<Box
							maxInlineSize={{
								initial: '100%',
								bp768: '28rem',
							}}
						>
							<CodeBlock code={INSTALL_COMMAND} title="Terminal" />
						</Box>
					</Stack>
					<HeadingLevels>
						<Box
							marginBlockStart={{
								initial: 'space.64',
								bp768: 'space.96',
							}}
						>
							<HomeSectionLinks />
						</Box>
					</HeadingLevels>
				</HeadingLevels>
			</Box>
		</SiteFrame>
	);
}
