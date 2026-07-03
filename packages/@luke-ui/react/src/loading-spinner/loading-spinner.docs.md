`LoadingSpinner` expects the Luke UI theme class to be applied at app/root level.
See [Getting Started](/docs/getting-started).

```tsx
<LoadingSpinner aria-label="Loading" />
```

All mounted indeterminate spinners rotate and pulse in sync, even when they mount at different
times.

## Progress mode

Omit `value` for indeterminate progress. Pass `value` for determinate.

```tsx
<LoadingSpinner aria-label="Loading profile" value={66} />
```

## Size

```tsx
<LoadingSpinner aria-label="Syncing" size="small" />
```

## Color

```tsx
<LoadingSpinner aria-label="Syncing" color="informative" />
```

## Accessibility

`aria-label` defaults to `"pending"` when omitted. Override it with what's
loading (e.g. "Loading profile") for a clearer announcement.
