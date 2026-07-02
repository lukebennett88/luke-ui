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

## Best Practices

| Guidance | Practices                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------- |
| Do       | Use `defaultItems` for a static list and `items` + `loadingState` when options load asynchronously. |
| Don't    | Reach for `ComboboxField` for multi-select — it's single-select only in v1.                         |

## API Shape

- Root props follow React Aria `ComboBox` naming.
- Composed convenience props: `label`, `description`, `errorMessage`, `necessityIndicator`, `size`, `placeholder`.
- `children` renders dynamic items from `items` or `defaultItems`.
- `listBoxProps` and `loadMoreItem` are lower-level escape hatches.

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

## Async options

Pass `loadingState` for built-in loading and empty states. Control options
externally via `items`.

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

### Size propagation

When you set `size` on `ComboboxInput`, it is automatically inherited by
`ComboboxControl`, `ComboboxTextInput`, `ComboboxTrigger`, `ComboboxItem`, and
`ComboboxLoadMoreItem`. You can override the inherited size on any individual
child by passing an explicit `size` prop to that component.
