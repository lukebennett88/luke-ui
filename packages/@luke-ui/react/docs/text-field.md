# Text Field

> Composes `TextInput` with label, description, and error slots.

## Import

```ts
import { TextField } from '@luke-ui/react/text-field';
```

## Usage

```tsx
<TextField
	name="email"
	label="Email"
	description="We'll only use this for account updates."
	placeholder="name@example.com"
/>
```

When visual context already communicates purpose, omit `label` and provide an
accessible name with `aria-label` or `aria-labelledby` on the field itself.

```tsx
<TextField aria-label="Search" name="search" placeholder="Search" />
```

## Required fields

Use `isRequired` and `necessityIndicator` to communicate mandatory fields.
`'icon'` renders a visual required marker; `'label'` appends "(required)" to the
label text.

```tsx
<TextField isRequired name="firstName" label="First name" necessityIndicator="icon" />
```

```tsx
<TextField isRequired name="lastName" label="Last name" necessityIndicator="label" />
```

## Validation

```tsx
import { Form } from 'react-aria-components';

<Form validationErrors={{ username: 'This username is not available.' }}>
	<TextField
		name="username"
		label="Username"
		errorMessage={(validation) => validation.validationErrors.join(' ')}
	/>
</Form>;
```

## Adornments

Use `adornmentStart` and `adornmentEnd` to place non-editable content inside
the input chrome. Adornments accept any `ReactNode`; you are responsible for
semantics if adornments are interactive.

```tsx
import { Icon } from '@luke-ui/react/icon';

<TextField
	name="search"
	label="Search"
	adornmentStart={<Icon name="search" aria-hidden size="small" />}
/>;
```

```tsx
<TextField name="url" label="URL" adornmentStart="https://" />
```

```tsx
<TextField name="price" label="Price" adornmentEnd="AUD" />
```

## Size

`size` controls height and typography. The HTML numeric `<input size>` attribute
is intentionally omitted; `size` is reserved for the design-system variant.

| Value      | Description           |
| ---------- | --------------------- |
| `'small'`  | Compact input height. |
| `'medium'` | Default input height. |

## Props

Extends [`react-aria-components` `TextFieldProps`](https://react-spectrum.adobe.com/react-aria/TextField.html).

| Prop                 | Type                                    | Default | Description                                      |
| -------------------- | --------------------------------------- | ------- | ------------------------------------------------ |
| `adornmentEnd`       | `ReactNode`                             | —       | Element shown after the input value.             |
| `adornmentStart`     | `ReactNode`                             | —       | Element shown before the input value.            |
| `description`        | `ReactNode`                             | —       | Helper text shown below the control.             |
| `errorMessage`       | `FieldErrorProps['children']`           | —       | Error content passed to `FieldError`.            |
| `inputClassName`     | `ClassNameOrFunction<InputRenderProps>` | —       | Class name forwarded to the inner input element. |
| `label`              | `ReactNode`                             | —       | Label content shown above the input.             |
| `necessityIndicator` | `FieldNecessityIndicator`               | —       | Label necessity style.                           |
| `placeholder`        | `string`                                | —       | Placeholder text for the input.                  |
| `size`               | `TextInputSize`                         | —       | Control size. Defaults to `'medium'`.            |
| `isDisabled`         | `boolean`                               | —       | Whether the field is disabled.                   |
| `isReadOnly`         | `boolean`                               | —       | Whether the field is read-only.                  |
| `isInvalid`          | `boolean`                               | —       | Whether the field has a validation error.        |
| `value`              | `string`                                | —       | Controlled input value.                          |
| `defaultValue`       | `string`                                | —       | Initial value (uncontrolled).                    |
| `onChange`           | `(value: string) => void`               | —       | Called when the value changes.                   |
