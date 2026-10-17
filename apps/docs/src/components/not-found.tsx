import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Container } from '@luke-ui/react/container';
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
			<Container
				elementType="main"
				flexGrow="1"
				maxInlineSize="px1152"
				paddingBlock={{
					initial: 'sp64',
					bp768: 'sp96',
				}}
				paddingInline={{
					initial: 'sp16',
					bp768: 'sp24',
				}}
			>
				<Stack alignItems="flex-start" gap="sp24">
					<Heading level={1} typography="display">
						Page not found
					</Heading>
					<Box maxInlineSize="36rem">
						<Text color="secondary" elementType="p" typography="lead">
							Check the address, or search the docs.
						</Text>
					</Box>
					<Cluster gap="sp12">
						<DocsLink appearance="button" prominence="high" to="/">
							Go to home
						</DocsLink>
						<DocsLink
							appearance="button"
							params={{
								_splat: 'components',
							}}
							prominence="low"
							to="/$"
						>
							Browse components
						</DocsLink>
					</Cluster>
				</Stack>
			</Container>
		</>
	);
}
