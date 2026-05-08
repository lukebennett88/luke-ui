# Field (primitive)

## Import

```ts
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldNecessityIndicator,
} from '@luke-ui/react/field/primitive';
```

## Exports

### `Field`

```ts
function Field(props: FieldProps): JSX.Element;
```

Composes label, control slot, description, and error text.

### `FieldDescription`

```ts
function FieldDescription(props: FieldDescriptionProps): JSX.Element;
```

Styled helper text shown under a field.

### `FieldError`

```ts
function FieldError(props: FieldErrorProps): JSX.Element;
```

Styled validation message for a field.

### `FieldLabel`

```ts
function FieldLabel(props: FieldLabelProps): JSX.Element;
```

Styled label for form fields.

### `FieldNecessityIndicator`

```ts
type FieldNecessityIndicator = NonNullable<FieldLabelVariantProps['necessityIndicator']>;
```

Allowed `necessityIndicator` values for `FieldLabel`.
