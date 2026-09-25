import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { DocsLink } from './docs-link.js';
import { SiteNav } from './site-nav.js';

export function NotFound() {
	return (
		<>
			<SiteNav hideActiveDestination />
			<main className="flex w-full flex-1 flex-col items-center justify-center px-4 md:px-6">
				<Stack alignItems="center" className="max-w-md text-center" gap="sp16">
					<Heading level={1} typography="display">
						404
					</Heading>
					<Heading level={2}>Page Not Found</Heading>
					<Text color="secondary" textAlign="center">
						The page you are looking for might have been removed, had its name changed, or is
						temporarily unavailable.
					</Text>
					<DocsLink appearance="button" prominence="high" to="/">
						Back to Home
					</DocsLink>
				</Stack>
			</main>
		</>
	);
}
