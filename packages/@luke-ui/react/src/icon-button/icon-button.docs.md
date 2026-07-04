Use `IconButton` for compact actions where an icon can carry the visible UI. Always provide an
accessible label.

```tsx
<IconButton icon="add" aria-label="Add item" />
```

## Best practices

| Guidance | Practices                                                                    |
| -------- | ---------------------------------------------------------------------------- |
| Do       | Name the action in `aria-label`, such as "Delete row". Do not name the icon. |
| Do       | Use `tone="critical"` for destructive icon actions such as delete.           |

## Tone

```tsx
<IconButton icon="close" aria-label="Close" tone="ghost" />
```

```tsx
<IconButton icon="delete" aria-label="Delete" tone="critical" />
```

## Size

```tsx
<IconButton icon="delete" aria-label="Delete" size="small" />
```

## Accessibility

`IconButton` has no visible text label. Always provide `aria-label` or `aria-labelledby`. Without
one, screen readers have no way to announce the button's purpose.

```tsx
<IconButton icon="search" aria-label="Search orders" />
```

## When to use vs Button

Use `IconButton` when the icon alone communicates the action and space is tight, such as in
toolbars, table row actions, or close buttons.

Use `Button` when you need a visible text label. Labels are clearer for unfamiliar users.
