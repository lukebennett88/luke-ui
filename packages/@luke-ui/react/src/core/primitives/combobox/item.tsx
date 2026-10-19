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
import { cx } from '../../../shared/utils/utils.js';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { Icon } from '../../icon/icon.js';
import { COMBOBOX_CHECK_ICON_SIZE } from '../../sizing/combobox-sizing.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxItemClassName, comboboxRecipe } from './styles.css.js';

type _ComboboxItemOmit<T extends object> = DistributiveOmit<
	RacListBoxItemProps<T>,
	'className' | 'render'
>;

interface _ComboboxItemProps<T extends object> extends _ComboboxItemOmit<T> {
	className?: RacListBoxItemProps<T>['className'];
	/**
	 * Passes resolved DOM props and item state to a caller-owned item root element.
	 */
	renderRoot?: RacListBoxItemProps<T>['render'];
	size?: ComboboxSize;
}

/** Props for a combobox list item. */
export type ComboboxItemProps<T extends object> = Prettify<_ComboboxItemProps<T>>;

export function ComboboxItem<T extends object>(props: ComboboxItemProps<T>): JSX.Element {
	const { renderRoot, size: sizeProp, ...itemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxItem
			// The children wrapper below is a render function, which disables RAC's
			// own string-children textValue inference — so re-derive it here.
			textValue={typeof itemProps.children === 'string' ? itemProps.children : undefined}
			{...itemProps}
			className={composeRenderProps(itemProps.className, (className) => {
				return cx(comboboxItemClassName, comboboxRecipe({ size }).item({ className }));
			})}
			render={renderRoot}
		>
			{composeRenderProps(itemProps.children, (children, { isSelected }) => {
				// RAC renders item content outside this component's original tree.
				// Put the provider inside the item render function so the content receives the context.
				return (
					<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
						{children}
						{isSelected ? (
							<Icon
								aria-hidden
								className={comboboxRecipe().itemCheck()}
								name="check"
								size={COMBOBOX_CHECK_ICON_SIZE}
							/>
						) : null}
					</IconSizeProvider>
				);
			})}
		</RacListBoxItem>
	);
}

type _ComboboxLoadMoreItemOmit = DistributiveOmit<
	RacListBoxLoadMoreItemProps,
	'className' | 'render'
>;
interface _ComboboxLoadMoreItemProps extends _ComboboxLoadMoreItemOmit {
	className?: RacListBoxLoadMoreItemProps['className'];
	/**
	 * Passes resolved DOM props to a caller-owned load-more root element.
	 */
	renderRoot?: RacListBoxLoadMoreItemProps['render'];
	size?: ComboboxSize;
}

/** Props for the combobox load-more sentinel item. */
export type ComboboxLoadMoreItemProps = Prettify<_ComboboxLoadMoreItemProps>;

export function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element {
	const { renderRoot, size: sizeProp, ...loadMoreItemProps } = props;
	const size = useComboboxSize(sizeProp);

	return (
		<RacListBoxLoadMoreItem
			{...loadMoreItemProps}
			className={comboboxRecipe({ size }).loadMoreItem({ className: loadMoreItemProps.className })}
			render={renderRoot}
		/>
	);
}
