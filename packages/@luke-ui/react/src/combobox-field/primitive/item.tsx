import type { JSX } from 'react';
import type {
	ListBoxItemProps as RacListBoxItemProps,
	ListBoxLoadMoreItemProps as RacListBoxLoadMoreItemProps,
} from 'react-aria-components/ComboBox';
import {
	ListBoxItem as RacListBoxItem,
	ListBoxLoadMoreItem as RacListBoxLoadMoreItem,
} from 'react-aria-components/ComboBox';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import * as styles from '../../recipes/combobox.css.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';

interface ComboboxStyleProps {
	size?: 'small' | 'medium';
}

/**
 * Props for a combobox list item.
 *
 * @tier primitive
 */
export interface ComboboxItemProps<T extends object>
	extends DistributiveOmit<RacListBoxItemProps<T>, 'className'>, ComboboxStyleProps {
	className?: RacListBoxItemProps<T>['className'];
}

export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { size = 'medium', ...itemProps } = props;

	return (
		<RacListBoxItem
			{...itemProps}
			className={composeRenderProps(itemProps.className, (className) => {
				return cx(styles.comboboxItem({ size }), className);
			})}
		/>
	);
}

/**
 * Props for the combobox load-more sentinel item.
 *
 * @tier primitive
 */
export interface ComboboxLoadMoreItemProps
	extends DistributiveOmit<RacListBoxLoadMoreItemProps, 'className'>, ComboboxStyleProps {
	className?: RacListBoxLoadMoreItemProps['className'];
}

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { size = 'medium', ...loadMoreItemProps } = props;

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={cx(styles.comboboxLoadMoreItem({ size }), loadMoreItemProps.className)}
		/>
	);
}
