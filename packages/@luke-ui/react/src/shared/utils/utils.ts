import { chain } from '@react-aria/utils';

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

type Merged<A, B> = {
	[K in keyof A | keyof B]: K extends 'className'
		? string
		: K extends 'style'
			? Record<string, unknown>
			: K extends keyof B
				? B[K]
				: K extends keyof A
					? A[K]
					: never;
};

type MergePossiblyWithArray<A, B> = {
	[K in keyof A | keyof B]: K extends 'className'
		? string
		: K extends 'style'
			? Record<string, unknown>
			: K extends keyof A
				? K extends keyof B
					? A[K] | B[K]
					: A[K]
				: K extends keyof B
					? B[K] | undefined
					: never;
};

type MergedAll<T extends ReadonlyArray<unknown>> = T extends readonly [infer First, ...infer Rest]
	? Rest extends readonly [infer Second, ...infer Others]
		? MergedAll<[Merged<First, Second>, ...Others]>
		: number extends Rest['length']
			? MergePossiblyWithArray<First, Rest[number]>
			: First
	: never;

/**
 * True when `key` looks like a React event handler prop (`on` + capital letter).
 * Matches React Aria's mergeProps event detection without a regex.
 */
function isEventHandlerKey(key: string): boolean {
	return (
		key.length >= 3 &&
		key.charCodeAt(0) === 111 /* o */ &&
		key.charCodeAt(1) === 110 /* n */ &&
		key.charCodeAt(2) >= 65 /* A */ &&
		key.charCodeAt(2) <= 90 /* Z */
	);
}

/**
 * Merges prop objects for composition and `renderRoot` callbacks.
 *
 * - Ordinary props: rightmost wins.
 * - `className`: concatenate left to right with `cx`.
 * - `style`: shallow merge; rightmost wins per key.
 * - Event handlers (`on*`): chain in argument order with React Aria's `chain`.
 * - Refs are not merged; rightmost wins like ordinary props.
 */
export function mergeProps<T extends [object, object, ...Array<object>]>(
	...props: T
): MergedAll<T> {
	const items = props as Array<Record<string, unknown>>;
	const result = { ...items[0] };

	for (let index = 1; index < items.length; index++) {
		const current = items[index];
		for (const key in current) {
			const previous = result[key];
			const next = current[key];

			if (key === 'className') {
				if (typeof next === 'string') {
					result.className = cx(typeof previous === 'string' ? previous : undefined, next);
				}
				continue;
			}

			if (key === 'style') {
				if (typeof next === 'object' && next !== null) {
					result.style = {
						...(typeof previous === 'object' && previous !== null
							? (previous as Record<string, unknown>)
							: null),
						...(next as Record<string, unknown>),
					};
				}
				continue;
			}

			if (typeof previous === 'function' && typeof next === 'function' && isEventHandlerKey(key)) {
				result[key] = chain(previous, next);
				continue;
			}

			if (next !== undefined) {
				result[key] = next;
			}
		}
	}

	return result as MergedAll<T>;
}

/** Converts a pixel value to rem. */
export function pxToRem(px: number, base: number = 16): string {
	return `${px / base}rem`;
}

/** Typed key-value pair from an object. Package-internal; not a public export. */
export type ObjectEntry<T> = { [K in keyof T]-?: [K, T[K]] }[keyof T];

/**
 * An alternative to `Object.entries()` that avoids type widening.
 *
 * Package-internal; not a public export.
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
 * Package-internal; not a public export.
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
