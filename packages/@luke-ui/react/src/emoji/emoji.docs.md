```tsx
<Emoji emoji="🎉" label="Celebration" />
```

`Emoji` accepts all `Text` props except `children` and `elementType`, so it
inherits typography controls like `fontSize` and `color`.

## Best Practices

| Guidance | Practices                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Do       | Write a `label` that describes the emoji's meaning in context ("Celebration"), not its literal name ("party popper"). |
| Don't    | Repeat text already in the surrounding sentence — that produces a duplicate announcement for screen reader users.     |

## Accessibility

`emoji` and `label` are both required. `label` replaces the emoji character for
screen readers; the raw character alone isn't reliably announced.
