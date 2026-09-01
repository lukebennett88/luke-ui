import type { CSSProperties, JSX, ReactNode } from 'react';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveComboboxRecipeStyles } from './recipe.js';

interface _ComboboxEmptyStateProps extends XStyleProps {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

/** Props for `ComboboxEmptyState`. */
export type ComboboxEmptyStateProps = Prettify<_ComboboxEmptyStateProps>;

export function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element {
	const { children, className, style, xstyle } = props;

	return (
		<div
			{...resolveXStyleProps(resolveComboboxRecipeStyles().emptyState, xstyle, className, style)}
		>
			{children}
		</div>
	);
}
