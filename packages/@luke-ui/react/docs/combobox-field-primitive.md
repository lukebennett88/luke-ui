# Combobox Field (primitive)

## Import

```ts
import {
	ComboboxControl,
	ComboboxEmptyState,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxLoadMoreItem,
	ComboboxPopover,
	ComboboxSection,
	ComboboxTextInput,
	ComboboxTrigger,
} from '@luke-ui/react/combobox-field/primitive';
```

## Exports

### `ComboboxControl`

```ts
function ComboboxControl(props: ComboboxControlProps): JSX.Element;
```

Control wrapper for combobox text input + trigger content.

### `ComboboxEmptyState`

```ts
function ComboboxEmptyState(props: ComboboxEmptyStateProps): JSX.Element;
```

### `ComboboxInput`

```ts
function ComboboxInput(props: ComboboxInputProps<T>): JSX.Element;
```

### `ComboboxItem`

```ts
function ComboboxItem(props: ComboboxItemProps<T>): JSX.Element;
```

### `ComboboxListBox`

```ts
function ComboboxListBox(props: ComboboxListBoxProps<T>): JSX.Element;
```

Styled listbox for combobox options.

### `ComboboxLoadMoreItem`

```ts
function ComboboxLoadMoreItem(props: ComboboxLoadMoreItemProps): JSX.Element;
```

### `ComboboxPopover`

```ts
function ComboboxPopover(props: ComboboxPopoverProps): JSX.Element;
```

Popover surface used for listbox content.

### `ComboboxSection`

```ts
function ComboboxSection(props: ComboboxSectionProps<T>): JSX.Element;
```

### `ComboboxTextInput`

```ts
function ComboboxTextInput(props: ComboboxTextInputProps): JSX.Element;
```

Text input used within `ComboboxControl` for combobox behavior.

### `ComboboxTrigger`

```ts
function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element;
```

Trigger button used by combobox pattern.
