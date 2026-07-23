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
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxItemOmit<T extends object> = DistributiveOmit<RacListBoxItemProps<T>, 'className'>;

interface _ComboboxItemProps<T extends object> extends _ComboboxItemOmit<T> {
	className?: RacListBoxItemProps<T>['className'];
	size?: ComboboxSize;
}

/**
 * Props for a combobox list item.
 *
 * @tier primitive
 */
export type ComboboxItemProps<T extends object> = Prettify<_ComboboxItemProps<T>>;

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
					return styles.combobox({ size }).item(className);
				})}
			>
				{composeRenderProps(itemProps.children, (children, { isSelected }) => {
					return (
						<>
							{children}
							{isSelected ? (
								<Icon aria-hidden className={styles.combobox().itemCheck()} name="check" />
							) : null}
						</>
					);
				})}
			</RacListBoxItem>
		</IconSizeProvider>
	);
}

type _ComboboxLoadMoreItemOmit = DistributiveOmit<RacListBoxLoadMoreItemProps, 'className'>;
interface _ComboboxLoadMoreItemProps extends _ComboboxLoadMoreItemOmit {
	className?: RacListBoxLoadMoreItemProps['className'];
	size?: ComboboxSize;
}

/**
 * Props for the combobox load-more sentinel item.
 *
 * @tier primitive
 */
export type ComboboxLoadMoreItemProps = Prettify<_ComboboxLoadMoreItemProps>;

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { size: sizeProp, ...loadMoreItemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={styles.combobox({ size }).loadMoreItem(loadMoreItemProps.className)}
		/>
	);
}
