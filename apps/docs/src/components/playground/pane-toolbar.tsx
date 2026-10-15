import { cx } from '@luke-ui/react/utils';
import type { ReactNode } from 'react';
import * as styles from './playground.css.js';

type PlaygroundPaneToolbarProps = {
	children: ReactNode;
	className?: string;
};

/** Shared toolbar chrome for editor and preview panes so bottom borders align. */
export function PlaygroundPaneToolbar({ children, className }: PlaygroundPaneToolbarProps) {
	return <div className={cx(styles.paneToolbar, className)}>{children}</div>;
}
