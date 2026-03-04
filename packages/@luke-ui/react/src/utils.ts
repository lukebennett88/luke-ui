export function cx(...parts: Array<string | undefined | null | false>): string {
	let result = '';
	for (const part of parts) {
		if (part) {
			result = result ? `${result} ${part.trim()}` : part.trim();
		}
	}
	return result;
}

export function pxToRem(px: number, base: number = 16): string {
	return `${px / base}rem`;
}

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
 * An alternative to `Object.keys()` that avoids type widening.
 *
 * @example
 * Object.keys({ foo: 1, bar: 2 }) // string[]
 * typedKeys({ foo: 1, bar: 2 }) // ("foo" | "bar")[]
 */
export function typedKeys<T extends object>(value: T) {
	return Object.keys(value) as Array<keyof T>;
}

/**
 * An alternative to `Object.fromEntries()` that avoids type widening. Must be
 * used in conjunction with `typedEntries` or `typedKeys`.
 *
 * @example
 * const obj = { name: 'Alice', age: 30 };
 * const rebuilt1 = Object.fromEntries(Object.entries(obj));
 * //    ^? { [k: string]: string | number }
 * const rebuilt2 = typedObjectFromEntries(typedEntries(obj));
 * //    ^? { name: string, age: number }
 */
export function typedObjectFromEntries<T extends object>(entries: Array<ObjectEntry<T>>) {
	return Object.fromEntries(entries) as T;
}
