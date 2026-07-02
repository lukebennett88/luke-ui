```tsx
<CloseButton onPress={onClose} />
```

`CloseButton` renders a close icon with `tone="ghost"` by default, and a fixed
`aria-label="Close"`. All `IconButton` props except `icon` are forwarded.

## Best Practices

| Guidance | Practices                                                                                   |
| -------- | ------------------------------------------------------------------------------------------- |
| Do       | Use `CloseButton` to dismiss dialogs, panels, drawers, and toasts.                          |
| Don't    | Use `CloseButton` somewhere "Close" doesn't describe the action — use `IconButton` instead. |

## Tone

```tsx
<CloseButton onPress={onClose} tone="critical" />
```

## Size

```tsx
<CloseButton onPress={onClose} size="small" />
```

## Accessibility

The accessible name is fixed to "Close" — an `aria-label` passed to
`CloseButton` is accepted by the type but ignored at render. Use `IconButton`
directly if you need a different label.

## When to use vs IconButton

`CloseButton` is an `IconButton` preset for the close icon with a fixed label.
Use `IconButton` directly for any other icon, or when you need a custom
`aria-label`.
