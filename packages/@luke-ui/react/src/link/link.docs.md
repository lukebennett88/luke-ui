`Link` expects the Luke UI theme class to be applied at app/root level. See
[Getting Started](/docs/getting-started).

```tsx
<Link href="/help">Help center</Link>
```

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

```tsx
<Link href="/terms" isStandalone>
	Terms and conditions
</Link>
```

## Tone

There are three tones available, `brand` (default), `neutral`, and
`inverted`.

- When a more subtle link is desired, use `neutral`.
- When the link is shown on a dark background, use `inverted`.

## Standalone

A `Link` can be used on its own as `isStandalone` or inline within a sentence or
paragraph (default: `isStandalone={false}`).

- `isStandalone={true}`: no underline until hover.
- `isStandalone={false}`: underlined inline link style.
