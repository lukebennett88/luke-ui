import { useObjectRef } from '@react-aria/utils';
import type { CSSProperties, JSX, Ref } from 'react';
import { useContext, useEffect, useId } from 'react';
import { SelectableCollectionContext } from 'react-aria-components/Autocomplete';
import { Button as RacButton } from 'react-aria-components/Button';
import type { ComboBoxProps as RacComboBoxProps } from 'react-aria-components/ComboBox';
import { ComboBoxStateContext, ComboBoxValue } from 'react-aria-components/ComboBox';
import { LabelContext } from 'react-aria-components/Label';
import { PopoverContext } from 'react-aria-components/Popover';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { useSlottedContext } from 'react-aria-components/slots';
import { Icon } from '../icon/icon.js';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.js';
import { MobileOverlay } from '../overlays/mobile-overlay.js';
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
import { comboboxRecipe } from '../primitives/combobox/styles.css.js';
import { ComboboxTrigger } from '../primitives/combobox/trigger.js';
import type { FieldSlotProps } from '../primitives/field/field.js';
import { Field } from '../primitives/field/field.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/utils.js';

type ComboboxLoadingState = 'error' | 'filtering' | 'idle' | 'loading' | 'loadingMore' | 'sorting';

const mobileListBoxContextValue = { shouldUseVirtualFocus: true };

interface ComboboxFieldRedeclaredRACProps {
	/** Whether the combobox is disabled. */
	isDisabled?: RacComboBoxProps<object>['isDisabled'];
	/** Whether the combobox is read-only. */
	isReadOnly?: RacComboBoxProps<object>['isReadOnly'];
}

type _ComboboxFieldOmit<T extends object> = DistributiveOmit<
	ComboboxRootProps<T>,
	'children' | keyof ComboboxFieldRedeclaredRACProps
>;

interface _ComboboxFieldProps<T extends object>
	extends _ComboboxFieldOmit<T>, ComboboxFieldRedeclaredRACProps, FieldSlotProps {
	/** Item content for the listbox (render prop or static children). */
	children: ComboboxListBoxProps<T>['children'];

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
		if (!isAsync) return undefined;

		return () => <ComboboxEmptyStateContent loadingState={loadingState} />;
	})();

	const resolvedStyle: ComboboxPopoverProps['style'] = (() => {
		if (menuWidth === undefined) return popoverProps?.style;

		return Object.assign({}, popoverProps?.style, { width: menuWidth });
	})();

	const content = (() => {
		if (isMobileDevice) {
			return (
				<MobileComboboxContent<T>
					inputRef={inputRef}
					isDisabled={comboboxRootProps.isDisabled === true}
					isReadOnly={comboboxRootProps.isReadOnly === true}
					listBoxProps={listBoxProps}
					loadMoreItem={loadMoreItem}
					placeholder={placeholder}
					renderEmptyState={resolvedEmptyState}
					size={size}
				>
					{children}
				</MobileComboboxContent>
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
					<ComboboxListBox<T>
						{...listBoxProps}
						loadMoreItem={loadMoreItem}
						renderEmptyState={resolvedEmptyState}
					>
						{children}
					</ComboboxListBox>
				</ComboboxPopover>
			</>
		);
	})();

	return (
		<ComboboxRoot size={size} {...comboboxRootProps}>
			<Field
				description={description}
				errorMessage={errorMessage}
				label={label}
				necessityIndicator={necessityIndicator}
			>
				{content}
			</Field>
		</ComboboxRoot>
	);
}

function MobileComboboxContent<T extends object>({
	children,
	inputRef,
	isDisabled,
	isReadOnly,
	listBoxProps,
	loadMoreItem,
	placeholder,
	renderEmptyState,
	size,
}: {
	children: ComboboxListBoxProps<T>['children'];
	isDisabled: boolean;
	isReadOnly: boolean;
	inputRef: Ref<HTMLInputElement> | undefined;
	listBoxProps: ComboboxFieldProps<T>['listBoxProps'];
	loadMoreItem: ComboboxListBoxProps<T>['loadMoreItem'];
	placeholder: string | undefined;
	renderEmptyState: ComboboxListBoxProps<T>['renderEmptyState'];
	size: ComboboxSize;
}): JSX.Element | null {
	const mobileInputRef = useObjectRef(inputRef);
	const labelContext = useSlottedContext(LabelContext);
	const popoverContext = useSlottedContext(PopoverContext);
	const state = useContext(ComboBoxStateContext);
	const valueId = useId();

	const ariaLabelledBy = labelContext?.id == null ? undefined : cx(labelContext.id, valueId);
	const comboboxStyles = comboboxRecipe({ size });

	const mobileListBoxClassName = composeRenderProps(listBoxProps?.className, (className) => {
		return comboboxStyles.mobileListBox(className);
	});

	const listBox = (
		<SelectableCollectionContext.Provider value={mobileListBoxContextValue}>
			<ComboboxListBox<T>
				{...listBoxProps}
				className={mobileListBoxClassName}
				loadMoreItem={loadMoreItem}
				renderEmptyState={renderEmptyState}
				shouldSelectOnPressUp={false}
			>
				{children}
			</ComboboxListBox>
		</SelectableCollectionContext.Provider>
	);

	// Focus the tray search input when the tray opens
	useEffect(() => {
		if (state?.isOpen !== true) return;

		mobileInputRef.current?.focus({ preventScroll: true });
	}, [mobileInputRef, state?.isOpen]);

	// RAC builds the collection before it provides state.
	if (state == null) return listBox;

	return (
		<>
			<ComboboxInputGroup>
				<RacButton
					aria-expanded={state.isOpen}
					aria-haspopup="dialog"
					aria-label={labelContext?.id == null ? labelContext?.['aria-label'] : undefined}
					aria-labelledby={ariaLabelledBy}
					className={comboboxStyles.mobileTrigger()}
					isDisabled={isDisabled || isReadOnly}
					onPress={() => {
						if (isReadOnly) return;

						state.open(null, 'manual');
					}}
					slot={null}
				>
					<ComboBoxValue
						className={comboboxStyles.mobileValue()}
						id={valueId}
						placeholder={placeholder}
					/>
					<Icon aria-hidden name="chevronDown" />
				</RacButton>
			</ComboboxInputGroup>
			<MobileOverlay
				aria-label={labelContext?.['aria-label']}
				aria-labelledby={labelContext?.id}
				isOpen={state.isOpen}
				onOpenChange={(isOpen) => {
					if (isOpen) return;

					state.setFocused(false);
					state.close();
				}}
				ref={popoverContext?.ref}
			>
				<ComboboxInputGroup className={comboboxStyles.mobileInputGroup()}>
					<ComboboxInput
						aria-expanded={undefined}
						aria-haspopup="listbox"
						placeholder={placeholder}
						ref={mobileInputRef}
						role="searchbox"
					/>
					<MobileComboboxClearButton size={size} />
				</ComboboxInputGroup>
				{listBox}
			</MobileOverlay>
		</>
	);
}

function MobileComboboxClearButton({ size }: { size: ComboboxSize }): JSX.Element | null {
	const state = useContext(ComboBoxStateContext);

	if (state == null || state.inputValue === '') return null;

	return (
		<RacButton
			aria-label="Clear search"
			className={comboboxRecipe({ size }).clearButton()}
			onPress={() => {
				state.setInputValue('');
			}}
			slot={null}
		>
			<Icon aria-hidden name="close" />
		</RacButton>
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
