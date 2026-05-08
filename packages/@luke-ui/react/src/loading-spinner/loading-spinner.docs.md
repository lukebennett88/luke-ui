`LoadingSpinner` expects the Luke UI theme class to be applied at app/root level.
See [Getting Started](/docs/getting-started).

Omit `value` for indeterminate (unknown progress); pass `value` for determinate.

```tsx
<LoadingSpinner aria-label="Loading" />
```

```tsx
<LoadingSpinner aria-label="Loading profile" value={66} />
```

```tsx
<LoadingSpinner aria-label="Syncing" color="informative" size="small" />
```
