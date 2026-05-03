import type { CSSProperties, JSX, ReactNode } from 'react';
import { ComboboxControl } from '../combobox/control.js';
import { ComboboxEmptyState } from '../combobox/empty-state.js';
import { ComboboxTextInput } from '../combobox/input.js';
import { ComboboxLoadMoreItem } from '../combobox/item.js';
import type { ComboboxLoadMoreItemProps } from '../combobox/item.js';
import { ComboboxListBox } from '../combobox/listbox.js';
import type { ComboboxListBoxProps } from '../combobox/listbox.js';
import { ComboboxPopover } from '../combobox/popover.js';
import type { ComboboxPopoverProps } from '../combobox/popover.js';
import { ComboboxInput } from '../combobox/root.js';
import type { ComboboxInputProps, ComboboxSize } from '../combobox/root.js';
import { ComboboxTrigger } from '../combobox/trigger.js';
import type { FieldErrorProps } from '../field/error.js';
import { Field } from '../field/index.js';
import type { FieldNecessityIndicator } from '../field/label.js';
import { Icon } from '../icon/index.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';

type ComboboxLoadingState = 'error' | 'filtering' | 'idle' | 'loading' | 'loadingMore' | 'sorting';

/** Props for composed `ComboboxField` (searchable single-select). */
export interface ComboboxFieldProps<T extends object> extends DistributiveOmit<
	ComboboxInputProps<T>,
	'children'
> {
	/** Item content for the listbox (render prop or static children). */
	children: ComboboxListBoxProps<T>['children'];

	/** Helper text shown below the control. */
	description?: ReactNode;

	/** Error content passed to `FieldError`. */
	errorMessage?: FieldErrorProps['children'];

	/** Label content shown above the control. */
	label?: ReactNode;

	/** Props forwarded to the inner listbox. */
	listBoxProps?: DistributiveOmit<ComboboxListBoxProps<T>, 'children' | 'items' | 'loadMoreItem'>;

	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ComboboxListBoxProps<T>['loadMoreItem'];

	/** Async loading state used for built-in loading and empty states. */
	loadingState?: ComboboxLoadingState;

	/** Width applied to the popover menu. */
	menuWidth?: CSSProperties['width'];

	/** Label necessity style. @default 'icon' */
	necessityIndicator?: FieldNecessityIndicator;

	/** Called when the listbox reaches its load-more sentinel. */
	onLoadMore?: ComboboxLoadMoreItemProps['onLoadMore'];

	/** Placeholder text shown in the input. */
	placeholder?: string;

	/** Props forwarded to the inner popover. */
	popoverProps?: DistributiveOmit<ComboboxPopoverProps, 'children'>;

	/** Control size. @default 'medium' */
	size?: ComboboxSize;
}

/** Composes `ComboboxInput` with label, description, and error slots. */
export function ComboboxField<T extends object>(props: ComboboxFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		label,
		listBoxProps,
		loadMoreItem,
		loadingState,
		menuWidth,
		necessityIndicator,
		onLoadMore,
		placeholder,
		popoverProps,
		size = 'medium',
		...comboboxInputProps
	} = props;

	const isAsync = loadingState != null;

	return (
		<ComboboxInput<T> {...comboboxInputProps}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<ComboboxControl size={size}>
					<ComboboxTextInput placeholder={placeholder} size={size} />
					<ComboboxTrigger aria-label="Toggle options" size={size}>
						<Icon aria-hidden name="chevronDown" size={size === 'small' ? 'xsmall' : 'small'} />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover
					offset={4}
					{...popoverProps}
					style={
						menuWidth === undefined
							? popoverProps?.style
							: Object.assign({}, popoverProps?.style, { width: menuWidth })
					}
				>
					<ComboboxListBox<T>
						{...listBoxProps}
						loadMoreItem={
							loadMoreItem ??
							(onLoadMore == null ? null : (
								<ComboboxLoadMoreItem
									isLoading={loadingState === 'loadingMore'}
									onLoadMore={onLoadMore}
								>
									<LoadingSpinner aria-label="Loading more options..." size="small" />
								</ComboboxLoadMoreItem>
							))
						}
						renderEmptyState={
							listBoxProps?.renderEmptyState ??
							(isAsync
								? () =>
										loadingState === 'loading' || loadingState === 'filtering' ? (
											<ComboboxEmptyState>
												<LoadingSpinner aria-label="Loading options..." size="medium" />
											</ComboboxEmptyState>
										) : (
											<ComboboxEmptyState>No results</ComboboxEmptyState>
										)
								: undefined)
						}
					>
						{children}
					</ComboboxListBox>
				</ComboboxPopover>
			</Field>
		</ComboboxInput>
	);
}
