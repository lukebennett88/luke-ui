import { Heading } from '@luke-ui/react/heading';
import { button } from '@luke-ui/react/recipes';
import { Text } from '@luke-ui/react/text';
import { DocsLink } from './docs-link.js';
import { SiteNav } from './site-nav.js';

export function NotFound() {
	return (
		<>
			<SiteNav hideActiveDestination />
			<main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-32 text-center max-w-md mx-auto">
				<Heading level={1} size="900">
					404
				</Heading>
				<Heading level={2}>Page Not Found</Heading>
				<Text color="secondary">
					The page you are looking for might have been removed, had its name changed, or is
					temporarily unavailable.
				</Text>
				<DocsLink className={button({ tone: 'accent' })} params={{ _splat: '' }} to="/$">
					Back to Home
				</DocsLink>
			</main>
		</>
	);
}
