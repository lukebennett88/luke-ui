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
import { IconSizeProvider } from '../../icon-size-context/index.js';
import { Icon } from '../../icon/index.js';
import * as styles from '../../recipes/combobox.css.js';
import { COMBOBOX_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import { cx } from '../../utils/index.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

/**
 * Props for a combobox list item.
 *
 * @tier primitive
 */
export interface ComboboxItemProps<T extends object> extends DistributiveOmit<
	RacListBoxItemProps<T>,
	'className'
> {
	className?: RacListBoxItemProps<T>['className'];
	size?: ComboboxSize;
}

export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { size: sizeProp, ...itemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<IconSizeProvider size={COMBOBOX_ICON_SIZE[size]}>
			<RacListBoxItem
				// The children wrapper below is a render function, which disables RAC's
				// own string-children textValue inference — so re-derive it here.
				textValue={typeof itemProps.children === 'string' ? itemProps.children : undefined}
				{...itemProps}
				className={composeRenderProps(itemProps.className, (className) => {
					return cx(styles.comboboxItem({ size }), className);
				})}
			>
				{composeRenderProps(itemProps.children, (children, { isSelected }) => {
					return (
						<>
							{children}
							{isSelected ? (
								<Icon aria-hidden className={styles.comboboxItemCheck} name="check" />
							) : null}
						</>
					);
				})}
			</RacListBoxItem>
		</IconSizeProvider>
	);
}

/**
 * Props for the combobox load-more sentinel item.
 *
 * @tier primitive
 */
export interface ComboboxLoadMoreItemProps extends DistributiveOmit<
	RacListBoxLoadMoreItemProps,
	'className'
> {
	className?: RacListBoxLoadMoreItemProps['className'];
	size?: ComboboxSize;
}

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { size: sizeProp, ...loadMoreItemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={cx(styles.comboboxLoadMoreItem({ size }), loadMoreItemProps.className)}
		/>
	);
}
