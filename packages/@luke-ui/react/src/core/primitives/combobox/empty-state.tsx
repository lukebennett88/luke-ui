import type { CSSProperties, JSX, ReactNode } from 'react';
import { resolveRecipeSlotProps } from '../../styles/recipe-authoring.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { composeRecipeProps } from '../../styles/xstyle.js';
import type { Prettify } from '../../types/prettify.js';
import { comboboxRecipe } from './recipe.js';

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
			{...composeRecipeProps(
				resolveRecipeSlotProps(comboboxRecipe, 'emptyState', undefined, xstyle),
				{
					className,
					style,
				},
			)}
		>
			{children}
		</div>
	);
}
