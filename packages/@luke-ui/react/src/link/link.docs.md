`Link` expects the Luke UI theme class at the app or root level. See
[Getting Started](/docs/getting-started).

```tsx
<Link href="/help">Help center</Link>
```

## Best practices

| Guidance | Practices                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Do       | Use `tone="inverted"` only on dark backgrounds. On light backgrounds, it is hard to read.                                          |
| Do       | Use `isStandalone` for links that are not part of a sentence, such as card links and nav items. Leave it `false` for inline links. |

## Tone

`Link` has three tones: `brand` (default), `neutral`, and `inverted`.

```tsx
<Link href="/docs/accessibility" tone="neutral">
	Accessibility docs
</Link>
```

```tsx
<div style={{ background: 'black', padding: 4 }}>
	<Link href="/status" tone="inverted">
		Service status
	</Link>
</div>
```

Use `neutral` for a more subtle link. Use `inverted` on dark backgrounds.

## Standalone

Use `isStandalone` when a link stands on its own. Leave it `false` for links inside paragraph text.

```tsx
<Link href="/terms" isStandalone>
	Terms and conditions
</Link>
```

- `isStandalone={true}`: no underline until hover.
- `isStandalone={false}`: underlined inline link style.

## Disabled

```tsx
<Link href="/archived" isDisabled>
	Archived report
</Link>
```

## Accessibility

Screen readers announce a disabled link as unavailable, but not why. Put the reason in nearby
visible text instead of relying on disabled state alone.

## When to use vs Button

Use `Link` to navigate to a new URL or route. Use `Button` for in-page actions, such as saving,
submitting, or opening a dialog.
