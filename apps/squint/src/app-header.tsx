import { Box } from '@luke-ui/react/box';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Text } from '@luke-ui/react/text';
import type { ReactNode } from 'react';
import * as styles from './app-header.css.js';
import logo from './assets/squint-logo.png';
import { repository } from './config.js';
import { TOP_BAR_ID } from './review/scroll-position.js';

export function AppHeader({
	actions,
	children,
	reportTitle,
}: {
	actions?: ReactNode;
	children?: ReactNode;
	reportTitle?: ReactNode;
}) {
	const wordmark = (
		<Link
			className={reportTitle != null ? styles.reviewWordmark : undefined}
			href={window.location.pathname}
			prominence="low"
		>
			<span className={styles.brand}>
				{/* The name beside it says it all, so the logo is decoration. */}
				<img alt="" className={styles.logo} height={28} src={logo} width={28} />
				<Text color="primary" fontWeight="emphasis" typography="label">
					Squint
				</Text>
			</span>
		</Link>
	);

	return (
		<Box
			backgroundColor="surface.subdued"
			className={styles.header}
			display="flex"
			elementType="header"
			id={TOP_BAR_ID}
			justifyContent="space-between"
		>
			{reportTitle != null ? (
				<Lockup gap="space.12" minInlineSize="0" railAlignment="center">
					<LockupRail className={children ? undefined : styles.reviewWordmark}>
						<Cluster flexWrap="nowrap" gap="space.12">
							{wordmark}
							{children}
						</Cluster>
					</LockupRail>
					<LockupBody>{reportTitle}</LockupBody>
				</Lockup>
			) : (
				<Box alignItems="center" display="flex" flexShrink="0" gap="space.12">
					{wordmark}
					{children}
				</Box>
			)}
			{actions === undefined ? (
				<Link
					appearance="button"
					endContent={<Icon name="externalLink" size="xsmall" />}
					href={`https://github.com/${repository}/pulls`}
					prominence="low"
					target="_blank"
				>
					{repository}
				</Link>
			) : (
				actions
			)}
		</Box>
	);
}
