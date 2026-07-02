`Link` expects the Luke UI theme class to be applied at app/root level. See
[Getting Started](/docs/getting-started).

```tsx
<Link href="/help">Help center</Link>
```

## Best Practices

| Guidance | Practices                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Do       | Use `tone="inverted"` only on dark backgrounds — elsewhere it's hard to read.                                                                 |
| Do       | Use `isStandalone` for links that aren't part of a sentence (card links, nav items); leave it `false` for inline links within paragraph text. |

## Tone

Three tones: `brand` (default), `neutral`, and `inverted`.

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

- For a more subtle link, use `neutral`.
- On a dark background, use `inverted`.

## Standalone

A `Link` can be used on its own as `isStandalone` or inline within a sentence or
paragraph (default: `isStandalone={false}`).

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

Screen readers announce a disabled link as unavailable but not why — put the
reason in nearby visible text rather than relying on the disabled state alone.

## When to use vs Button

Use `Link` to navigate to a new URL or route. Use `Button` for in-page actions
like saving, submitting, or opening a dialog.
