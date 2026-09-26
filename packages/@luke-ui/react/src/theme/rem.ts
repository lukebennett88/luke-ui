/**
 * Converts a value at a 16px root to `rem` (16 → 1rem).
 * Private to the theme pipeline — not a public API.
 */
export function rem(pixels: number): `${string}rem` {
	return `${formatRemNumber(pixels / 16)}rem`;
}

/** Formats a rem magnitude without floating-point noise (for example `2.1875`, not `2.1875000001`). */
function formatRemNumber(value: number): string {
	return String(Number(value.toFixed(6)));
}
