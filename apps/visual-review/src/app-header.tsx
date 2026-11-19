import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';
import * as styles from './app-header.css.js';
import { repository } from './config.js';

/** The dashboard's top bar, in the same tone and height as the review's. */
export function AppHeader() {
	return (
		<Box backgroundColor="surface.subdued" className={styles.header} elementType="header">
			<Text fontWeight="label">Visual review</Text>
			<Link
				appearance="button"
				endContent={<Icon name="externalLink" size="xsmall" />}
				href={`https://github.com/${repository}/pulls`}
				prominence="low"
				size="small"
				target="_blank"
			>
				{repository}
			</Link>
		</Box>
	);
}
