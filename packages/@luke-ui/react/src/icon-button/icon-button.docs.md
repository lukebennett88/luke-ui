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
