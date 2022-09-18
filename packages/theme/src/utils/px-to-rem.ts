/**
 * Afford consumers the simplicity of pixel values for token declarations while
 * supporting our users' browser preferences.
 *
 * NOTE: assume default browser settings of 16px root
 */
export function pxToRem(value: number | string) {
	const px = typeof value === 'string' ? parseFloat(value) : value;

	const modifier = 1 / 16;
	return `${px * modifier}rem` as const;
}
