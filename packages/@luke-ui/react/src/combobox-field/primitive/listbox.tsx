import type { JSX, ReactNode } from 'react';
import { Collection } from 'react-aria-components/Collection';
import type { ListBoxProps as RacListBoxProps } from 'react-aria-components/ComboBox';
import { ListBox as RacListBox } from 'react-aria-components/ComboBox';
import { ListBoxContext } from 'react-aria-components/ListBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';

/**
 * Props for the styled listbox.
 *
 * @tier primitive
 */
export interface ComboboxListBoxProps<T extends object> extends DistributiveOmit<
	RacListBoxProps<T>,
	'dependencies' | 'items'
> {
	/** Item content for the listbox (render prop or static children). */
	children?: RacListBoxProps<T>['children'];
	/** Values that should invalidate the dynamic item cache. */
	dependencies?: ReadonlyArray<unknown>;
	/** Dynamic items rendered by the `children` render prop. */
	items?: Iterable<T>;
	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ReactNode;
}

/** Styled listbox for combobox options. */
export function ComboboxListBox<T extends object>(props: ComboboxListBoxProps<T>): JSX.Element {
	const { children, dependencies, items, loadMoreItem, ...listBoxProps } = props;
	const listBoxContext = useSlottedContext(ListBoxContext);
	const collectionItems = items ?? listBoxContext?.items;
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
			className={composeRenderProps(listBoxProps.className, (className) => {
				return cx(styles.comboboxListBox(), className);
			})}
		>
			{listBoxChildren}
			{loadMoreItem}
		</RacListBox>
	);
}
