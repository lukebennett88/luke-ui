import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { DocsLink } from './docs-link.js';
import { SiteFrame } from './site-frame.js';

/** 404 page shown for any unmatched route, in the home page's frame and spacing. */
export function NotFound() {
	return (
		<SiteFrame hideActiveDestination>
			<Container
				maxInlineSize="container.1152"
				paddingBlock={{
					initial: 'space.64',
					bp768: 'space.96',
				}}
				paddingInline={{
					initial: 'space.16',
					bp768: 'space.24',
				}}
			>
				<Stack alignItems="flex-start" gap="space.24">
					<Heading level={1} typography="display">
						Page not found
					</Heading>
					<Box maxInlineSize="36rem">
						<Text color="secondary" elementType="p" typography="lead">
							Check the address, or search the docs.
						</Text>
					</Box>
					<Cluster gap="space.12">
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
		</SiteFrame>
	);
}
