import type { CSSProperties, JSX, ReactNode, Ref } from 'react';
import type { ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import { Icon } from '../icon/icon.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import { useIsMobileDevice } from '../overlays/use-is-mobile-device.js';
import { ComboboxClearButton } from '../primitives/combobox/clear-button.js';
import { ComboboxEmptyState } from '../primitives/combobox/empty-state.js';
import { ComboboxInputGroup } from '../primitives/combobox/input-group.js';
import { ComboboxInput } from '../primitives/combobox/input.js';
import type { ComboboxLoadMoreItemProps } from '../primitives/combobox/item.js';
import { ComboboxLoadMoreItem } from '../primitives/combobox/item.js';
import type { ComboboxListBoxProps } from '../primitives/combobox/listbox.js';
import { ComboboxListBox } from '../primitives/combobox/listbox.js';
import type { ComboboxPopoverProps } from '../primitives/combobox/popover.js';
import { ComboboxPopover } from '../primitives/combobox/popover.js';
import type { ComboboxRootProps, ComboboxSize } from '../primitives/combobox/root.js';
import { ComboboxRoot } from '../primitives/combobox/root.js';
import { ComboboxTrayTrigger } from '../primitives/combobox/tray-trigger.js';
import { ComboboxTray } from '../primitives/combobox/tray.js';
import { ComboboxTrigger } from '../primitives/combobox/trigger.js';
import type { FieldSlotProps } from '../primitives/field/field.js';
import {
	Field,
	isInvalidFromErrorMessage,
	normalizeErrorMessage,
} from '../primitives/field/field.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';

type ComboboxLoadingState = 'error' | 'filtering' | 'idle' | 'loading' | 'loadingMore' | 'sorting';

interface ComboboxFieldRedeclaredRACProps {
	/** Whether the combobox is disabled. */
	isDisabled?: RacComboBoxProps<object>['isDisabled'];
	/** Whether the combobox is read-only. */
	isReadOnly?: RacComboBoxProps<object>['isReadOnly'];
}

type _ComboboxFieldOmit<T extends object> = DistributiveOmit<
	ComboboxRootProps<T>,
	'children' | 'isInvalid' | keyof ComboboxFieldRedeclaredRACProps
>;

interface _ComboboxFieldProps<T extends object>
	extends _ComboboxFieldOmit<T>, ComboboxFieldRedeclaredRACProps, FieldSlotProps {
	/** Item content for the listbox (render prop or static children). */
	children: ComboboxListBoxProps<T>['children'];

	/** Validation message for a controlled error. A non-empty message marks the field invalid. */
	errorMessage?: ReactNode;

	/**
	 * Targets the persistent combobox input on desktop. On mobile it targets the tray search input
	 * only while the tray is open, so it is null when the tray is closed.
	 */
	inputRef?: Ref<HTMLInputElement>;

	/** Props forwarded to the inner listbox. */
	listBoxProps?: DistributiveOmit<ComboboxListBoxProps<T>, 'children' | 'items' | 'loadMoreItem'>;

	/** Async loading state used for built-in loading and empty states. */
	loadingState?: ComboboxLoadingState;

	/** Optional content appended after the main collection, e.g. a load-more sentinel. */
	loadMoreItem?: ComboboxListBoxProps<T>['loadMoreItem'];

	/** Width applied to the desktop popover menu. Mobile uses the tray instead. */
	menuWidth?: CSSProperties['width'];

	/** Called when the listbox reaches its load-more sentinel. */
	onLoadMore?: ComboboxLoadMoreItemProps['onLoadMore'];

	/** Placeholder text shown in the input. */
	placeholder?: string;

	/** Props forwarded to the desktop popover. Mobile uses the tray instead. */
	popoverProps?: DistributiveOmit<ComboboxPopoverProps, 'children'>;

	/** Control size. @default 'medium' */
	size?: ComboboxSize;
}

/** Props for `ComboboxField` (searchable single-select). */
export type ComboboxFieldProps<T extends object> = Prettify<_ComboboxFieldProps<T>>;

/** Composes `ComboboxRoot` with label, description, and error slots. */
export function ComboboxField<T extends object>(props: ComboboxFieldProps<T>): JSX.Element {
	const {
		children,
		description,
		errorMessage,
		inputRef,
		label,
		listBoxProps,
		loadMoreItem: loadMoreItemProp,
		loadingState,
		menuWidth,
		necessityIndicator,
		onLoadMore,
		placeholder,
		popoverProps,
		size = 'medium',
		...comboboxRootProps
	} = props;

	const normalizedErrorMessage = normalizeErrorMessage(errorMessage);

	const isMobileDevice = useIsMobileDevice();
	const isAsync: boolean = loadingState != null;
	const isInteractive: boolean =
		comboboxRootProps.isDisabled !== true && comboboxRootProps.isReadOnly !== true;

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
		if (!isAsync) return;

		return () => <ComboboxEmptyStateContent loadingState={loadingState} />;
	})();

	const resolvedStyle: ComboboxPopoverProps['style'] = (() => {
		if (menuWidth === undefined) return popoverProps?.style;

		return Object.assign({}, popoverProps?.style, { width: menuWidth });
	})();

	const listBox = (
		<ComboboxListBox<T>
			{...listBoxProps}
			loadMoreItem={loadMoreItem}
			renderEmptyState={resolvedEmptyState}
		>
			{children}
		</ComboboxListBox>
	);

	const content = (() => {
		if (isMobileDevice) {
			return (
				<>
					<ComboboxInputGroup>
						<ComboboxTrayTrigger placeholder={placeholder}>
							<Icon aria-hidden name="chevronDown" />
						</ComboboxTrayTrigger>
					</ComboboxInputGroup>
					<ComboboxTray>
						<ComboboxInputGroup>
							<ComboboxInput placeholder={placeholder} ref={inputRef} />
							<ComboboxClearButton aria-label="Clear search">
								<Icon aria-hidden name="close" />
							</ComboboxClearButton>
						</ComboboxInputGroup>
						{listBox}
					</ComboboxTray>
				</>
			);
		}

		return (
			<>
				<ComboboxInputGroup>
					<ComboboxInput placeholder={placeholder} ref={inputRef} />
					{isInteractive ? (
						<ComboboxClearButton aria-label="Clear selection">
							<Icon aria-hidden name="close" />
						</ComboboxClearButton>
					) : null}
					<ComboboxTrigger aria-label="Toggle options">
						<Icon aria-hidden name="chevronDown" />
					</ComboboxTrigger>
				</ComboboxInputGroup>
				<ComboboxPopover offset={4} {...popoverProps} style={resolvedStyle}>
					{listBox}
				</ComboboxPopover>
			</>
		);
	})();

	return (
		<ComboboxRoot
			size={size}
			{...comboboxRootProps}
			isInvalid={isInvalidFromErrorMessage(normalizedErrorMessage)}
		>
			<Field
				description={description}
				errorMessage={normalizedErrorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				{content}
			</Field>
		</ComboboxRoot>
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
