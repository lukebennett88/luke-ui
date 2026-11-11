import { Cluster } from '@luke-ui/react/cluster';
import { cx } from '@luke-ui/react/utils';
import type { ComponentProps, ReactNode } from 'react';
import * as styles from './playground.css.js';

type PlaygroundPaneToolbarProps = {
	children: ReactNode;
	className?: string;
	gap?: ComponentProps<typeof Cluster>['gap'];
	justifyContent?: ComponentProps<typeof Cluster>['justifyContent'];
};

/** Shared toolbar chrome for editor and preview panes so bottom borders align. */
export function PlaygroundPaneToolbar({
	children,
	className,
	gap,
	justifyContent,
}: PlaygroundPaneToolbarProps) {
	return (
		<Cluster
			className={cx(styles.paneToolbar, className)}
			flexShrink="0"
			flexWrap="nowrap"
			gap={gap}
			justifyContent={justifyContent}
		>
			{children}
		</Cluster>
	);
}
