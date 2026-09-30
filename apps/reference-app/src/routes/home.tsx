import { Box } from '@luke-ui/react/box';
import { Container } from '@luke-ui/react/container';
import { Heading } from '@luke-ui/react/heading';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { applyInterfaceSettings } from '../api/settings-api.js';
import { settingsQueryOptions } from '../api/settings-query.js';
import * as styles from '../styles/settings.css.js';

const NAME_PARTS_PATTERN = /\s+/;

export function HomePage() {
	const settings = useQuery(settingsQueryOptions).data;
	const profile = settings?.profile;
	const firstName = profile?.displayName.trim().split(NAME_PARTS_PATTERN)[0];

	useEffect(() => {
		if (settings) applyInterfaceSettings(settings.preferences);
	}, [settings]);

	return (
		<Box
			backgroundColor="surface.canvas"
			blockSize="100%"
			className={cx(rootClassName, styles.shell)}
			display="flex"
			minBlockSize="100%"
			overflow="hidden"
		>
			<title>Home</title>
			<Box
				backgroundColor="surface.floating"
				boxShadow={{ bp768: 'raised' }}
				className={styles.main}
				elementType="main"
				flexGrow="1"
				marginBlock={{ bp768: 'sp8' }}
				marginInline={{ bp768: 'sp8' }}
				minBlockSize={0}
				overflow="hidden"
			>
				<Box
					blockSize="100%"
					className={styles.mainScroll}
					overflowY="auto"
					paddingBlock={{ bp768: 'sp64', initial: 'sp32' }}
					paddingInline={{ bp768: 'sp40', initial: 'sp16' }}
				>
					<Container maxInlineSize="ct672">
						<Stack alignItems="flex-start" gap="sp16">
							<Heading level={1} shouldDisableTrim typography="heading2">
								{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
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
