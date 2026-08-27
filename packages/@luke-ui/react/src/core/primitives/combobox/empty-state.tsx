import type { JSX, ReactNode } from 'react';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe } from './styles.css.js';

interface _ComboboxEmptyStateProps {
	children: ReactNode;
	className?: string;
}

/** Props for `ComboboxEmptyState`. */
export type ComboboxEmptyStateProps = Prettify<_ComboboxEmptyStateProps>;

export function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element {
	const { children, className } = props;

	return <div className={comboboxRecipe().emptyState(className)}>{children}</div>;
}
