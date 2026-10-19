import { Container } from '@luke-ui/react/container';
import { HeadingLevels } from '@luke-ui/react/heading';
import { createFileRoute } from '@tanstack/react-router';
import type { SoftwareSourceCode, WithContext } from 'schema-dts';
import { license } from '../../../../packages/@luke-ui/react/package.json';
import { HomeFeatures } from '../components/home-features.js';
import { HomeHero } from '../components/home-hero.js';
import { SiteNav } from '../components/site-nav.js';
import { withBasePath } from '../lib/base-path.js';
import { GITHUB_REPO_URL } from '../lib/github.js';
import { HOME_INTRO } from '../lib/home-content.js';
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

function Home() {
	return (
		<>
			<SiteNav />
			<Container
				elementType="main"
				flexGrow="1"
				maxInlineSize="container.1152"
				paddingInline={{
					initial: 'space.16',
					bp768: 'space.24',
				}}
			>
				<HeadingLevels base={1}>
					<HomeHero />
					<HomeFeatures />
				</HeadingLevels>
			</Container>
		</>
	);
}
