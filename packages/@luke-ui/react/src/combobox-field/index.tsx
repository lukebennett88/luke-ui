import type { CSSProperties, JSX, ReactNode } from 'react';
import type { ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import type { FieldErrorProps } from '../field/primitive/error.js';
import { Field } from '../field/primitive/index.js';
import type { FieldNecessityIndicator } from '../field/primitive/label.js';
import { Icon } from '../icon/index.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { ComboboxControl } from './primitive/control.js';
import { ComboboxEmptyState } from './primitive/empty-state.js';
import { ComboboxTextInput } from './primitive/input.js';
import type { ComboboxLoadMoreItemProps } from './primitive/item.js';
import { ComboboxLoadMoreItem } from './primitive/item.js';
import type { ComboboxListBoxProps } from './primitive/listbox.js';
import { ComboboxListBox } from './primitive/listbox.js';
import type { ComboboxPopoverProps } from './primitive/popover.js';
import { ComboboxPopover } from './primitive/popover.js';
import type { ComboboxInputProps, ComboboxSize } from './primitive/root.js';
import { ComboboxInput } from './primitive/root.js';
import { ComboboxTrigger } from './primitive/trigger.js';

type ComboboxLoadingState = 'error' | 'filtering' | 'idle' | 'loading' | 'loadingMore' | 'sorting';

interface ComboboxFieldRedeclaredRACProps {
	/** Whether the combobox is disabled. */
	isDisabled?: RacComboBoxProps<object>['isDisabled'];
	/** Whether the combobox is read-only. */
	isReadOnly?: RacComboBoxProps<object>['isReadOnly'];
}

/**
 * Props for composed `ComboboxField` (searchable single-select).
 *
 * @tier composed
 */
export interface ComboboxFieldProps<T extends object>
	extends
		DistributiveOmit<ComboboxInputProps<T>, 'children' | keyof ComboboxFieldRedeclaredRACProps>,
		ComboboxFieldRedeclaredRACProps {
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

	/** Async loading state used for built-in loading and empty states. */
	loadingState?: ComboboxLoadingState;

	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ComboboxListBoxProps<T>['loadMoreItem'];

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
		<ComboboxInput<T> size={size} {...comboboxInputProps}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				<ComboboxControl>
					<ComboboxTextInput placeholder={placeholder} />
					<ComboboxTrigger aria-label="Toggle options">
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
								? () => {
										switch (loadingState) {
											case 'loading':
											case 'filtering': {
												return (
													<ComboboxEmptyState>
														<LoadingSpinner aria-label="Loading options..." size="medium" />
													</ComboboxEmptyState>
												);
											}
											default: {
												return <ComboboxEmptyState>No results</ComboboxEmptyState>;
											}
										}
									}
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
