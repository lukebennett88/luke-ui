`LoadingSkeleton` expects the Luke UI theme class at the app or root level. See
[Getting Started](/docs/getting-started).

Use it when loading content should keep the same footprint as the loaded state. Text renders as an
inline skeleton. Elements keep their layout while the skeleton surface is painted over them.

```tsx
<LoadingSkeleton isLoading={isLoading}>{user?.name ?? 'Placeholder name'}</LoadingSkeleton>
```

```tsx
<LoadingSkeleton isLoading={isLoading}>
	<Button>Submit</Button>
</LoadingSkeleton>
```

All mounted skeletons use the same pulse timing, even when they mount at different times.

## Best practices

| Guidance | Practices                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Do       | Wrap real content so the skeleton matches the final size exactly.                                                   |
| Don't    | Use `LoadingSkeleton` for content whose final size is unknown. Size mismatch causes layout shift when loading ends. |

## Loading state

`isLoading` defaults to `true`. Pass `isLoading={false}` when content is ready.

```tsx
<LoadingSkeleton isLoading={false}>
	<Button>Submit</Button>
</LoadingSkeleton>
```

## Multi-line text

Wrap text directly when the copy spans more than one line. Each line gets its own skeleton shape.

```tsx
<div style={{ maxInlineSize: '16rem' }}>
	<LoadingSkeleton isLoading={isLoading}>
		A short paragraph of placeholder copy that wraps across two lines.
	</LoadingSkeleton>
</div>
```

## Element type

`LoadingSkeleton` renders a `span` by default. Use `as` when the surrounding markup needs another
element.

```tsx
<ul>
	<LoadingSkeleton as="li" isLoading={isLoading}>
		List item placeholder
	</LoadingSkeleton>
</ul>
```

## LoadingSkeletonProvider

Use `LoadingSkeletonProvider` when one loading state controls a group of skeletons. The provider
value overrides descendant `isLoading` props.

```tsx
<LoadingSkeletonProvider isLoading={isLoading}>
	<LoadingSkeleton isLoading={false}>Ada Lovelace</LoadingSkeleton>
	<LoadingSkeleton isLoading={false}>
		<Button>Edit profile</Button>
	</LoadingSkeleton>
</LoadingSkeletonProvider>
```

## Border radius

Use `borderRadius` when the wrapped child has no radius, but the visible control inside it does.

```tsx
<LoadingSkeleton borderRadius="0.25rem" isLoading={isLoading}>
	<TextField label="Email" name="email" />
</LoadingSkeleton>
```

## Custom dimensions

Wrap an element with explicit dimensions when you need a placeholder for a fixed shape, such as an
avatar.

```tsx
<LoadingSkeleton isLoading={isLoading}>
	<div style={{ borderRadius: '9999px', height: '3rem', width: '3rem' }} />
</LoadingSkeleton>
```

## Accessibility

While loading, skeleton content is hidden from assistive technology and cannot be focused or
clicked. `LoadingSkeleton` sets `aria-hidden`, `inert`, `tabIndex={-1}`, and disables pointer
events.
