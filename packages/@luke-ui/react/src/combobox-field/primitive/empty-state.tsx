import type { JSX, ReactNode } from 'react';
import * as styles from '../../recipes/combobox.js';
import type { Prettify } from '../../types/prettify.js';
import { cx } from '../../utils/index.js';

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
	const comboboxStyles = styles.combobox();

	return <div className={cx(comboboxStyles.emptyState, className)}>{children}</div>;
}
