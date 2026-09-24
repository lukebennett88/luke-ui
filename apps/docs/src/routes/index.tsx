import { HeadingLevels } from '@luke-ui/react/heading';
import { createFileRoute } from '@tanstack/react-router';
import { HomeFeatures } from '../components/home-features.js';
import { HomeHero } from '../components/home-hero.js';
import { SiteNav } from '../components/site-nav.js';

export const Route = createFileRoute('/')({
	component: Home,
	head: () => ({
		meta: [{ title: 'Luke UI' }],
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
