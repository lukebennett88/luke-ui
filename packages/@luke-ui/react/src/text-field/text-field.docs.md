Use `TextField` for a single text input with label, description, validation, and optional adornments
built in.

```tsx
<TextField
	name="email"
	label="Email"
	description="We'll only use this for account updates."
	placeholder="name@example.com"
/>
```

## Best practices

| Guidance | Practices                                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Do       | Use `label` for every field where possible. It works better with assistive technology and autofill than `aria-label` alone. |
| Don't    | Use `placeholder` as a label substitute. It disappears after typing and often fails colour contrast requirements.           |

## Required fields

Use `isRequired` and `necessityIndicator` to communicate mandatory fields. `'icon'` renders a visual
required marker. `'label'` appends "(required)" to the label text.

```tsx
<TextField isRequired name="firstName" label="First name" necessityIndicator="icon" />
```

```tsx
<TextField isRequired name="lastName" label="Last name" necessityIndicator="label" />
```

## Validation

Pass field-level validation through React Aria `Form`. Use `errorMessage` to render the validation
message.

```tsx
import { Form } from 'react-aria-components';

<Form validationErrors={{ username: 'Username is not available.' }}>
	<TextField
		name="username"
		label="Username"
		errorMessage={(validation) => validation.validationErrors.join(' ')}
	/>
</Form>;
```

## Adornments

Use `adornmentStart` and `adornmentEnd` to place non-editable content inside the input chrome.
Adornments accept any `ReactNode`. If an adornment is interactive, you are responsible for its
semantics.

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

`size` controls height and typography. The HTML numeric `<input size>` attribute is intentionally
omitted because `size` is reserved for the design-system variant.

| Value      | Description           |
| ---------- | --------------------- |
| `'small'`  | Compact input height. |
| `'medium'` | Default input height. |

## Accessibility

When visual context already communicates purpose, you may omit `label` and provide an accessible
name with `aria-label` or `aria-labelledby` on the field.

```tsx
<TextField aria-label="Search" name="search" placeholder="Search" />
```

## Primitive TextInput

The lower-level `TextInput` primitive is available when you need the input without the label,
description, or error slots that `Field` provides.

```ts
import { TextInput } from '@luke-ui/react/text-field/primitive';
```
