import { HeadingLevels } from '@luke-ui/react/heading';
import { createFileRoute } from '@tanstack/react-router';
import { HomeFeatures } from '../components/home-features.js';
import { HomeHero } from '../components/home-hero.js';
import { SiteNav } from '../components/site-nav.js';
import { withBasePath } from '../lib/base-path.js';

export const Route = createFileRoute('/')({
	component: Home,
	head: () => ({
		links: [
			{
				href: withBasePath('/index.md', import.meta.env.BASE_URL),
				rel: 'alternate',
				type: 'text/markdown',
			},
			{ href: withBasePath('/llms.txt', import.meta.env.BASE_URL), rel: 'describedby' },
		],
		meta: [
			{ title: 'Luke UI' },
			{
				content: 'Luke UI is a React design system built on React Aria Components.',
				name: 'description',
			},
		],
	}),
});

function Home() {
	return (
		<>
			<SiteNav />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 md:px-6">
				<HeadingLevels base={1}>
					<HomeHero />
					<HomeFeatures />
				</HeadingLevels>
			</main>
		</>
	);
}
