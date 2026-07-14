import type { CSSProperties, JSX } from 'react';
import { useRef } from 'react';
import type { ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import type { FieldSlotProps } from '../field/compose-field.js';
import { composeField } from '../field/compose-field.js';
import { Field } from '../field/primitive/index.js';
import { Icon } from '../icon/index.js';
import { LoadingSpinner } from '../loading-spinner/index.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import { ComboboxClearButton } from './primitive/clear-button.js';
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
		ComboboxFieldRedeclaredRACProps,
		FieldSlotProps {
	/** Item content for the listbox (render prop or static children). */
	children: ComboboxListBoxProps<T>['children'];

	/** Props forwarded to the inner listbox. */
	listBoxProps?: DistributiveOmit<ComboboxListBoxProps<T>, 'children' | 'items' | 'loadMoreItem'>;

	/** Async loading state used for built-in loading and empty states. */
	loadingState?: ComboboxLoadingState;

	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ComboboxListBoxProps<T>['loadMoreItem'];

	/** Width applied to the popover menu. */
	menuWidth?: CSSProperties['width'];

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
	const controlRef = useRef<HTMLDivElement>(null);
	const [fieldSlotProps, restProps] = composeField(props);
	const {
		children,
		listBoxProps,
		loadMoreItem: loadMoreItemProp,
		loadingState,
		menuWidth,
		onLoadMore,
		placeholder,
		popoverProps,
		size = 'medium',
		...comboboxInputProps
	} = restProps;

	const isAsync: boolean = loadingState != null;
	const isInteractive: boolean =
		comboboxInputProps.isDisabled !== true && comboboxInputProps.isReadOnly !== true;

	const loadMoreItem: ComboboxListBoxProps<T>['loadMoreItem'] = (() => {
		if (loadMoreItemProp != null) return loadMoreItemProp;
		if (onLoadMore == null) return null;

		return (
			<ComboboxLoadMoreItem isLoading={loadingState === 'loadingMore'} onLoadMore={onLoadMore}>
				<LoadingSpinner aria-label="Loading more options..." size="small" />
			</ComboboxLoadMoreItem>
		);
	})();

	const resolvedEmptyState: ComboboxListBoxProps<T>['renderEmptyState'] = (() => {
		if (listBoxProps?.renderEmptyState != null) return listBoxProps.renderEmptyState;
		if (!isAsync) return undefined;

		return () => <ComboboxEmptyStateContent loadingState={loadingState} />;
	})();

	const resolvedStyle: ComboboxPopoverProps['style'] = (() => {
		if (menuWidth === undefined) return popoverProps?.style;

		return Object.assign({}, popoverProps?.style, { width: menuWidth });
	})();

	return (
		<ComboboxInput<T> size={size} {...comboboxInputProps}>
			<Field {...fieldSlotProps}>
				<ComboboxControl ref={controlRef}>
					<ComboboxTextInput placeholder={placeholder} />
					{isInteractive ? (
						<ComboboxClearButton aria-label="Clear selection">
							<Icon aria-hidden name="close" />
						</ComboboxClearButton>
					) : null}
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" />
					</ComboboxTrigger>
				</ComboboxControl>
				<ComboboxPopover offset={4} {...popoverProps} style={resolvedStyle} triggerRef={controlRef}>
					<ComboboxListBox<T>
						{...listBoxProps}
						loadMoreItem={loadMoreItem}
						renderEmptyState={resolvedEmptyState}
					>
						{children}
					</ComboboxListBox>
				</ComboboxPopover>
			</Field>
		</ComboboxInput>
	);
}

function ComboboxEmptyStateContent({
	loadingState,
}: {
	loadingState: ComboboxLoadingState | undefined;
}) {
	if (loadingState === 'loading' || loadingState === 'filtering') {
		return (
			<ComboboxEmptyState>
				<LoadingSpinner aria-label="Loading options..." size="medium" />
			</ComboboxEmptyState>
		);
	}

	return <ComboboxEmptyState>No results</ComboboxEmptyState>;
}
