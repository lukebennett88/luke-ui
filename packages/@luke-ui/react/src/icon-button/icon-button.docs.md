```tsx
<IconButton icon="add" aria-label="Add item" />
```

## Best Practices

| Guidance | Practices                                                                       |
| -------- | ------------------------------------------------------------------------------- |
| Do       | Name the action in `aria-label`, not the icon ("Delete row", not "Trash icon"). |
| Do       | Use `tone="critical"` for destructive icon actions like delete.                 |

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

`IconButton` has no visible text label. Always provide `aria-label` or
`aria-labelledby` — without one, screen readers have no way to announce the
button's purpose.

```tsx
<IconButton icon="search" aria-label="Search orders" />
```

## When to use vs Button

Use `IconButton` when the icon alone communicates the action and space is tight
(toolbars, table row actions, close buttons). Use `Button` when you need a visible
label. Labels are clearer for unfamiliar users.
