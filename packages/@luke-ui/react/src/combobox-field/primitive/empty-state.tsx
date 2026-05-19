import type { JSX, ReactNode } from 'react';
import * as styles from '../../recipes/combobox.css.js';
import { cx } from '../../utils/index.js';

/**
 * Props for `ComboboxEmptyState`.
 *
 * @tier primitive
 */
export interface ComboboxEmptyStateProps {
	children: ReactNode;
	className?: string;
}

export function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element {
	const { children, className } = props;

	return <div className={cx(styles.comboboxEmptyState(), className)}>{children}</div>;
}
