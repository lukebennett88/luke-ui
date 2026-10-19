import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useQuery } from '@tanstack/react-query';
import { settingsQueryOptions } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';

const NAME_PARTS_PATTERN = /\s+/;

export function HomePage() {
	const profile = useQuery(settingsQueryOptions).data!.profile;
	const firstName = profile.displayName.trim().split(NAME_PARTS_PATTERN)[0];

	return (
		<Box
			backgroundColor="surface.subdued"
			blockSize="100%"
			className={styles.shell}
			display="flex"
			minBlockSize="100%"
			overflow="hidden"
		>
			<title>Home</title>
			<Box
				backgroundColor="surface.base"
				boxShadow={{ bp768: 'raised' }}
				className={styles.main}
				elementType="main"
				flexGrow="1"
				marginBlock={{ bp768: 'space.8' }}
				marginInline={{ bp768: 'space.8' }}
				minBlockSize={0}
				overflow="hidden"
			>
				<Box
					blockSize="100%"
					className={styles.mainScroll}
					overflowY="auto"
					paddingBlock={{ bp768: 'space.64', initial: 'space.32' }}
					paddingInline={{ bp768: 'space.40', initial: 'space.16' }}
				>
					<Container maxInlineSize="container.672">
						<Stack alignItems="flex-start" gap="space.16">
							<Heading level={1} shouldDisableTrim typography="heading2">
								Welcome back, {firstName}
							</Heading>
							<Text color="secondary" elementType="p">
								Your workspace is ready whenever you need it.
							</Text>
							<Link appearance="button" href="/settings" prominence="high">
								Open settings
							</Link>
						</Stack>
					</Container>
				</Box>
			</Box>
		</Box>
	);
}
