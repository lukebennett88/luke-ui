# Icon Button

> Button that renders only an icon.

## Import

```ts
import { IconButton } from '@luke-ui/react/icon-button';
```

## Usage

```tsx
<IconButton icon="add" aria-label="Add item" />
```

```tsx
<IconButton icon="close" aria-label="Close" tone="ghost" />
```

```tsx
<IconButton icon="delete" aria-label="Delete" tone="critical" size="small" />
```

## Accessibility

`IconButton` has no visible text label. Always provide `aria-label` or
`aria-labelledby` — without one, screen readers have no way to announce the
button's purpose.

```tsx
<IconButton icon="search" aria-label="Search orders" />
```

## When to use vs Button

Use `IconButton` when the icon alone communicates the action and space is tight
(toolbars, table row actions, close buttons). Use `Button` when a visible text
label is needed — the label reduces ambiguity and improves discoverability for
less familiar users.

## Props

| Prop         | Type                              | Default    | Description                                                                   |
| ------------ | --------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `icon`       | `IconName`                        | —          | Icon name from the generated icon set.                                        |
| `size`       | `"small" \| "medium"`             | `'medium'` | Sets the button size.                                                         |
| `isDisabled` | `boolean`                         | `false`    | Whether the button is disabled. Disabled buttons can't be focused or pressed. |
| `onPress`    | `(e: PressEvent) => void`         | —          | Press handler. Called on click, Enter, or Space.                              |
| `type`       | `"reset" \| "button" \| "submit"` | —          | HTML button type.                                                             |
