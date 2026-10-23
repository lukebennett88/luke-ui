import { Box } from '@luke-ui/react/box';
import { Grid } from '@luke-ui/react/grid';
import { Heading } from '@luke-ui/react/heading';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { HOME_SECTIONS } from '../lib/home-content.js';
import { DocsLink } from './docs-link.js';
import * as styles from './home-section-links.css.js';

/** One whole-surface link card per docs section. Each title is an `h2` under the page title. */
export function HomeSectionLinks() {
	return (
		<Grid
			columns={{
				initial: 1,
				bp768: 2,
			}}
			gap="space.16"
		>
			{HOME_SECTIONS.map((section) => (
				<Box
					backgroundColor="surface.subdued"
					blockSize="100%"
					borderRadius="surface"
					className={styles.card}
					key={section.href}
					padding={{
						initial: 'space.24',
						bp768: 'space.32',
					}}
					renderRoot={(domProps) => <DocsLink {...domProps} appearance="text" to={section.href} />}
				>
					<Stack gap="space.12">
						<Heading typography="heading4">{section.title}</Heading>
						<Text color="secondary" elementType="p" fontWeight="body">
							{section.description}
						</Text>
					</Stack>
				</Box>
			))}
		</Grid>
	);
}
