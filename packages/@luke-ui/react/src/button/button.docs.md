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
