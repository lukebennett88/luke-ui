# Text Field (primitive)

> Styled text input with optional start/end adornments.

## Import

```ts
import { TextField } from '@luke-ui/react/text-field/primitive';
```

## Props

Extends [`react-aria-components` `InputProps`](https://react-spectrum.adobe.com/react-aria/Input.html).

| Prop             | Type                                    | Default    | Description                                |
| ---------------- | --------------------------------------- | ---------- | ------------------------------------------ |
| `adornmentEnd`   | `ReactNode`                             | —          | Element shown at the end of the control.   |
| `adornmentStart` | `ReactNode`                             | —          | Element shown at the start of the control. |
| `className`      | `ClassNameOrFunction<GroupRenderProps>` | —          | Class name for the outer group wrapper.    |
| `inputClassName` | `ClassNameOrFunction<InputRenderProps>` | —          | Class name for the inner input element.    |
| `size`           | `"medium" \| "small"`                   | `'medium'` | Sets the input size.                       |
