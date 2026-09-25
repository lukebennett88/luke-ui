import { Cluster } from '@luke-ui/react/cluster';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { DocsLink } from './docs-link.js';
import { SiteNav } from './site-nav.js';

/** 404 page shown for any unmatched route, matching the home hero's spacing and CTA pairing. */
export function NotFound() {
	return (
		<>
			<SiteNav hideActiveDestination />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 pb-16 md:px-6 md:pt-24 md:pb-24">
				<Stack alignItems="flex-start" gap="sp24">
					<Heading level={1} typography="display">
						Page not found
					</Heading>
					<Text className="max-w-xl" color="secondary" elementType="p" typography="lead">
						Check the address, or search the docs.
					</Text>
					<Cluster gap="sp12">
						<DocsLink appearance="button" prominence="high" to="/">
							Go to home
						</DocsLink>
						<DocsLink
							appearance="button"
							params={{ _splat: 'components' }}
							prominence="low"
							to="/$"
						>
							Browse components
						</DocsLink>
					</Cluster>
				</Stack>
			</main>
		</>
	);
}
