/**
 * Builds a CSS `repeat()` track list from a count and a track size. The result is a plain string.
 * Luke UI does not validate or rewrite it.
 */
export function repeat<
	const Count extends number | 'auto-fit' | 'auto-fill',
	const Tracks extends string,
>(count: Count, tracks: Tracks): `repeat(${Count}, ${Tracks})` {
	return `repeat(${count}, ${tracks})`;
}

/**
 * Builds a CSS `minmax()` track size. The result is a plain string. Luke UI does not validate or
 * rewrite it.
 */
export function minmax<const Min extends string, const Max extends string>(
	min: Min,
	max: Max,
): `minmax(${Min}, ${Max})` {
	return `minmax(${min}, ${max})`;
}

/**
 * Builds a CSS `fit-content()` track size. The result is a plain string. Luke UI does not validate
 * or rewrite it.
 */
export function fitContent<const Limit extends string>(limit: Limit): `fit-content(${Limit})` {
	return `fit-content(${limit})`;
}
