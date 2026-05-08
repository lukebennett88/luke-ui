# Combobox Field

> Composes `ComboboxInput` with label, description, and error slots.

## Import

```ts
import { ComboboxField } from '@luke-ui/react/combobox-field';
```

## Usage

```tsx
<ComboboxField
	label="Country"
	name="country"
	placeholder="Select a country..."
	defaultItems={countries}
>
	{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
</ComboboxField>
```

## Grouped Options

```tsx
<ComboboxField label="Country" name="country">
	<ComboboxSection title="Northern hemisphere">
		<ComboboxItem id="ca">Canada</ComboboxItem>
	</ComboboxSection>
	<ComboboxSection title="Southern hemisphere">
		<ComboboxItem id="au">Australia</ComboboxItem>
	</ComboboxSection>
</ComboboxField>
```

## Required fields

```tsx
<ComboboxField isRequired label="Country" name="country" necessityIndicator="icon">
	{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
</ComboboxField>
```

## Validation

```tsx
import { Form } from 'react-aria-components';

<Form validationErrors={{ country: 'Please select a country.' }}>
	<ComboboxField
		name="country"
		label="Country"
		errorMessage={(validation) => validation.validationErrors.join(' ')}
	>
		{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
	</ComboboxField>
</Form>;
```

## Async options

Pass `loadingState` to activate built-in loading and empty states. Options are
controlled externally via `items`.

```tsx
<ComboboxField
	label="Country"
	name="country"
	items={results}
	loadingState={status}
	onInputChange={setQuery}
>
	{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
</ComboboxField>
```

## Infinite scroll

Use `onLoadMore` for automatic sentinel-based loading, or `loadMoreItem` for
full control.

```tsx
<ComboboxField
	label="Country"
	name="country"
	items={results}
	loadingState={status}
	onLoadMore={fetchNextPage}
>
	{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
</ComboboxField>
```

## API Shape

- Root props follow React Aria `ComboBox` naming.
- Composed convenience props: `label`, `description`, `errorMessage`, `necessityIndicator`, `size`, `placeholder`.
- `children` renders dynamic items from `items` or `defaultItems`.
- `listBoxProps` and `loadMoreItem` are lower-level escape hatches.
- Single-select only in v1.

## Primitive kit

The individual `Combobox*` building blocks used to assemble `ComboboxField` are
available for library authors who need a custom combobox layout.

```ts
import {
	ComboboxInput,
	ComboboxControl,
	ComboboxTextInput,
	ComboboxTrigger,
	ComboboxPopover,
	ComboboxListBox,
	ComboboxItem,
	ComboboxSection,
} from '@luke-ui/react/combobox-field/primitive';
```

## Props

| Prop                 | Type                                                                                 | Default    | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------- |
| `children`           | `ComboboxListBoxProps<T>['children']`                                                | —          | Item content for the listbox (render prop or static children).                  |
| `description`        | `ReactNode`                                                                          | —          | Helper text shown below the control.                                            |
| `errorMessage`       | `FieldErrorProps['children']`                                                        | —          | Error content passed to `FieldError`.                                           |
| `label`              | `ReactNode`                                                                          | —          | Label content shown above the control.                                          |
| `listBoxProps`       | `DistributiveOmit<ComboboxListBoxProps<T>, 'children' \| 'items' \| 'loadMoreItem'>` | —          | Props forwarded to the inner listbox.                                           |
| `loadMoreItem`       | `ComboboxListBoxProps<T>['loadMoreItem']`                                            | —          | Optional content appended after the main collection, e.g. a load-more sentinel. |
| `loadingState`       | `ComboboxLoadingState`                                                               | —          | Async loading state used for built-in loading and empty states.                 |
| `menuWidth`          | `Property.Width<string \| number>`                                                   | —          | Width applied to the popover menu.                                              |
| `necessityIndicator` | `FieldNecessityIndicator`                                                            | `'icon'`   | Label necessity style.                                                          |
| `onLoadMore`         | `() => any`                                                                          | —          | Called when the listbox reaches its load-more sentinel.                         |
| `placeholder`        | `string`                                                                             | —          | Placeholder text shown in the input.                                            |
| `popoverProps`       | `DistributiveOmit<ComboboxPopoverProps, 'children'>`                                 | —          | Props forwarded to the inner popover.                                           |
| `size`               | `ComboboxSize`                                                                       | `'medium'` | Control size.                                                                   |
| `isDisabled`         | `boolean`                                                                            | —          | Whether the combobox is disabled.                                               |
| `isReadOnly`         | `boolean`                                                                            | —          | Whether the combobox is read-only.                                              |
