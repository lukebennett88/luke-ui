/**
 * Joins a space-separated token list, such as class names or an `aria-labelledby` ID list, and
 * skips empty values.
 */
export function cx(...parts: Array<string | undefined | null | false>): string {
	let result = '';
	for (let index = 0; index < parts.length; index++) {
		const part = parts[index];
		if (!part) continue;
		const trimmed = part.trim();
		if (trimmed) {
			result = result ? `${result} ${trimmed}` : trimmed;
		}
	}
	return result;
}

/** Converts a pixel value to rem. */
export function pxToRem(px: number, base: number = 16): string {
	return `${px / base}rem`;
}

/** Typed key-value pair from an object. */
export type ObjectEntry<T> = { [K in keyof T]-?: [K, T[K]] }[keyof T];

/**
 * An alternative to `Object.entries()` that avoids type widening.
 *
 * @example
 * Object.entries({ foo: 1, bar: 2 }) // [string, number][]
 * typedEntries({ foo: 1, bar: 2 }) // ["foo" | "bar", number][]
 */
export function typedEntries<T extends object>(value: T) {
	return Object.entries(value) as Array<ObjectEntry<T>>;
}

/**
 * An alternative to `Object.fromEntries()` that avoids type widening. Must be
 * used in conjunction with `typedEntries`.
 *
 * @example
 * const obj = { name: 'Alice', age: 30 };
 * const rebuilt1 = Object.fromEntries(Object.entries(obj));
 * //    ^? { [k: string]: string | number }
 * const rebuilt2 = typedFromEntries(typedEntries(obj));
 * //    ^? { name: string, age: number }
 */
export function typedFromEntries<T extends object>(entries: Array<ObjectEntry<T>>) {
	return Object.fromEntries(entries) as T;
}
