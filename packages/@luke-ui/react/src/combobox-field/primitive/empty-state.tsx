import type { JSX, ReactNode } from 'react';
import * as styles from '../../recipes/combobox.css.js';
import type { Prettify } from '../../types/prettify.js';

interface _ComboboxEmptyStateProps {
	children: ReactNode;
	className?: string;
}

/**
 * Props for `ComboboxEmptyState`.
 *
 * @tier primitive
 */
export type ComboboxEmptyStateProps = Prettify<_ComboboxEmptyStateProps>;

export function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element {
	const { children, className } = props;

	return <div className={styles.combobox().emptyState(className)}>{children}</div>;
}
