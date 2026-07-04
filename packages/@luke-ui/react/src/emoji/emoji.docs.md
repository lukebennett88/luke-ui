Use `Emoji` when an emoji needs a reliable accessible label.

```tsx
<Emoji emoji="🎉" label="Celebration" />
```

`Emoji` accepts all `Text` props except `children` and `elementType`, so it inherits typography
controls such as `fontSize` and `color`.

## Best practices

| Guidance | Practices                                                                                                  |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| Do       | Write a `label` that describes the emoji's meaning in context, such as "Celebration".                      |
| Don't    | Repeat text that already appears in the surrounding sentence. That creates duplicate screen reader output. |

## Accessibility

Both `emoji` and `label` are required. Screen readers announce the label instead of the raw emoji
character, which is not announced consistently across platforms.
