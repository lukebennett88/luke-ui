import type { CSSProperties } from 'react';

/**
 * Inline styles that hide content visually while keeping it available to assistive technology.
 * Use this for statically hidden application-owned markup. Prefer
 * `<VisuallyHidden isFocusable>` when hidden content must reveal on focus.
 */
export const visuallyHiddenStyle = {
	blockSize: '1px',
	clip: 'rect(1px, 1px, 1px, 1px)',
	clipPath: 'inset(100%)',
	inlineSize: '1px',
	overflow: 'hidden',
	position: 'absolute',
	whiteSpace: 'nowrap',
} satisfies CSSProperties;
