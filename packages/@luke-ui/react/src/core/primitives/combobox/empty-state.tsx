import type { CSSProperties, JSX, ReactNode } from 'react';
import type { XStyleProp } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveComboboxRecipeStyles } from './recipe.js';

interface _ComboboxEmptyStateProps {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	/**
	 * Extra styles as one or more `stylex.create(...)` objects. Applied after `ComboboxEmptyState`'s
	 * own styles and before `className`. A same-property `xstyle` value wins over those styles. A
	 * consumer `className` still beats `xstyle`, and inline `style` beats `className`.
	 */
	xstyle?: XStyleProp;
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
