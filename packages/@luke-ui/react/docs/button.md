# Button

> Composed button. Wraps children in a `Text` for ellipsis truncation; shows a spinner when `isPending`.

## Import

```ts
import { Button } from '@luke-ui/react/button';
```

## Usage

`Button` expects the Luke UI theme class to be applied at app/root level. See
[Getting Started](/docs/getting-started).

```tsx
<Button>Save</Button>
```

```tsx
<Button tone="critical">Delete</Button>
```

```tsx
<Button tone="ghost">Cancel</Button>
```

```tsx
<Button isDisabled>Disabled</Button>
```

The composed `Button` wraps children in a `Text` element, so long labels
truncate with an ellipsis automatically. It also shows a `LoadingSpinner` when
`isPending` is set.

## Primitive Button

A lower-level `Button` primitive is available for cases where you need full
control over the button's children — for example, custom loading states,
render-prop children, or non-standard content.

```ts
import { Button } from '@luke-ui/react/button/primitive';
```

The primitive renders a single `<button>` element with no internal wrapper. Its
children are direct flex items, so you manage layout yourself.

## Props

| Prop         | Type                                              | Default     | Description                                                                   |
| ------------ | ------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `tone`       | `"primary" \| "neutral" \| "critical" \| "ghost"` | `'primary'` | Visual tone. Controls colour scheme.                                          |
| `size`       | `"medium" \| "small"`                             | `'medium'`  | Sets the button size.                                                         |
| `isPending`  | `boolean`                                         | `false`     | Shows pending button styles. When true, a spinner overlays the label.         |
| `isBlock`    | `boolean`                                         | `false`     | Whether the button takes up the full inline size of its container.            |
| `isDisabled` | `boolean`                                         | `false`     | Whether the button is disabled. Disabled buttons can't be focused or pressed. |
| `onPress`    | `(e: PressEvent) => void`                         | —           | Press handler. Called on click, Enter, or Space.                              |
| `type`       | `"reset" \| "button" \| "submit"`                 | —           | HTML button type.                                                             |
