`Button` expects the Luke UI theme class to be applied at app/root level. See
[Getting Started](/docs/getting-started).

```tsx
<Button>Save</Button>
```

## Best Practices

| Guidance | Practices                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| Do       | Use one `tone="primary"` button per view for the main action. Use `neutral` or `ghost` for everything else.          |
| Do       | Write a label that describes the action ("Save changes", "Delete account"), not a vague label like "OK" or "Submit". |
| Do       | Set `isPending` for actions that take time, like saving or submitting, so the user knows it's working.               |
| Don't    | Use `Button` for navigation. If it only takes the user to another page, use `Link` instead.                          |

## Tone

Four tones: `primary` (default), `neutral`, `critical`, and `ghost`.

```tsx
<Button tone="neutral">Cancel</Button>
```

```tsx
<Button tone="critical">Delete</Button>
```

```tsx
<Button tone="ghost">Dismiss</Button>
```

## Size

Two sizes: `medium` (default) and `small`.

```tsx
<Button size="small">Save</Button>
```

## Icons

Use `startIcon` and `endIcon` to place an icon before or after the label. Icon
size is inherited from the button's own `size`, so no `size` prop is needed on
the icon itself.

```tsx
import { Icon } from '@luke-ui/react/icon';

<Button startIcon={<Icon name="add" aria-hidden />}>Add item</Button>;
```

## Disabled

Disabled buttons can't be focused or pressed.

```tsx
<Button isDisabled>Save</Button>
```

## Pending

Set `isPending` while an action is in flight. A spinner overlays the label and
the button becomes non-interactive.

```tsx
<Button isPending>Saving</Button>
```

## Full width

Set `isBlock` to make the button fill the inline size of its container.

```tsx
<Button isBlock>Save</Button>
```

## Accessibility

`Button` wraps its children in `Text`, so it always has a visible accessible
name — no `aria-label` is needed. The `isPending` spinner is `aria-hidden` and
does not announce a busy state to screen readers; if the pending state needs to
be conveyed audibly, change the label text itself (e.g. "Saving…") while
`isPending` is set.

## Primitive Button

A lower-level `Button` primitive is available when you need full control over
children: custom loading states, render-prop children, or non-standard content.

```ts
import { Button } from '@luke-ui/react/button/primitive';
```

The primitive renders a single `<button>` element with no internal wrapper. Its
children are direct flex items, so you manage layout yourself.
