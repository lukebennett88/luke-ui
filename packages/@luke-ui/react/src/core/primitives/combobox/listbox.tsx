import type { JSX, ReactNode } from 'react';
import { Collection } from 'react-aria-components/Collection';
import type { ListBoxProps as RacListBoxProps } from 'react-aria-components/ComboBox';
import { ListBox as RacListBox } from 'react-aria-components/ComboBox';
import { ListBoxContext } from 'react-aria-components/ListBox';
import { useSlottedContext } from 'react-aria-components/slots';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveRacXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { resolveComboboxRecipeSlotStyles } from './recipe.js';

type _ComboboxListBoxOmit<T extends object> = DistributiveOmit<
	RacListBoxProps<T>,
	'dependencies' | 'items'
>;

interface _ComboboxListBoxProps<T extends object> extends _ComboboxListBoxOmit<T>, XStyleProps {
	/** Item content for the listbox (render prop or static children). */
	children?: RacListBoxProps<T>['children'];
	/** Values that should invalidate the dynamic item cache. */
	dependencies?: ReadonlyArray<unknown>;
	/** Dynamic items rendered by the `children` render prop. */
	items?: Iterable<T>;
	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ReactNode;
}

/** Props for the styled listbox. */
export type ComboboxListBoxProps<T extends object> = Prettify<_ComboboxListBoxProps<T>>;

/** Styled listbox for combobox options. */
export function ComboboxListBox<T extends object>(props: ComboboxListBoxProps<T>): JSX.Element {
	const { children, dependencies, items, loadMoreItem, style, xstyle, ...listBoxProps } = props;
	const listBoxContext = useSlottedContext(ListBoxContext);
	const collectionItems = items ?? listBoxContext?.items;
	const recipeStyles = resolveComboboxRecipeSlotStyles('listBox');
	const listBoxChildren =
		typeof children === 'function' ? (
			<Collection<T> dependencies={dependencies} items={collectionItems}>
				{children}
			</Collection>
		) : (
			children
		);

	return (
		<RacListBox
			{...listBoxProps}
			{...resolveRacXStyleProps(recipeStyles, xstyle, listBoxProps.className, style)}
		>
			{listBoxChildren}
			{loadMoreItem}
		</RacListBox>
	);
}
