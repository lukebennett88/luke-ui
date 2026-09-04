import { buttonRecipe } from '@luke-ui/react/button';
import { Heading } from '@luke-ui/react/heading';
import { Text } from '@luke-ui/react/text';
import { DocsLink } from './docs-link.js';
import { SiteNav } from './site-nav.js';

export function NotFound() {
	return (
		<>
			<SiteNav hideActiveDestination />
			<main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-32 text-center max-w-md mx-auto">
				<Heading level={1} typography="display">
					404
				</Heading>
				<Heading level={2}>Page Not Found</Heading>
				<Text color="secondary">
					The page you are looking for might have been removed, had its name changed, or is
					temporarily unavailable.
				</Text>
				<DocsLink {...buttonRecipe({ tone: 'accent' })} to="/">
					Back to Home
				</DocsLink>
			</main>
		</>
	);
}
